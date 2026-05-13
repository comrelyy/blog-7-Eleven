'use client'

import { useMemo } from 'react'
import type { Stock } from '@/lib/cost-basis'

const WEEKS_BACK = 53
const CELL = 12
const GAP = 3

const EMPTY = 'rgba(0,0,0,0.04)'
const BUY_LEVELS = ['rgba(224, 65, 60, 0.25)', 'rgba(224, 65, 60, 0.5)', 'rgba(224, 65, 60, 0.75)', '#e0413c']
const SELL_LEVELS = ['rgba(43, 182, 115, 0.25)', 'rgba(43, 182, 115, 0.5)', 'rgba(43, 182, 115, 0.75)', '#2bb673']
const MIXED_LEVELS = ['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.55)', 'rgba(245, 158, 11, 0.8)', '#f59e0b']
const BRAND = '#35bfab'

function fmtDate(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(s: string) {
	const [y, m, d] = s.split('-').map(Number)
	return new Date(y, m - 1, d)
}

function levelIdx(count: number) {
	if (count <= 0) return -1
	if (count === 1) return 0
	if (count === 2) return 1
	if (count === 3) return 2
	return 3
}

function cellColor(buys: number, sells: number): string {
	const total = buys + sells
	if (total === 0) return EMPTY
	if (buys > sells) return BUY_LEVELS[levelIdx(buys)]
	if (sells > buys) return SELL_LEVELS[levelIdx(sells)]
	return MIXED_LEVELS[levelIdx(total)]
}

export default function TradeHeatmap({ stocks, today }: { stocks: Stock[]; today: string }) {
	const byDate = useMemo(() => {
		const m = new Map<string, { buys: number; sells: number }>()
		for (const stock of stocks) {
			for (const t of stock.trades) {
				const slot = m.get(t.date) ?? { buys: 0, sells: 0 }
				if (t.type === 'buy') slot.buys += 1
				else slot.sells += 1
				m.set(t.date, slot)
			}
		}
		return m
	}, [stocks])

	const weeks = useMemo(() => {
		const todayDate = parseDate(today)
		const todayDow = todayDate.getDay()
		const mondayOffset = todayDow === 0 ? 6 : todayDow - 1
		const lastMonday = new Date(todayDate.getTime() - mondayOffset * 86400000)
		const start = new Date(lastMonday.getTime() - (WEEKS_BACK - 1) * 7 * 86400000)
		const grid: string[][] = []
		for (let w = 0; w < WEEKS_BACK; w++) {
			const col: string[] = []
			for (let d = 0; d < 7; d++) {
				const dt = new Date(start.getTime() + (w * 7 + d) * 86400000)
				col.push(fmtDate(dt))
			}
			grid.push(col)
		}
		return grid
	}, [today])

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

	const totalTrades = useMemo(() => {
		let n = 0
		for (const v of byDate.values()) n += v.buys + v.sells
		return n
	}, [byDate])

	return (
		<div className='rounded-2xl border border-white/40 bg-white/40 p-4 shadow-sm backdrop-blur-md'>
			<div className='mb-3 flex items-end justify-between'>
				<div>
					<div className='text-xs font-medium text-primary'>交易热力</div>
					<div className='text-[10px] text-secondary'>近 {WEEKS_BACK} 周共 {totalTrades} 笔交易</div>
				</div>
			</div>
			<div className='overflow-x-auto'>
				<div style={{ display: 'flex', gap: GAP }} className='pb-1'>
					{weeks.map((col, wi) => (
						<div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
							{col.map(date => {
								const slot = byDate.get(date)
								const buys = slot?.buys ?? 0
								const sells = slot?.sells ?? 0
								const count = buys + sells
								const future = date > today
								const isToday = date === today
								const bg = future ? 'rgba(0,0,0,0.02)' : cellColor(buys, sells)
								const title = future ? '' : count === 0 ? `${date} · 无交易` : `${date} · 买 ${buys} / 卖 ${sells}`
								return (
									<div
										key={date}
										title={title}
										style={{
											width: CELL,
											height: CELL,
											borderRadius: 3,
											background: bg,
											outline: isToday ? `1.5px solid ${BRAND}` : 'none',
											outlineOffset: 1
										}}
									/>
								)
							})}
						</div>
					))}
				</div>
				<div className='relative mt-1 h-3 text-[9px] text-secondary/70'>
					{monthLabels.map((m, i) => (
						<span key={i} style={{ position: 'absolute', left: m.weekIdx * (CELL + GAP) }}>
							{m.label}
						</span>
					))}
				</div>
			</div>
			<div className='mt-3 flex items-center justify-end gap-4 text-[10px] text-secondary'>
				<LegendRow label='买多' levels={BUY_LEVELS} />
				<LegendRow label='卖多' levels={SELL_LEVELS} />
				<LegendRow label='对半' levels={MIXED_LEVELS} />
			</div>
		</div>
	)
}

function LegendRow({ label, levels }: { label: string; levels: string[] }) {
	return (
		<div className='flex items-center gap-1'>
			<span className='mr-1'>{label}</span>
			{levels.map((bg, i) => (
				<span key={i} style={{ width: 10, height: 10, background: bg, borderRadius: 2, display: 'inline-block' }} />
			))}
		</div>
	)
}
