'use client'

import { putFile, toBase64Utf8, readTextFileFromRepo } from '@/lib/github-client'

export type BlogIndexItem = {
	slug: string
	title: string
	tags: string[]
	date: string  // 创建日期
	updatedAt?: string  // 最后修改日期
	summary?: string
	cover?: string
}

export async function upsertBlogsIndex(token: string, owner: string, repo: string, item: BlogIndexItem, branch: string): Promise<void> {
	const indexPath = 'public/blogs/index.json'
	let list: BlogIndexItem[] = []
	try {
		const txt = await readTextFileFromRepo(token, owner, repo, indexPath, branch)
		if (txt) list = JSON.parse(txt)
	} catch {
		// ignore parse errors and start from empty list
	}
	
	// 更新或添加项目，设置 updatedAt 时间戳
	const now = new Date().toISOString().split('T')[0]; // 使用今天的日期作为更新时间
	const map = new Map<string, BlogIndexItem>(list.map(i => [i.slug, i]))
	
	// 如果是更新现有文章，保留原始创建日期，但更新修改日期
	const existingItem = map.get(item.slug);
	if (existingItem) {
		// 更新现有项目，保留原始日期，但更新修改日期
		map.set(item.slug, { ...item, date: existingItem.date, updatedAt: now });
	} else {
		// 新增项目，设置创建和修改日期为同一天
		map.set(item.slug, { ...item, date: item.date || now, updatedAt: now });
	}
	
	// 按修改日期排序（优先）或创建日期排序
	const next = Array.from(map.values()).sort((a, b) => {
		const dateA = new Date(a.updatedAt || a.date).getTime();
		const dateB = new Date(b.updatedAt || b.date).getTime();
		return dateB - dateA; // 降序，最新的在前
	});
	
	const base64 = toBase64Utf8(JSON.stringify(next, null, 2))
	await putFile(token, owner, repo, indexPath, base64, 'Update blogs index', branch)
}

export async function prepareBlogsIndex(token: string, owner: string, repo: string, item: BlogIndexItem, branch: string): Promise<string> {
	const indexPath = 'public/blogs/index.json'
	let list: BlogIndexItem[] = []
	try {
		const txt = await readTextFileFromRepo(token, owner, repo, indexPath, branch)
		if (txt) list = JSON.parse(txt)
	} catch {
		// ignore parse errors and start from empty list
	}
	
	// 更新或添加项目，设置 updatedAt 时间戳
	const now = new Date().toISOString().split('T')[0]; // 使用今天的日期作为更新时间
	const map = new Map<string, BlogIndexItem>(list.map(i => [i.slug, i]))
	
	// 如果是更新现有文章，保留原始创建日期，但更新修改日期
	const existingItem = map.get(item.slug);
	if (existingItem) {
		// 更新现有项目，保留原始日期，但更新修改日期
		map.set(item.slug, { ...item, date: existingItem.date, updatedAt: now });
	} else {
		// 新增项目，设置创建和修改日期为同一天
		map.set(item.slug, { ...item, date: item.date || now, updatedAt: now });
	}
	
	// 按修改日期排序（优先）或创建日期排序
	const next = Array.from(map.values()).sort((a, b) => {
		const dateA = new Date(a.updatedAt || a.date).getTime();
		const dateB = new Date(b.updatedAt || b.date).getTime();
		return dateB - dateA; // 降序，最新的在前
	});
	
	return JSON.stringify(next, null, 2)
}

export async function removeBlogsFromIndex(token: string, owner: string, repo: string, slugs: string[], branch: string): Promise<string> {
	const indexPath = 'public/blogs/index.json'
	let list: BlogIndexItem[] = []
	try {
		const txt = await readTextFileFromRepo(token, owner, repo, indexPath, branch)
		if (txt) list = JSON.parse(txt)
	} catch {
		// ignore parse errors and keep empty list
	}
	const slugSet = new Set(slugs.filter(Boolean))
	if (slugSet.size === 0) {
		return JSON.stringify(list, null, 2)
	}
	const next = list.filter(item => !slugSet.has(item.slug))
	return JSON.stringify(next, null, 2)
}

export async function removeBlogFromIndex(token: string, owner: string, repo: string, slug: string, branch: string): Promise<string> {
	return removeBlogsFromIndex(token, owner, repo, [slug], branch)
}