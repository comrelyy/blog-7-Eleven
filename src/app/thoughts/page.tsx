'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Thought } from '@/app/(home)/services/push-thoughts'

const STICKY_COLORS = [
	{ bg: 'rgba(254,255,156,0.55)', pin: '#e6c02a' }, // yellow
	{ bg: 'rgba(255,126,179,0.45)', pin: '#d94f8a' }, // pink
	{ bg: 'rgba(122,252,255,0.45)', pin: '#2ab8bd' }, // cyan
	{ bg: 'rgba(255,160,122,0.45)', pin: '#d97a4f' }, // salmon
	{ bg: 'rgba(152,251,152,0.45)', pin: '#4bba4b' }, // green
	{ bg: 'rgba(221,160,221,0.45)', pin: '#a855a8' }, // plum
	{ bg: 'rgba(135,206,235,0.45)', pin: '#4a90b8' }, // sky
	{ bg: 'rgba(255,215,0,0.50)', pin: '#c9a200' }, // gold
	{ bg: 'rgba(230,230,250,0.50)', pin: '#7a7acd' }, // lavender
	{ bg: 'rgba(255,218,185,0.50)', pin: '#c98a55' }, // peach
]

function getMonthLabel(year: number, month: number) {
	return `${year}年${month}月`
}

function hashStr(s: string): number {
	let h = 0
	for (let i = 0; i < s.length; i++) {
		h = ((h << 5) - h + s.charCodeAt(i)) | 0
	}
	return Math.abs(h)
}

function seededRandom(seed: number) {
	const x = Math.sin(seed) * 10000
	return x - Math.floor(x)
}

async function fetchThoughtsByMonth(year: number, month: number): Promise<Thought[]> {
	const fileName = `${year}-${String(month).padStart(2, '0')}.json`
	try {
		const res = await fetch(`/thoughts/${fileName}`, {
			cache: 'no-store',
			headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache', Expires: '0' },
		})
		if (!res.ok) return []
		const data = await res.json()
		return (Array.isArray(data) ? data : []).sort((a: Thought, b: Thought) => b.timestamp - a.timestamp)
	} catch {
		return []
	}
}

interface StickyPosition {
	x: number
	y: number
	rotation: number
	colorIndex: number
}

// Check if two rectangles overlap (with margin)
function rectsOverlap(
	ax: number, ay: number, aw: number, ah: number,
	bx: number, by: number, bw: number, bh: number,
	margin: number
) {
	return (
		ax - margin < bx + bw &&
		ax + aw + margin > bx &&
		ay - margin < by + bh &&
		ay + ah + margin > by
	)
}

function computePositions(thoughts: Thought[], W: number, H: number): StickyPosition[] {
	const SW = 200
	const SH = 130
	const MARGIN = 12 // gap between notes
	const NAV_H = 80 // reserved for bottom nav

	const cx = W / 2 - SW / 2
	const cy = H / 2 - SH / 2

	const goldenAngle = Math.PI * (3 - Math.sqrt(5))
	const placed: StickyPosition[] = []

	for (let i = 0; i < thoughts.length; i++) {
		const h = hashStr(thoughts[i].id)
		const rotation = (seededRandom(h + 2) - 0.5) * 7
		const colorIndex = h % STICKY_COLORS.length

		let bestX = cx
		let bestY = cy

		// Try spiral positions, increasing radius until no overlap
		const baseAngle = i * goldenAngle
		let found = false

		for (let attempt = 0; attempt < 200; attempt++) {
			const r = Math.sqrt(attempt / 200) * Math.min(W, H) * 0.48
			// Alternate angle offsets to fill space
			const angle = baseAngle + attempt * goldenAngle * 0.1
			const candidateX = cx + r * Math.cos(angle) + (seededRandom(h + attempt) - 0.5) * 16
			const candidateY = cy + r * Math.sin(angle) + (seededRandom(h + attempt + 1) - 0.5) * 12

			// Clamp to viewport
			const px = Math.max(10, Math.min(W - SW - 10, candidateX))
			const py = Math.max(10, Math.min(H - SH - NAV_H, candidateY))

			// Check overlap with all placed notes
			let overlaps = false
			for (const p of placed) {
				if (rectsOverlap(px, py, SW, SH, p.x, p.y, SW, SH, MARGIN)) {
					overlaps = true
					break
				}
			}

			if (!overlaps) {
				bestX = px
				bestY = py
				found = true
				break
			}
		}

		// If still not found, use the spiral position anyway (clamped)
		if (!found) {
			const r = Math.sqrt(i / Math.max(1, thoughts.length - 1)) * Math.min(W, H) * 0.42
			bestX = Math.max(10, Math.min(W - SW - 10, cx + r * Math.cos(baseAngle)))
			bestY = Math.max(10, Math.min(H - SH - NAV_H, cy + r * Math.sin(baseAngle)))
		}

		placed.push({ x: bestX, y: bestY, rotation, colorIndex })
	}

	return placed
}

// Pushpin SVG component
function Pushpin({ color }: { color: string }) {
	return (
		<svg width='16' height='20' viewBox='0 0 16 20' fill='none' className='absolute -top-2 left-1/2 z-10 -translate-x-1/2 drop-shadow-sm'>
			{/* Pin shaft */}
			<line x1='8' y1='10' x2='8' y2='19' stroke='#999' strokeWidth='1.2' strokeLinecap='round' />
			{/* Pin head */}
			<circle cx='8' cy='7' r='5.5' fill={color} />
			{/* Highlight */}
			<circle cx='6.5' cy='5.5' r='2' fill='rgba(255,255,255,0.5)' />
		</svg>
	)
}

export default function ThoughtsPage() {
	const router = useRouter()
	const now = new Date()
	const [year, setYear] = useState(now.getFullYear())
	const [month, setMonth] = useState(now.getMonth() + 1)
	const [thoughts, setThoughts] = useState<Thought[]>([])
	const [loading, setLoading] = useState(true)
	const [direction, setDirection] = useState(0)
	const containerRef = useRef<HTMLDivElement>(null)
	const [containerWidth, setContainerWidth] = useState(0)
	const [containerHeight, setContainerHeight] = useState(0)

	useEffect(() => {
		const updateSize = () => {
			setContainerWidth(window.innerWidth)
			setContainerHeight(window.innerHeight)
		}
		updateSize()
		window.addEventListener('resize', updateSize)
		return () => window.removeEventListener('resize', updateSize)
	}, [])

	useEffect(() => {
		let cancelled = false
		setLoading(true)
		fetchThoughtsByMonth(year, month).then(data => {
			if (!cancelled) {
				setThoughts(data)
				setLoading(false)
			}
		})
		return () => {
			cancelled = true
		}
	}, [year, month])

	const goPrev = () => {
		setDirection(-1)
		if (month === 1) {
			setYear(y => y - 1)
			setMonth(12)
		} else {
			setMonth(m => m - 1)
		}
	}

	const goNext = () => {
		const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1
		if (isCurrent) return
		setDirection(1)
		if (month === 12) {
			setYear(y => y + 1)
			setMonth(1)
		} else {
			setMonth(m => m + 1)
		}
	}

	const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

	const positions = useMemo(() => {
		if (!containerWidth || !containerHeight) return []
		return computePositions(thoughts, containerWidth, containerHeight)
	}, [thoughts, containerWidth, containerHeight])

	const monthKey = `${year}-${month}`

	return (
		<div ref={containerRef} className='relative h-screen overflow-hidden'>
			<AnimatePresence mode='wait'>
				<motion.div
					key={monthKey}
					initial={{ opacity: 0, x: direction * 60 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: direction * -60 }}
					transition={{ duration: 0.25, ease: 'easeOut' }}
					className='relative'
					style={{ height: containerHeight || '100vh' }}
				>
					{loading ? (
						<div className='text-secondary flex h-full items-center justify-center text-sm'>加载中...</div>
					) : thoughts.length === 0 ? (
						<div className='text-secondary flex h-full items-center justify-center text-sm'>这个月还没有碎碎念</div>
					) : (
						thoughts.map((thought, idx) => {
							const pos = positions[idx]
							if (!pos) return null
							const stickyColor = STICKY_COLORS[pos.colorIndex]
							return (
								<motion.div
									key={thought.id}
									initial={{ opacity: 0, scale: 0.6, rotate: pos.rotation - 10 }}
									animate={{ opacity: 1, scale: 1, rotate: pos.rotation }}
									transition={{ delay: idx * 0.03, type: 'spring', stiffness: 180, damping: 18 }}
									whileHover={{ scale: 1.06, rotate: 0, zIndex: 50 }}
									className='absolute w-[200px] cursor-default rounded-2xl border border-white/30 p-4 pt-5 backdrop-blur-xl transition-shadow hover:shadow-xl'
									style={{
										left: pos.x,
										top: pos.y,
										background: stickyColor.bg,
									}}
								>
									<Pushpin color={stickyColor.pin} />
									<p className='text-primary text-sm leading-relaxed'>{thought.text}</p>
									<div className='text-secondary mt-3 flex items-center justify-between text-[10px]'>
										<span>{thought.date}</span>
										<span>{thought.time}</span>
									</div>
								</motion.div>
							)
						})
					)}
				</motion.div>
			</AnimatePresence>

			{/* Bottom navigation bar */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-card fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-5 py-3 backdrop-blur-xl'
			>
				<button onClick={() => router.back()} className='text-secondary hover:text-primary text-sm transition-colors'>
					← 返回
				</button>

				<div className='bg-border mx-1 h-4 w-px' />

				<button
					onClick={goPrev}
					className='text-secondary hover:text-primary flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/40'
				>
					<ChevronLeft size={18} />
				</button>
				<span className='text-primary min-w-[90px] text-center text-sm font-medium'>{getMonthLabel(year, month)}</span>
				<button
					onClick={goNext}
					disabled={isCurrentMonth}
					className='text-secondary hover:text-primary flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/40 disabled:opacity-30'
				>
					<ChevronRight size={18} />
				</button>

				<div className='bg-border mx-1 h-4 w-px' />

				<span className='text-secondary text-xs'>{thoughts.length} 条</span>
			</motion.div>
		</div>
	)
}
