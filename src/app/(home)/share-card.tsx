'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import { poetryData } from './poetry-data'
import { getPoetryMood } from './poetry-mood'
import { PoetryScene } from './poetry-scene'
import { HomeDraggableLayer } from './home-draggable-layer'

export default function ShareCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const styles = cardStyles.shareCard
	const hiCardStyles = cardStyles.hiCard
	const socialButtonsStyles = cardStyles.socialButtons
	const [isAnimating, setIsAnimating] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)

	useEffect(() => {
		const randomIndex = Math.floor(Math.random() * poetryData.length)
		setCurrentIndex(randomIndex)
	}, [])

	const handleNextItem = () => {
		if (poetryData.length === 0 || isAnimating) return
		setIsAnimating(true)
		setTimeout(() => {
			setCurrentIndex(prevIndex => (prevIndex + 1) % poetryData.length)
			setIsAnimating(false)
		}, 300)
	}

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x + hiCardStyles.width / 2 + CARD_SPACING
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y + hiCardStyles.height / 2 + CARD_SPACING + socialButtonsStyles.height + CARD_SPACING / 2

	const currentItem = poetryData[currentIndex]
	const mood = currentItem ? getPoetryMood(currentItem) : 'default'

	return (
		<HomeDraggableLayer cardKey='shareCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y}>
				{siteContent.enableChristmas && (
					<img
						src='/images/christmas/snow-12.webp'
						alt='Christmas decoration'
						className='pointer-events-none absolute'
						style={{ width: 120, left: -12, top: -12, opacity: 0.8 }}
					/>
				)}

				{/* Poetry scene background */}
				<div className='pointer-events-none absolute inset-6 overflow-hidden rounded-[34px] opacity-60 transition-all duration-700'>
					<PoetryScene mood={mood} />
				</div>

				<div className='relative'>
					<h2 className='text-secondary cursor-pointer text-sm' onClick={handleNextItem}>
						随机推荐
					</h2>
					{currentItem && (
						<div className='mt-2 space-y-2'>
							<div className='flex items-center justify-between'>
								<h3 className='text-sm font-medium'>{currentItem.title}</h3>
								<span className='text-secondary text-xs'>{currentItem.author ? `作者：${currentItem.author}` : `${currentItem.chapter}`}</span>
							</div>
							<p className='text-secondary text-xs leading-relaxed'>{currentItem.content}</p>
						</div>
					)}
				</div>
			</Card>
		</HomeDraggableLayer>
	)
}
