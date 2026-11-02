import type { CSSProperties } from 'react'

type PaperPalette = {
	background: string
	surface: string
	text: string
	muted: string
	accent: string
	border: string
	code: string
}

type PaperTheme = {
	id: string
	name: string
	description: string
	palette: PaperPalette | null
}

export const PAPER_THEMES = [
	{ id: 'original', name: '跟随网站', description: '保留网站原来的通透配色', palette: null },
	{
		id: 'white',
		name: '纯白纸',
		description: '干净明亮，像一页新纸',
		palette: { background: '#ffffff', surface: '#f7f8fa', text: '#303943', muted: '#68727e', accent: '#266b8c', border: '#dce2e7', code: '#f2f4f7' }
	},
	{
		id: 'cream',
		name: '奶油纸',
		description: '柔和暖白，适合慢慢书写',
		palette: { background: '#faf5e9', surface: '#f3eddf', text: '#494338', muted: '#716552', accent: '#886132', border: '#dfd5c2', code: '#eee7d7' }
	},
	{
		id: 'sepia',
		name: '旧书纸',
		description: '温暖泛黄，像翻开一本旧书',
		palette: { background: '#eee0c3', surface: '#e7d7b5', text: '#51412e', muted: '#6a543c', accent: '#83522f', border: '#cdbb98', code: '#e3d2ad' }
	},
	{
		id: 'sage',
		name: '豆沙绿',
		description: '低饱和浅绿，安静自然',
		palette: { background: '#e3eddf', surface: '#d9e5d4', text: '#354a38', muted: '#526a51', accent: '#316d4b', border: '#bdcfb6', code: '#d1dfcb' }
	},
	{
		id: 'mist',
		name: '雾蓝纸',
		description: '清淡灰蓝，留一点清凉',
		palette: { background: '#e6eef3', surface: '#dce6ed', text: '#354957', muted: '#506879', accent: '#30678c', border: '#c1d1dc', code: '#d5e1e9' }
	},
	{
		id: 'rose',
		name: '樱花纸',
		description: '轻柔浅粉，记录生活片段',
		palette: { background: '#f6e9e7', surface: '#efdfdd', text: '#584342', muted: '#765956', accent: '#8c4f59', border: '#dfc7c4', code: '#ead5d2' }
	},
	{
		id: 'night',
		name: '夜读灰',
		description: '深灰纸面，降低夜间亮度',
		palette: { background: '#24282b', surface: '#2d3337', text: '#d5d9d6', muted: '#a5afaa', accent: '#a5cbb6', border: '#48534f', code: '#1c2125' }
	}
] as const satisfies readonly PaperTheme[]

export type PaperThemeId = (typeof PAPER_THEMES)[number]['id']

export const PAPER_LINE_STRENGTHS = [
	{ id: 'soft', name: '淡雅', line: '6%', dot: '13%' },
	{ id: 'normal', name: '适中', line: '10%', dot: '20%' },
	{ id: 'strong', name: '清晰', line: '16%', dot: '30%' }
] as const

export const PAPER_TEXT_SIZES = [
	{ id: 'default', name: '默认', size: undefined },
	{ id: 'comfortable', name: '舒适', size: '16px' },
	{ id: 'large', name: '大字', size: '18px' }
] as const

export type PaperLineStrength = (typeof PAPER_LINE_STRENGTHS)[number]['id']
export type PaperTextSize = (typeof PAPER_TEXT_SIZES)[number]['id']
export type PaperAppearance = { lineStrength: PaperLineStrength; textSize: PaperTextSize }
export const DEFAULT_PAPER_APPEARANCE: PaperAppearance = { lineStrength: 'normal', textSize: 'default' }

export function normalizePaperAppearance(value: unknown): PaperAppearance {
	const saved = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
	return {
		lineStrength: PAPER_LINE_STRENGTHS.find(item => item.id === saved.lineStrength)?.id ?? DEFAULT_PAPER_APPEARANCE.lineStrength,
		textSize: PAPER_TEXT_SIZES.find(item => item.id === saved.textSize)?.id ?? DEFAULT_PAPER_APPEARANCE.textSize
	}
}

const gridLine = 'color-mix(in srgb, currentColor var(--paper-line-opacity, 10%), transparent)'

export const PAPER_PATTERNS = [
	{ id: 'plain', name: '素纸', image: 'none', size: 'auto' },
	{
		id: 'grid',
		name: '方格',
		image: `linear-gradient(to right, ${gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)`,
		size: '24px 24px'
	},
	{
		id: 'fine-grid',
		name: '细方格',
		image: `linear-gradient(to right, ${gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)`,
		size: '16px 16px'
	},
	{
		id: 'ruled',
		name: '横线',
		image: `linear-gradient(to bottom, transparent calc(var(--paper-rule-height, 26px) - 1px), ${gridLine} calc(var(--paper-rule-height, 26px) - 1px))`,
		size: '100% var(--paper-rule-height, 26px)'
	},
	{
		id: 'dots',
		name: '点阵',
		image: 'radial-gradient(circle at 1px 1px, color-mix(in srgb, currentColor var(--paper-dot-opacity, 20%), transparent) 1px, transparent 1px)',
		size: '18px 18px'
	}
] as const

export type PaperPatternId = (typeof PAPER_PATTERNS)[number]['id']

export function isPaperPatternId(value: unknown): value is PaperPatternId {
	return PAPER_PATTERNS.some(pattern => pattern.id === value)
}

export function getPaperPatternStyle(id: PaperPatternId, appearance: PaperAppearance = DEFAULT_PAPER_APPEARANCE): CSSProperties {
	const pattern = PAPER_PATTERNS.find(item => item.id === id)!
	const strength = PAPER_LINE_STRENGTHS.find(item => item.id === appearance.lineStrength)!
	const textSize = PAPER_TEXT_SIZES.find(item => item.id === appearance.textSize)!
	return {
		'--paper-pattern-image': pattern.image,
		'--paper-pattern-size': pattern.size,
		'--paper-line-opacity': strength.line,
		'--paper-dot-opacity': strength.dot,
		'--paper-font-size': textSize.size,
		'--paper-text-leading': textSize.size ? '1.8' : undefined,
		'--paper-rule-height': textSize.size ? `max(26px, calc(${textSize.size} * 1.8))` : undefined
	} as CSSProperties
}

export function isPaperThemeId(value: unknown): value is PaperThemeId {
	return PAPER_THEMES.some(theme => theme.id === value)
}

export function getPaperThemeStyle(
	id: PaperThemeId,
	pattern: PaperPatternId = 'plain',
	appearance: PaperAppearance = DEFAULT_PAPER_APPEARANCE
): CSSProperties | undefined {
	const palette = PAPER_THEMES.find(theme => theme.id === id)?.palette
	const patternStyle = getPaperPatternStyle(pattern, appearance)
	if (!palette) return pattern === 'plain' && appearance.textSize === 'default' ? undefined : patternStyle
	return {
		...patternStyle,
		'--color-primary': palette.text,
		'--color-secondary': palette.muted,
		'--color-brand': palette.accent,
		'--color-brand-secondary': palette.accent,
		'--color-card': palette.surface,
		'--color-article': palette.background,
		'--color-border': palette.border,
		'--paper-background': palette.background,
		'--paper-surface': palette.surface,
		'--paper-code': palette.code,
		colorScheme: id === 'night' ? 'dark' : 'light'
	} as CSSProperties
}
