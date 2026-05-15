'use client'

import { useCenterStore } from '@/hooks/use-center'
import Card from '@/components/card'
import { useConfigStore } from './stores/config-store'
import { HomeDraggableLayer } from './home-draggable-layer'
import { useAuthStore } from '@/hooks/use-auth'
import { readFileAsText } from '@/lib/file-utils'
import { toast } from 'sonner'
import { generateAndCacheToken } from '@/lib/auth'
import { useEffect, useRef, useState } from 'react'
import AggregatedHeatmap from '@/app/checkin/components/aggregated-heatmap'
import { loadCheckinData, type CheckinData } from '@/app/checkin/services/checkin-data-service'

function getGreeting() {
	const hour = new Date().getHours()

	if (hour >= 6 && hour < 12) {
		return 'Good Morning'
	} else if (hour >= 12 && hour < 18) {
		return 'Good Afternoon'
	} else if (hour >= 18 && hour < 22) {
		return 'Good Evening'
	} else {
		return 'Good Night'
	}
}

function fmtToday(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function HiCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const greeting = getGreeting()
	const styles = cardStyles.hiCard
	const username = siteContent.meta.username || 'Suni'
	const { setPrivateKey } = useAuthStore()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [checkinData, setCheckinData] = useState<CheckinData | null>(null)
	const today = fmtToday(new Date())

	useEffect(() => {
		let cancelled = false
		void loadCheckinData().then(data => {
			if (!cancelled) setCheckinData(data)
		})
		return () => {
			cancelled = true
		}
	}, [])

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - styles.width / 2
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y - styles.height / 2

	const handlePrivateKeySelection = async (file: File) => {
		try {
			const pem = await readFileAsText(file)
			setPrivateKey(pem)
			await generateAndCacheToken()
			toast.success('密钥导入成功')
		} catch (error) {
			console.error(error)
			toast.error('读取密钥失败')
		}
	}

	const handleImportKey = () => {
		fileInputRef.current?.click()
	}

	return (
		<>
			<input
				ref={fileInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handlePrivateKeySelection(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>
			<HomeDraggableLayer cardKey='hiCard' x={x} y={y} width={styles.width} height={styles.height}>
				<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className='relative max-sm:static max-sm:translate-0'>
					{siteContent.enableChristmas && (
						<>
							<img
								src='/images/christmas/snow-1.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 140, left: -16, top: -20, opacity: 0.9 }}
							/>
							<img
								src='/images/christmas/snow-2.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 120, bottom: -10, right: -6, opacity: 0.9 }}
							/>
						</>
					)}
					<div className='flex items-center gap-3'>
						<img
							src='/images/avatar.png'
							onClick={handleImportKey}
							className='shrink-0 cursor-pointer rounded-full'
							style={{ width: 56, height: 56, boxShadow: '0 8px 16px -4px #E2D9CE' }}
						/>
						<h1 className='font-averia text-base leading-snug'>
							{greeting}, <br />
							I'm <span className='text-linear text-lg'>{username}</span>, Nice to <br />
							meet you!
						</h1>
					</div>
					<div className='mt-4'>
						<AggregatedHeatmap
							events={checkinData?.events ?? []}
							records={checkinData?.records ?? []}
							today={today}
							weeksBack={20}
							bare
							showLegend={false}
						/>
					</div>
				</Card>
			</HomeDraggableLayer>
		</>
	)
}
