'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { INIT_DELAY } from '@/consts'
import { useAuthStore } from '@/hooks/use-auth'
import { generateAndCacheToken } from '@/lib/auth'
import { readFileAsText } from '@/lib/file-utils'
import { computeStock, marketLabel, moneySymbol, type Market, type Stock, type StockTrade } from '@/lib/cost-basis'
import { loadStocksData, saveStocksData } from '../services/stocks-data-service'
import StockCard from './stock-card'
import StockFormDialog from './stock-form-dialog'
import TradeFormDialog from './trade-form-dialog'
import TradeHeatmap from './trade-heatmap'
import PnlTrendChart from './pnl-trend-chart'

function todayStr() {
	const t = new Date()
	return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export default function StocksClient() {
	const { isAuth, setPrivateKey } = useAuthStore()
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const [stocks, setStocks] = useState<Stock[]>([])
	const [loaded, setLoaded] = useState(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [mounted, setMounted] = useState(false)

	const [stockFormOpen, setStockFormOpen] = useState(false)
	const [stockFormMode, setStockFormMode] = useState<'create' | 'edit'>('create')
	const [stockFormInitial, setStockFormInitial] = useState<Stock | undefined>(undefined)

	const [tradeFormOpen, setTradeFormOpen] = useState(false)
	const [tradeFormStockSymbol, setTradeFormStockSymbol] = useState<string | null>(null)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		const init = async () => {
			try {
				const data = await loadStocksData()
				if (data) setStocks(data.stocks)
			} catch (err) {
				console.error('初始化股票数据失败:', err)
				toast.error('初始化股票数据失败')
			} finally {
				setLoaded(true)
			}
		}
		init()
	}, [])

	useEffect(() => {
		if (!hasUnsavedChanges) return
		const timer = setTimeout(async () => {
			setIsSaving(true)
			try {
				await saveStocksData({ stocks })
				setHasUnsavedChanges(false)
				toast.success('已保存到 GitHub')
			} catch (err) {
				console.error('保存到 GitHub 失败:', err)
			} finally {
				setIsSaving(false)
			}
		}, 1000)
		return () => clearTimeout(timer)
	}, [hasUnsavedChanges, stocks])

	const requireAuth = () => {
		if (!isAuth) {
			toast.error('请先导入密钥')
			return false
		}
		return true
	}

	const handleImportKey = () => fileInputRef.current?.click()

	const handleKeyFile = async (file: File) => {
		try {
			const pem = await readFileAsText(file)
			setPrivateKey(pem)
			await generateAndCacheToken()
			toast.success('密钥已导入')
		} catch (err) {
			console.error(err)
			toast.error('读取密钥失败')
		}
	}

	const openAddStock = () => {
		if (!requireAuth()) return
		setStockFormMode('create')
		setStockFormInitial(undefined)
		setStockFormOpen(true)
	}

	const openEditStock = (stock: Stock) => {
		if (!requireAuth()) return
		setStockFormMode('edit')
		setStockFormInitial(stock)
		setStockFormOpen(true)
	}

	const openAddTrade = (symbol: string) => {
		if (!requireAuth()) return
		setTradeFormStockSymbol(symbol)
		setTradeFormOpen(true)
	}

	const handleStockSubmit = (stock: Stock) => {
		if (!requireAuth()) return
		if (stockFormMode === 'create') {
			setStocks(prev => [stock, ...prev])
			toast.success('股票已添加')
		} else {
			setStocks(prev => prev.map(s => (s.symbol === stock.symbol ? stock : s)))
			toast.success('已保存')
		}
		setHasUnsavedChanges(true)
		setStockFormOpen(false)
	}

	const handleTradeSubmit = (trade: StockTrade) => {
		if (!requireAuth() || !tradeFormStockSymbol) return
		setStocks(prev =>
			prev.map(s => {
				if (s.symbol !== tradeFormStockSymbol) return s
				return { ...s, trades: [...s.trades, trade] }
			})
		)
		setHasUnsavedChanges(true)
		setTradeFormOpen(false)
		toast.success(trade.type === 'buy' ? '买入已记录' : '卖出已记录')
	}

	const handleDeleteStock = (symbol: string) => {
		if (!requireAuth()) return
		setStocks(prev => prev.filter(s => s.symbol !== symbol))
		setHasUnsavedChanges(true)
		toast.success('股票已删除')
	}

	const handleDeleteTrade = (symbol: string, tradeId: string) => {
		if (!requireAuth()) return
		setStocks(prev =>
			prev.map(s => {
				if (s.symbol !== symbol) return s
				return { ...s, trades: s.trades.filter(t => t.id !== tradeId) }
			})
		)
		setHasUnsavedChanges(true)
		toast.success('交易已删除')
	}

	const tradeFormStock = useMemo(() => stocks.find(s => s.symbol === tradeFormStockSymbol), [stocks, tradeFormStockSymbol])

	const today = useMemo(todayStr, [])

	const { holding, cleared, marketRealized, totalCount } = useMemo(() => {
		const holding: { stock: Stock; realized: number }[] = []
		const cleared: { stock: Stock; realized: number }[] = []
		const marketRealized: Record<Market, number> = { A: 0, HK: 0, US: 0 }
		let totalCount = 0
		for (const stock of stocks) {
			const c = computeStock(stock)
			totalCount += stock.trades.length
			marketRealized[stock.market] += c.realized
			if (c.heldShares > 0) holding.push({ stock, realized: c.realized })
			else cleared.push({ stock, realized: c.realized })
		}
		holding.sort((a, b) => b.realized - a.realized)
		cleared.sort((a, b) => b.realized - a.realized)
		return { holding, cleared, marketRealized, totalCount }
	}, [stocks])

	const summaries: { label: string; value: React.ReactNode }[] = [
		{
			label: '持仓股票',
			value: (
				<>
					{holding.length}
					<span className='ml-1 text-xs font-medium text-secondary'>/ {stocks.length} 只</span>
				</>
			)
		}
	]
	for (const m of ['A', 'HK', 'US'] as Market[]) {
		const seen = stocks.some(s => s.market === m)
		if (seen) {
			const n = marketRealized[m]
			summaries.push({
				label: `${marketLabel(m)} 累计盈亏`,
				value: <span className={n >= 0 ? 'text-[#e0413c]' : 'text-[#2bb673]'}>{(n >= 0 ? '+' : '-') + moneySymbol(m) + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
			})
		}
	}
	while (summaries.length < 4) {
		summaries.push({ label: '总交易次数', value: totalCount })
	}

	return (
		<div className='mx-auto w-full max-w-6xl'>
			<input
				ref={fileInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handleKeyFile(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: INIT_DELAY }}
				className='mb-6 flex flex-wrap items-end justify-between gap-4'>
				<div>
					<h1 className='mb-1 text-3xl font-bold text-primary max-sm:text-2xl'>📈 股票跟踪</h1>
					<p className='text-sm font-medium text-primary/80'>
						{!loaded ? '加载中…' : `LIFO 栈式配对 · 仅记已实现盈亏 · 共 ${stocks.length} 只`}
					</p>
				</div>
				<div className='flex items-center gap-2'>
					{isSaving && <span className='text-[11px] text-secondary'>保存中…</span>}
					{mounted && !isAuth && (
						<button
							onClick={handleImportKey}
							className='rounded-full border border-white/40 bg-white/60 px-3 py-1.5 text-xs font-medium text-primary shadow-sm transition hover:bg-white'>
							导入密钥
						</button>
					)}
					<button
						onClick={openAddStock}
						className='rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90'>
						+ 添加股票
					</button>
				</div>
			</motion.div>

			{loaded && stocks.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: INIT_DELAY + 0.05 }}
					className='mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4'>
					{summaries.slice(0, 4).map((s, i) => (
						<div key={i} className='rounded-2xl border border-white/40 bg-white/50 p-3.5 backdrop-blur-md'>
							<div className='text-[11px] text-secondary'>{s.label}</div>
							<div className='mt-1 text-xl font-bold tabular-nums text-primary max-sm:text-lg'>{s.value}</div>
						</div>
					))}
				</motion.div>
			)}

			{loaded && stocks.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: INIT_DELAY + 0.1 }}
					className='mb-6 space-y-4'>
					<TradeHeatmap stocks={stocks} today={today} />
					<PnlTrendChart stocks={stocks} today={today} />
				</motion.div>
			)}

			{loaded && stocks.length === 0 && (
				<div className='rounded-2xl border border-dashed border-white/50 bg-white/30 p-12 text-center text-sm text-secondary backdrop-blur-md'>
					还没有股票，点击右上角"+ 添加股票"开始
				</div>
			)}

			{holding.length > 0 && (
				<>
					<SectionLabel>持仓中 · {holding.length}</SectionLabel>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						<AnimatePresence initial={false}>
							{holding.map(({ stock }) => (
								<StockCard
									key={stock.symbol}
									stock={stock}
									onAddTrade={() => openAddTrade(stock.symbol)}
									onEdit={() => openEditStock(stock)}
									onDeleteStock={() => handleDeleteStock(stock.symbol)}
									onDeleteTrade={tradeId => handleDeleteTrade(stock.symbol, tradeId)}
								/>
							))}
						</AnimatePresence>
					</div>
				</>
			)}

			{cleared.length > 0 && (
				<>
					<SectionLabel>已清仓 · {cleared.length}</SectionLabel>
					<div className='grid grid-cols-1 gap-4 opacity-90 sm:grid-cols-2 lg:grid-cols-3'>
						<AnimatePresence initial={false}>
							{cleared.map(({ stock }) => (
								<StockCard
									key={stock.symbol}
									stock={stock}
									onAddTrade={() => openAddTrade(stock.symbol)}
									onEdit={() => openEditStock(stock)}
									onDeleteStock={() => handleDeleteStock(stock.symbol)}
									onDeleteTrade={tradeId => handleDeleteTrade(stock.symbol, tradeId)}
								/>
							))}
						</AnimatePresence>
					</div>
				</>
			)}

			<StockFormDialog
				open={stockFormOpen}
				mode={stockFormMode}
				initial={stockFormInitial}
				existingSymbols={stocks.map(s => s.symbol)}
				onClose={() => setStockFormOpen(false)}
				onSubmit={handleStockSubmit}
			/>

			<TradeFormDialog open={tradeFormOpen} stock={tradeFormStock} onClose={() => setTradeFormOpen(false)} onSubmit={handleTradeSubmit} />
		</div>
	)
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<div className='mt-8 mb-4 flex items-center gap-3 text-xs text-secondary'>
			<div className='h-px flex-1 bg-secondary/20' />
			<span className='uppercase tracking-wider'>{children}</span>
			<div className='h-px flex-1 bg-secondary/20' />
		</div>
	)
}
