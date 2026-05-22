import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { createBlob, getRef, createTree, createCommit, updateRef, type TreeItem } from '@/lib/github-client'

// 心境记录：按日期存「当天每一次心境（翻涌/沉静）」。文字内容只进当月博客，这里不存敏感文本。
export type EmotionEntry = { emotion: string; time?: string }
export type EmotionEventData = Record<string, EmotionEntry[]>

const DATA_PATH = 'public/emotion-events/data.json'

function normalize(raw: unknown): EmotionEventData {
	if (!raw || typeof raw !== 'object') return {}
	const result: EmotionEventData = {}
	for (const [date, value] of Object.entries(raw as Record<string, unknown>)) {
		if (Array.isArray(value)) {
			// 新结构：[{ emotion, time }]
			const list = value
				.map(v => {
					if (!v || typeof v !== 'object') return null
					const o = v as { emotion?: unknown; time?: unknown }
					return { emotion: o.emotion ? String(o.emotion) : 'unknown', time: o.time ? String(o.time) : undefined } as EmotionEntry
				})
				.filter((v): v is EmotionEntry => v !== null)
			if (list.length) result[date] = list
		} else if (typeof value === 'number') {
			// 旧结构：date -> 次数
			if (value > 0) result[date] = Array.from({ length: value }, () => ({ emotion: 'unknown' }))
		} else if (value && typeof value === 'object') {
			// 旧结构：date -> { count } 或 { lost, controlled }
			const v = value as { count?: unknown; lost?: unknown; controlled?: unknown }
			const count = typeof v.count === 'number' ? v.count : (Number(v.lost) || 0) + (Number(v.controlled) || 0)
			if (count > 0) result[date] = Array.from({ length: count }, () => ({ emotion: 'unknown' }))
		}
	}
	return result
}

export function getDayEntries(data: EmotionEventData, date: string): EmotionEntry[] {
	return data[date] ?? []
}

export function getDayCount(data: EmotionEventData, date: string): number {
	return (data[date] ?? []).length
}

export function getDayEmotions(data: EmotionEventData, date: string): string[] {
	return (data[date] ?? []).map(e => e.emotion)
}

export function getMonthCount(data: EmotionEventData, date: string): number {
	const prefix = date.slice(0, 7)
	let total = 0
	for (const [d, list] of Object.entries(data)) if (d.startsWith(prefix)) total += list.length
	return total
}

// 本月每种情绪的次数，用于底部堆叠彩条
export function getMonthEmotionCounts(data: EmotionEventData, date: string): Record<string, number> {
	const prefix = date.slice(0, 7)
	const counts: Record<string, number> = {}
	for (const [d, list] of Object.entries(data)) {
		if (!d.startsWith(prefix)) continue
		for (const e of list) counts[e.emotion] = (counts[e.emotion] || 0) + 1
	}
	return counts
}

export async function loadEmotionEventData(): Promise<EmotionEventData> {
	try {
		const res = await fetch('/emotion-events/data.json', {
			cache: 'no-store',
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
				Expires: '0'
			}
		})
		if (!res.ok) return {}
		const data = await res.json()
		return normalize(data)
	} catch (error) {
		console.error('加载心境数据失败:', error)
		return {}
	}
}

export async function saveEmotionEventData(data: EmotionEventData): Promise<void> {
	const token = await getAuthToken()

	const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
	const latestCommitSha = refData.sha

	const json = JSON.stringify(data, null, 2)
	const blob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, btoa(unescape(encodeURIComponent(json))), 'base64')

	const treeItems: TreeItem[] = [
		{
			path: DATA_PATH,
			mode: '100644',
			type: 'blob',
			sha: blob.sha
		}
	]

	const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)
	const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, 'Update emotion-events data', treeData.sha, [latestCommitSha])
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)
}
