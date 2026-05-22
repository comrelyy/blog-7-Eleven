'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { cn } from '@/lib/utils'
import { DialogModal } from '@/components/dialog-modal'
import DateActivityModal from './date-activity-modal'
import DateActivityTooltip from './date-activity-tooltip'
import { HomeDraggableLayer } from './home-draggable-layer'
import { loadEmotionEventData, saveEmotionEventData, getDayEmotions, getMonthEmotionCounts, type EmotionEventData } from './services/emotion-event-service'
import { EMOTION_ORDER, getEmotion } from './services/emotions'
import { appendLearningLog } from '@/app/checkin/services/append-learning-log'
import { useAuthStore } from '@/hooks/use-auth'
import EmotionJournalDialog from './emotion-journal-dialog'
import { Zap } from 'lucide-react'


dayjs.locale('zh-cn')

export default function CalendarCard() {
	const center = useCenterStore()

	// 使用 useState 来管理当前显示的月份
	const [currentMonth, setCurrentMonth] = useState(dayjs())
	const { cardStyles, siteContent } = useConfigStore()
	const now = dayjs()
	const currentDate = now.date()
	const firstDayOfMonth = currentMonth.startOf('month')
	const firstDayWeekday = (firstDayOfMonth.day() + 6) % 7
	const daysInMonth = currentMonth.daysInMonth()
	const currentWeekday = (now.day() + 6) % 7
	const styles = cardStyles.calendarCard
	const hiCardStyles = cardStyles.hiCard
	const clockCardStyles = cardStyles.clockCard

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x + CARD_SPACING + hiCardStyles.width / 2
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y - clockCardStyles.offset + CARD_SPACING

	const [selectedDate, setSelectedDate] = useState<string | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [hoveredDate, setHoveredDate] = useState<string | null>(null)
	const [emotionEvents, setEmotionEvents] = useState<EmotionEventData>({})
	const [emotionSaving, setEmotionSaving] = useState(false)
	const [journalOpen, setJournalOpen] = useState(false)
	const { isAuth } = useAuthStore()
	const todayKey = now.format('YYYY-MM-DD')

	const monthEmotionCounts = useMemo(() => getMonthEmotionCounts(emotionEvents, currentMonth.format('YYYY-MM-DD')), [emotionEvents, currentMonth])
	const monthCount = useMemo(() => Object.values(monthEmotionCounts).reduce((a, b) => a + b, 0), [monthEmotionCounts])
	// 本月翻涌/沉静堆叠成彩条，按枚举顺序排列
	const segments = EMOTION_ORDER.map(key => ({ def: getEmotion(key), count: monthEmotionCounts[key] || 0 })).filter(s => s.count > 0)
	const lostCount = monthEmotionCounts['lost'] || 0
	const ctrlCount = monthEmotionCounts['controlled'] || 0

	useEffect(() => {
		void loadEmotionEventData().then(setEmotionEvents)
	}, [])

	const handleOpenJournal = () => {
		if (!isAuth) {
			toast.error('请先导入密钥')
			return
		}
		setJournalOpen(true)
	}

	const handleEmotionConfirm = async (emotion: string, text: string) => {
		if (emotionSaving || !emotion) return
		const trimmed = text.trim()
		const next: EmotionEventData = {
			...emotionEvents,
			[todayKey]: [...(emotionEvents[todayKey] ?? []), { emotion, time: new Date().toISOString() }]
		}
		setEmotionEvents(next)
		setEmotionSaving(true)
		try {
			// 先存记录（commit 1），有文字再追加到当月博客（commit 2）
			await saveEmotionEventData(next)
			if (trimmed) {
				await appendLearningLog({ eventName: `心境 · ${getEmotion(emotion).label}`, summary: trimmed, date: todayKey })
			}
			setJournalOpen(false)
		} catch (error: any) {
			console.error(error)
			toast.error(error?.message || '记录失败')
			setEmotionEvents(emotionEvents)
		} finally {
			setEmotionSaving(false)
		}
	}

	// 切换到上个月
	const handlePrevMonth = () => {
		setCurrentMonth(prev => prev.subtract(1, 'month'))
	}

	// 切换到下个月
	const handleNextMonth = () => {
		setCurrentMonth(prev => prev.add(1, 'month'))
	}

	const handleDateClick = (day: number) => {
		const dateStr = currentMonth.clone().date(day).format('YYYY-MM-DD')
		setSelectedDate(dateStr)
		setShowModal(true)
	}

	const handleDateHover = (day: number) => {
		const dateStr = currentMonth.clone().date(day).format('YYYY-MM-DD')
		setHoveredDate(dateStr)
	}

	const handleDateLeave = () => {
		setHoveredDate(null)
	}

	const handleCloseModal = () => {
		setShowModal(false)
		setSelectedDate(null)
	}

	// 判断是否是今天
	const isToday = (day: number) => {
		return currentMonth.isSame(now, 'month') && day === currentDate
	}

	return (
		<HomeDraggableLayer cardKey='calendarCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className='flex flex-col max-sm:static'>
				{siteContent.enableChristmas && (
					<>
						<img
							src='/images/christmas/snow-7.webp'
							alt='Christmas decoration'
							className='pointer-events-none absolute'
							style={{ width: 150, right: -12, top: -12, opacity: 0.8 }}
						/>
					</>
				)}

				<div className="flex items-center justify-between">
					<button
						onClick={handlePrevMonth}
						className="text-secondary text-lg font-bold px-2 hover:text-brand transition-colors"
					>
						&lt;
					</button>
					<h3 className='text-secondary text-sm'>
						{currentMonth.format('YYYY/M/D')} {currentMonth.format('ddd')}
					</h3>
					<button
						onClick={handleNextMonth}
						className="text-secondary text-lg font-bold px-2 hover:text-brand transition-colors"
					>
						&gt;
					</button>
				</div>
				<ul className={cn('text-secondary mt-3 grid h-[206px] flex-1 grid-cols-7 gap-2 text-sm', (styles.height < 240 || styles.width < 240) && 'text-xs')}>
					{new Array(7).fill(0).map((_, index) => {
						const isCurrentWeekday = index === currentWeekday
						return (
							<li key={index} className={cn('flex items-center justify-center font-medium', isCurrentWeekday && 'text-brand')}>
								{dates[index]}
							</li>
						)
					})}
					{new Array(firstDayWeekday).fill(0).map((_, index) => (
						<li key={`empty-${index}`} />
					))}

					{new Array(daysInMonth).fill(0).map((_, index) => {
						const day = index + 1
						const isCurrentDay = isToday(day)
						const dateStr = currentMonth.clone().date(day).format('YYYY-MM-DD')
						const isHovered = hoveredDate === dateStr
						return (
							<li
								key={day}
								onClick={() => handleDateClick(day)}
								onMouseEnter={() => handleDateHover(day)}
								onMouseLeave={handleDateLeave}
								className={cn(
									'relative flex items-center justify-center rounded-lg cursor-pointer transition-all hover:bg-gray-100',
									isCurrentDay && 'bg-linear border font-medium'
								)}>
								{day}
								{isHovered && <DateActivityTooltip date={dateStr} emotions={getDayEmotions(emotionEvents, dateStr)} />}
							</li>
						)
					})}
				</ul>
				<button
					onClick={handleOpenJournal}
					disabled={emotionSaving}
					title={`本月翻涌 ${lostCount} · 沉静 ${ctrlCount}（点击记录这次）`}
					className='mt-3 flex w-full items-center gap-2 disabled:opacity-60'>
					<span className='inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-secondary transition-colors hover:bg-gray-100'>
						<Zap className='h-3.5 w-3.5' />
						<span>心境</span>
					</span>
					<div className='flex h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100'>
						{segments.map(s => (
							<div
								key={s.def.key}
								title={`${s.def.label} ${s.count} 次`}
								className='h-full transition-all'
								style={{ width: `${(s.count / monthCount) * 100}%`, background: s.def.color }}
							/>
						))}
					</div>
					<span className='whitespace-nowrap text-xs text-secondary'>
					翻涌 <span className='font-medium text-red-500'>{lostCount}</span> · 沉静 <span className='font-medium text-emerald-500'>{ctrlCount}</span>
				</span>
				</button>
			</Card>




			<DialogModal open={showModal} onClose={handleCloseModal}>
				{selectedDate && (
					<DateActivityModal date={selectedDate} emotions={getDayEmotions(emotionEvents, selectedDate)} onClose={handleCloseModal} />
				)}
			</DialogModal>

			<EmotionJournalDialog
				open={journalOpen}
				date={todayKey}
				submitting={emotionSaving}
				onClose={() => setJournalOpen(false)}
				onConfirm={handleEmotionConfirm}
			/>
		</HomeDraggableLayer>
	)
}

const dates = ['一', '二', '三', '四', '五', '六', '日']
