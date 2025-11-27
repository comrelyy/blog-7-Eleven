'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { styles as hiCardStyles } from './hi-card'
import { styles as socialButtonsStyles } from './social-buttons'
import { CARD_SPACING } from '@/consts'
import shareList from '@/app/share/list.json'
import { poetryData } from './poetry-data'

export const styles = {
	width: 300, // 增大宽度从200到300
	order: 7
}

type ShareItem = {
	name: string
	url: string
	logo: string
	description: string
	tags: string[]
	stars: number
}

type PoetryItem = {
	title: string
	author?: string
	chapter?: string
	content: string
}

export default function ShareCard() {
	const center = useCenterStore()
	const [randomItem, setRandomItem] = useState<ShareItem | null>(null)
	const [randomPoetry, setRandomPoetry] = useState<PoetryItem | null>(null)

	useEffect(() => {
		// 随机决定展示分享项目还是诗词
		//const showPoetry = Math.random() > 0.5
		
		//if (showPoetry) {
			// 随机选择一个诗词
			const randomIndex = Math.floor(Math.random() * poetryData.length)
			setRandomPoetry(poetryData[randomIndex])
		//	setRandomItem(null)
		// } else {
		// 	// 随机选择一个分享项目
		// 	const randomIndex = Math.floor(Math.random() * shareList.length)
		// 	setRandomItem(shareList[randomIndex])
		// 	setRandomPoetry(null)
		// }
	}, [])

	if (!randomItem && !randomPoetry) {
		return null
	}

	return (
		<Card
			order={styles.order}
			width={styles.width}
			x={center.x + hiCardStyles.width / 2 + CARD_SPACING * 2}
			y={center.y + hiCardStyles.height / 2 + CARD_SPACING + socialButtonsStyles.height + CARD_SPACING}>
			<h2 className='text-secondary text-sm'>随机推荐</h2>

			{randomPoetry ? (
				<div className='mt-2 space-y-2'>
					<div className='flex items-center justify-between'>
						<h3 className='text-sm font-medium'>{randomPoetry.title}</h3>
						<span className='text-xs text-secondary'>
							{randomPoetry.author ? `作者：${randomPoetry.author}` : `${randomPoetry.chapter}`}
						</span>
					</div>
					<p className='text-secondary text-xs leading-relaxed'>{randomPoetry.content}</p>
				</div>
			) : randomItem ? (
				<a href={randomItem.url} target="_blank" rel="noopener noreferrer" className='mt-2 block space-y-2'>
					<div className='flex items-center'>
						<div className='relative mr-3 h-12 w-12 shrink-0 overflow-hidden rounded-xl'>
							<img src={randomItem.logo} alt={randomItem.name} className='h-full w-full object-contain' />
						</div>
						<h3 className='text-sm font-medium'>{randomItem.name}</h3>
					</div>
					<p className='text-secondary line-clamp-3 text-xs'>{randomItem.description}</p>
				</a>
			) : null}
		</Card>
	)
}