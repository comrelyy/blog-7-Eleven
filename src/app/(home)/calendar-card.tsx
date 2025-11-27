'use client'

import { useState } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { CARD_SPACING } from '@/consts'
import { styles as hiCardStyles } from './hi-card'
import { styles as clockCardStyles } from './clock-card'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { cn } from '@/lib/utils'
import { DialogModal } from '@/components/dialog-modal'
import DateActivityModal from './date-activity-modal'
import DateActivityTooltip from './date-activity-tooltip'

dayjs.locale('zh-cn')

export const styles = {
	width: 350,
	height: 286,
	order: 5
}

export default function CalendarCard() {
	const center = useCenterStore()
	const now = dayjs()
	const currentDate = now.date()
	const firstDayOfMonth = now.startOf('month')
	const firstDayWeekday = (firstDayOfMonth.day() + 6) % 7
	const daysInMonth = now.daysInMonth()
	const currentWeekday = (now.day() + 6) % 7

	const [selectedDate, setSelectedDate] = useState<string | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [hoveredDate, setHoveredDate] = useState<string | null>(null)

	const handleDateClick = (day: number) => {
		const dateStr = now.clone().date(day).format('YYYY-MM-DD')
		setSelectedDate(dateStr)
		setShowModal(true)
	}

	const handleDateHover = (day: number) => {
		const dateStr = now.clone().date(day).format('YYYY-MM-DD')
		setHoveredDate(dateStr)
	}

	const handleDateLeave = () => {
		setHoveredDate(null)
	}

	const handleCloseModal = () => {
		setShowModal(false)
		setSelectedDate(null)
	}

	return (
		<>
			<Card
				order={styles.order}
				width={styles.width}
				height={styles.height}
				x={center.x + CARD_SPACING + hiCardStyles.width / 2}
				y={center.y - clockCardStyles.offset + CARD_SPACING}>
				<h3 className='text-secondary text-sm'>
					{now.format('YYYY/M/D')} {now.format('ddd')}
				</h3>
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
						const isToday = day === currentDate
						const dateStr = now.clone().date(day).format('YYYY-MM-DD')
						const isHovered = hoveredDate === dateStr
						return (
							<li
								key={day}
								onClick={() => handleDateClick(day)}
								onMouseEnter={() => handleDateHover(day)}
								onMouseLeave={handleDateLeave}
								className={cn(
									'relative flex items-center justify-center rounded-lg cursor-pointer transition-all hover:bg-gray-100',
									isToday && 'bg-linear border font-medium'
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
		</>
	)
}

const dates = ['一', '二', '三', '四', '五', '六', '日']
