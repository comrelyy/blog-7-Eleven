'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isBetween from 'dayjs/plugin/isBetween'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { INIT_DELAY, ANIMATION_DELAY } from '@/consts'
import type { BlogIndexItem } from '@/hooks/use-blog-index'
import { loadCheckinData } from '@/app/checkin/services/checkin-data-service'
import type { CheckinData, CheckinRecord, CheckinEvent } from '@/app/checkin/services/checkin-data-service'
import { getThoughtsByDate, type Thought } from './services/push-thoughts'
import { DialogModal } from '@/components/dialog-modal'

dayjs.locale('zh-cn')
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(isBetween)

interface DateActivityModalProps {
	date: string // YYYY-MM-DD format
	onClose: () => void
}

export default function DateActivityModal({ date, onClose }: DateActivityModalProps) {
	const [checkinData, setCheckinData] = useState<CheckinData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { items: blogs } = useBlogIndex()

	const [postsOnDate, setPostsOnDate] = useState<BlogIndexItem[]>([])
	const [thoughtsOnDate, setThoughtsOnDate] = useState<Thought[]>([]) // 添加当天碎碎念状态
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
				
				// 加载当天的碎碎念数据
				const thoughts = await getThoughtsByDate(date)
				setThoughtsOnDate(thoughts)
			} catch (err) {
				console.error('Failed to load checkin data from GitHub:', err)
				setError(err instanceof Error ? err.message : '未知错误')
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

	const formatTime = (timestamp: number) => {
		const dateObj = new Date(timestamp)
		return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`
	}

	const displayDate = dayjs(date).format('YYYY年 M月 D日 dddd')

	// 如果数据还在加载中
	if (loading) {
		return (
			<DialogModal open onClose={onClose} className='card scrollbar-none max-h-[90vh] min-h-[300px] w-[400px] overflow-y-auto'>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: INIT_DELAY }}
					className='mb-4'>
					<h2 className='text-2xl font-bold text-gray-900'>{displayDate}</h2>
					<p className='text-sm text-gray-500 mt-1'>查看当天动态</p>
				</motion.div>
				
				<div className='text-center py-4'>加载中...</div>
				
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 6 }}
					className='flex justify-end'>
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={onClose}
						className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
						关闭
					</motion.button>
				</motion.div>
			</DialogModal>
		)
	}

	// 如果加载出错
	if (error) {
		return (
			<DialogModal open onClose={onClose} className='card scrollbar-none max-h-[90vh] min-h-[300px] w-[400px] overflow-y-auto'>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: INIT_DELAY }}
					className='mb-4'>
					<h2 className='text-2xl font-bold text-gray-900'>{displayDate}</h2>
					<p className='text-sm text-gray-500 mt-1'>查看当天动态</p>
				</motion.div>
				
				<div className='text-red-500 mb-4'>加载打卡数据失败: {error}</div>
				
				{/* Posts on this date */}
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 2 }}
					className='mb-4'>
					<h3 className='mb-2 text-sm font-semibold text-gray-700'>当日文章</h3>
					{postsOnDate.length > 0 ? (
						<ul className='space-y-2'>
							{postsOnDate.map((post, idx) => (
								<motion.li
									key={post.slug}
									initial={{ opacity: 0, x: -8 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: INIT_DELAY + ANIMATION_DELAY * (3 + idx) }}
									className='rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors bg-[var(--color-article)]'>
									<a href={`/blog/${post.slug}`} className='block'>
										<p className='text-sm font-medium text-gray-900 hover:text-brand'>{post.title || post.slug}</p>
										{post.summary && <p className='text-xs text-gray-500 mt-1 line-clamp-2'>{post.summary}</p>}
									</a>
								</motion.li>
							))}
						</ul>
					) : (
						<p className='text-sm text-gray-500'>暂无文章</p>
					)}
				</motion.div>
				
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 6 }}
					className='flex justify-end'>
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={onClose}
						className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
						关闭
					</motion.button>
				</motion.div>
			</DialogModal>
		)
	}

	return (
		<DialogModal open onClose={onClose} className='card scrollbar-none max-h-[90vh] min-h-[300px] w-[400px] overflow-y-auto'>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: INIT_DELAY }}
				className='mb-4'>
				<h2 className='text-2xl font-bold text-gray-900'>{displayDate}</h2>
				<p className='text-sm text-gray-500 mt-1'>查看当天动态</p>
			</motion.div>

			{/* Checkin events */}
			{eventsOnDate.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: INIT_DELAY + ANIMATION_DELAY }}
					className='mb-4 rounded-lg border border-gray-200 p-3'>
					<h3 className='text-sm font-semibold text-gray-700 mb-2'>打卡事件</h3>
					<div className='space-y-1'>
						{eventsOnDate.map(event => {
							// 检查是否存在对应的打卡记录
							const isChecked = checkinData?.records.some(
								r => r.date === date && r.eventId === event.id
							) || false
							return (
								<div key={event.id} className='flex items-center gap-2 text-sm'>
									<span 
										className='h-2 w-2 rounded-full flex-shrink-0' 
										style={{ 
											backgroundColor: isChecked ? '#10b981' : event.color 
										}}
									/>
									<span className='flex-1 break-words'>{event.name}</span>
									<span style={{ 
										color: isChecked ? '#10b981' : undefined 
									}}>
										{isChecked ? '✓' : '○'}
									</span>
								</div>
							)
						})}
					</div>
				</motion.div>
			)}

			{/* Thoughts on this date */}
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 1 }}
				className='mb-4'>
				<h3 className='mb-2 text-sm font-semibold text-gray-700'>当日碎碎念</h3>
				{thoughtsOnDate.length > 0 ? (
					<div className='space-y-1'>
						{thoughtsOnDate.map((thought, idx) => (
							<motion.div
								key={thought.id}
								initial={{ opacity: 0, x: -8 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: INIT_DELAY + ANIMATION_DELAY * (2 + idx) }}
								className='text-sm flex items-start bg-[var(--color-card)] p-2 rounded-lg'>
								<span className='mr-2 text-secondary flex-shrink-0'>•</span>
								<div className='flex-1 min-w-0'>
									<span className='text-secondary text-xs mr-2 whitespace-nowrap'>
										{formatTime(thought.timestamp)}
									</span>
									<span className='break-words'>{thought.text}</span>
								</div>
							</motion.div>
						))}
					</div>
				) : (
					<p className='text-sm text-gray-500'>暂无碎碎念</p>
				)}
			</motion.div>

			{/* Posts on this date */}
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 3 }}
				className='mb-4'>
				<h3 className='mb-2 text-sm font-semibold text-gray-700'>当日文章</h3>
				{postsOnDate.length > 0 ? (
					<ul className='space-y-2'>
						{postsOnDate.map((post, idx) => (
							<motion.li
								key={post.slug}
								initial={{ opacity: 0, x: -8 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: INIT_DELAY + ANIMATION_DELAY * (4 + idx) }}
								className='rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors bg-[var(--color-article)]'>
								<a href={`/blog/${post.slug}`} className='block'>
									<p className='text-sm font-medium text-gray-900 hover:text-brand break-words'>{post.title || post.slug}</p>
									{post.summary && <p className='text-xs text-gray-500 mt-1 break-words'>{post.summary}</p>}
								</a>
							</motion.li>
						))}
					</ul>
				) : (
					<p className='text-sm text-gray-500'>暂无文章</p>
				)}
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 6 }}
				className='flex justify-end'>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={onClose}
					className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
					关闭
				</motion.button>
			</motion.div>
		</DialogModal>
	)
}