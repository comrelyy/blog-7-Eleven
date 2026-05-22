'use client'

import { useEffect, useState } from 'react'
import { DialogModal } from '@/components/dialog-modal'
import type { CheckinEvent } from '../services/checkin-data-service'

export default function JournalDialog({
	open,
	event,
	date,
	submitting,
	onClose,
	onConfirm
}: {
	open: boolean
	event?: CheckinEvent
	date: string
	submitting: boolean
	onClose: () => void
	onConfirm: (summary: string) => void
}) {
	const [summary, setSummary] = useState('')

	useEffect(() => {
		if (open) setSummary('')
	}, [open, event])

	if (!event) return null
	const slug = date.slice(0, 7)

	return (
		<DialogModal open={open} onClose={submitting ? () => {} : onClose}>
			<div className='w-[min(30rem,calc(100vw-2rem))] rounded-3xl bg-white p-6 shadow-xl'>
				<div className='mb-1 flex items-center gap-3'>
					<span className='inline-block h-5 w-5 rounded-full' style={{ background: event.color }} />
					<h3 className='text-lg font-semibold text-primary'>{event.name} · 今日打卡</h3>
				</div>
				<p className='mb-4 text-xs text-secondary'>
					简单总结今天学到的与感悟，确认后会追加到《{slug}》月度博客；留空直接确认则只打卡、不追加。
				</p>

				<textarea
					value={summary}
					onChange={e => setSummary(e.target.value)}
					rows={5}
					autoFocus
					placeholder={'例如：\n今天学了 xxx；\n感悟是 yyy。'}
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
						onClick={() => onConfirm(summary)}
						disabled={submitting}
						className='rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'>
						{submitting ? '提交中…' : summary.trim() ? '确认并追加博客' : '仅打卡'}
					</button>
				</div>
			</div>
		</DialogModal>
	)
}
