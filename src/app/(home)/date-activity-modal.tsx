'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { INIT_DELAY, ANIMATION_DELAY } from '@/consts'
import type { BlogIndexItem } from '@/hooks/use-blog-index'
import { loadCheckinData } from '@/app/checkin/services/checkin-data-service'
import type { CheckinData, CheckinRecord, CheckinEvent } from '@/app/checkin/services/checkin-data-service'

interface DateActivityModalProps {
	date: string // YYYY-MM-DD format
	onClose: () => void
}

export default function DateActivityModal({ date, onClose }: DateActivityModalProps) {
	const [checkinData, setCheckinData] = useState<CheckinData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { items: blogs } = useBlogIndex()

	const [hasCheckin, setHasCheckin] = useState(false)
	const [postsOnDate, setPostsOnDate] = useState<BlogIndexItem[]>([])

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
				}
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

	const displayDate = dayjs(date).format('YYYY年 M月 D日 dddd')

	// 如果数据还在加载中
	if (loading) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 20 }}
				className='w-full max-w-md rounded-lg bg-white p-6 shadow-lg'>
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: INIT_DELAY }}
					className='mb-4'>
					<h2 className='text-2xl font-bold text-gray-900'>{displayDate}</h2>
					<p className='text-sm text-gray-500 mt-1'>查看当天动态</p>
				</motion.div>
				
				<div className='text-center py-4'>加载中...</div>
			</motion.div>
		)
	}

	// 如果加载出错
	if (error) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 20 }}
				className='w-full max-w-md rounded-lg bg-white p-6 shadow-lg'>
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
									className='rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors'>
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
					<button
						onClick={onClose}
						className='rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200'>
						关闭
					</button>
				</motion.div>
			</motion.div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 20 }}
			className='w-full max-w-md rounded-lg bg-white p-6 shadow-lg'>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: INIT_DELAY }}
				className='mb-4'>
				<h2 className='text-2xl font-bold text-gray-900'>{displayDate}</h2>
				<p className='text-sm text-gray-500 mt-1'>查看当天动态</p>
			</motion.div>

			{/* Checkin status */}
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: INIT_DELAY + ANIMATION_DELAY }}
				className='mb-4 rounded-lg border border-gray-200 p-3'>
				<div className='flex items-center gap-2'>
					<div className={`h-3 w-3 rounded-full ${hasCheckin ? 'bg-green-500' : 'bg-gray-300'}`} />
					<span className='text-sm font-medium'>
						{hasCheckin ? '✓ 已打卡' : '未打卡'}
					</span>
				</div>
			</motion.div>

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
								className='rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors'>
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
				<button
					onClick={onClose}
					className='rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200'>
					关闭
				</button>
			</motion.div>
		</motion.div>
	)
}