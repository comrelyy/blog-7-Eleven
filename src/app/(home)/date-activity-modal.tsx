'use client'

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { motion } from 'motion/react'
import Link from 'next/link'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { INIT_DELAY, ANIMATION_DELAY } from '@/consts'

dayjs.locale('zh-cn')

interface DateActivityModalProps {
	date: string // YYYY-MM-DD format
	onClose: () => void
}

interface CheckinRecord {
	date: string
	checked: boolean
}

export default function DateActivityModal({ date, onClose }: DateActivityModalProps) {
	const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([])
	const { items: blogs } = useBlogIndex()

	const [hasCheckin, setHasCheckin] = useState(false)
	const [postsOnDate, setPostsOnDate] = useState<typeof blogs>([])

	useEffect(() => {
		// Load checkin records from localStorage
		const stored = localStorage.getItem('checkin-records')
		if (stored) {
			try {
				const records = JSON.parse(stored) as CheckinRecord[]
				setCheckinRecords(records)
				const checked = records.some(r => r.date === date && r.checked)
				setHasCheckin(checked)
			} catch (e) {
				console.error('Failed to parse checkin records:', e)
			}
		}

		// Find posts published on this date
		const postsForDate = blogs.filter(blog => {
			const blogDate = dayjs(blog.date).format('YYYY-MM-DD')
			return blogDate === date
		})
		setPostsOnDate(postsForDate)
	}, [date, blogs])

	const displayDate = dayjs(date).format('YYYY年 M月 D日 dddd')

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
								<Link href={`/blog/${post.slug}`} className='block'>
									<p className='text-sm font-medium text-gray-900 hover:text-brand'>{post.title || post.slug}</p>
									{post.summary && <p className='text-xs text-gray-500 mt-1 line-clamp-2'>{post.summary}</p>}
								</Link>
							</motion.li>
						))}
					</ul>
				) : (
					<p className='text-sm text-gray-500'>暂无文章发布</p>
				)}
			</motion.div>

			{/* Close button */}
			<motion.button
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 4 }}
				onClick={onClose}
				className='w-full rounded-lg bg-brand text-white py-2 px-3 text-sm font-medium hover:bg-brand/90 transition-colors'>
				关闭
			</motion.button>
		</motion.div>
	)
}
