import { BlogIndexItem } from '@/hooks/use-blog-index'

// 获取所有thoughts文件并生成索引
export async function getThoughtIndex(): Promise<BlogIndexItem[]> {
  // 为了动态获取所有thoughts文件，我们可以尝试获取一个包含所有文件列表的文件
  // 或者根据日期范围生成可能的文件名
  const thoughtFiles = await getCurrentMonthThoughtFiles()
  const thoughtsData: BlogIndexItem[] = []
  
  for (const file of thoughtFiles) {
    try {
      const res = await fetch(`/thoughts/${file}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          // 取每个月最新的thought作为该月的"文章"
          const latestThought = data.reduce((latest, current) => 
            current.timestamp > latest.timestamp ? current : latest
          )
          
          // 从文件名中提取年份
          const fileName = file.replace('.json', '')
          const year = fileName.split('-')[0]
          
          // 将thought转换为blog格式
          thoughtsData.push({
            slug: fileName, // 使用文件名作为slug
            title: `${fileName} 碎碎念`,
            tags: ['碎碎念', year], // 添加年份作为标签
            date: latestThought.date,
            summary:  '',
            type: 'thought'
          })
        }
      }
    } catch (e) {
      console.error(`Failed to load thought file: ${file}`, e)
    }
  }
  
  return thoughtsData
}

// 获取可能的thoughts文件列表
async function getPossibleThoughtFiles(): Promise<string[]> {
  // 从当前日期往前推算可能的月份
  const files = []
  const today = new Date()
  const startYear = 2025 // 假设从2025年开始
  const startMonth = 11
  
  for (let year = today.getFullYear(); year >= startYear; year--) {
    const endMonth = year === today.getFullYear() ? today.getMonth() + 1 : 12
    const beginMonth = year === startYear ? startMonth : 1
   // console.log(year, endMonth, beginMonth)
    for (let month = endMonth; month >= beginMonth; month--) {
      const monthStr = String(month).padStart(2, '0')
      files.push(`${year}-${monthStr}.json`)
    }
  }
  
  // 检查哪些文件实际存在
  const existingFiles = []
  for (const file of files) {
    try {
      const res = await fetch(`/thoughts/${file}`, { method: 'HEAD' })
      if (res.ok) {
        existingFiles.push(file)
      }
    } catch (e) {
      // 忽略错误，继续检查下一个文件
    }
  }
  
  return existingFiles
}

async function getCurrentMonthThoughtFiles(): Promise<string[]> {
  // 从当前日期往前推算可能的月份

  const today = new Date()
 
  const year = today.getFullYear()
  const monthStr = String(today.getMonth() + 1).padStart(2, '0')
  const file = `${year}-${monthStr}.json`
  // 检查哪些文件实际存在
  const existingFiles = []
  //for (const file of files) {
    try {
      const res = await fetch(`/thoughts/${file}`, { method: 'HEAD' })
      if (res.ok) {
        existingFiles.push(file)
      }
    } catch (e) {
      // 忽略错误，继续检查下一个文件
    }
  //}
  
  return existingFiles
}