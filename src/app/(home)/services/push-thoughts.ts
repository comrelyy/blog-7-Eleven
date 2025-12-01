import { toBase64Utf8, getRef, createTree, createCommit, updateRef, createBlob, type TreeItem } from '@/lib/github-client'
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

// 推送碎碎念数据到GitHub
export async function pushThoughts(thoughts: Thought[]): Promise<void> {
  // 获取认证 token
  const token = await getAuthToken()

  toast.info('正在获取分支信息...')
  const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
  const latestCommitSha = refData.sha

  // 按月份分组碎碎念数据
  const thoughtsByMonth: Record<string, Thought[]> = {}
  thoughts.forEach(thought => {
    const monthKey = thought.date.substring(0, 7) // 提取 yyyy-mm 部分
    if (!thoughtsByMonth[monthKey]) {
      thoughtsByMonth[monthKey] = []
    }
    thoughtsByMonth[monthKey].push(thought)
  })

  toast.info('正在准备文件...')

  const treeItems: TreeItem[] = []

  // 为每个月份创建JSON文件，保存到 /public/thoughts 目录
  for (const [month, monthlyThoughts] of Object.entries(thoughtsByMonth)) {
    const thoughtsJson = JSON.stringify(monthlyThoughts, null, '\t')
    const thoughtsBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(thoughtsJson), 'base64')
    
    // 文件路径：public/thoughts/xxxx-xx.json
    const filePath = `public/thoughts/${month}.json`
    
    treeItems.push({
      path: filePath,
      mode: '100644',
      type: 'blob',
      sha: thoughtsBlob.sha
    })
  }

  // 如果没有碎碎念数据，创建一个空的目录占位文件
  if (Object.keys(thoughtsByMonth).length === 0) {
    const emptyBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(''), 'base64')
    treeItems.push({
      path: 'public/thoughts/.gitkeep',
      mode: '100644',
      type: 'blob',
      sha: emptyBlob.sha
    })
  }

  const commitMessage = `更新碎碎念数据 (${Object.keys(thoughtsByMonth).length} 个月份)`

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
  
  // 合并所有数据
  const allThoughts: Thought[] = []
  let loading = 0
  let error = null
  
  // 检查所有请求的状态
  for (const file of possibleFiles) {
  if (loading > 1) {
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
    loading++
    continue
  }
  
  if (!res.ok) {
    throw new Error(`Failed to load ${file}`)
  }
  
  
  const data = await res.json()
  

  allThoughts.push(...(Array.isArray(data) ? data : []))

  }
  
  // 按时间戳排序，最新的在前
  const sortedThoughts = allThoughts.sort((a, b) => b.timestamp - a.timestamp)

  return { thoughts: sortedThoughts }
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