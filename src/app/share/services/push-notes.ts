import { toBase64Utf8, getRef, createTree, createCommit, updateRef, createBlob, type TreeItem } from '@/lib/github-client'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { toast } from 'sonner'

// 定义碎碎念数据结构
export interface Note {
  id: string
  content: string
  date: string // YYYY-MM-DD
  time: string // HH:mm:ss
}

// 推送碎碎念数据到GitHub
export async function pushNotes(notes: Note[]): Promise<void> {
  // 获取认证 token
  const token = await getAuthToken()

  toast.info('正在获取分支信息...')
  const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
  const latestCommitSha = refData.sha

  // 按月份分组碎碎念数据
  const notesByMonth: Record<string, Note[]> = {}
  notes.forEach(note => {
    const monthKey = note.date.substring(0, 7) // 提取 yyyy-mm 部分
    if (!notesByMonth[monthKey]) {
      notesByMonth[monthKey] = []
    }
    notesByMonth[monthKey].push(note)
  })

  toast.info('正在准备文件...')

  const treeItems: TreeItem[] = []

  // 为每个月份创建JSON文件
  for (const [month, monthlyNotes] of Object.entries(notesByMonth)) {
    const notesJson = JSON.stringify(monthlyNotes, null, '\t')
    const notesBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(notesJson), 'base64')
    
    // 文件路径：src/app/share/notes/xxxx-xx.json
    const filePath = `src/app/share/notes/${month}.json`
    
    treeItems.push({
      path: filePath,
      mode: '100644',
      type: 'blob',
      sha: notesBlob.sha
    })
  }

  // 如果没有碎碎念数据，创建一个空的目录占位文件
  if (Object.keys(notesByMonth).length === 0) {
    const emptyBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(''), 'base64')
    treeItems.push({
      path: 'src/app/share/notes/.gitkeep',
      mode: '100644',
      type: 'blob',
      sha: emptyBlob.sha
    })
  }

  const commitMessage = `更新碎碎念数据 (${Object.keys(notesByMonth).length} 个月份)`

  toast.info('正在创建文件树...')
  const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)

  toast.info('正在创建提交...')
  const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, commitMessage, treeData.sha, [latestCommitSha])

  toast.info('正在更新分支...')
  await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)

  toast.success('碎碎念保存成功！')
}

// 从GitHub读取碎碎念数据
export async function fetchNotes(): Promise<Note[]> {
  const token = await getAuthToken()
  
  // 获取所有碎碎念文件
  const notes: Note[] = []
  
  // 这里我们简化实现，实际项目中可能需要列出目录中的所有文件
  // 并逐个读取。为了演示，我们假设只读取最近几个月的数据
  
  const today = new Date()
  const months = []
  
  // 获取最近6个月的年月
  for (let i = 0; i < 6; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
  }
  
  // 读取每个月份的碎碎念数据
  for (const month of months) {
    try {
      const path = `src/app/share/notes/${month}.json`
      // 注意：这里应该使用一个能读取文件的函数，比如readTextFileFromRepo
      // 但由于readTextFileFromRepo需要ref参数，我们需要先获取ref
      const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
      
      // 我们需要创建一个读取文件内容的辅助函数
      const fileContent = await readTextFileFromRepo(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, path, refData.sha)
      
      if (fileContent) {
        const monthlyNotes: Note[] = JSON.parse(fileContent)
        notes.push(...monthlyNotes)
      }
    } catch (error) {
      // 文件不存在或其他错误，跳过
      console.debug(`未能读取 ${month} 的碎碎念数据:`, error)
    }
  }
  
  // 按日期排序，最新的在前
  return notes.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }
    return b.time.localeCompare(a.time)
  })
}

// 辅助函数：从仓库读取文本文件
async function readTextFileFromRepo(token: string, owner: string, repo: string, path: string, ref: string): Promise<string | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`, {
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
}