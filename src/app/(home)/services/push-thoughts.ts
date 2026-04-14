import { toBase64Utf8, getRef, createTree, createCommit, updateRef, createBlob, readTextFileFromRepo, type TreeItem } from '@/lib/github-client'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { toast } from 'sonner'

export type ThoughtJsonArray = {
  thoughts: Thought[]
}

export interface Thought {
  id: string
  text: string
  timestamp: number
  date: string // YYYY-MM-DD
  time: string // HH:mm:ss
}

// 推送单条碎碎念到GitHub（只更新该条所在月份的文件，不影响其他月份）
export async function pushThoughts(newThoughts: Thought[]): Promise<void> {
  const token = await getAuthToken()

  toast.info('正在获取分支信息...')
  const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
  const latestCommitSha = refData.sha

  // 找出需要更新的月份（只处理新增/变动的月份）
  const monthsToUpdate = new Set<string>()
  newThoughts.forEach(t => monthsToUpdate.add(t.date.substring(0, 7)))

  toast.info('正在读取已有数据...')

  const treeItems: TreeItem[] = []

  for (const monthKey of monthsToUpdate) {
    // 从GitHub读取该月份已有的数据
    const filePath = `public/thoughts/${monthKey}.json`
    let existingThoughts: Thought[] = []
    try {
      const content = await readTextFileFromRepo(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, filePath, GITHUB_CONFIG.BRANCH)
      if (content) {
        const parsed = JSON.parse(content)
        existingThoughts = Array.isArray(parsed) ? parsed : []
      }
    } catch {
      // 文件不存在或解析失败，从空数组开始
    }

    // 合并：用新数据中该月份的条目替换/新增，按id去重
    const newForMonth = newThoughts.filter(t => t.date.substring(0, 7) === monthKey)
    const newIds = new Set(newForMonth.map(t => t.id))
    const merged = [
      ...newForMonth,
      ...existingThoughts.filter(t => !newIds.has(t.id))
    ].sort((a, b) => b.timestamp - a.timestamp)

    const thoughtsJson = JSON.stringify(merged, null, '\t')
    const thoughtsBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(thoughtsJson), 'base64')

    treeItems.push({
      path: filePath,
      mode: '100644',
      type: 'blob',
      sha: thoughtsBlob.sha
    })
  }

  if (treeItems.length === 0) {
    toast.info('没有需要更新的数据')
    return
  }

  const commitMessage = `更新碎碎念数据 (${Array.from(monthsToUpdate).join(', ')})`

  toast.info('正在创建文件树...')
  const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)

  toast.info('正在创建提交...')
  const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, commitMessage, treeData.sha, [latestCommitSha])

  toast.info('正在更新分支...')
  await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)

  // 清除受影响月份的缓存，确保下次读取拿到最新数据
  for (const month of monthsToUpdate) {
    invalidateThoughtsCache(month)
  }

  toast.success('碎碎念保存成功！')
}

export async function useThoughtsIndex() :Promise<ThoughtJsonArray | null>{
  // 定义可能的文件列表（您可以根据实际情况调整）
  const possibleFiles = getAllPossibleThoughtFiles()
  
  // 创建多个 SWR 请求来加载所有可能的文件
  
  const allThoughts: Thought[] = []
  let consecutiveNotFound = 0

  for (const file of possibleFiles) {
    if (consecutiveNotFound > 1) {
      break
    }
    const res = await fetch(`/thoughts/${file}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    if (res.status === 404) {
      consecutiveNotFound++
      continue
    }

    if (!res.ok) {
      throw new Error(`Failed to load ${file}`)
    }

    consecutiveNotFound = 0
    const data = await res.json()
    allThoughts.push(...(Array.isArray(data) ? data : []))
  }
  
  // 按时间戳排序，最新的在前
  const sortedThoughts = allThoughts.sort((a, b) => b.timestamp - a.timestamp)

  return { thoughts: sortedThoughts }
}

// 只获取最近一条碎碎念（首页卡片使用，避免拉取所有月份文件）
export async function getLatestThought(): Promise<Thought | null> {
  const possibleFiles = getAllPossibleThoughtFiles()
  let consecutiveNotFound = 0

  for (const file of possibleFiles) {
    if (consecutiveNotFound > 1) break
    try {
      const res = await fetch(`/thoughts/${file}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      })
      if (res.status === 404) {
        consecutiveNotFound++
        continue
      }
      if (!res.ok) continue
      consecutiveNotFound = 0
      const data = await res.json()
      const thoughts = Array.isArray(data) ? data : []
      if (thoughts.length > 0) {
        // 找到即返回，无需继续
        return thoughts.reduce((a, b) => (a.timestamp > b.timestamp ? a : b))
      }
    } catch {
      consecutiveNotFound++
    }
  }
  return null
}

// Session 级月份缓存 —— 同一月份的请求（包括不同日期）只发一次 fetch
// 失效时机：页面刷新 / pushThoughts 成功后清除相关月份
const monthlyThoughtsCache = new Map<string, Promise<Thought[]>>()

export function invalidateThoughtsCache(yearMonth?: string) {
  if (yearMonth) monthlyThoughtsCache.delete(yearMonth)
  else monthlyThoughtsCache.clear()
}

async function loadMonthThoughts(yearMonth: string): Promise<Thought[]> {
  const res = await fetch(`/thoughts/${yearMonth}.json`, { cache: 'no-store' })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`Failed to load ${yearMonth}.json`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

// 获取指定日期的碎碎念数据（命中月份缓存）
export async function getThoughtsByDate(date: string): Promise<Thought[]> {
  const yearMonth = date.substring(0, 7)
  let promise = monthlyThoughtsCache.get(yearMonth)
  if (!promise) {
    promise = loadMonthThoughts(yearMonth).catch(err => {
      console.error(`Error fetching thoughts for ${yearMonth}:`, err)
      monthlyThoughtsCache.delete(yearMonth) // 失败不缓存
      return []
    })
    monthlyThoughtsCache.set(yearMonth, promise)
  }
  const monthThoughts = await promise
  return monthThoughts.filter(t => t.date === date).sort((a, b) => b.timestamp - a.timestamp)
}

// 获取所有可能的碎碎念文件列表
function getAllPossibleThoughtFiles(): string[] {
  const files = []
  const today = new Date()
  
  // 生成从当前日期往前推24个月的文件名
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    files.push(`${year}-${month}.json`)
  }
  
  return files
}