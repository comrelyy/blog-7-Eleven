'use client'

import { useState } from 'react'
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


dayjs.locale('zh-cn')

export default function CalendarCard() {
	const center = useCenterStore()
	const { cardStyles } = useConfigStore()
	
	// 使用 useState 来管理当前显示的月份
	const [currentMonth, setCurrentMonth] = useState(dayjs())
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
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y}>
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
				<ul className='text-secondary mt-3 grid h-[206px] grid-cols-7 gap-2 text-sm'>
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
			</Card>




			<DialogModal open={showModal} onClose={handleCloseModal}>
				{selectedDate && <DateActivityModal date={selectedDate} onClose={handleCloseModal} />}
			</DialogModal>
		</HomeDraggableLayer>
	)
}

const dates = ['一', '二', '三', '四', '五', '六', '日']