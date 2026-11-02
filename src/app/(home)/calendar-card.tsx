'use client'

import { useEffect, useState } from 'react'
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
import { loadEmotionEventData, getDayEmotions, type EmotionEventData } from './services/emotion-event-service'
import EmotionLineCardDialog from './emotion-line-card-dialog'
import { MessageCircle } from 'lucide-react'

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
	const [lineCardOpen, setLineCardOpen] = useState(false)

	useEffect(() => {
		void loadEmotionEventData().then(setEmotionEvents)
	}, [])

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

				<div className='flex items-center justify-between'>
					<button onClick={handlePrevMonth} className='text-secondary hover:text-brand px-2 text-lg font-bold transition-colors'>
						&lt;
					</button>
					<h3 className='text-secondary min-w-0 truncate text-sm'>
						{currentMonth.format('YYYY/M/D')} {currentMonth.format('ddd')}
					</h3>
					<div className='flex shrink-0 items-center gap-1'>
						<button
							type='button'
							onClick={() => setLineCardOpen(true)}
							aria-label='打开情绪台词卡'
							title='情绪台词卡'
							className='text-secondary hover:text-brand focus-visible:outline-brand inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'>
							<MessageCircle size={12} aria-hidden='true' />
							{styles.width >= 300 && <span>情绪台词卡</span>}
						</button>
						<button onClick={handleNextMonth} className='text-secondary hover:text-brand px-2 text-lg font-bold transition-colors'>
							&gt;
						</button>
					</div>
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
									'relative flex cursor-pointer items-center justify-center rounded-lg transition-all hover:bg-gray-100',
									isCurrentDay && 'bg-linear border font-medium'
								)}>
								{day}
								{isHovered && <DateActivityTooltip date={dateStr} emotions={getDayEmotions(emotionEvents, dateStr)} />}
							</li>
						)
					})}
				</ul>
			</Card>

			<DialogModal open={showModal} onClose={handleCloseModal}>
				{selectedDate && <DateActivityModal date={selectedDate} emotions={getDayEmotions(emotionEvents, selectedDate)} onClose={handleCloseModal} />}
			</DialogModal>

			<EmotionLineCardDialog open={lineCardOpen} onClose={() => setLineCardOpen(false)} />
		</HomeDraggableLayer>
	)
}

const dates = ['一', '二', '三', '四', '五', '六', '日']
