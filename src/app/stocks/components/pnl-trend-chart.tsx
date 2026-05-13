'use client'

import { useMemo, useState } from 'react'
import { computeStock, marketLabel, moneySymbol, type Market, type Stock } from '@/lib/cost-basis'

const WEEKS_BACK = 53
const W = 960
const H = 200
const PAD_LEFT = 14
const PAD_RIGHT = 14
const PAD_TOP = 14
const PAD_BOTTOM = 22

const MARKET_COLOR: Record<Market, string> = {
	A: '#e0413c',
	HK: '#1d4ed8',
	US: '#7c3aed'
}

function fmtDate(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(s: string) {
	const [y, m, d] = s.split('-').map(Number)
	return new Date(y, m - 1, d)
}

type Series = {
	market: Market
	cumulative: number[] // length WEEKS_BACK + 1; cumulative[i] = 累计盈亏到第 i 周末（i=0 表示窗口起点之前）
	min: number
	max: number
	latest: number
}

function buildWeeklySeries(stocks: Stock[], market: Market, weekStart: Date): Series | null {
	let initial = 0
	const weeklyDeltas = new Array(WEEKS_BACK).fill(0)
	let hasAny = false

	for (const stock of stocks) {
		if (stock.market !== market) continue
		const c = computeStock(stock)
		for (const t of c.sortedTrades) {
			if (t.type !== 'sell') continue
			const pnl = c.tradePnl[t.id]
			if (pnl === undefined) continue
			hasAny = true
			const tradeDate = parseDate(t.date)
			const diffDays = Math.floor((tradeDate.getTime() - weekStart.getTime()) / 86400000)
			if (diffDays < 0) {
				initial += pnl
			} else {
				const wi = Math.floor(diffDays / 7)
				if (wi >= 0 && wi < WEEKS_BACK) weeklyDeltas[wi] += pnl
			}
		}
	}

	if (!hasAny) return null

	const cumulative: number[] = [initial]
	let acc = initial
	for (let i = 0; i < WEEKS_BACK; i++) {
		acc += weeklyDeltas[i]
		cumulative.push(acc)
	}

	const min = Math.min(...cumulative)
	const max = Math.max(...cumulative)
	return { market, cumulative, min, max, latest: cumulative[cumulative.length - 1] }
}

export default function PnlTrendChart({ stocks, today }: { stocks: Stock[]; today: string }) {
	const { series, weekStart, weekLabels } = useMemo(() => {
		const todayDate = parseDate(today)
		const todayDow = todayDate.getDay()
		const mondayOffset = todayDow === 0 ? 6 : todayDow - 1
		const lastMonday = new Date(todayDate.getTime() - mondayOffset * 86400000)
		const start = new Date(lastMonday.getTime() - (WEEKS_BACK - 1) * 7 * 86400000)

		const series: Series[] = []
		for (const m of ['A', 'HK', 'US'] as Market[]) {
			const s = buildWeeklySeries(stocks, m, start)
			if (s) series.push(s)
		}

		// 用每周的 Monday 作为 label 锚点
		const labels: { idx: number; label: string }[] = []
		let lastMonth = -1
		for (let i = 0; i < WEEKS_BACK; i++) {
			const d = new Date(start.getTime() + i * 7 * 86400000)
			if (d.getMonth() !== lastMonth) {
				labels.push({ idx: i, label: `${d.getMonth() + 1}月` })
				lastMonth = d.getMonth()
			}
		}

		return { series, weekStart: start, weekLabels: labels }
	}, [stocks, today])

	const [hoverIdx, setHoverIdx] = useState<number | null>(null)

	if (series.length === 0) {
		return (
			<div className='rounded-2xl border border-white/40 bg-white/40 p-4 text-center text-xs text-secondary shadow-sm backdrop-blur-md'>
				还没有卖出交易，无法生成收益曲线
			</div>
		)
	}

	const innerW = W - PAD_LEFT - PAD_RIGHT
	const innerH = H - PAD_TOP - PAD_BOTTOM
	const N = WEEKS_BACK + 1
	const xOf = (i: number) => PAD_LEFT + (i / (N - 1)) * innerW

	// 每条线独立归一化到 [0, 1] 内自己的 [min, max]
	const yOf = (s: Series, i: number) => {
		const range = s.max - s.min
		if (range === 0) return PAD_TOP + innerH / 2
		return PAD_TOP + (1 - (s.cumulative[i] - s.min) / range) * innerH
	}

	const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
		const rect = e.currentTarget.getBoundingClientRect()
		const x = ((e.clientX - rect.left) / rect.width) * W
		const ratio = (x - PAD_LEFT) / innerW
		const idx = Math.max(0, Math.min(N - 1, Math.round(ratio * (N - 1))))
		setHoverIdx(idx)
	}

	const hoverWeekDate = hoverIdx !== null && hoverIdx > 0 ? fmtDate(new Date(weekStart.getTime() + (hoverIdx - 1) * 7 * 86400000)) : null

	return (
		<div className='rounded-2xl border border-white/40 bg-white/40 p-4 shadow-sm backdrop-blur-md'>
			<div className='mb-3 flex items-end justify-between'>
				<div>
					<div className='text-xs font-medium text-primary'>累计已实现盈亏 · 按周</div>
					<div className='text-[10px] text-secondary'>近 {WEEKS_BACK} 周 · 每条线独立纵向缩放</div>
				</div>
				<div className='flex flex-wrap gap-3 text-[11px]'>
					{series.map(s => (
						<div key={s.market} className='flex items-center gap-1.5'>
							<span className='h-1.5 w-1.5 rounded-full' style={{ background: MARKET_COLOR[s.market] }} />
							<span className='text-secondary'>{marketLabel(s.market)}</span>
							<span className={`font-semibold tabular-nums ${s.latest >= 0 ? 'text-[#e0413c]' : 'text-[#2bb673]'}`}>
								{s.latest >= 0 ? '+' : '-'}
								{moneySymbol(s.market)}
								{Math.abs(s.latest).toLocaleString('en-US', { maximumFractionDigits: 0 })}
							</span>
						</div>
					))}
				</div>
			</div>

			<svg
				viewBox={`0 0 ${W} ${H}`}
				className='h-48 w-full cursor-crosshair'
				preserveAspectRatio='none'
				onMouseMove={handleMove}
				onMouseLeave={() => setHoverIdx(null)}>
				{/* baseline */}
				<line x1={PAD_LEFT} x2={W - PAD_RIGHT} y1={H - PAD_BOTTOM} y2={H - PAD_BOTTOM} stroke='rgba(123,136,142,0.25)' strokeWidth='1' />

				{/* 月份标签 */}
				{weekLabels.map((m, i) => (
					<text key={i} x={xOf(m.idx + 1)} y={H - 6} fontSize='9' fill='rgba(123,136,142,0.7)' textAnchor='middle'>
						{m.label}
					</text>
				))}

				{/* lines */}
				{series.map(s => {
					const d = s.cumulative.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i)} ${yOf(s, i)}`).join(' ')
					return <path key={s.market} d={d} fill='none' stroke={MARKET_COLOR[s.market]} strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round' />
				})}

				{/* hover crosshair */}
				{hoverIdx !== null && (
					<>
						<line x1={xOf(hoverIdx)} x2={xOf(hoverIdx)} y1={PAD_TOP} y2={H - PAD_BOTTOM} stroke='rgba(51,79,82,0.3)' strokeWidth='1' strokeDasharray='2 2' />
						{series.map(s => (
							<circle key={s.market} cx={xOf(hoverIdx)} cy={yOf(s, hoverIdx)} r='3.5' fill='white' stroke={MARKET_COLOR[s.market]} strokeWidth='1.5' />
						))}
					</>
				)}
			</svg>

			<div className='mt-1 flex items-center justify-between text-[10px] text-secondary'>
				{hoverIdx !== null ? (
					<>
						<span>{hoverWeekDate ? `${hoverWeekDate} 当周末` : '窗口起点之前'}</span>
						<div className='flex gap-3'>
							{series.map(s => {
								const v = s.cumulative[hoverIdx]
								return (
									<span key={s.market} className='tabular-nums' style={{ color: MARKET_COLOR[s.market] }}>
										{marketLabel(s.market)} {v >= 0 ? '+' : '-'}
										{moneySymbol(s.market)}
										{Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}
									</span>
								)
							})}
						</div>
					</>
				) : (
					<>
						<span>{fmtDate(weekStart)}</span>
						<span>{today}</span>
					</>
				)}
			</div>
		</div>
	)
}
