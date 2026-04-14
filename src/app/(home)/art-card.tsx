'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import { useRouter } from 'next/navigation'
import { HomeDraggableLayer } from './home-draggable-layer'
import picturesList from '@/app/pictures/list.json'

const INTERVAL = 5000

export default function ArtCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const router = useRouter()
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
		// Fallback to configured art images
		if (urls.length === 0) {
			const artImages = siteContent.artImages ?? []
			const currentId = siteContent.currentArtImageId
			const currentArt = (currentId ? artImages.find((item: any) => item.id === currentId) : undefined) ?? artImages[0]
			if (currentArt?.url) urls.push(currentArt.url)
			else urls.push('/images/art/cat.png')
		}
		return urls
	}, [siteContent.artImages, siteContent.currentArtImageId])

	const [index, setIndex] = useState(0)
	// Lazy orientation map — only filled when image has actually been seen
	const [orientation, setOrientation] = useState<Record<string, 'portrait' | 'landscape'>>({})

	useEffect(() => {
		if (allImages.length <= 1) return
		const timer = setInterval(() => {
			setIndex(prev => (prev + 1) % allImages.length)
		}, INTERVAL)
		return () => clearInterval(timer)
	}, [allImages.length])

	// Lazily detect orientation for current + next image only (no upfront bulk preload)
	useEffect(() => {
		const toCheck = [allImages[index], allImages[(index + 1) % allImages.length]].filter(Boolean)
		let cancelled = false
		for (const url of toCheck) {
			if (orientation[url]) continue
			const img = new Image()
			img.onload = () => {
				if (cancelled) return
				setOrientation(prev => ({ ...prev, [url]: img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape' }))
			}
			img.src = url
		}
		return () => {
			cancelled = true
		}
	}, [index, allImages, orientation])

	const isPortrait = orientation[allImages[index]] === 'portrait'

	const handleClick = useCallback(() => router.push('/pictures'), [router])

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
								key={allImages[index]}
								className='absolute inset-0'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.6 }}
							>
								<img src={allImages[index]} alt='' className='absolute inset-0 h-full w-full scale-110 object-cover blur-lg' />
								<img src={allImages[index]} alt='wall art' className='relative h-full w-full object-contain' />
							</motion.div>
						) : (
							<motion.img
								key={allImages[index]}
								src={allImages[index]}
								alt='wall art'
								className='absolute inset-0 h-full w-full object-cover'
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.6 }}
							/>
						)}
					</AnimatePresence>
				</div>
			</Card>
		</HomeDraggableLayer>
	)
}
