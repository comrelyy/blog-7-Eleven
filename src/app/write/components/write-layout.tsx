'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useSize } from '@/hooks/use-size'
import { ANIMATION_DELAY, INIT_DELAY } from '@/consts'
import { cn } from '@/lib/utils'
import { WriteEditor } from './editor'
import { WriteSidebar } from './sidebar'
import { CoverSection } from './sections/cover-section'
import { MetaSection } from './sections/meta-section'
import { ImagesSection } from './sections/images-section'

type Tab = 'content' | 'meta'

const tabs: { key: Tab; label: string }[] = [
	{ key: 'content', label: '内容' },
	{ key: 'meta', label: '信息' }
]

export function WriteLayout() {
	const { maxSM, init } = useSize()
	const [activeTab, setActiveTab] = useState<Tab>('content')

	if (!init || !maxSM) {
		return (
			<>
				<WriteEditor />
				<WriteSidebar />
			</>
		)
	}

	return (
		<div className='flex w-full flex-col gap-4'>
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className='card btn-rounded fixed top-1/2 right-2 z-20 flex -translate-y-1/2 flex-col items-stretch gap-1 p-1 shadow-lg'>
				{tabs.map(t => (
					<button
						key={t.key}
						onClick={() => setActiveTab(t.key)}
						className={cn(
							'w-9 rounded-lg px-1 py-1.5 text-xs font-medium transition-all',
							activeTab === t.key ? 'bg-brand text-white shadow-sm' : 'text-secondary hover:text-brand'
						)}>
						{t.label}
					</button>
				))}
			</motion.div>

			{activeTab === 'content' && <WriteEditor />}
			{activeTab === 'meta' && (
				<div className='space-y-6'>
					<CoverSection delay={INIT_DELAY} />
					<MetaSection delay={INIT_DELAY + ANIMATION_DELAY} />
					<ImagesSection delay={INIT_DELAY + ANIMATION_DELAY * 2} />
				</div>
			)}
		</div>
	)
}
