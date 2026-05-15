'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { CheckinEvent, CheckinRecord } from '../services/checkin-data-service'

const DEFAULT_WEEKS_BACK = 53
const DEFAULT_CELL = 12
const DEFAULT_GAP = 3

function fmtDate(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(s: string) {
	const [y, m, d] = s.split('-').map(Number)
	return new Date(y, m - 1, d)
}

const BRAND = '#35bfab'
const LEVELS = ['rgba(0,0,0,0.04)', 'rgba(53, 191, 171, 0.28)', 'rgba(53, 191, 171, 0.55)', 'rgba(53, 191, 171, 0.82)', BRAND]

function level(count: number) {
	if (count <= 0) return 0
	if (count === 1) return 1
	if (count === 2) return 2
	if (count === 3) return 3
	return 4
}

export default function AggregatedHeatmap({
	events,
	records,
	today,
	onClickDate,
	weeksBack = DEFAULT_WEEKS_BACK,
	cell = DEFAULT_CELL,
	gap = DEFAULT_GAP,
	bare = false,
	showLegend = true,
	showMonthLabels = true
}: {
	events: CheckinEvent[]
	records: CheckinRecord[]
	today: string
	onClickDate?: (date: string) => void
	weeksBack?: number
	cell?: number
	gap?: number
	bare?: boolean
	showLegend?: boolean
	showMonthLabels?: boolean
}) {
	const eventIds = useMemo(() => new Set(events.map(e => e.id)), [events])

	const countByDate = useMemo(() => {
		const m = new Map<string, number>()
		for (const r of records) {
			if (!eventIds.has(r.eventId)) continue
			m.set(r.date, (m.get(r.date) ?? 0) + 1)
		}
		return m
	}, [records, eventIds])

	const weeks = useMemo(() => {
		const todayDate = parseDate(today)
		const todayDow = todayDate.getDay()
		const mondayOffset = todayDow === 0 ? 6 : todayDow - 1
		const lastMonday = new Date(todayDate.getTime() - mondayOffset * 86400000)
		const start = new Date(lastMonday.getTime() - (weeksBack - 1) * 7 * 86400000)
		const grid: string[][] = []
		for (let w = 0; w < weeksBack; w++) {
			const col: string[] = []
			for (let d = 0; d < 7; d++) {
				const dt = new Date(start.getTime() + (w * 7 + d) * 86400000)
				col.push(fmtDate(dt))
			}
			grid.push(col)
		}
		return grid
	}, [today, weeksBack])

	const monthLabels = useMemo(() => {
		const labels: { weekIdx: number; label: string }[] = []
		let lastMonth = -1
		weeks.forEach((col, idx) => {
			const d = parseDate(col[0])
			if (d.getMonth() !== lastMonth) {
				labels.push({ weekIdx: idx, label: `${d.getMonth() + 1}月` })
				lastMonth = d.getMonth()
			}
		})
		return labels
	}, [weeks])

	return (
		<div className={cn(!bare && 'rounded-2xl border border-white/40 bg-white/40 p-4 backdrop-blur-md shadow-sm')}>
			<div className='overflow-x-auto'>
				<div style={{ display: 'flex', gap }} className='pb-1'>
					{weeks.map((col, wi) => (
						<div key={wi} style={{ display: 'flex', flexDirection: 'column', gap }}>
							{col.map(date => {
								const count = countByDate.get(date) ?? 0
								const future = date > today
								const isToday = date === today
								const lv = future ? 0 : level(count)
								const clickable = !future && !!onClickDate
								return (
									<button
										key={date}
										type='button'
										disabled={!clickable}
										onClick={clickable ? () => onClickDate!(date) : undefined}
										title={future ? '' : `${date} · ${count === 0 ? '未打卡' : `打了 ${count} 项`}${clickable ? ' · 点击编辑' : ''}`}
										style={{
											width: cell,
											height: cell,
											borderRadius: 3,
											background: future ? 'rgba(0,0,0,0.02)' : LEVELS[lv],
											outline: isToday ? `1.5px solid ${BRAND}` : 'none',
											outlineOffset: 1,
											cursor: clickable ? 'pointer' : 'default',
											padding: 0,
											border: 'none'
										}}
										className={clickable ? 'transition hover:scale-110' : ''}
									/>
								)
							})}
						</div>
					))}
				</div>
				{showMonthLabels && (
					<div className='relative mt-1 h-3 text-[9px] text-secondary/70'>
						{monthLabels.map((m, i) => (
							<span key={i} style={{ position: 'absolute', left: m.weekIdx * (cell + gap) }}>
								{m.label}
							</span>
						))}
					</div>
				)}
			</div>
			{showLegend && (
				<div className='mt-3 flex items-center justify-end gap-2 text-[10px] text-secondary'>
					<span>少</span>
					{LEVELS.map((bg, i) => (
						<span key={i} style={{ width: cell, height: cell, background: bg, borderRadius: 3, display: 'inline-block' }} />
					))}
					<span>多</span>
				</div>
			)}
		</div>
	)
}
