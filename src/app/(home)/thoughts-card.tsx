import { useState, useEffect, useRef } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { hasAuth } from '@/lib/auth'
import { pushThoughts, useThoughtsIndex, type Thought, type ThoughtJsonArray } from './services/push-thoughts'

export const styles = {
	width: 360,
	height: 120,
	order: 2
}

export default function ThoughtsCard() {
	const center = useCenterStore()
	const { cardStyles } = useConfigStore()
	const { isAuth } = useAuthStore()
	const initAuth = hasAuth()
	const [inputValue, setInputValue] = useState('')
	const [latestThought, setLatestThought] = useState<Thought | null>(null)
	const [thoughts, setThoughts] = useState<Thought[]>([])
	const isMounted = useRef(true)

	// 设置最新碎碎念
	useEffect(() => {
		isMounted.current = true
		const init = async () => {
			try {
				const data = await useThoughtsIndex()
				// 确保组件仍然挂载
				if (isMounted.current && data) {
					setThoughts(data.thoughts)
					if (data.thoughts.length > 0) {
						setLatestThought(data.thoughts[0])
					}
				}
			} catch (error) {
				console.error('Failed to load thoughts', error)
				toast.error('加载碎碎念失败')
			}
		}
		
		init()
		
		// 清理函数
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
				time: `${hours}:${minutes}:${seconds}`
			}
			
			const updatedThoughts = [newThought, ...thoughts]
			
			// 保存数据
			try {
				await pushThoughts(updatedThoughts)
				// 更新本地状态
				setInputValue('')
				setThoughts(updatedThoughts)
				setLatestThought(newThought)
				toast.success('碎碎念保存成功！')
			} catch (error) {
				console.error('Failed to save thoughts', error)
				toast.error('保存失败，请重试')
			}
		}
	}

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp)
		return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
	}

	// 计算与 hi-card 左对齐的 x 坐标
	const alignedX = center.x - (cardStyles.hiCard?.width || 0) / 2

	return (
		<Card
			order={styles.order}
			width={styles.width}
			height={styles.height}
			x={alignedX}
			y={center.y + (cardStyles.hiCard?.height || 0) / 2 + CARD_SPACING}
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
			
			{/* 显示最近的一条碎碎念 */}
			{latestThought && (
				<div className='mt-3 pt-3 border-t border-white/20'>
					<div className='text-xs text-secondary'>
						最新碎碎念 · {formatTime(latestThought.timestamp)}
					</div>
					<div className='text-sm mt-1 truncate'>
						{latestThought.text}
					</div>
				</div>
			)}
		</Card>
	)
}