import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { createBlob, getRef, createTree, createCommit, updateRef, type TreeItem } from '@/lib/github-client'

export type EmotionDayRecord = { lost: number; controlled: number }
export type EmotionLossData = Record<string, EmotionDayRecord>

const DATA_PATH = 'public/emotion-loss/data.json'

function normalize(raw: unknown): EmotionLossData {
	if (!raw || typeof raw !== 'object') return {}
	const result: EmotionLossData = {}
	for (const [date, value] of Object.entries(raw as Record<string, unknown>)) {
		if (typeof value === 'number') {
			result[date] = { lost: value, controlled: 0 }
		} else if (value && typeof value === 'object') {
			const v = value as Partial<EmotionDayRecord>
			result[date] = { lost: Number(v.lost) || 0, controlled: Number(v.controlled) || 0 }
		}
	}
	return result
}

export function getDayRecord(data: EmotionLossData, date: string): EmotionDayRecord {
	return data[date] ?? { lost: 0, controlled: 0 }
}

export async function loadEmotionLossData(): Promise<EmotionLossData> {
	try {
		const res = await fetch('/emotion-loss/data.json', {
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
		console.error('加载情绪记录数据失败:', error)
		return {}
	}
}

export async function saveEmotionLossData(data: EmotionLossData): Promise<void> {
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
	const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, 'Update emotion-loss data', treeData.sha, [latestCommitSha])
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)
}
