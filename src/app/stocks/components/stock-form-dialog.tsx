'use client'

import { useEffect, useState } from 'react'
import { DialogModal } from '@/components/dialog-modal'
import type { Market, Stock } from '@/lib/cost-basis'

const COLORS = ['#e0413c', '#1fc9e7', '#35bfab', '#84D68A', '#EDDD62', '#f59e0b', '#8b5cf6', '#ec4899']

export default function StockFormDialog({
	open,
	mode,
	initial,
	existingSymbols,
	onClose,
	onSubmit
}: {
	open: boolean
	mode: 'create' | 'edit'
	initial?: Stock
	existingSymbols: string[]
	onClose: () => void
	onSubmit: (stock: Stock) => void | Promise<void>
}) {
	const [symbol, setSymbol] = useState('')
	const [name, setName] = useState('')
	const [market, setMarket] = useState<Market>('A')
	const [color, setColor] = useState(COLORS[0])
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		if (!open) return
		setSymbol(initial?.symbol ?? '')
		setName(initial?.name ?? '')
		setMarket(initial?.market ?? 'A')
		setColor(initial?.color ?? COLORS[0])
		setSubmitting(false)
		setError('')
	}, [open, initial])

	const handleSubmit = async () => {
		const s = symbol.trim()
		const n = name.trim()
		if (!s || !n || submitting) {
			setError('代码和名称必填')
			return
		}
		if (mode === 'create' && existingSymbols.includes(s)) {
			setError('该代码已存在')
			return
		}
		setSubmitting(true)
		try {
			const next: Stock = {
				symbol: s,
				name: n,
				market,
				color,
				trades: initial?.trades ?? []
			}
			await onSubmit(next)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<DialogModal open={open} onClose={onClose}>
			<div className='w-[min(28rem,calc(100vw-2rem))] rounded-3xl bg-white p-6 shadow-xl'>
				<div className='mb-5 flex items-center gap-3'>
					<span className='inline-block h-5 w-5 rounded-full' style={{ background: color }} />
					<h3 className='text-lg font-semibold text-primary'>{mode === 'create' ? '添加股票' : '编辑股票'}</h3>
				</div>

				<div className='space-y-4'>
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='mb-1 block text-xs font-medium text-secondary'>代码</label>
							<input
								value={symbol}
								onChange={e => {
									setSymbol(e.target.value)
									setError('')
								}}
								disabled={mode === 'edit'}
								placeholder='600519 / AAPL / 00700'
								className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2 font-mono text-sm text-primary placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:bg-gray-50 disabled:text-secondary'
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium text-secondary'>市场</label>
							<select
								value={market}
								onChange={e => setMarket(e.target.value as Market)}
								className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-primary focus:border-brand focus:ring-2 focus:ring-brand/30'>
								<option value='A'>A 股</option>
								<option value='HK'>港股</option>
								<option value='US'>美股</option>
							</select>
						</div>
					</div>

					<div>
						<label className='mb-1 block text-xs font-medium text-secondary'>名称</label>
						<input
							value={name}
							onChange={e => {
								setName(e.target.value)
								setError('')
							}}
							placeholder='贵州茅台 / 苹果 / 腾讯控股'
							className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-primary placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/30'
						/>
					</div>

					<div>
						<label className='mb-1 block text-xs font-medium text-secondary'>卡片色</label>
						<div className='flex flex-wrap gap-2'>
							{COLORS.map(c => (
								<button
									key={c}
									type='button'
									onClick={() => setColor(c)}
									className={`h-7 w-7 rounded-full border-2 transition ${color === c ? 'border-primary' : 'border-transparent'}`}
									style={{ background: c }}
								/>
							))}
						</div>
					</div>

					{error && <div className='rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700'>{error}</div>}
				</div>

				<div className='mt-6 flex justify-end gap-2'>
					<button onClick={onClose} className='rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50'>
						取消
					</button>
					<button
						onClick={handleSubmit}
						disabled={!symbol.trim() || !name.trim() || submitting}
						className='rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'>
						{submitting ? '保存中…' : mode === 'create' ? '添加' : '保存'}
					</button>
				</div>
			</div>
		</DialogModal>
	)
}
