import { useState, useEffect, useRef } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { hasAuth, generateAndCacheToken } from '@/lib/auth'
import { pushThoughts, useThoughtsIndex, type Thought, type ThoughtJsonArray } from './services/push-thoughts'
import { readFileAsText } from '@/lib/file-utils'
import { useRouter } from 'next/navigation'

export default function ThoughtsCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const styles = cardStyles.thoughtsCard
	const { isAuth, setPrivateKey } = useAuthStore()
	const initAuth = hasAuth()
	const [inputValue, setInputValue] = useState('')
	const [latestThought, setLatestThought] = useState<Thought | null>(null)
	const [allThoughts, setAllThoughts] = useState<Thought[]>([])
	const isMounted = useRef(true)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const router = useRouter()

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

	useEffect(() => {
		isMounted.current = true
		const init = async () => {
			try {
				const data = await useThoughtsIndex()
				if (isMounted.current && data && data.thoughts.length > 0) {
					setLatestThought(data.thoughts[0])
					setAllThoughts(data.thoughts)
				}
			} catch (error) {
				console.error('Failed to load thoughts', error)
				toast.error('加载碎碎念失败')
			}
		}

		init()

		return () => {
			isMounted.current = false
		}
	}, [])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!initAuth) {
			toast.error('请先完成身份验证')
			return
		}
		if (inputValue.trim()) {
			const now = Date.now()
			const date = new Date(now)
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			const seconds = String(date.getSeconds()).padStart(2, '0')

			const newThought: Thought = {
				id: now.toString(),
				text: inputValue.trim(),
				timestamp: now,
				date: `${year}-${month}-${day}`,
				time: `${hours}:${minutes}:${seconds}`,
			}

			const updatedThoughts = [newThought, ...allThoughts]

			try {
				await pushThoughts(updatedThoughts)
				setInputValue('')
				setLatestThought(newThought)
				setAllThoughts(updatedThoughts)
				toast.success('碎碎念保存成功！')
			} catch (error) {
				console.error('Failed to save thoughts', error)
				toast.error('保存失败，请重试')
			}
		}
	}

	const formatDateTime = (timestamp: number) => {
		const date = new Date(timestamp)
		const month = (date.getMonth() + 1).toString().padStart(2, '0')
		const day = date.getDate().toString().padStart(2, '0')
		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')
		return `${month}-${day} ${hours}:${minutes}`
	}

	const alignedX = center.x - (cardStyles.hiCard?.width || 0) / 2

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
			<Card
				order={styles.order}
				width={styles.width}
				height={styles.height}
				x={alignedX}
				y={center.y + (cardStyles.hiCard?.height || 0) / 2 + CARD_SPACING}
				className='space-y-2 max-sm:static'>
				{siteContent.enableChristmas && (
					<>
						<img
							src='/images/christmas/snow-7.webp'
							alt='Christmas decoration'
							className='pointer-events-none absolute'
							style={{ width: 150, right: -12, top: -12, opacity: 0.8 }}
						/>
					</>
				)}
				<form onSubmit={handleSubmit} className='flex h-full flex-col'>
					<textarea
						value={inputValue}
						onChange={e => setInputValue(e.target.value)}
						placeholder='写下你的碎碎念...'
						className='placeholder:text-secondary w-full flex-1 resize-none border-none bg-transparent text-sm outline-none'
					/>
					<div className='mt-2 flex items-center justify-between'>
						<span className='text-secondary text-xs'>{/* 按回车保存 */}</span>
						<button
							type={isAuth ? 'submit' : 'button'}
							onClick={!isAuth ? handleImportKey : undefined}
							className='bg-brand rounded px-2 py-1 text-xs text-white transition-colors hover:bg-brand/80'
						>
							{isAuth ? '保存' : '导入密钥'}
						</button>
					</div>
				</form>

				{/* 最新一条碎碎念 */}
				<div className='mt-3 border-t border-white/20 pt-3'>
					<div className='text-secondary mb-1 text-xs'>最新碎碎念</div>
					{latestThought ? (
						<div
							onClick={() => router.push('/thoughts')}
							className='cursor-pointer rounded border border-white/20 bg-white/10 p-2 transition-colors hover:bg-white/20'
						>
							<div className='flex items-start'>
								<span className='text-secondary mr-2 flex-shrink-0'>•</span>
								<div className='min-w-0 flex-1'>
									<span className='text-secondary mr-2 whitespace-nowrap text-xs'>
										{formatDateTime(latestThought.timestamp)}
									</span>
									<span className='break-words text-sm'>{latestThought.text}</span>
								</div>
							</div>
						</div>
					) : (
						<div className='text-secondary rounded border border-white/20 bg-white/10 p-2 text-sm italic'>暂无碎碎念</div>
					)}
				</div>
			</Card>
		</>
	)
}
