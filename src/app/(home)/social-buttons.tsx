import { useCenterStore } from '@/hooks/use-center'
import GithubSVG from '@/svgs/github.svg'
import { ANIMATION_DELAY, CARD_SPACING } from '@/consts'
import { useConfigStore } from './stores/config-store'
import JuejinSVG from '@/svgs/juejin.svg'
import EmailSVG from '@/svgs/email.svg'
import XSVG from '@/svgs/x.svg'
import TgSVG from '@/svgs/tg.svg'
import WechatSVG from '@/svgs/wechat.svg'
import FacebookSVG from '@/svgs/facebook.svg'
import TiktokSVG from '@/svgs/tiktok.svg'
import InstagramSVG from '@/svgs/instagram.svg'
import WeiboSVG from '@/svgs/weibo.svg'
import XiaohongshuSVG from '@/svgs/小红书.svg'
import ZhihuSVG from '@/svgs/知乎.svg'
import BilibiliSVG from '@/svgs/哔哩哔哩.svg'
import QqSVG from '@/svgs/qq.svg'
import { motion } from 'motion/react'
import { useEffect, useState, useMemo } from 'react'
import type React from 'react'
import { toast } from 'sonner'
import { useSize } from '@/hooks/use-size'
import { HomeDraggableLayer } from './home-draggable-layer'

type SocialButtonType =
	| 'github'
	| 'juejin'
	| 'email'
	| 'link'
	| 'x'
	| 'tg'
	| 'wechat'
	| 'facebook'
	| 'tiktok'
	| 'instagram'
	| 'weibo'
	| 'xiaohongshu'
	| 'zhihu'
	| 'bilibili'
	| 'qq'

interface SocialButtonConfig {
	id: string
	type: SocialButtonType
	value: string
	label?: string
	order: number
}

export default function SocialButtons() {
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const { maxSM, init } = useSize()
	const styles = cardStyles.socialButtons
	const hiCardStyles = cardStyles.hiCard
	const order = maxSM && init ? 0 : styles.order
	const delay = maxSM && init ? 0 : 100

	// const sortedButtons = useMemo(() => {
	// 	const buttons = (siteContent.socialButtons || []) as SocialButtonConfig[]
	// 	return [...buttons].sort((a, b) => a.order - b.order)
	// }, [siteContent.socialButtons])

	const [showStates, setShowStates] = useState<Record<string, boolean>>({})

	// useEffect(() => {
	// 	const baseDelay = order * ANIMATION_DELAY * 1000

	// 	sortedButtons.forEach((button, index) => {
	// 		const showDelay = baseDelay + index * delay
	// 		setTimeout(() => {
	// 			setShowStates(prev => ({ ...prev, [button.id]: true }))
	// 		}, showDelay)
	// 	})

	// 	setTimeout(() => {
	// 		setShowStates(prev => ({ ...prev, container: true }))
	// 	}, baseDelay)
	// }, [order, delay, sortedButtons])

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x + hiCardStyles.width / 2 - styles.width
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y + hiCardStyles.height / 2 + CARD_SPACING

//<<<<<<< HEAD
/**	if (fales)
/**		return (		<motion.div
				className='absolute max-sm:static'
				animate={{ left: center.x + hiCardStyles.width / 2, top: center.y + hiCardStyles.height / 2 + CARD_SPACING }}
				initial={{ left: center.x + hiCardStyles.width / 2, top: center.y + hiCardStyles.height / 2 + CARD_SPACING }}>
				<div className='absolute top-0 right-0 flex items-center gap-3 max-sm:static'>
					{tertiaryShow && (
						<motion.a
							href='https://github.com/comrelyy'
							target='_blank'
							initial={{ opacity: 0, scale: 0.6 }}
							animate={{ opacity: 1, scale: 1 }}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='font-averia flex items-center gap-2 rounded-xl border bg-[#070707] px-3 py-2 text-xl text-white'
							style={{ boxShadow: ' inset 0 0 12px rgba(255, 255, 255, 0.4)' }}>
							<GithubSVG />
							Github
						</motion.a>
					)}

//<<<<<<< HEAD
//					{secondaryShow && (
//						<motion.a
//							href='https://juejin.cn/user/2427311675422382'
//							target='_blank'
//							initial={{ opacity: 0, scale: 0.6 }}
//							animate={{ opacity: 1, scale: 1 }}
//							whileHover={{ scale: 1.05 }}
//							whileTap={{ scale: 0.95 }}
//							className='card relative flex items-center gap-2 rounded-xl px-3 py-2.5 font-medium whitespace-nowrap'>
//							<JuejinSVG className='h-6 w-6' />
//							稀土掘金
//						</motion.a> 
//					)}

//					<motion.button
//						onClick={() => {
//							navigator.clipboard.writeText('yysuni1001@gmail.com').then(() => {
//								toast.success('邮箱已复制到剪贴板')
//							})
//						}}
//						initial={{ opacity: 0, scale: 0.6 }}
//						animate={{ opacity: 1, scale: 1 }}
//						whileHover={{ scale: 1.05 }}
//						whileTap={{ scale: 0.95 }}
//						className='card btn relative rounded-xl p-1.5'>
//						<EmailSVG />
//					</motion.button>
//=======
	const iconMap: Record<SocialButtonType, React.ComponentType<{ className?: string }>> = {
		github: GithubSVG,
		juejin: JuejinSVG,
		email: EmailSVG,
		wechat: WechatSVG,
		x: XSVG,
		tg: TgSVG,
		facebook: FacebookSVG,
		tiktok: TiktokSVG,
		instagram: InstagramSVG,
		weibo: WeiboSVG,
		xiaohongshu: XiaohongshuSVG,
		zhihu: ZhihuSVG,
		bilibili: BilibiliSVG,
		qq: QqSVG,
		link: () => null
	}

	const renderButton = (button: SocialButtonConfig) => {
		if (!showStates[button.id]) return null

		const commonProps = {
			initial: { opacity: 0, scale: 0.6 } as const,
			animate: { opacity: 1, scale: 1 } as const,
			whileHover: { scale: 1.05 } as const,
			whileTap: { scale: 0.95 } as const
		}

		const Icon = iconMap[button.type]
		const hasLabel = Boolean(button.label)
		const iconSize = hasLabel ? 'size-6' : 'size-8'

		if (button.type === 'github') {
			return (
				<motion.a
					key={button.id}
					href={button.value}
					target='_blank'
					{...commonProps}
					className={`font-averia flex items-center gap-2 rounded-xl border bg-[#070707] text-xl text-white ${!hasLabel ? 'p-1.5' : 'px-3 py-1.5'}`}
					style={{ boxShadow: ' inset 0 0 12px rgba(255, 255, 255, 0.4)' }}>
					<Icon className={'size-8'} />
					{hasLabel && button.label}
				</motion.a>
			)
		}

		if (button.type === 'email' || button.type === 'wechat' || button.type === 'qq') {
			const messageMap: Record<'email' | 'wechat' | 'qq', string> = {
				email: '邮箱已复制到剪贴板',
				wechat: '微信号已复制到剪贴板',
				qq: 'QQ号已复制到剪贴板'
			}
			return (
				<motion.button
					key={button.id}
					onClick={() => {
						navigator.clipboard.writeText(button.value).then(() => {
							toast.success(messageMap[button.type as 'email' | 'wechat' | 'qq'])
						})
					}}
					{...commonProps}
					className='card btn relative rounded-xl p-1.5'>
					<Icon className='size-8' />
				</motion.button>
			)
		}

		if (button.type === 'link') {
			return (
				<motion.a
					key={button.id}
					href={button.value}
					target='_blank'
					{...commonProps}
					className='card relative flex items-center gap-2 rounded-xl px-3 py-2.5 font-medium whitespace-nowrap'>
					{hasLabel ? button.label : button.value}
				</motion.a>
			)
		}

		return (
			<motion.a
				key={button.id}
				href={button.value}
				target='_blank'
				{...commonProps}
				className={`card relative rounded-xl font-medium whitespace-nowrap ${hasLabel ? 'flex items-center gap-2 px-3 py-2.5' : 'p-1.5'}`}>
				<Icon className={iconSize} />
				{hasLabel && button.label}
			</motion.a>
		)
	}

	return (
		<HomeDraggableLayer cardKey='socialButtons' x={x} y={y} width={styles.width} height={styles.height}>
			<motion.div className='absolute max-sm:static' animate={{ left: x, top: y }} initial={{ left: x, top: y }}>
				<div className='absolute top-0 left-0 flex flex-row-reverse items-center gap-3 max-sm:static' style={{ width: styles.width }}>
					{sortedButtons.map(button => renderButton(button))}
>>>>>>> 4446e7d (Socials)
				</div>
			</motion.div>
		) */
	return null
// =======
// 	if (!showStates.container) return null

// 	const renderButton = (button: SocialButtonConfig) => {
// 		if (!showStates[button.id]) return null

// 		const commonProps = {
// 			initial: { opacity: 0, scale: 0.6 } as const,
// 			animate: { opacity: 1, scale: 1 } as const,
// 			whileHover: { scale: 1.05 } as const,
// 			whileTap: { scale: 0.95 } as const
// 		}

// 		switch (button.type) {
// 			case 'github':
// 				return (
// 					<motion.a
// 						key={button.id}
// 						href={button.value}
// 						target='_blank'
// 						{...commonProps}
// 						className='font-averia flex items-center gap-2 rounded-xl border bg-[#070707] px-3 py-2 text-xl text-white'
// 						style={{ boxShadow: ' inset 0 0 12px rgba(255, 255, 255, 0.4)' }}>
// 						<GithubSVG />
// 						{button.label || 'Github'}
// 					</motion.a>
// 				)

// 			case 'juejin':
// 				return (
// 					<motion.a
// 						key={button.id}
// 						href={button.value}
// 						target='_blank'
// 						{...commonProps}
// 						className='card relative flex items-center gap-2 rounded-xl px-3 py-2.5 font-medium whitespace-nowrap'>
// 						<JuejinSVG className='h-6 w-6' />
// 						{button.label || '稀土掘金'}
// 					</motion.a>
// 				)

// 			case 'email':
// 				return (
// 					<motion.button
// 						key={button.id}
// 						onClick={() => {
// 							navigator.clipboard.writeText(button.value).then(() => {
// 								toast.success('邮箱已复制到剪贴板')
// 							})
// 						}}
// 						{...commonProps}
// 						className='card btn relative rounded-xl p-1.5'>
// 						<EmailSVG />
// 					</motion.button>
// 				)

// 			case 'link':
// 				return (
// 					<motion.a
// 						key={button.id}
// 						href={button.value}
// 						target='_blank'
// 						{...commonProps}
// 						className='card relative flex items-center gap-2 rounded-xl px-3 py-2.5 font-medium whitespace-nowrap'>
// 						{button.label || button.value}
// 					</motion.a>
// 				)

// 			default:
// 				return null
// 		}
// 	}

// 	return (
// 		<HomeDraggableLayer cardKey='socialButtons' x={x} y={y} width={styles.width} height={styles.height}>
// 			<motion.div className='absolute max-sm:static' animate={{ left: x, top: y }} initial={{ left: x, top: y }}>
// 				<div className='absolute top-0 left-0 flex flex-row-reverse items-center gap-3 max-sm:static' style={{ width: styles.width }}>
// 					{sortedButtons.map(button => renderButton(button))}
// 				</div>
// 			</motion.div>
// 		</HomeDraggableLayer>
// 	)
// >>>>>>> main
}
