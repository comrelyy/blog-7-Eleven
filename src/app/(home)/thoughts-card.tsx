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
	const [latestThoughts, setLatestThoughts] = useState<Thought[]>([]) // 修改为数组
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
					// 获取最新的三条碎碎念
					if (data.thoughts.length > 0) {
						setLatestThoughts(data.thoughts.slice(0, 3))
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
				// 更新最新三条碎碎念
				setLatestThoughts(updatedThoughts.slice(0, 3))
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
			
			{/* 显示最新的三条碎碎念 */}
			{latestThoughts.length > 0 && (
				<div className='mt-3 pt-3 border-t border-white/20'>
					<div className='text-xs text-secondary mb-1'>
						最新碎碎念
					</div>
					<div className='space-y-1'>
						{latestThoughts.map((thought, index) => (
							<div key={thought.id} className='text-sm truncate flex items-start'>
								<span className='mr-2 text-secondary'>•</span>
								<div className='flex-1'>
									<span className='text-secondary text-xs mr-2'>
										{formatDateTime(thought.timestamp)}
									</span>
									<span>{thought.text}</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</Card>
	)
}