'use client'

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useBlogIndex } from '@/hooks/use-blog-index'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

dayjs.locale('zh-cn')

interface DateActivityTooltipProps {
	date: string // YYYY-MM-DD format
}

interface CheckinRecord {
	date: string
	checked: boolean
}

export default function DateActivityTooltip({ date }: DateActivityTooltipProps) {
	const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([])
	const { items: blogs } = useBlogIndex()
	const [hasCheckin, setHasCheckin] = useState(false)
	const [postsOnDate, setPostsOnDate] = useState<BlogIndexItem[]>([])

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

	return (
		<div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-lg bg-white border border-gray-200 shadow-lg p-3 text-xs pointer-events-none text-gray-800'>
			<div className='flex items-center gap-2 mb-2'>
				<div className={`h-2 w-2 rounded-full ${hasCheckin ? 'bg-green-500' : 'bg-gray-300'}`} />
				<span className='font-medium'>{hasCheckin ? '已打卡' : '未打卡'}</span>
			</div>
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
