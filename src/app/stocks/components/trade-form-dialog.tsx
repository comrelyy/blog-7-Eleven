'use client'

import { useEffect, useMemo, useState } from 'react'
import { DialogModal } from '@/components/dialog-modal'
import { computeStock, marketLabel, moneySymbol, type Stock, type StockTrade } from '@/lib/cost-basis'

function todayStr() {
	const t = new Date()
	return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export default function TradeFormDialog({
	open,
	stock,
	onClose,
	onSubmit
}: {
	open: boolean
	stock?: Stock
	onClose: () => void
	onSubmit: (trade: StockTrade) => void | Promise<void>
}) {
	const [type, setType] = useState<'buy' | 'sell'>('buy')
	const [date, setDate] = useState(todayStr())
	const [shares, setShares] = useState('')
	const [price, setPrice] = useState('')
	const [fee, setFee] = useState('')
	const [dayLow, setDayLow] = useState('')
	const [dayHigh, setDayHigh] = useState('')
	const [note, setNote] = useState('')
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		if (!open) return
		setType('buy')
		setDate(todayStr())
		setShares('')
		setPrice('')
		setFee('')
		setDayLow('')
		setDayHigh('')
		setNote('')
		setSubmitting(false)
	}, [open])

	const preview = useMemo(() => {
		if (!stock) return null
		const sharesN = parseFloat(shares)
		const priceN = parseFloat(price)
		const feeN = parseFloat(fee) || 0
		if (!sharesN || !priceN) return { kind: 'placeholder' as const, message: '填写数量和成交价后预览本笔盈亏' }

		if (type === 'buy') {
			const totalCost = sharesN * priceN + feeN
			return { kind: 'info' as const, message: `✓ 买入 ${sharesN} 股 @ ${priceN}，本笔总成本 ${moneySymbol(stock.market)}${totalCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}（含手续费）` }
		}

		const simStock: Stock = {
			...stock,
			trades: [
				...stock.trades,
				{ id: '__sim__', type: 'sell', date: '9999-12-31', price: priceN, shares: sharesN, fee: feeN }
			]
		}
		const c = computeStock(simStock)
		const simPnl = c.tradePnl['__sim__']
		const err = c.errors.find(e => e.tradeId === '__sim__')
		if (err) {
			const heldNow = computeStock(stock).heldShares
			return { kind: 'error' as const, message: `⚠️ ${err.message}：当前持仓仅 ${heldNow} 股` }
		}
		const sign = simPnl >= 0 ? '盈利 +' : '亏损 -'
		const abs = Math.abs(simPnl).toLocaleString('en-US', { maximumFractionDigits: 2 })
		return {
			kind: simPnl >= 0 ? ('info' as const) : ('warning' as const),
			message: `💰 LIFO 匹配后：本笔 ${sign}${moneySymbol(stock.market)}${abs}（已扣手续费）`
		}
	}, [stock, type, shares, price, fee])

	const canSubmit = preview && (preview.kind === 'info' || preview.kind === 'warning')

	const handleSubmit = async () => {
		if (!stock || !canSubmit || submitting) return
		const sharesN = parseFloat(shares)
		const priceN = parseFloat(price)
		const feeN = fee ? parseFloat(fee) : undefined
		const lowN = dayLow ? parseFloat(dayLow) : undefined
		const highN = dayHigh ? parseFloat(dayHigh) : undefined
		const trade: StockTrade = {
			id: String(Date.now()),
			type,
			date,
			price: priceN,
			shares: sharesN
		}
		if (feeN !== undefined && !Number.isNaN(feeN)) trade.fee = feeN
		if (lowN !== undefined && !Number.isNaN(lowN)) trade.dayLow = lowN
		if (highN !== undefined && !Number.isNaN(highN)) trade.dayHigh = highN
		if (note.trim()) trade.note = note.trim()

		setSubmitting(true)
		try {
			await onSubmit(trade)
		} finally {
			setSubmitting(false)
		}
	}

	if (!stock) return null

	const previewBg =
		preview?.kind === 'info' ? 'bg-green-50 border-green-200 text-green-800'
			: preview?.kind === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800'
				: preview?.kind === 'error' ? 'bg-red-50 border-red-200 text-red-800'
					: 'bg-gray-50 border-gray-200 text-secondary'

	return (
		<DialogModal open={open} onClose={onClose}>
			<div className='w-[min(30rem,calc(100vw-2rem))] rounded-3xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto'>
				<div className='mb-1 flex items-center gap-3'>
					<span className='inline-block h-5 w-5 rounded-full' style={{ background: stock.color }} />
					<h3 className='text-lg font-semibold text-primary'>添加交易 · {stock.name}</h3>
				</div>
				<div className='mb-5 text-xs text-secondary'>{stock.symbol} · {marketLabel(stock.market)}</div>

				<div className='mb-4 flex rounded-xl bg-gray-100 p-1'>
					<button
						type='button'
						onClick={() => setType('buy')}
						className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${type === 'buy' ? 'bg-white text-[#e0413c] shadow-sm' : 'text-secondary'}`}>
						买入
					</button>
					<button
						type='button'
						onClick={() => setType('sell')}
						className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${type === 'sell' ? 'bg-white text-[#2bb673] shadow-sm' : 'text-secondary'}`}>
						卖出
					</button>
				</div>

				<div className='space-y-3'>
					<div className='grid grid-cols-2 gap-3'>
						<Field label='日期'>
							<input type='date' value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
						</Field>
						<Field label='数量（股）'>
							<input type='number' min='1' step='1' value={shares} onChange={e => setShares(e.target.value)} className={inputCls} />
						</Field>
					</div>

					<div className='grid grid-cols-2 gap-3'>
						<Field label='成交价'>
							<input type='number' step='0.01' value={price} onChange={e => setPrice(e.target.value)} className={inputCls} />
						</Field>
						<Field label='手续费（可选）'>
							<input type='number' step='0.01' value={fee} onChange={e => setFee(e.target.value)} placeholder='0' className={inputCls} />
						</Field>
					</div>

					<div className='grid grid-cols-2 gap-3'>
						<Field label='当天最低（可选）'>
							<input type='number' step='0.01' value={dayLow} onChange={e => setDayLow(e.target.value)} className={inputCls} />
						</Field>
						<Field label='当天最高（可选）'>
							<input type='number' step='0.01' value={dayHigh} onChange={e => setDayHigh(e.target.value)} className={inputCls} />
						</Field>
					</div>

					<Field label='备注（可选）'>
						<textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder='买入原因、当时市场情绪…' className={`${inputCls} resize-none`} />
					</Field>
				</div>

				{preview && (
					<div className={`mt-4 rounded-xl border px-3 py-2.5 text-xs ${previewBg}`}>{preview.message}</div>
				)}

				<div className='mt-5 flex justify-end gap-2'>
					<button onClick={onClose} className='rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50'>
						取消
					</button>
					<button
						onClick={handleSubmit}
						disabled={!canSubmit || submitting}
						className='rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'>
						{submitting ? '保存中…' : '保存'}
					</button>
				</div>
			</div>
		</DialogModal>
	)
}

const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-primary placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/30'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div>
			<label className='mb-1 block text-xs font-medium text-secondary'>{label}</label>
			{children}
		</div>
	)
}
