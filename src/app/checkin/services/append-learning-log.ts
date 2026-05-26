import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { readTextFileFromRepo, getRef, createBlob, createTree, createCommit, updateRef, toBase64Utf8, type TreeItem } from '@/lib/github-client'
import type { BlogIndexItem } from '@/lib/blog-index'
import { toast } from 'sonner'

const INDEX_PATH = 'public/blogs/index.json'
const MAX_RETRIES = 3

export type ExtraFile = { path: string; content: string }

/** 把一条总结合并进当月博客的 markdown。同一天小节存在则追加到末尾，否则在文章顶部新建当天小节。 */
export function mergeMonthMarkdown(existing: string | null, date: string, entry: string): string {
	if (!existing || !existing.trim()) {
		return `### ${date}\n\n${entry}\n`
	}
	const lines = existing.split('\n')
	const headerIdx = lines.findIndex(l => l.trim() === `### ${date}`)
	if (headerIdx === -1) {
		// 顶部新建当天小节
		return `### ${date}\n\n${entry}\n\n---\n\n${existing.replace(/^\s+/, '')}`.replace(/\s+$/, '') + '\n'
	}
	// 找到当天小节的结尾：下一个日期小节标题、或一行单独的 ---、或文件末尾
	let end = lines.length
	for (let i = headerIdx + 1; i < lines.length; i++) {
		const t = lines[i].trim()
		if (/^### \d{4}-\d{2}-\d{2}$/.test(t) || t === '---') {
			end = i
			break
		}
	}
	const before = lines.slice(0, end).join('\n').replace(/\s+$/, '')
	const after = lines.slice(end).join('\n')
	const merged = after ? `${before}\n\n${entry}\n\n${after}` : `${before}\n\n${entry}`
	return merged.replace(/\s+$/, '') + '\n'
}

/** 升级 index.json：已有当月条目只更新 updatedAt（保留 title/summary/cover 等），否则新增条目。 */
function upsertIndex(list: BlogIndexItem[], slug: string, date: string, summaryForNew: string): BlogIndexItem[] {
	const idx = list.findIndex(i => i.slug === slug)
	if (idx >= 0) {
		list[idx] = { ...list[idx], updatedAt: date }
	} else {
		list.push({ slug, title: slug, tags: ['碎碎念', slug], date, updatedAt: date, summary: summaryForNew })
	}
	return [...list].sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime())
}

/**
 * 把学习类打卡的总结追加到当月博客（slug = date 的 YYYY-MM，如 2026-05）。
 * - 当月博客不存在时自动新建 index.md + config.json。
 * - 可选传入 extraFiles，合并为单次 commit 避免连续提交的竞态失败。
 * - 内置重试：updateRef 失败时重新获取最新 ref 并重建 tree/commit 再试。
 */
export async function appendLearningLog(params: {
	eventName: string
	summary: string
	date: string
	extraFiles?: ExtraFile[]
}): Promise<{ slug: string; created: boolean }> {
	const { eventName, summary, date, extraFiles } = params
	const slug = date.slice(0, 7) // YYYY-MM
	const trimmed = summary.trim()
	const entry = `***${eventName}***\n${trimmed}`

	const token = await getAuthToken()
	const { OWNER, REPO, BRANCH } = GITHUB_CONFIG

	toast.info('正在追加到当月博客...')

	// 读分支上最新的当月 index.md 与 index.json
	const mdPath = `public/blogs/${slug}/index.md`
	const existingMd = await readTextFileFromRepo(token, OWNER, REPO, mdPath, BRANCH)
	const created = existingMd === null
	const nextMd = mergeMonthMarkdown(existingMd, date, entry)

	let indexList: BlogIndexItem[] = []
	try {
		const txt = await readTextFileFromRepo(token, OWNER, REPO, INDEX_PATH, BRANCH)
		if (txt) indexList = JSON.parse(txt)
	} catch {
		// 解析失败按空列表处理
	}
	const nextIndex = upsertIndex(indexList, slug, date, trimmed.slice(0, 80))

	// 预先创建 blob（blob 是不可变的，不受 ref 变化影响，无需重试）
	const mdBlob = await createBlob(token, OWNER, REPO, toBase64Utf8(nextMd), 'base64')
	const indexBlob = await createBlob(token, OWNER, REPO, toBase64Utf8(JSON.stringify(nextIndex, null, 2)), 'base64')

	let configBlob: { sha: string } | null = null
	if (created) {
		const config = { title: slug, tags: ['碎碎念', slug], date, summary: trimmed.slice(0, 80), images: [] as string[] }
		configBlob = await createBlob(token, OWNER, REPO, toBase64Utf8(JSON.stringify(config, null, 2)), 'base64')
	}

	const extraBlobs: { path: string; sha: string }[] = []
	if (extraFiles?.length) {
		for (const f of extraFiles) {
			const blob = await createBlob(token, OWNER, REPO, toBase64Utf8(f.content), 'base64')
			extraBlobs.push({ path: f.path, sha: blob.sha })
		}
	}

	// 带重试的提交：updateRef 失败（422 竞态）时重新获取 ref 再试
	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		const refData = await getRef(token, OWNER, REPO, `heads/${BRANCH}`)
		const latestCommitSha = refData.sha

		const treeItems: TreeItem[] = [
			{ path: mdPath, mode: '100644', type: 'blob', sha: mdBlob.sha },
			{ path: INDEX_PATH, mode: '100644', type: 'blob', sha: indexBlob.sha }
		]
		if (configBlob) {
			treeItems.push({ path: `public/blogs/${slug}/config.json`, mode: '100644', type: 'blob', sha: configBlob.sha })
		}
		for (const eb of extraBlobs) {
			treeItems.push({ path: eb.path, mode: '100644', type: 'blob', sha: eb.sha })
		}

		const treeData = await createTree(token, OWNER, REPO, treeItems, latestCommitSha)
		const commitMsg = extraBlobs.length ? `更新碎碎念数据 (${slug})` : `打卡总结追加: ${slug}`
		const commitData = await createCommit(token, OWNER, REPO, commitMsg, treeData.sha, [latestCommitSha])

		try {
			await updateRef(token, OWNER, REPO, `heads/${BRANCH}`, commitData.sha)
			toast.success(created ? `已新建《${slug}》并追加总结` : `已追加到《${slug}》`)
			return { slug, created }
		} catch (err) {
			if (attempt < MAX_RETRIES - 1) {
				await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
				continue
			}
			throw err
		}
	}

	throw new Error('appendLearningLog: max retries exceeded')
}
