'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, Check, ChevronDown, RotateCcw, X } from 'lucide-react'
import { usePaperTheme } from '@/hooks/use-paper-theme'
import { getPaperPatternStyle, getPaperThemeStyle, PAPER_LINE_STRENGTHS, PAPER_PATTERNS, PAPER_TEXT_SIZES, PAPER_THEMES } from '@/lib/paper-themes'

export function PaperThemePicker() {
	const { theme, pattern, appearance, setTheme, setPattern, setAppearance, reset } = usePaperTheme()
	const [open, setOpen] = useState(false)
	const [position, setPosition] = useState({ top: 0, left: 0, width: 336 })
	const triggerRef = useRef<HTMLButtonElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)
	const selectedRef = useRef<HTMLButtonElement>(null)
	const panelId = useId()
	const current = PAPER_THEMES.find(item => item.id === theme)!
	const currentPattern = PAPER_PATTERNS.find(item => item.id === pattern)!

	const close = () => {
		setOpen(false)
		triggerRef.current?.focus()
	}

	useLayoutEffect(() => {
		if (!open || !triggerRef.current || !panelRef.current) return
		const updatePosition = () => {
			if (!triggerRef.current || !panelRef.current) return
			const rect = triggerRef.current.getBoundingClientRect()
			const width = Math.min(336, window.innerWidth - 24)
			const height = panelRef.current.offsetHeight
			const next = {
				left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)),
				top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - height - 12)),
				width
			}
			setPosition(previous => (previous.left === next.left && previous.top === next.top && previous.width === next.width ? previous : next))
		}
		updatePosition()
		selectedRef.current?.focus({ preventScroll: true })
		const observer = new ResizeObserver(updatePosition)
		observer.observe(panelRef.current)
		return () => observer.disconnect()
	}, [open])

	useEffect(() => {
		if (!open) return
		const onPointerDown = (event: PointerEvent) => {
			if (!panelRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) setOpen(false)
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault()
				close()
			}
			if (event.key === 'Tab' && panelRef.current) {
				const buttons = Array.from(panelRef.current.querySelectorAll<HTMLButtonElement>('button'))
				const first = buttons[0]
				const last = buttons[buttons.length - 1]
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault()
					last?.focus()
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault()
					first?.focus()
				}
			}
		}
		const onViewportChange = (event: Event) => {
			if (event.type === 'scroll' && event.target instanceof Node && panelRef.current?.contains(event.target)) return
			setOpen(false)
		}
		document.addEventListener('pointerdown', onPointerDown)
		document.addEventListener('keydown', onKeyDown)
		window.addEventListener('resize', onViewportChange)
		window.addEventListener('scroll', onViewportChange, true)
		return () => {
			document.removeEventListener('pointerdown', onPointerDown)
			document.removeEventListener('keydown', onKeyDown)
			window.removeEventListener('resize', onViewportChange)
			window.removeEventListener('scroll', onViewportChange, true)
		}
	}, [open])

	return (
		<div className='paper-theme-control'>
			<button
				ref={triggerRef}
				type='button'
				className='paper-theme-trigger'
				aria-haspopup='dialog'
				aria-expanded={open}
				aria-controls={open ? panelId : undefined}
				onClick={() => setOpen(!open)}>
				<BookOpen size={15} aria-hidden='true' />
				<span>纸张</span>
				<span className='paper-theme-current'>
					{current.name}
					{pattern !== 'plain' && ` · ${currentPattern.name}`}
				</span>
				<ChevronDown size={13} aria-hidden='true' />
			</button>
			{open &&
				createPortal(
					<div
						ref={panelRef}
						id={panelId}
						role='dialog'
						aria-label='纸张主题'
						className='paper-theme-panel paper-scope'
						data-paper-theme={theme}
						style={{ ...getPaperThemeStyle(theme, pattern, appearance), ...position }}>
						<div className='paper-theme-panel-heading'>
							<div>
								<strong>选择一张喜欢的纸</strong>
								<p>为写作和阅读换个心情</p>
							</div>
							<button type='button' className='paper-theme-close' aria-label='关闭纸张选择' onClick={close}>
								<X size={17} />
							</button>
						</div>
						<div className='paper-settings-label'>纸张配色</div>
						<div className='paper-theme-options' role='group' aria-label='纸张配色'>
							{PAPER_THEMES.map(item => (
								<button
									key={item.id}
									ref={item.id === theme ? selectedRef : undefined}
									type='button'
									className='paper-theme-option'
									aria-pressed={theme === item.id}
									title={item.description}
									onClick={() => setTheme(item.id)}>
									<span
										className='paper-theme-swatch'
										style={{ backgroundColor: item.palette?.background || '#eaf4f0', color: item.palette?.text || '#334f52' }}>
										<span>Aa</span>
										{theme === item.id && <Check size={13} aria-hidden='true' />}
									</span>
									<span>{item.name}</span>
								</button>
							))}
						</div>
						<div className='paper-pattern-heading'>纸面样式</div>
						<div className='paper-pattern-options' role='group' aria-label='纸面格线'>
							{PAPER_PATTERNS.map(item => (
								<button key={item.id} type='button' className='paper-theme-option' aria-pressed={pattern === item.id} onClick={() => setPattern(item.id)}>
									<span className='paper-theme-swatch paper-pattern-swatch' style={getPaperPatternStyle(item.id, appearance)}>
										{pattern === item.id && <Check size={13} aria-hidden='true' />}
									</span>
									<span>{item.name}</span>
								</button>
							))}
						</div>
						<div className='paper-adjustments'>
							<div className='paper-adjustment'>
								<div className='paper-adjustment-label'>
									<span>格线深浅</span>
									{pattern === 'plain' && <small>选择格线纸后可调</small>}
								</div>
								<div className='paper-segmented' role='group' aria-label='格线深浅'>
									{PAPER_LINE_STRENGTHS.map(item => (
										<button
											key={item.id}
											type='button'
											disabled={pattern === 'plain'}
											aria-pressed={appearance.lineStrength === item.id}
											onClick={() => setAppearance({ lineStrength: item.id })}>
											{item.name}
										</button>
									))}
								</div>
							</div>
							<div className='paper-adjustment'>
								<div className='paper-adjustment-label'>
									<span>正文字号</span>
									<small>{PAPER_TEXT_SIZES.find(item => item.id === appearance.textSize)?.size || '跟随页面'}</small>
								</div>
								<div className='paper-segmented' role='group' aria-label='正文字号'>
									{PAPER_TEXT_SIZES.map(item => (
										<button key={item.id} type='button' aria-pressed={appearance.textSize === item.id} onClick={() => setAppearance({ textSize: item.id })}>
											{item.name}
										</button>
									))}
								</div>
							</div>
						</div>
						<div className='paper-theme-sample'>
							<span>把生活写成自己的文字。</span>
							<p>留一点时间，写下今天的想法。慢慢积累，也常常回看。</p>
						</div>
						<div className='paper-theme-footer'>
							<button type='button' className='paper-reset-button' onClick={reset}>
								<RotateCcw size={13} aria-hidden='true' />
								恢复默认
							</button>
							<button type='button' className='paper-done-button' onClick={close}>
								完成
							</button>
						</div>
						<p className='paper-theme-hint'>自动记住选择，写作与阅读同步使用</p>
					</div>,
					document.body
				)}
		</div>
	)
}
