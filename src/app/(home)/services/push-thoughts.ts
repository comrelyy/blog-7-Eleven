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

// 获取指定日期的碎碎念数据
export async function getThoughtsByDate(date: string): Promise<Thought[]> {
  // 从日期提取年月
  const yearMonth = date.substring(0, 7); // YYYY-MM
  const fileName = `${yearMonth}.json`;
  
  try {
    // 尝试获取该月份的碎碎念数据
    const res = await fetch(`/thoughts/${fileName}`, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (res.status === 404) {
      // 文件不存在，返回空数组
      return [];
    }
    
    if (!res.ok) {
      throw new Error(`Failed to load ${fileName}`);
    }
    
    const data = await res.json();
    
    // 筛选出指定日期的碎碎念
    const thoughtsForDate = Array.isArray(data) 
      ? data.filter(thought => thought.date === date)
      : [];
    
    // 按时间戳排序，最新的在前
    return thoughtsForDate.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error(`Error fetching thoughts for date ${date}:`, error);
    return [];
  }
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