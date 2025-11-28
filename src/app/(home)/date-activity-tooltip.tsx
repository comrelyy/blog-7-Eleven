'use client'

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isBetween from 'dayjs/plugin/isBetween'
import { useBlogIndex } from '@/hooks/use-blog-index'
import type { BlogIndexItem } from '@/hooks/use-blog-index'
import { loadCheckinData } from '@/app/checkin/services/checkin-data-service'
import type { CheckinData, CheckinRecord, CheckinEvent } from '@/app/checkin/services/checkin-data-service'

dayjs.locale('zh-cn')
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(isBetween)

interface DateActivityTooltipProps {
	date: string // YYYY-MM-DD format
}

export default function DateActivityTooltip({ date }: DateActivityTooltipProps) {
	const [checkinData, setCheckinData] = useState<CheckinData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { items: blogs } = useBlogIndex()
	const [hasCheckin, setHasCheckin] = useState(false)
	const [postsOnDate, setPostsOnDate] = useState<BlogIndexItem[]>([])
	const [eventsOnDate, setEventsOnDate] = useState<CheckinEvent[]>([])

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true)
				setError(null)
				// 从GitHub加载打卡数据
				const data = await loadCheckinData()
				setCheckinData(data)
				
				if (data) {
					// 检查当天是否有任何打卡记录来判断是否已打卡
					const checked = data.records.some(r => r.date === date)
					setHasCheckin(checked)
					
					// Filter events that are active on the given date
					const activeEvents = data.events.filter(event => {
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
				}
			} catch (err) {
				console.error('Failed to load checkin data from GitHub:', err)
				setError(err instanceof Error ? err.message : '未知错误')
				// 如果从GitHub加载失败，可以考虑使用localStorage作为后备方案
			} finally {
				setLoading(false)
			}
		}

		loadData()

		// Find posts published on this date
		const postsForDate = blogs.filter(blog => {
			const blogDate = dayjs(blog.date).format('YYYY-MM-DD')
			return blogDate === date
		})
		setPostsOnDate(postsForDate)
	}, [date, blogs])

	// 如果数据还在加载中
	if (loading) {
		return (
			<div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-lg bg-white border border-gray-200 shadow-lg p-3 text-xs pointer-events-none text-gray-800'>
				<div className='space-y-1'>
					<p className='text-gray-600 font-medium'>文章: {postsOnDate.length}</p>
					{postsOnDate.slice(0, 2).map(post => (
						<p key={post.slug} className='text-gray-500 truncate'>{post.title || post.slug}</p>
					))}
					{postsOnDate.length > 2 && <p className='text-gray-400 text-xs'>还有 {postsOnDate.length - 2} 篇...</p>}
				</div>
			</div>
		)
	}

	// 如果加载出错
	if (error) {
		return (
			<div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-lg bg-white border border-gray-200 shadow-lg p-3 text-xs pointer-events-none text-gray-800'>
				<div className='text-red-500 mb-2'>加载打卡数据失败</div>
				<div className='space-y-1'>
					<p className='text-gray-600 font-medium'>文章: {postsOnDate.length}</p>
					{postsOnDate.slice(0, 2).map(post => (
						<p key={post.slug} className='text-gray-500 truncate'>{post.title || post.slug}</p>
					))}
					{postsOnDate.length > 2 && <p className='text-gray-400 text-xs'>还有 {postsOnDate.length - 2} 篇...</p>}
				</div>
			</div>
		)
	}

	return (
		<div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-lg bg-white border border-gray-200 shadow-lg p-3 text-xs pointer-events-none text-gray-800'>
			{/* Checkin events */}
			{eventsOnDate.length > 0 && (
				<div className='mb-2'>
					<p className='text-gray-600 font-medium mb-1'>打卡事件:</p>
					<div className='space-y-1'>
						{eventsOnDate.map(event => {
							// 检查是否存在对应的打卡记录
							const isChecked = checkinData?.records.some(
								r => r.date === date && r.eventId === event.id
							) || false
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