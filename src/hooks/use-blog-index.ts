import useSWR from 'swr'
import { getThoughtIndex } from '@/lib/thought-index'

export type BlogIndexItem = {
	slug: string
	title: string
	tags: string[]
	theme?: string
	date: string
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
	
	// 合并并按日期排序
	const allItems = [...blogItems]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	
	return allItems
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

	const latestBlog = items.length > 0 ? items[0] : null

	return {
		blog: latestBlog,
		loading,
		error
	}
}