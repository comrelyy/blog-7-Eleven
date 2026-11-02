'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import {
	DEFAULT_PAPER_APPEARANCE,
	isPaperPatternId,
	isPaperThemeId,
	normalizePaperAppearance,
	type PaperAppearance,
	type PaperPatternId,
	type PaperThemeId
} from '@/lib/paper-themes'

const STORAGE_KEY = 'blog-paper-theme'
const PATTERN_STORAGE_KEY = 'blog-paper-pattern'
const APPEARANCE_STORAGE_KEY = 'blog-paper-appearance'

type PaperThemeStore = {
	theme: PaperThemeId
	pattern: PaperPatternId
	appearance: PaperAppearance
	hydrated: boolean
	hydrate: () => void
	setTheme: (theme: PaperThemeId) => void
	setPattern: (pattern: PaperPatternId) => void
	setAppearance: (appearance: Partial<PaperAppearance>) => void
	reset: () => void
}

const usePaperThemeStore = create<PaperThemeStore>((set, get) => ({
	theme: 'original',
	pattern: 'plain',
	appearance: { ...DEFAULT_PAPER_APPEARANCE },
	hydrated: false,
	hydrate: () => {
		if (get().hydrated) return
		let theme: PaperThemeId = 'original'
		let pattern: PaperPatternId = 'plain'
		let appearance = { ...DEFAULT_PAPER_APPEARANCE }
		try {
			const saved = localStorage.getItem(STORAGE_KEY)
			if (isPaperThemeId(saved)) theme = saved
			const savedPattern = localStorage.getItem(PATTERN_STORAGE_KEY)
			if (isPaperPatternId(savedPattern)) pattern = savedPattern
			const savedAppearance = localStorage.getItem(APPEARANCE_STORAGE_KEY)
			if (savedAppearance) appearance = normalizePaperAppearance(JSON.parse(savedAppearance))
		} catch {
			// Storage may be unavailable; theme selection still works for this visit.
		}
		set({ theme, pattern, appearance, hydrated: true })
	},
	setTheme: theme => {
		if (!isPaperThemeId(theme)) return
		set({ theme, hydrated: true })
		try {
			localStorage.setItem(STORAGE_KEY, theme)
		} catch {
			// Keep the in-memory preference when storage is blocked or full.
		}
	},
	setPattern: pattern => {
		if (!isPaperPatternId(pattern)) return
		set({ pattern, hydrated: true })
		try {
			localStorage.setItem(PATTERN_STORAGE_KEY, pattern)
		} catch {
			// Keep the in-memory preference when storage is blocked or full.
		}
	},
	setAppearance: updates => {
		const appearance = normalizePaperAppearance({ ...get().appearance, ...updates })
		set({ appearance, hydrated: true })
		try {
			localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance))
		} catch {
			// Keep the in-memory preference when storage is blocked or full.
		}
	},
	reset: () => {
		set({ theme: 'original', pattern: 'plain', appearance: { ...DEFAULT_PAPER_APPEARANCE }, hydrated: true })
		try {
			localStorage.removeItem(STORAGE_KEY)
			localStorage.removeItem(PATTERN_STORAGE_KEY)
			localStorage.removeItem(APPEARANCE_STORAGE_KEY)
		} catch {
			// Reset still applies to the current visit when storage is unavailable.
		}
	}
}))

export function usePaperTheme() {
	const store = usePaperThemeStore()
	useEffect(() => store.hydrate(), [store.hydrate])
	return store
}
