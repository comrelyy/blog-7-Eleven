import useSWR from 'swr'
import { getThoughtIndex } from '@/lib/thought-index'

export type BlogIndexItem = {
	slug: string
	title: string
	tags: string[]
	theme?: string
	date: string  // 创建日期
	updatedAt?: string  // 最后修改日期
	summary?: string
	cover?: string
	type?: 'blog' | 'thought' // 区分是博客还是碎碎念
}

const blogFetcher = async (url: string) => {
	const res = await fetch(url, { cache: 'no-store' })
	if (!res.ok) {
		throw new Error('Failed to load blog index')
	}
	const data = await res.json()
	return Array.isArray(data) ? data.map(item => ({ ...item, type: 'blog' as const })) : []
}

const thoughtFetcher = async () => {
	return await getThoughtIndex()
}

// 组合数据获取函数
const combinedFetcher = async () => {
	const [blogData, thoughtData] = await Promise.allSettled([
		blogFetcher('/blogs/index.json'),
		thoughtFetcher()
	])
	
	const blogItems = blogData.status === 'fulfilled' ? blogData.value : []
	const thoughtItems = thoughtData.status === 'fulfilled' ? thoughtData.value : []
	
	// 合并并按日期排序：先比较更新时间，更新时间一致时再比较创建时间
	const allItems = [...blogItems].sort(compareByUpdatedThenCreated)
	return allItems
}

function compareByUpdatedThenCreated(a: BlogIndexItem, b: BlogIndexItem) {
	const updatedA = new Date(a.updatedAt || a.date).getTime()
	const updatedB = new Date(b.updatedAt || b.date).getTime()
	if (updatedA !== updatedB) return updatedB - updatedA
	const createdA = new Date(a.date).getTime()
	const createdB = new Date(b.date).getTime()
	return createdB - createdA
}

export function useBlogIndex() {
	const { data, error, isLoading } = useSWR<BlogIndexItem[]>('/combined-index', combinedFetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: true
	})

	return {
		items: data || [],
		loading: isLoading,
		error
	}
}

export function useLatestBlog() {
	const { items, loading, error } = useBlogIndex()

	// 先比较更新时间，更新时间一致时再比较创建时间
	const sortedItems = [...items].sort(compareByUpdatedThenCreated)

	const latestBlog = sortedItems.length > 0 ? sortedItems[0] : null

	return {
		blog: latestBlog,
		loading,
		error
	}
}