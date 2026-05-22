import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { readTextFileFromRepo, getRef, createBlob, createTree, createCommit, updateRef, toBase64Utf8, type TreeItem } from '@/lib/github-client'
import type { BlogIndexItem } from '@/lib/blog-index'
import { toast } from 'sonner'

const INDEX_PATH = 'public/blogs/index.json'

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
 * - 一次 GitHub 提交完成 index.md（+ 新建时的 config.json）+ index.json。
 */
export async function appendLearningLog(params: { eventName: string; summary: string; date: string }): Promise<{ slug: string; created: boolean }> {
	const { eventName, summary, date } = params
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

	// 组装提交
	const refData = await getRef(token, OWNER, REPO, `heads/${BRANCH}`)
	const latestCommitSha = refData.sha
	const treeItems: TreeItem[] = []

	const mdBlob = await createBlob(token, OWNER, REPO, toBase64Utf8(nextMd), 'base64')
	treeItems.push({ path: mdPath, mode: '100644', type: 'blob', sha: mdBlob.sha })

	if (created) {
		const config = { title: slug, tags: ['碎碎念', slug], date, summary: trimmed.slice(0, 80), images: [] as string[] }
		const configBlob = await createBlob(token, OWNER, REPO, toBase64Utf8(JSON.stringify(config, null, 2)), 'base64')
		treeItems.push({ path: `public/blogs/${slug}/config.json`, mode: '100644', type: 'blob', sha: configBlob.sha })
	}

	const indexBlob = await createBlob(token, OWNER, REPO, toBase64Utf8(JSON.stringify(nextIndex, null, 2)), 'base64')
	treeItems.push({ path: INDEX_PATH, mode: '100644', type: 'blob', sha: indexBlob.sha })

	const treeData = await createTree(token, OWNER, REPO, treeItems, latestCommitSha)
	const commitData = await createCommit(token, OWNER, REPO, `打卡总结追加: ${slug}`, treeData.sha, [latestCommitSha])
	await updateRef(token, OWNER, REPO, `heads/${BRANCH}`, commitData.sha)

	toast.success(created ? `已新建《${slug}》并追加总结` : `已追加到《${slug}》`)
	return { slug, created }
}
