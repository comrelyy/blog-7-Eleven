export type Market = 'A' | 'HK' | 'US'

export type StockTrade = {
	id: string
	type: 'buy' | 'sell'
	date: string
	price: number
	shares: number
	fee?: number
	dayLow?: number
	dayHigh?: number
	note?: string
}

export type InitialPosition = {
	costPrice: number
	shares: number
	pnl: number
	heldDays: number
	asOf: string
}

export type Stock = {
	symbol: string
	name: string
	market: Market
	color: string
	trades: StockTrade[]
	initial?: InitialPosition
}

export type StocksData = {
	stocks: Stock[]
}

export type ComputedStock = {
	heldShares: number
	avgPrice: number | null
	realized: number
	tradePnl: Record<string, number>
	tradeRound: Record<string, number>
	roundPnls: number[]
	errors: { tradeId: string; message: string }[]
	sortedTrades: StockTrade[]
	phantomRemaining: number
}

export function sortTrades(trades: StockTrade[]): StockTrade[] {
	return [...trades].sort((a, b) => {
		if (a.date !== b.date) return a.date.localeCompare(b.date)
		if (a.type !== b.type) return a.type === 'buy' ? -1 : 1
		return a.id.localeCompare(b.id)
	})
}

export function computeStock(stock: Stock): ComputedStock {
	const trades = sortTrades(stock.trades)
	const stack: { price: number; shares: number; fee: number; remaining: number; isPhantom?: boolean }[] = []
	let realized = stock.initial?.pnl ?? 0
	const tradePnl: Record<string, number> = {}
	const tradeRound: Record<string, number> = {}
	const roundPnls: number[] = []
	const errors: { tradeId: string; message: string }[] = []

	let currentRound = 0
	let currentRoundPnl = 0
	let inActiveRound = false

	// 初始持仓压入栈底作为 phantom lot；新交易在其上叠加，LIFO 卖出先吃新买入，吃完后回退到此
	if (stock.initial && stock.initial.shares > 0) {
		stack.push({
			price: stock.initial.costPrice,
			shares: stock.initial.shares,
			fee: 0,
			remaining: stock.initial.shares,
			isPhantom: true
		})
		inActiveRound = true
	}

	for (const t of trades) {
		tradeRound[t.id] = currentRound
		if (t.type === 'buy') {
			stack.push({ price: t.price, shares: t.shares, fee: t.fee || 0, remaining: t.shares })
			inActiveRound = true
		} else {
			let remaining = t.shares
			let pnl = -(t.fee || 0)
			while (remaining > 0) {
				if (stack.length === 0) {
					errors.push({ tradeId: t.id, message: `超卖 ${remaining} 股` })
					break
				}
				const top = stack[stack.length - 1]
				const matched = Math.min(top.remaining, remaining)
				const buyFeeShare = top.fee * (matched / top.shares)
				pnl += (t.price - top.price) * matched - buyFeeShare
				top.remaining -= matched
				remaining -= matched
				if (top.remaining === 0) stack.pop()
			}
			tradePnl[t.id] = pnl
			realized += pnl
			currentRoundPnl += pnl
			if (stack.length === 0 && inActiveRound) {
				roundPnls.push(currentRoundPnl)
				currentRoundPnl = 0
				currentRound++
				inActiveRound = false
			}
		}
	}

	const heldShares = stack.reduce((s, lot) => s + lot.remaining, 0)
	const heldCost = stack.reduce((s, lot) => s + lot.remaining * lot.price, 0)
	const avgPrice = heldShares > 0 ? heldCost / heldShares : null
	const phantomRemaining = stack.find(l => l.isPhantom)?.remaining ?? 0

	return { heldShares, avgPrice, realized, tradePnl, tradeRound, roundPnls, errors, sortedTrades: trades, phantomRemaining }
}

export function computeHeldDays(stock: Stock, today: string): number | null {
	if (!stock.initial) return null
	const c = computeStock(stock)
	if (c.phantomRemaining === 0) return null
	const [ty, tm, td] = today.split('-').map(Number)
	const [ay, am, ad] = stock.initial.asOf.split('-').map(Number)
	const todayDate = new Date(ty, tm - 1, td)
	const asOfDate = new Date(ay, am - 1, ad)
	const daysSince = Math.floor((todayDate.getTime() - asOfDate.getTime()) / 86400000)
	return stock.initial.heldDays + Math.max(0, daysSince)
}

export function moneySymbol(market: Market): string {
	return market === 'A' ? '¥' : market === 'HK' ? 'HK$' : '$'
}

export function marketLabel(market: Market): string {
	return market === 'A' ? 'A 股' : market === 'HK' ? '港股' : '美股'
}

export function formatMoney(market: Market, n: number, opts: { signed?: boolean; decimals?: number } = {}): string {
	const decimals = opts.decimals ?? 2
	const sign = opts.signed ? (n >= 0 ? '+' : '-') : n < 0 ? '-' : ''
	const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
	return `${sign}${moneySymbol(market)}${abs}`
}
