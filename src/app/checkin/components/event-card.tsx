'use client'

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { CheckinEvent, CheckinRecord } from '../services/checkin-data-service'

const CARD_HEIGHT = 300

function parseDate(s: string) {
	const [y, m, d] = s.split('-').map(Number)
	return new Date(y, m - 1, d)
}

function fmtDate(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function streakFor(records: CheckinRecord[], eventId: string, today: string) {
	const set = new Set(records.filter(r => r.eventId === eventId).map(r => r.date))
	let cursor = today
	if (!set.has(cursor)) {
		const y = new Date(parseDate(today).getTime() - 86400000)
		cursor = fmtDate(y)
		if (!set.has(cursor)) return 0
	}
	let count = 0
	while (set.has(cursor)) {
		count++
		const prev = new Date(parseDate(cursor).getTime() - 86400000)
		cursor = fmtDate(prev)
	}
	return count
}

function daysRunning(event: CheckinEvent, today: string): number {
	let start: string
	if (event.start) {
		start = event.start
	} else {
		const ts = Number(event.id)
		start = Number.isFinite(ts) && ts > 0 ? fmtDate(new Date(ts)) : today
	}
	if (start > today) return 0
	const tail = event.end && event.end < today ? event.end : today
	const diff = Math.round((parseDate(tail).getTime() - parseDate(start).getTime()) / 86400000) + 1
	return Math.max(diff, 0)
}

export default function EventCard({
	event,
	records,
	today,
	checkedToday,
	disabled,
	onToggleCheck,
	onEdit,
	onDelete
}: {
	event: CheckinEvent
	records: CheckinRecord[]
	today: string
	checkedToday: boolean
	disabled?: boolean
	onToggleCheck: () => void
	onEdit: () => void
	onDelete: () => void
}) {
	const [flipped, setFlipped] = useState(false)
	const [confirmDelete, setConfirmDelete] = useState(false)

	const ended = !!event.end && event.end < today
	const streak = useMemo(() => streakFor(records, event.id, today), [records, event.id, today])
	const history = useMemo(
		() =>
			records
				.filter(r => r.eventId === event.id)
				.map(r => r.date)
				.sort((a, b) => b.localeCompare(a)),
		[records, event.id]
	)
	const total = history.length
	const elapsed = useMemo(() => daysRunning(event, today), [event, today])

	const flipBack = () => {
		setFlipped(false)
		setConfirmDelete(false)
	}

	const handleDelete = () => {
		if (!confirmDelete) {
			setConfirmDelete(true)
			return
		}
		onDelete()
	}

	const dateRangeLine =
		event.start && event.end
			? `${event.start} → ${event.end}`
			: event.start
				? `自 ${event.start}`
				: event.end
					? `截止 ${event.end}`
					: '长期'

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ type: 'spring', stiffness: 320, damping: 28 }}
			className='relative w-full'
			style={{ perspective: 1200, height: CARD_HEIGHT }}>
			<motion.div
				animate={{ rotateY: flipped ? 180 : 0 }}
				transition={{ duration: 0.55, ease: [0.7, 0, 0.3, 1] }}
				className='relative h-full w-full'
				style={{ transformStyle: 'preserve-3d' }}>
				{/* Front */}
				<div
					className={`absolute inset-0 flex flex-col items-center rounded-3xl border border-white/40 bg-white/50 p-5 text-center shadow-sm backdrop-blur-md transition ${checkedToday ? 'opacity-75' : ''}`}
					style={{ backfaceVisibility: 'hidden' }}>
					<div className='flex items-center gap-2'>
						<span className='h-3 w-3 rounded-full' style={{ background: event.color }} />
						<span className='text-[11px] text-secondary'>{dateRangeLine}</span>
					</div>

					{event.category && (
						<span className='mt-2 rounded-full px-2 py-0.5 text-[10px] font-medium' style={{ background: `${event.color}22`, color: event.color }}>
							{event.category}
						</span>
					)}

					<h2 className='mt-2 line-clamp-2 text-base font-semibold text-primary max-sm:text-sm'>{event.name}</h2>

					<div className='mt-3 flex items-end gap-3'>
						<div className='min-w-[3rem]'>
							<div className='text-[10px] text-secondary'>已进行</div>
							<div className='text-xl font-bold leading-none text-primary'>
								{elapsed}
								<span className='ml-0.5 text-[10px] font-medium text-secondary'>天</span>
							</div>
						</div>
						<div className='h-7 w-px bg-secondary/20' />
						<div className='min-w-[3rem]'>
							<div className='text-[10px] text-secondary'>已打卡</div>
							<div className='text-xl font-bold leading-none text-primary'>
								{total}
								<span className='ml-0.5 text-[10px] font-medium text-secondary'>次</span>
							</div>
						</div>
						<div className='h-7 w-px bg-secondary/20' />
						<div className='min-w-[3rem]'>
							<div className='text-[10px] text-secondary'>streak</div>
							<div className='text-xl font-bold leading-none text-primary'>
								{streak}
								<span className='ml-0.5 text-[10px]'>🔥</span>
							</div>
						</div>
					</div>

					<button
						type='button'
						disabled={disabled}
						onClick={onToggleCheck}
						aria-pressed={checkedToday}
						className='mt-4 rounded-full px-7 py-2.5 text-sm font-semibold shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
						style={{
							background: checkedToday ? '#e5e7eb' : event.color,
							color: checkedToday ? '#6b7280' : 'white',
							boxShadow: checkedToday ? undefined : `0 6px 16px ${event.color}55`
						}}>
						{ended ? '打卡截止' : checkedToday ? '✓ 今日已打 · 取消' : '今日打卡'}
					</button>

					{event.description && (
						<p className='mt-3 line-clamp-2 text-[11px] text-secondary whitespace-pre-line'>{event.description}</p>
					)}

					<button onClick={() => setFlipped(true)} className='mt-auto pt-2 text-[11px] text-secondary transition hover:text-primary'>
						翻面看历史 →
					</button>
				</div>

				{/* Back */}
				<div
					className='absolute inset-0 flex flex-col rounded-3xl border border-white/40 bg-white/50 p-5 shadow-sm backdrop-blur-md'
					style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
					<div className='mb-2 flex items-center justify-between gap-2'>
						<div className='flex min-w-0 items-center gap-2'>
							<span className='h-3 w-3 shrink-0 rounded-full' style={{ background: event.color }} />
							<span className='truncate text-sm font-medium text-primary'>{event.name}</span>
						</div>
						<button onClick={flipBack} className='shrink-0 text-[11px] text-secondary transition hover:text-primary'>
							← 返回
						</button>
					</div>

					<div className='mb-3 flex items-center gap-2 text-[10px] text-secondary'>
						<span>{dateRangeLine}</span>
						{event.category && (
							<span className='rounded-full px-2 py-0.5 font-medium' style={{ background: `${event.color}22`, color: event.color }}>
								{event.category}
							</span>
						)}
					</div>

					<div className='min-h-0 flex-1 overflow-y-auto rounded-xl bg-white/40 p-3'>
						<div className='mb-2 text-[11px] font-medium text-primary'>打卡记录 · {total}</div>
						{history.length === 0 ? (
							<div className='text-[11px] text-secondary/60'>暂无打卡记录</div>
						) : (
							<div className='grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-secondary'>
								{history.slice(0, 60).map(d => (
									<div key={d} className='flex items-center gap-1.5'>
										<span className='h-1.5 w-1.5 rounded-full' style={{ background: event.color }} />
										{d}
									</div>
								))}
							</div>
						)}
					</div>

					<div className='mt-3 flex items-center justify-between gap-2'>
						<button
							onClick={handleDelete}
							className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
								confirmDelete ? 'bg-red-500 text-white shadow-sm hover:bg-red-600' : 'text-red-500 hover:bg-red-50'
							}`}>
							{confirmDelete ? '确认删除' : '删除'}
						</button>
						<button onClick={onEdit} className='rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90'>
							编辑
						</button>
					</div>
				</div>
			</motion.div>
		</motion.div>
	)
}
