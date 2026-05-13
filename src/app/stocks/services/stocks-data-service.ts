import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { createBlob, getRef, createTree, createCommit, updateRef, type TreeItem } from '@/lib/github-client'
import { toast } from 'sonner'
import type { StocksData } from '@/lib/cost-basis'

export async function loadStocksData(): Promise<StocksData | null> {
	try {
		const res = await fetch('/stocks/data.json', {
			cache: 'no-store',
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				Pragma: 'no-cache',
				Expires: '0'
			}
		})
		if (!res.ok) throw new Error('Failed to load stocks data.json')
		const data: StocksData = await res.json()
		return data
	} catch (error) {
		console.error('加载股票数据失败:', error)
		return null
	}
}

export async function saveStocksData(data: StocksData): Promise<void> {
	try {
		const token = await getAuthToken()
		const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
		const latestCommitSha = refData.sha
		const dataJson = JSON.stringify(data, null, 2)
		const dataBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, btoa(unescape(encodeURIComponent(dataJson))), 'base64')
		const treeItems: TreeItem[] = [
			{
				path: 'public/stocks/data.json',
				mode: '100644',
				type: 'blob',
				sha: dataBlob.sha
			}
		]
		const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)
		const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, 'Update stocks data', treeData.sha, [latestCommitSha])
		await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)
	} catch (error) {
		console.error('保存股票数据失败:', error)
		toast.error('股票数据保存失败')
		throw error
	}
}
