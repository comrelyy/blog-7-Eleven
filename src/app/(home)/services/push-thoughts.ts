import { toBase64Utf8, getRef, createTree, createCommit, updateRef, createBlob, type TreeItem } from '@/lib/github-client'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { toast } from 'sonner'

// 定义碎碎念数据结构
export interface Thought {
  id: string
  text: string
  timestamp: number
  date: string // YYYY-MM-DD
  time: string // HH:mm:ss
}

// 将时间戳转换为日期和时间字符串
function formatDateTime(timestamp: number): { date: string; time: string } {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:${seconds}`
  }
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
    // 确保每个thought都有date和time字段
    if (!thought.date || !thought.time) {
      const { date, time } = formatDateTime(thought.timestamp)
      thought.date = date
      thought.time = time
    }
    
    const monthKey = thought.date.substring(0, 7) // 提取 yyyy-mm 部分
    if (!thoughtsByMonth[monthKey]) {
      thoughtsByMonth[monthKey] = []
    }
    thoughtsByMonth[monthKey].push(thought)
  })

  toast.info('正在准备文件...')

  const treeItems: TreeItem[] = []

  // 为每个月份创建JSON文件
  for (const [month, monthlyThoughts] of Object.entries(thoughtsByMonth)) {
    const thoughtsJson = JSON.stringify(monthlyThoughts, null, '\t')
    const thoughtsBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(thoughtsJson), 'base64')
    
    // 文件路径：src/data/thoughts/xxxx-xx.json
    const filePath = `src/data/thoughts/${month}.json`
    
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
      path: 'src/data/thoughts/.gitkeep',
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

// 从GitHub读取碎碎念数据
export async function fetchThoughts(): Promise<Thought[]> {
  const token = await getAuthToken()
  
  // 获取所有碎碎念文件
  const thoughts: Thought[] = []
  
  // 获取最近几个月的年月（最近12个月）
  const today = new Date()
  const months = []
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
  }
  
  // 读取每个月份的碎碎念数据
  for (const month of months) {
    try {
      const path = `src/data/thoughts/${month}.json`
      const fileContent = await readTextFileFromRepo(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, path)
      
      if (fileContent) {
        const monthlyThoughts: Thought[] = JSON.parse(fileContent)
        thoughts.push(...monthlyThoughts)
      }
    } catch (error) {
      // 文件不存在或其他错误，跳过
      console.debug(`未能读取 ${month} 的碎碎念数据:`, error)
    }
  }
  
  // 按时间戳排序，最新的在前
  return thoughts.sort((a, b) => b.timestamp - a.timestamp)
}

// 辅助函数：从仓库读取文本文件
async function readTextFileFromRepo(token: string, owner: string, repo: string, path: string): Promise<string | null> {
  try {
    // 先获取ref
    const refData = await getRef(token, owner, repo, `heads/${GITHUB_CONFIG.BRANCH}`)
    
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(refData.sha)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`read file failed: ${res.status}`)
    
    const data: any = await res.json()
    if (Array.isArray(data) || !data.content) return null
    
    try {
      return decodeURIComponent(escape(atob(data.content)))
    } catch {
      return atob(data.content)
    }
  } catch (error) {
    console.error(`Error reading file from repo: ${path}`, error)
    return null
  }
}