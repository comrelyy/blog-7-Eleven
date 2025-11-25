 'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { INIT_DELAY, ANIMATION_DELAY } from '@/consts'

interface CheckinRecord {
	date: string
	checked: boolean
}

export default function CheckinClient() {
	const [records, setRecords] = useState<CheckinRecord[]>([])
	const [currentMonth, setCurrentMonth] = useState(new Date())

	useEffect(() => {
		const stored = localStorage.getItem('checkin-records')
		if (stored) {
			try {
				setRecords(JSON.parse(stored))
			} catch (e) {
				console.error('Failed to parse checkin records:', e)
			}
		}
	}, [])

	useEffect(() => {
		localStorage.setItem('checkin-records', JSON.stringify(records))
	}, [records])

	const handleCheckin = (date: string) => {
		setRecords(prev => {
			const existing = prev.find(r => r.date === date)
			if (existing) {
				return prev.map(r => (r.date === date ? { ...r, checked: !r.checked } : r))
			} else {
				return [...prev, { date, checked: true }]
			}
		})
	}

	const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
	const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
	const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
	const checkedCount = records.filter(r => r.checked).length

	const goToPreviousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
	const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
	const goToToday = () => setCurrentMonth(new Date())

	const isToday = (day: number): boolean => {
		const today = new Date()
		return (
			day === today.getDate() &&
			currentMonth.getMonth() === today.getMonth() &&
			currentMonth.getFullYear() === today.getFullYear()
		)
	}

	const isChecked = (day: number): boolean => {
		const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
		return records.some(r => r.date === dateStr && r.checked)
	}

	return (
		<>
			<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY }} className='mb-6 text-center'>
				<motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY }} className='mb-4 text-4xl font-bold'>我的打卡</motion.h1>
				<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY }} className='text-secondary text-lg'>坚持每一天，成就更好的自己</motion.p>
			</motion.div>

			<div className='grid grid-cols-3 gap-4'>
				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY }} className='rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center'>
					<div className='text-3xl font-bold text-blue-600'>{checkedCount}</div>
					<div className='text-sm text-gray-600'>总打卡次数</div>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 2 }} className='rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 text-center'>
					<div className='text-3xl font-bold text-green-600'>{daysInMonth}</div>
					<div className='text-sm text-gray-600'>本月天数</div>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 3 }} className='rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center'>
					<div className='text-3xl font-bold text-purple-600'>{Math.round((checkedCount / daysInMonth) * 100)}%</div>
					<div className='text-sm text-gray-600'>完成率</div>
				</motion.div>
			</div>

			<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 4 }} className='flex items-center justify-between mt-4'>
				<button onClick={goToPreviousMonth} className='rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors'>← 上月</button>
				<div className='flex items-center gap-4'>
					<h2 className='text-lg font-semibold text-gray-900'>{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</h2>
					<button onClick={goToToday} className='rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors'>今天</button>
				</div>
				<button onClick={goToNextMonth} className='rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors'>下月 →</button>
			</motion.div>

			<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 5 }} className='rounded-lg border border-gray-200 p-4 mt-4'>
				<div className='mb-4 grid grid-cols-7 gap-2'>
					{['日', '一', '二', '三', '四', '五', '六'].map(day => (
						<div key={day} className='text-center text-sm font-semibold text-gray-500'>{day}</div>
					))}
				</div>

				<div className='grid grid-cols-7 gap-2'>
					{Array.from({ length: firstDayOfMonth }).map((_, i) => (
						<div key={`empty-${i}`} />
					))}
					{days.map(day => {
						const checked = isChecked(day)
						const today = isToday(day)
						return (
							<button
								key={day}
								onClick={() => handleCheckin(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
								className={`aspect-square rounded-lg transition-all font-medium text-sm flex items-center justify-center ${
									checked
										? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-md hover:shadow-lg'
										: today
										? 'border-2 border-blue-400 bg-blue-50 text-gray-900 hover:bg-blue-100'
										: 'border border-gray-200 text-gray-600 hover:bg-gray-50'
								}`}>
								{day}
							</button>
						)
					})}
				</div>
			</motion.div>

			<p className='text-center text-sm text-gray-500 mt-4'>点击任意日期进行打卡 / 取消打卡</p>
		</>
	)
}
