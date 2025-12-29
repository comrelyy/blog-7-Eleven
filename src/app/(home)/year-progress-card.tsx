'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import dayjs from 'dayjs'
import { HomeDraggableLayer } from './home-draggable-layer'

export default function YearProgressCard() {
	const center = useCenterStore()
	const { cardStyles } = useConfigStore()
	const styles = cardStyles.yearProgressCard
	const hiCardStyles = cardStyles.hiCard
	const clockCardStyles = cardStyles.clockCard

	// 计算时钟卡片右侧的位置
	const x = styles.offsetX !== null 
		? center.x + styles.offsetX 
		: center.x + CARD_SPACING + hiCardStyles.width/2 + clockCardStyles.width + CARD_SPACING
	
	const y = styles.offsetY !== null 
		? center.y + styles.offsetY  
		: center.y - clockCardStyles.offset - styles.height + CARD_SPACING/2

	const [yearProgress, setYearProgress] = useState(0)

	useEffect(() => {
		const calculateYearProgress = () => {
			const now = dayjs()
			const startOfYear = now.startOf('year')
			const endOfYear = now.endOf('year')
			const totalDuration = endOfYear.diff(startOfYear)
			const elapsedDuration = now.diff(startOfYear)
			const progress = (elapsedDuration / totalDuration) * 100
			setYearProgress(progress)
		}

		calculateYearProgress()
	}, [])

	const remainingProgress = 100 - yearProgress

	return (
		<HomeDraggableLayer cardKey='yearProgressCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className="flex items-center justify-center p-2">
				<div className="w-full h-full flex flex-col items-center">
					<div className="text-xs text-secondary mb-1">今年剩余</div>
					<div className="relative w-4 h-full bg-gray-200 rounded-full overflow-hidden flex flex-col">
						{/* 剩余进度 - 绿色部分，显示在底部 */}
						<div 
							className="absolute bottom-0 w-full bg-green-500"
							style={{ height: `${remainingProgress}%` }}
						/>
						{/* 已过去的进度 - 白色部分，显示在顶部 */}
						<div 
							className="absolute top-0 w-full bg-white"
							style={{ height: `${yearProgress}%` }}
						/>
					</div>
					<div className="text-xs text-secondary mt-1">{Math.round(remainingProgress)}%</div>
				</div>
			</Card>
		</HomeDraggableLayer>
	)
}