"use client"

import { useCenterStore } from '@/hooks/use-center'
import Card from '@/components/card'
import { useConfigStore } from './stores/config-store'
import { HomeDraggableLayer } from './home-draggable-layer'
import { useAuthStore } from '@/hooks/use-auth'
import { readFileAsText } from '@/lib/file-utils'
import { toast } from 'sonner'
import { useRef } from 'react'

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

export default function HiCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const greeting = getGreeting()
	const styles = cardStyles.hiCard
	const username = siteContent.meta.username || 'Suni'
	const { setPrivateKey } = useAuthStore()
	const fileInputRef = useRef<HTMLInputElement>(null)

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - styles.width / 2
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y - styles.height / 2

	const handlePrivateKeySelection = async (file: File) => {
		try {
			const pem = await readFileAsText(file)
			setPrivateKey(pem)
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
				<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className='relative text-center max-sm:static max-sm:translate-0 cursor-pointer'>
					{siteContent.enableChristmas && (
						<>
							<img
								src='/images/christmas/snow-1.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 180, left: -20, top: -25, opacity: 0.9 }}
							/>
							<img
								src='/images/christmas/snow-2.webp'
								alt='Christmas decoration'
								className='pointer-events-none absolute'
								style={{ width: 160, bottom: -12, right: -8, opacity: 0.9 }}
							/>
						</>
					)}
					<img src='/images/avatar.png' className='mx-auto rounded-full' style={{ width: 120, height: 120, boxShadow: ' 0 16px 32px -5px #E2D9CE' }} />
					<h1 className='font-averia mt-3 text-2xl' onClick={handleImportKey}>
						{greeting} <br /> I'm <span className='text-linear text-[32px]'>{username}</span> , Nice to <br /> meet you!
					</h1>
				</Card>
			</HomeDraggableLayer>
		</>
	)
}
