export type BlogConfig = {
	title?: string
	tags?: string[]
	date?: string
	summary?: string
	cover?: string
}

export type LoadedBlog = {
	slug: string
	config: BlogConfig
	markdown: string
	cover?: string
}

/**
 * Load blog data from public/blogs/{slug} or thoughts/{slug}.json
 * Used by both view page and edit page
 */
export async function loadBlog(slug: string): Promise<LoadedBlog> {
	if (!slug) {
		throw new Error('Slug is required')
	}

	// 检查是否是thoughts的slug (格式为 YYYY-MM)
	const isThought = false
	
	if (isThought) {
		console.log('Loading thought for slug:', slug)
		// 加载thought数据
		const res = await fetch(`/thoughts/${slug}.json`)
		if (!res.ok) {
			throw new Error('Thought not found')
		}
		
		const thoughts = await res.json()
		if (!Array.isArray(thoughts) || thoughts.length === 0) {
			throw new Error('Thought not found')
		}
		
		// 将thoughts转换为markdown格式
		const markdown = thoughts
			.sort((a, b) => b.timestamp - a.timestamp) // 按时间倒序排列
			.map(thought => {
				// 如果thought.text包含markdown格式的标题或特殊字符，需要转义
				const escapedText = thought.text
					.replace(/#/g, '\\#') // 转义标题符号
					.replace(/>/g, '\\>') // 转义引用符号
					.replace(/\*/g, '\\*') // 转义强调符号
					.replace(/_/g, '\\_') // 转义下划线
					.replace(/-/g, '\\-') // 转义列表符号
				return `### ${thought.date} ${thought.time}\n\n${escapedText}\n`
			})
			.join('\n---\n\n')
		
		// 获取最新的thought作为配置参考
		const latestThought = thoughts.reduce((latest, current) => 
			current.timestamp > latest.timestamp ? current : latest
		)
		
		const config: BlogConfig = {
			title: `${slug} 碎碎念`,
			tags: ['碎碎念'],
			date: latestThought.date,
			summary: latestThought.text.substring(0, 100) + (latestThought.text.length > 100 ? '...' : ''),
		}
		
		return {
			slug,
			config,
			markdown,
			cover: config.cover
		}
	} else {
		// 原有的博客加载逻辑
		// Load config.json
		let config: BlogConfig = {}
		const configRes = await fetch(`/blogs/${encodeURIComponent(slug)}/config.json`)
		if (configRes.ok) {
			try {
				config = await configRes.json()
			} catch {
				config = {}
			}
		}

		// Load index.md
		const mdRes = await fetch(`/blogs/${encodeURIComponent(slug)}/index.md`)
		if (!mdRes.ok) {
			throw new Error('Blog not found')
		}
		const markdown = await mdRes.text()

		return {
			slug,
			config,
			markdown,
			cover: config.cover
		}
	}
}