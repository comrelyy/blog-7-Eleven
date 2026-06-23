'use client'

import { useEffect, useState } from 'react'
import { DialogModal } from '@/components/dialog-modal'
import type { CheckinEvent } from '../services/checkin-data-service'

const DEFAULT_COLOR = '#35bfab'
const PRESET_CATEGORIES = ['学习类', '日常习惯', '健康运动', '工作事业']

export default function EventFormDialog({
	open,
	mode,
	initial,
	existingCategories = [],
	onClose,
	onSubmit
}: {
	open: boolean
	mode: 'create' | 'edit'
	initial?: CheckinEvent
	existingCategories?: string[]
	onClose: () => void
	onSubmit: (ev: CheckinEvent) => void | Promise<void>
}) {
	const [name, setName] = useState('')
	const [color, setColor] = useState(DEFAULT_COLOR)
	const [category, setCategory] = useState('')
	const [journal, setJournal] = useState(false)
	const [vocab, setVocab] = useState(false)
	const [start, setStart] = useState('')
	const [end, setEnd] = useState('')
	const [description, setDescription] = useState('')
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		if (!open) return
		setName(initial?.name ?? '')
		setColor(initial?.color ?? DEFAULT_COLOR)
		setCategory(initial?.category ?? '')
		setJournal(initial?.journal ?? false)
		setVocab(initial?.vocab ?? false)
		setStart(initial?.start ?? '')
		setEnd(initial?.end ?? '')
		setDescription(initial?.description ?? '')
		setSubmitting(false)
	}, [open, initial])

	// 建议标签：预设分类 ∪ 已用过的分类，去重
	const categorySuggestions = Array.from(new Set([...PRESET_CATEGORIES, ...existingCategories])).filter(Boolean)

	const handleSubmit = async () => {
		if (!name.trim() || submitting) return
		setSubmitting(true)
		try {
			const next: CheckinEvent = {
				id: initial?.id ?? String(Date.now()),
				name: name.trim(),
				color,
				category: category.trim() || undefined,
				journal: journal || undefined,
				vocab: vocab || undefined,
				start: start || undefined,
				end: end || undefined,
				description: description.trim() || undefined
			}
			await onSubmit(next)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<DialogModal open={open} onClose={onClose}>
			<div className='w-[min(28rem,calc(100vw-2rem))] rounded-3xl bg-white p-6 shadow-xl'>
				<div className='mb-5 flex items-center gap-3'>
					<span className='inline-block h-5 w-5 rounded-full' style={{ background: color }} />
					<h3 className='text-lg font-semibold text-primary'>{mode === 'create' ? '新增事件' : '编辑事件'}</h3>
				</div>

				<div className='space-y-4'>
					<div>
						<label className='mb-1 block text-xs font-medium text-secondary'>事件名称</label>
						<input
							value={name}
							onChange={e => setName(e.target.value)}
							placeholder='例如：每日锻炼'
							className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-primary placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/30'
						/>
					</div>
					<div>
						<label className='mb-1 block text-xs font-medium text-secondary'>说明（可选）</label>
						<textarea
							value={description}
							onChange={e => setDescription(e.target.value)}
							rows={2}
							placeholder='这件事的细则，比如"俯卧撑 10 个"'
							className='w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-primary placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/30'
						/>
					</div>
					<div>
						<label className='mb-1 block text-xs font-medium text-secondary'>分类（可选）</label>
						<input
							value={category}
							onChange={e => setCategory(e.target.value)}
							placeholder='例如：学习类'
							className='w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-primary placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/30'
						/>
						<div className='mt-2 flex flex-wrap gap-1.5'>
							{categorySuggestions.map(c => {
								const active = category.trim() === c
								return (
									<button
										key={c}
										type='button'
										onClick={() => setCategory(active ? '' : c)}
										className={`rounded-full border px-2.5 py-1 text-xs transition ${
											active ? 'border-brand bg-brand text-white' : 'border-gray-200 text-secondary hover:border-brand hover:text-brand'
										}`}>
										{c}
									</button>
								)
							})}
						</div>
					</div>
					<div>
						<label className='mb-1 block text-xs font-medium text-secondary'>颜色</label>
						<div className='flex items-center gap-3'>
							<input type='color' value={color} onChange={e => setColor(e.target.value)} className='h-10 w-14 cursor-pointer rounded-lg border border-gray-200' />
							<span className='font-mono text-xs text-secondary'>{color}</span>
						</div>
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='mb-1 block text-xs font-medium text-secondary'>开始</label>
							<input
								type='date'
								value={start}
								onChange={e => setStart(e.target.value)}
								className='w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-primary'
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-medium text-secondary'>结束</label>
							<input
								type='date'
								value={end}
								onChange={e => setEnd(e.target.value)}
								className='w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-primary'
							/>
						</div>
					</div>
					<label className='flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5'>
						<input type='checkbox' checked={journal} onChange={e => setJournal(e.target.checked)} className='mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand' />
						<span className='text-xs text-secondary'>
							<span className='font-medium text-primary'>打卡时写学习总结</span>
							<br />
							打卡时弹出输入框，内容会追加到当月博客（标题如 2026-05）
						</span>
					</label>
					<label className='flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5'>
						<input type='checkbox' checked={vocab} onChange={e => setVocab(e.target.checked)} className='mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand' />
						<span className='text-xs text-secondary'>
							<span className='font-medium text-primary'>每日单词任务</span>
							<br />
							每天生成 20 个单词（词/音标/中文），打卡时追加到当月博客
						</span>
					</label>
				</div>

				<div className='mt-6 flex justify-end gap-2'>
					<button onClick={onClose} className='rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-gray-50'>
						取消
					</button>
					<button
						onClick={handleSubmit}
						disabled={!name.trim() || submitting}
						className='rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'>
						{submitting ? '保存中…' : mode === 'create' ? '新增' : '保存'}
					</button>
				</div>
			</div>
		</DialogModal>
	)
}
