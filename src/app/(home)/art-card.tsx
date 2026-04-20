'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import { HomeDraggableLayer } from './home-draggable-layer'
import picturesList from '@/app/pictures/list.json'

export default function ArtCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const styles = cardStyles.artCard
	const hiCardStyles = cardStyles.hiCard

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - styles.width / 2
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y - hiCardStyles.height / 2 - styles.height - CARD_SPACING

	// Collect all valid image URLs from pictures list
	const allImages = useMemo(() => {
		const urls: string[] = []
		for (const pic of picturesList as Array<{ images?: string[]; image?: string }>) {
			if (pic.images) {
				for (const u of pic.images) {
					if (u && !u.startsWith('blob:')) urls.push(u)
				}
			} else if (pic.image && !pic.image.startsWith('blob:')) {
				urls.push(pic.image)
			}
		}
		if (urls.length === 0) {
			const artImages = siteContent.artImages ?? []
			const currentId = siteContent.currentArtImageId
			const currentArt = (currentId ? artImages.find((item: any) => item.id === currentId) : undefined) ?? artImages[0]
			if (currentArt?.url) urls.push(currentArt.url)
			else urls.push('/images/art/cat.png')
		}
		return urls
	}, [siteContent.artImages, siteContent.currentArtImageId])

	// 刷新时随机选一张
	const [index, setIndex] = useState(() => Math.floor(Math.random() * Math.max(1, allImages.length)))
	const [orientation, setOrientation] = useState<Record<string, 'portrait' | 'landscape'>>({})

	// 检测当前图片方向
	useEffect(() => {
		const url = allImages[index]
		if (!url || orientation[url]) return
		const img = new Image()
		img.onload = () => {
			setOrientation(prev => ({ ...prev, [url]: img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape' }))
		}
		img.src = url
	}, [index, allImages, orientation])

	// 点击切换下一张
	const handleClick = useCallback(() => {
		if (allImages.length <= 1) return
		setIndex(prev => {
			let next: number
			do {
				next = Math.floor(Math.random() * allImages.length)
			} while (next === prev && allImages.length > 1)
			return next
		})
	}, [allImages.length])

	const isPortrait = orientation[allImages[index]] === 'portrait'
	const currentUrl = allImages[index] ?? allImages[0]

	return (
		<HomeDraggableLayer cardKey='artCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card className='p-2 max-sm:static max-sm:translate-0' order={styles.order} width={styles.width} height={styles.height} x={x} y={y}>
				{siteContent.enableChristmas && (
					<img
						src='/images/christmas/snow-3.webp'
						alt='Christmas decoration'
						className='pointer-events-none absolute'
						style={{ width: 160, right: -8, top: -16, opacity: 0.9 }}
					/>
				)}

				<div className='relative h-full w-full cursor-pointer overflow-hidden rounded-[32px]' onClick={handleClick}>
					<AnimatePresence mode='wait'>
						{isPortrait ? (
							<motion.div
								key={currentUrl}
								className='absolute inset-0'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.4 }}
							>
								<img src={currentUrl} alt='' className='absolute inset-0 h-full w-full scale-110 object-cover blur-lg' />
								<img src={currentUrl} alt='wall art' className='relative h-full w-full object-contain' />
							</motion.div>
						) : (
							<motion.img
								key={currentUrl}
								src={currentUrl}
								alt='wall art'
								className='absolute inset-0 h-full w-full object-cover'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.4 }}
							/>
						)}
					</AnimatePresence>
				</div>
			</Card>
		</HomeDraggableLayer>
	)
}
