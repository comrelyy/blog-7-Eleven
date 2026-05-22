'use client'

import { useEffect, useState } from 'react'
import { DialogModal } from '@/components/dialog-modal'
import { EMOTIONS } from './services/emotions'

export default function EmotionJournalDialog({
	open,
	date,
	submitting,
	onClose,
	onConfirm
}: {
	open: boolean
	date: string
	submitting: boolean
	onClose: () => void
	onConfirm: (emotion: string, text: string) => void
}) {
	const [emotion, setEmotion] = useState('')
	const [text, setText] = useState('')

	useEffect(() => {
		if (open) {
			setEmotion('')
			setText('')
		}
	}, [open])

	const slug = date.slice(0, 7)

	return (
		<DialogModal open={open} onClose={submitting ? () => {} : onClose}>
			<div className='w-[min(30rem,calc(100vw-2rem))] rounded-3xl bg-white p-6 shadow-xl'>
				<h3 className='mb-1 text-lg font-semibold text-primary'>心境 · 记录</h3>
				<p className='mb-4 text-xs text-secondary'>
					这次是翻涌还是沉静下来了？写下缘由（跟谁、什么事），会追加到《{slug}》月度博客；留空则只计次。
				</p>

				<div className='mb-4 flex flex-wrap gap-2'>
					{EMOTIONS.map(e => {
						const active = emotion === e.key
						return (
							<button
								key={e.key}
								onClick={() => setEmotion(e.key)}
								disabled={submitting}
								className='inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-50'
								style={
									active
										? { borderColor: e.color, background: `${e.color}22`, color: e.color }
										: { borderColor: '#e5e7eb', color: '#6b7280' }
								}>
								<span className='h-2.5 w-2.5 rounded-full' style={{ background: e.color }} />
								{e.label}
							</button>
						)
					})}
				</div>

				<textarea
					value={text}
					onChange={e => setText(e.target.value)}
					rows={4}
					placeholder={'可选：跟谁、因为什么事？当时的反应、后来怎么平复的……'}
					className='w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-primary placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/30'
				/>

				<div className='mt-6 flex justify-end gap-2'>
					<button
						onClick={onClose}
						disabled={submitting}
						className='rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'>
						取消
					</button>
					<button
						onClick={() => onConfirm(emotion, text)}
						disabled={submitting || !emotion}
						className='rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'>
						{submitting ? '提交中…' : text.trim() ? '确认并追加博客' : '仅记录'}
					</button>
				</div>
			</div>
		</DialogModal>
	)
}
