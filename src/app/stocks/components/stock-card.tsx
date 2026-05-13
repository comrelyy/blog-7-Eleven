'use client'

import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { computeStock, formatMoney, marketLabel, moneySymbol, type Stock, type StockTrade } from '@/lib/cost-basis'

const CARD_HEIGHT = 320

const MARKET_TAG_STYLE: Record<Stock['market'], string> = {
	A: 'bg-red-100 text-red-700',
	HK: 'bg-blue-100 text-blue-700',
	US: 'bg-indigo-100 text-indigo-700'
}

function pnlClass(n: number) {
	return n >= 0 ? 'text-[#e0413c]' : 'text-[#2bb673]'
}

function pnlText(market: Stock['market'], n: number, decimals = 0) {
	const sign = n >= 0 ? '+' : '-'
	const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
	return `${sign}${moneySymbol(market)}${abs}`
}

export default function StockCard({
	stock,
	onAddTrade,
	onEdit,
	onDeleteStock,
	onDeleteTrade
}: {
	stock: Stock
	onAddTrade: () => void
	onEdit: () => void
	onDeleteStock: () => void
	onDeleteTrade: (tradeId: string) => void
}) {
	const [flipped, setFlipped] = useState(false)
	const [confirmDelete, setConfirmDelete] = useState(false)

	const c = useMemo(() => computeStock(stock), [stock])
	const isCleared = c.heldShares === 0
	const lastTrade = c.sortedTrades[c.sortedTrades.length - 1]

	const tradesReversed = useMemo(() => [...c.sortedTrades].reverse(), [c.sortedTrades])

	const flipBack = () => {
		setFlipped(false)
		setConfirmDelete(false)
	}

	const handleDeleteStock = () => {
		if (!confirmDelete) {
			setConfirmDelete(true)
			setTimeout(() => setConfirmDelete(false), 3000)
			return
		}
		onDeleteStock()
	}

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
					className={`absolute inset-0 flex flex-col items-center rounded-3xl border border-white/40 bg-white/50 p-5 text-center shadow-sm backdrop-blur-md ${isCleared ? 'opacity-75' : ''}`}
					style={{ backfaceVisibility: 'hidden' }}>
					<div className='flex items-center gap-2'>
						<span className='h-2.5 w-2.5 rounded-full' style={{ background: stock.color }} />
						<span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${MARKET_TAG_STYLE[stock.market]}`}>{marketLabel(stock.market)}</span>
						<span className='font-mono text-[11px] text-secondary'>{stock.symbol}</span>
					</div>

					<h2 className='mt-2 line-clamp-2 text-base font-semibold text-primary max-sm:text-sm'>{stock.name}</h2>

					<div className='mt-3 flex items-end gap-3'>
						<div className='min-w-[3.5rem]'>
							<div className='text-[10px] text-secondary'>持仓</div>
							<div className='text-lg font-bold leading-none text-primary tabular-nums'>
								{c.heldShares.toLocaleString()}
								<span className='ml-0.5 text-[10px] font-medium text-secondary'>股</span>
							</div>
						</div>
						<div className='h-7 w-px bg-secondary/20' />
						<div className='min-w-[3.5rem]'>
							<div className='text-[10px] text-secondary'>均价</div>
							<div className='text-lg font-bold leading-none text-primary tabular-nums'>
								{c.avgPrice !== null ? formatMoney(stock.market, c.avgPrice, { decimals: 2 }) : '—'}
							</div>
						</div>
						<div className='h-7 w-px bg-secondary/20' />
						<div className='min-w-[3.5rem]'>
							<div className='text-[10px] text-secondary'>已实现</div>
							<div className={`text-lg font-bold leading-none tabular-nums ${pnlClass(c.realized)}`}>{pnlText(stock.market, c.realized)}</div>
						</div>
					</div>

					<button
						type='button'
						onClick={onAddTrade}
						className='mt-4 rounded-full px-6 py-2 text-sm font-semibold text-white shadow-md transition active:scale-95'
						style={
							isCleared
								? { background: '#e5e7eb', color: '#6b7280' }
								: { background: '#e0413c', boxShadow: '0 6px 16px #e0413c44' }
						}>
						{isCleared ? '补记交易' : '+ 添加交易'}
					</button>

					{lastTrade && (
						<div className='mt-3 text-[11px] text-secondary'>
							最近：{lastTrade.date} {lastTrade.type === 'buy' ? '买入' : '卖出'} {lastTrade.shares} @ {lastTrade.price.toLocaleString()}
						</div>
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
							<span className='h-2.5 w-2.5 shrink-0 rounded-full' style={{ background: stock.color }} />
							<span className='truncate text-sm font-semibold text-primary'>{stock.name}</span>
							<span className='font-mono text-[10px] text-secondary'>{stock.symbol}</span>
						</div>
						<button onClick={flipBack} className='shrink-0 text-[11px] text-secondary transition hover:text-primary'>
							← 返回
						</button>
					</div>

					<div className='min-h-0 flex-1 overflow-y-auto rounded-xl bg-white/40 p-3 text-[11.5px]'>
						{tradesReversed.length === 0 ? (
							<div className='py-5 text-center text-[11px] text-secondary/60'>暂无交易记录</div>
						) : (
							<TradeHistory stock={stock} trades={tradesReversed} tradePnl={c.tradePnl} tradeRound={c.tradeRound} roundPnls={c.roundPnls} onDelete={onDeleteTrade} />
						)}
					</div>

					<div className='mt-3 flex items-center justify-between gap-2'>
						<button
							onClick={handleDeleteStock}
							className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
								confirmDelete ? 'bg-red-500 text-white shadow-sm hover:bg-red-600' : 'text-red-500 hover:bg-red-50'
							}`}>
							{confirmDelete ? '确认删除' : '删除股票'}
						</button>
						<div className='flex gap-2'>
							<button onClick={onEdit} className='rounded-xl border border-secondary/20 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-white/60'>
								编辑
							</button>
							<button onClick={onAddTrade} className='rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90'>
								+ 添加交易
							</button>
						</div>
					</div>
				</div>
			</motion.div>
		</motion.div>
	)
}

function TradeHistory({
	stock,
	trades,
	tradePnl,
	tradeRound,
	roundPnls,
	onDelete
}: {
	stock: Stock
	trades: StockTrade[]
	tradePnl: Record<string, number>
	tradeRound: Record<string, number>
	roundPnls: number[]
	onDelete: (id: string) => void
}) {
	const rows: React.ReactNode[] = []
	for (let i = 0; i < trades.length; i++) {
		const t = trades[i]
		rows.push(<TradeRow key={t.id} stock={stock} trade={t} pnl={t.type === 'sell' ? tradePnl[t.id] : undefined} onDelete={() => onDelete(t.id)} />)
		const nextOlder = trades[i + 1]
		if (nextOlder && tradeRound[t.id] > tradeRound[nextOlder.id]) {
			const olderRound = tradeRound[nextOlder.id]
			const rp = roundPnls[olderRound]
			rows.push(<RoundDivider key={`divider-${olderRound}`} market={stock.market} pnl={rp} />)
		}
	}
	return <div className='space-y-0'>{rows}</div>
}

function TradeRow({ stock, trade, pnl, onDelete }: { stock: Stock; trade: StockTrade; pnl?: number; onDelete: () => void }) {
	const [hovered, setHovered] = useState(false)
	return (
		<div
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			className='grid grid-cols-[72px_28px_1fr_auto] items-center gap-1.5 border-b border-dashed border-secondary/15 py-1 last:border-b-0'>
			<div className='text-[10.5px] text-secondary'>{trade.date}</div>
			<div className={`rounded px-1 py-px text-center text-[10.5px] font-bold ${trade.type === 'buy' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
				{trade.type === 'buy' ? '买' : '卖'}
			</div>
			<div className='tabular-nums text-[11px] text-primary'>
				{trade.shares} @ {trade.price.toLocaleString()}
				{trade.note && <span className='ml-2 text-[10px] text-secondary/80'>· {trade.note}</span>}
			</div>
			{hovered ? (
				<button onClick={onDelete} className='rounded px-1.5 py-0.5 text-[10.5px] text-red-600 transition hover:bg-red-100'>
					删除
				</button>
			) : pnl !== undefined ? (
				<span className={`tabular-nums text-[11px] font-semibold ${pnlClass(pnl)}`}>{pnlText(stock.market, pnl)}</span>
			) : (
				<span />
			)}
		</div>
	)
}

function RoundDivider({ market, pnl }: { market: Stock['market']; pnl: number }) {
	return (
		<div className='my-1.5 flex items-center gap-1.5 text-[10px] text-secondary'>
			<div className='h-px flex-1 bg-gradient-to-r from-transparent via-secondary/30 to-transparent' />
			<span className='whitespace-nowrap rounded-full bg-white/70 px-2 py-0.5'>
				🔄 重新建仓 · 上轮结算 <span className={`font-bold ${pnlClass(pnl)}`}>{pnlText(market, pnl)}</span>
			</span>
			<div className='h-px flex-1 bg-gradient-to-r from-transparent via-secondary/30 to-transparent' />
		</div>
	)
}
