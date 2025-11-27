'use client'

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isBetween from 'dayjs/plugin/isBetween'
import { useBlogIndex } from '@/hooks/use-blog-index'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

dayjs.locale('zh-cn')
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(isBetween)

interface DateActivityTooltipProps {
	date: string // YYYY-MM-DD format
}

interface CheckinRecord {
	date: string
	eventId: string
}

interface CheckinEvent {
	id: string
	name: string
	color: string
	start?: string
	end?: string
}

export default function DateActivityTooltip({ date }: DateActivityTooltipProps) {
	const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([])
	const [checkinEvents, setCheckinEvents] = useState<CheckinEvent[]>([])
	const { items: blogs } = useBlogIndex()
	const [hasCheckin, setHasCheckin] = useState(false)
	const [postsOnDate, setPostsOnDate] = useState<BlogIndexItem[]>([])
	const [eventsOnDate, setEventsOnDate] = useState<CheckinEvent[]>([])

	useEffect(() => {
		// Load checkin records from localStorage
		const stored = localStorage.getItem('checkin-records')
		if (stored) {
			try {
				const records = JSON.parse(stored) as CheckinRecord[]
				setCheckinRecords(records)
				// 检查当天是否有任何打卡记录来判断是否已打卡
				const checked = records.some(r => r.date === date)
				setHasCheckin(checked)
			} catch (e) {
				console.error('Failed to parse checkin records:', e)
			}
		}

		// Load checkin events from localStorage
		const storedEvents = localStorage.getItem('checkin-events')
		if (storedEvents) {
			try {
				const events = JSON.parse(storedEvents) as CheckinEvent[]
				setCheckinEvents(events)
				
				// Filter events that are active on the given date
				const activeEvents = events.filter(event => {
					const eventDate = dayjs(date)
					const startDate = event.start ? dayjs(event.start) : null
					const endDate = event.end ? dayjs(event.end) : null
					
					// If event has no start/end date, it's always active
					if (!startDate && !endDate) return true
					
					// If event has only start date, it's active from start date onwards
					if (startDate && !endDate) return eventDate.isSameOrAfter(startDate, 'day')
					
					// If event has only end date, it's active until end date
					if (!startDate && endDate) return eventDate.isSameOrBefore(endDate, 'day')
					
					// If event has both start and end date, it's active between them
					if (startDate && endDate) return eventDate.isBetween(startDate, endDate, 'day', '[]')
					
					return false
				})
				
				setEventsOnDate(activeEvents)
			} catch (e) {
				console.error('Failed to parse checkin events:', e)
			}
		}

		// Find posts published on this date
		const postsForDate = blogs.filter(blog => {
			const blogDate = dayjs(blog.date).format('YYYY-MM-DD')
			return blogDate === date
		})
		setPostsOnDate(postsForDate)
	}, [date, blogs])

	return (
		<div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-lg bg-white border border-gray-200 shadow-lg p-3 text-xs pointer-events-none text-gray-800'>
			{/* Checkin events */}
			{eventsOnDate.length > 0 && (
				<div className='mb-2'>
					<p className='text-gray-600 font-medium mb-1'>打卡事件:</p>
					<div className='space-y-1'>
						{eventsOnDate.map(event => {
							// 修改这里：检查是否存在对应的打卡记录，而不是检查checked属性
							const isChecked = checkinRecords.some(
								r => r.date === date && r.eventId === event.id
							)
							return (
								<div key={event.id} className='flex items-center gap-2'>
									<span 
										className='h-2 w-2 rounded-full' 
										style={{ backgroundColor: event.color }}
									/>
									<span className='flex-1 truncate'>{event.name}</span>
									<span>{isChecked ? '✓' : '○'}</span>
								</div>
							)
						})}
					</div>
				</div>
			)}
			
			{/* Posts */}
			{postsOnDate.length > 0 && (
				<div className='space-y-1'>
					<p className='text-gray-600 font-medium'>文章: {postsOnDate.length}</p>
					{postsOnDate.slice(0, 2).map(post => (
						<p key={post.slug} className='text-gray-500 truncate'>{post.title || post.slug}</p>
					))}
					{postsOnDate.length > 2 && <p className='text-gray-400 text-xs'>还有 {postsOnDate.length - 2} 篇...</p>}
				</div>
			)}
		</div>
	)
}