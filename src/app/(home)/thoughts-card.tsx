import { useState, useEffect, useRef } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { hasAuth } from '@/lib/auth'
import { pushThoughts, useThoughtsIndex, type Thought, type ThoughtJsonArray } from './services/push-thoughts'

// export const styles = {
// 	width: 360,
// 	height: 120,
// 	order: 2
// }

export default function ThoughtsCard() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const styles = cardStyles.thoughtsCard
	const { isAuth } = useAuthStore()
	const initAuth = hasAuth()
	const [inputValue, setInputValue] = useState('')
	const [allThoughts, setAllThoughts] = useState<Thought[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [isAnimating, setIsAnimating] = useState(false)
	const isMounted = useRef(true)

	// 设置所有碎碎念
	useEffect(() => {
		isMounted.current = true
		const init = async () => {
			try {
				const data = await useThoughtsIndex()
				// 确保组件仍然挂载
				if (isMounted.current && data) {
					// 获取最新的10条碎碎念
					const latestThoughts = data.thoughts.slice(0, 10)
					setAllThoughts(latestThoughts)
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
			
			const updatedThoughts = [newThought, ...allThoughts]
			
			// 保存数据
			try {
				await pushThoughts(updatedThoughts)
				// 更新本地状态
				setInputValue('')
				setAllThoughts(updatedThoughts.slice(0, 10)) // 保持最多10条
				setCurrentIndex(0) // 重置到第一条
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

	// 点击下一条碎碎念
	const handleNextThought = () => {
		if (allThoughts.length === 0) return
		
		if (isAnimating) return // 防止重复点击
		
		setIsAnimating(true)
		
		// 撕日历效果
		setTimeout(() => {
			setCurrentIndex((prevIndex) => (prevIndex + 1) % allThoughts.length)
			setIsAnimating(false)
		}, 300) // 动画持续时间
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
			
			{/* 显示碎碎念卡片堆叠效果 */}
			{allThoughts.length > 0 && (
				<div className='mt-3 pt-3 border-t border-white/20'>
					<div className='flex items-center justify-between'>
						<div className='text-xs text-secondary mb-1'>
							最新碎碎念
						</div>
						<div className='text-xs text-secondary'>
							{currentIndex + 1}/{allThoughts.length}
						</div>
					</div>
					<div 
						className='relative h-16 cursor-pointer bg-white/10 p-2 rounded border border-white/20'
						onClick={handleNextThought}
					>
						{allThoughts.slice(currentIndex, Math.min(currentIndex + 3, allThoughts.length)).map((thought, index) => {
							const zIndex = allThoughts.length - (currentIndex + index)
							const offset = index * 6 // 增加每张卡片的偏移量
							const opacity = index === 0 ? 1 : 0.4 // 当前卡片完全不透明，其他卡片更低透明度
							
							return (
								<div
									key={`${thought.id}-${currentIndex + index}`}
									className={`absolute w-full text-sm rounded transition-all duration-300 ${
										index === 0 ? 'bg-white/10' : 'bg-white/5'
									}`}
									style={{
										top: `${offset}px`,
										left: 0,
										zIndex,
										opacity,
										transform: isAnimating && index === 0 ? 'translateY(-20px) rotate(-5deg)' : 'none',
										transition: 'transform 0.3s ease, opacity 0.3s ease'
									}}
								>
									<div className='flex items-start'>
										<span className='mr-2 text-secondary flex-shrink-0'>•</span>
										<div className='flex-1 min-w-0'>
											<span className='text-secondary text-xs mr-2 whitespace-nowrap'>
												{formatDateTime(thought.timestamp)}
											</span>
											<span className='break-words'>{thought.text}</span>
										</div>
									</div>
								</div>
							)
						})}
					</div>
					<div className='text-xs text-secondary mt-1 text-center'>
						点击切换下一条
					</div>
				</div>
			)}
			
			{allThoughts.length === 0 && (
				<div className='mt-3 pt-3 border-t border-white/20'>
					<div className='text-xs text-secondary mb-1'>
						最新碎碎念
					</div>
					<div className='text-sm text-secondary italic bg-white/10 p-2 rounded border border-white/20'>
						暂无碎碎念
					</div>
				</div>
			)}
		</Card>
	)
}