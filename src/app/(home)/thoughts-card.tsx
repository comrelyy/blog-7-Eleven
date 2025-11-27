import { useState, useEffect } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { CARD_SPACING } from '@/consts'
import { styles as hiCardStyles } from './hi-card'
import { pushThoughts, fetchThoughts, type Thought } from './services/push-thoughts'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'

export const styles = {
	width: 360,
	height: 120,
	order: 2
}

export default function ThoughtsCard() {
	const center = useCenterStore()
	const { isAuth } = useAuthStore()
	const [thoughts, setThoughts] = useState<Thought[]>([])
	const [inputValue, setInputValue] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [latestThought, setLatestThought] = useState<Thought | null>(null)

	// 从 GitHub 加载数据（如果已认证）或从 localStorage 加载数据（如果未认证）
	useEffect(() => {
		const loadData = async () => {
			if (isAuth) {
				try {
					const fetchedThoughts = await fetchThoughts()
					setThoughts(fetchedThoughts)
					// 设置最新碎碎念
					if (fetchedThoughts.length > 0) {
						setLatestThought(fetchedThoughts[0])
					}
				} catch (error) {
					console.error('Failed to fetch thoughts from GitHub', error)
					toast.error('加载碎碎念失败，使用本地缓存')
					loadFromLocalStorage()
				}
			} else {
				loadFromLocalStorage()
			}
			setIsLoading(false)
		}

		loadData()
	}, [isAuth])

	const loadFromLocalStorage = () => {
		const savedThoughts = localStorage.getItem('thoughts')
		if (savedThoughts) {
			try {
				const parsedThoughts = JSON.parse(savedThoughts)
				// 转换旧格式到新格式
				const convertedThoughts = parsedThoughts.map((thought: any) => ({
					id: thought.id,
					text: thought.text,
					timestamp: thought.timestamp,
					date: thought.date || new Date(thought.timestamp).toISOString().split('T')[0],
					time: thought.time || new Date(thought.timestamp).toTimeString().split(' ')[0]
				}))
				setThoughts(convertedThoughts)
				// 设置最新碎碎念
				if (convertedThoughts.length > 0) {
					setLatestThought(convertedThoughts[0])
				}
			} catch (e) {
				console.error('Failed to parse thoughts from localStorage', e)
			}
		}
	}

	// 保存数据到 GitHub（如果已认证）或 localStorage（如果未认证）
	const saveThoughts = async (newThoughts: Thought[]) => {
		if (isAuth) {
			try {
				await pushThoughts(newThoughts)
			} catch (error) {
				console.error('Failed to push thoughts to GitHub', error)
				toast.error('保存到 GitHub 失败，使用本地缓存')
				localStorage.setItem('thoughts', JSON.stringify(newThoughts))
			}
		} else {
			localStorage.setItem('thoughts', JSON.stringify(newThoughts))
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (inputValue.trim()) {
			const now = Date.now()
			const { date, time } = formatDateToParts(now)
			
			const newThought: Thought = {
				id: now.toString(),
				text: inputValue.trim(),
				timestamp: now,
				date,
				time
			}
			
			const updatedThoughts = [newThought, ...thoughts]
			setThoughts(updatedThoughts)
			setInputValue('')
			// 立即更新最新碎碎念
			setLatestThought(newThought)
			
			// 保存数据
			await saveThoughts(updatedThoughts)
		}
	}

	const formatDateToParts = (timestamp: number): { date: string; time: string } => {
		const date = new Date(timestamp)
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		const seconds = String(date.getSeconds()).padStart(2, '0')
		
		return {
			date: `${year}-${month}-${day}`,
			time: `${hours}:${minutes}:${seconds}`
		}
	}

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp)
		return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
	}

	// 计算与 hi-card 左对齐的 x 坐标
	const alignedX = center.x - hiCardStyles.width / 2

	// 显示加载状态
	if (isLoading) {
		return (
			<Card
				order={styles.order}
				width={styles.width}
				height={styles.height}
				x={alignedX}
				y={center.y + hiCardStyles.height / 2 + CARD_SPACING}
				className='p-4 flex items-center justify-center'>
				<div className="text-sm text-secondary">加载中...</div>
			</Card>
		)
	}

	return (
		<Card
			order={styles.order}
			width={styles.width}
			height={styles.height}
			x={alignedX}
			y={center.y + hiCardStyles.height / 2 + CARD_SPACING}
			className='p-4'>
			<form onSubmit={handleSubmit} className='flex flex-col h-full'>
				<textarea
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					placeholder='写下你的碎碎念...'
					className='flex-1 w-full resize-none border-none outline-none bg-transparent text-sm placeholder:text-secondary'
				/>
				<div className='flex justify-between items-center mt-2'>
                    <span className='text-xs text-secondary'>
						{/* 按回车保存 */}
					</span>
					<button 
						type='submit' 
						className='text-xs bg-brand text-white px-2 py-1 rounded hover:bg-brand/80 transition-colors'
					>
						保存
					</button>
				</div>
			</form>
			
			{/* 显示最近的一条碎碎念，从GitHub或localStorage读取的数据 */}
			{(latestThought || thoughts.length > 0) && (
				<div className='mt-3 pt-3 border-t border-white/20'>
					<div className='text-xs text-secondary'>
						最新碎碎念 · {formatDate(latestThought?.timestamp || thoughts[0].timestamp)}
					</div>
					<div className='text-sm mt-1 truncate'>
						{latestThought?.text || thoughts[0].text}
					</div>
				</div>
			)}
		</Card>
	)
}