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
import { loadEmotionLossData, saveEmotionLossData, getDayRecord, type EmotionLossData } from './services/emotion-loss-service'
import { Angry, Smile } from 'lucide-react'


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
	const [emotionLoss, setEmotionLoss] = useState<EmotionLossData>({})
	const [emotionSavingKind, setEmotionSavingKind] = useState<'lost' | 'controlled' | null>(null)
	const todayKey = now.format('YYYY-MM-DD')
	const todayRecord = getDayRecord(emotionLoss, todayKey)

	const monthStats = useMemo(() => {
		const prefix = currentMonth.format('YYYY-MM')
		let lost = 0
		let controlled = 0
		for (const [date, rec] of Object.entries(emotionLoss)) {
			if (date.startsWith(prefix)) {
				lost += rec.lost
				controlled += rec.controlled
			}
		}
		return { lost, controlled }
	}, [emotionLoss, currentMonth])

	const monthMax = Math.max(monthStats.lost, monthStats.controlled, 5)
	const lostPercent = (monthStats.lost / monthMax) * 100
	const controlledPercent = (monthStats.controlled / monthMax) * 100

	useEffect(() => {
		void loadEmotionLossData().then(setEmotionLoss)
	}, [])

	const handleEmotionRecord = async (kind: 'lost' | 'controlled') => {
		if (emotionSavingKind) return
		const current = getDayRecord(emotionLoss, todayKey)
		const next: EmotionLossData = {
			...emotionLoss,
			[todayKey]: { ...current, [kind]: current[kind] + 1 }
		}
		setEmotionLoss(next)
		try {
			setEmotionSavingKind(kind)
			await saveEmotionLossData(next)
		} catch (error: any) {
			console.error(error)
			toast.error(error?.message || '记录失败')
			setEmotionLoss(emotionLoss)
		} finally {
			setEmotionSavingKind(null)
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
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className='flex flex-col'>
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
								{isHovered && <DateActivityTooltip date={dateStr} />}
							</li>
						)
					})}
				</ul>
				<div className='mt-3 flex items-center gap-2'>
					<div
						title={`本月情绪失控 ${monthStats.lost} 次`}
						className='flex h-1.5 flex-1 justify-end overflow-hidden rounded-full bg-red-100'>
						<div className='h-full rounded-full bg-red-400 transition-all' style={{ width: `${lostPercent}%` }} />
					</div>
					<button
						onClick={() => handleEmotionRecord('lost')}
						disabled={emotionSavingKind !== null}
						title={`情绪失控 +1（今日 ${todayRecord.lost} 次）`}
						className='inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60'>
						<Angry className='h-3.5 w-3.5' />
						<span>{todayRecord.lost}</span>
					</button>
					<button
						onClick={() => handleEmotionRecord('controlled')}
						disabled={emotionSavingKind !== null}
						title={`情绪控制 +1（今日 ${todayRecord.controlled} 次）`}
						className='inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-60'>
						<Smile className='h-3.5 w-3.5' />
						<span>{todayRecord.controlled}</span>
					</button>
					<div
						title={`本月情绪控制 ${monthStats.controlled} 次`}
						className='flex h-1.5 flex-1 overflow-hidden rounded-full bg-blue-100'>
						<div className='h-full rounded-full bg-blue-400 transition-all' style={{ width: `${controlledPercent}%` }} />
					</div>
				</div>
			</Card>




			<DialogModal open={showModal} onClose={handleCloseModal}>
				{selectedDate && <DateActivityModal date={selectedDate} onClose={handleCloseModal} />}
			</DialogModal>
		</HomeDraggableLayer>
	)
}

const dates = ['一', '二', '三', '四', '五', '六', '日']