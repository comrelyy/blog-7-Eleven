'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import shareList from '@/app/share/list.json'
import { poetryData } from './poetry-data'
import Link from 'next/link'
import { HomeDraggableLayer } from './home-draggable-layer'

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
	const { cardStyles, siteContent } = useConfigStore()
	const [randomItem, setRandomItem] = useState<ShareItem | null>(null)
	const [randomPoetry, setRandomPoetry] = useState<PoetryItem | null>(null)
	const styles = cardStyles.shareCard
	const hiCardStyles = cardStyles.hiCard
	const socialButtonsStyles = cardStyles.socialButtons


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

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x + hiCardStyles.width / 2 + CARD_SPACING
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y + hiCardStyles.height / 2 + CARD_SPACING + socialButtonsStyles.height + CARD_SPACING / 2	

	return (
		<HomeDraggableLayer cardKey='shareCard' x={x} y={y} width={styles.width} height={styles.height}>
{/* <<<<<<< HEAD
		<Card order={styles.order} width={styles.width} x={x} y={y}>
			{/* <h2 className='text-secondary text-sm'>随机推荐</h2> */}

			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y}>
				{siteContent.enableChristmas && (
					<>
						<img
							src='/images/christmas/snow-12.webp'
							alt='Christmas decoration'
							className='pointer-events-none absolute'
							style={{ width: 120, left: -12, top: -12, opacity: 0.8 }}
						/>
					</>
				)}

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
		</HomeDraggableLayer>
	)
}