import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { readTextFileFromRepo, createBlob, getRef, createTree, createCommit, updateRef, type TreeItem } from '@/lib/github-client'
import { toast } from 'sonner'

// 打卡事件和记录的数据结构
export type CheckinEvent = { id: string; name: string; color: string; start?: string; end?: string }
export type CheckinRecord = { date: string; eventId: string }
export type CheckinPosition = { x: number; y: number }

// 打卡数据的完整结构
export type CheckinData = {
  events: CheckinEvent[]
  records: CheckinRecord[]
  positions: Record<string, CheckinPosition>
}

/**
 * 从GitHub读取打卡数据
 */
export async function loadCheckinData(): Promise<CheckinData | null> {
  try {
    // const token = await getAuthToken()
    
    // // 读取打卡数据文件
    // const dataStr = await readTextFileFromRepo(
    //   token, 
    //   GITHUB_CONFIG.OWNER, 
    //   GITHUB_CONFIG.REPO, 
    //   'src/app/checkin/data.json', 
    //   GITHUB_CONFIG.BRANCH
    // )

    const res = await fetch(`/checkin/data.json`, { 
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
  
  if (!res.ok) {
    throw new Error(`Failed to load checkin data.json`)
  }
    const data: CheckinData = await res.json()
    return data
  } catch (error) {
    console.error('加载打卡数据失败:', error)
    return null
  }
}

/**
 * 保存打卡数据到GitHub
 */
export async function saveCheckinData(data: CheckinData): Promise<void> {
  try {
    const token = await getAuthToken()
    
    // 获取当前分支信息
    const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
    const latestCommitSha = refData.sha
    
    // 准备数据文件
    const dataJson = JSON.stringify(data, null, 2)
    const dataBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, btoa(unescape(encodeURIComponent(dataJson))), 'base64')
    
    // 创建文件树
    const treeItems: TreeItem[] = [{
      path: '/checkin/data.json',
      mode: '100644',
      type: 'blob',
      sha: dataBlob.sha
    }]
    
    // 创建提交
    const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)
    const commitData = await createCommit(
      token, 
      GITHUB_CONFIG.OWNER, 
      GITHUB_CONFIG.REPO, 
      'Update checkin data', 
      treeData.sha, 
      [latestCommitSha]
    )
    
    // 更新分支引用
    await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)
    
    toast.success('打卡数据保存成功!')
  } catch (error) {
    console.error('保存打卡数据失败:', error)
    toast.error('打卡数据保存失败')
    throw error
  }
}

/**
 * 从localStorage迁移数据到GitHub（如果GitHub上没有数据的话）
 */
export async function migrateLocalDataIfNeeded(): Promise<boolean> {
  try {
    // 先尝试从GitHub加载数据
    const githubData = await loadCheckinData()
    
    // 如果GitHub上有数据，使用GitHub数据
    if (githubData) {
      return false
    }
    
    // 如果GitHub上没有数据，检查localStorage是否有数据
    const localEvents = localStorage.getItem("checkin-events")
    const localRecords = localStorage.getItem("checkin-records")
    const localPositions = localStorage.getItem("checkin-positions")
    
    // 如果localStorage中有数据，则迁移到GitHub
    if (localEvents || localRecords || localPositions) {
      const data: CheckinData = {
        events: localEvents ? JSON.parse(localEvents) : [],
        records: localRecords ? JSON.parse(localRecords) : [],
        positions: localPositions ? JSON.parse(localPositions) : {}
      }
      
      await saveCheckinData(data)
      
      // 清除localStorage中的旧数据
      localStorage.removeItem("checkin-events")
      localStorage.removeItem("checkin-records")
      localStorage.removeItem("checkin-positions")
      
      toast.info('数据已从本地迁移到GitHub')
      return true
    }
    
    return false
  } catch (error) {
    console.error('数据迁移失败:', error)
    return false
  }
}