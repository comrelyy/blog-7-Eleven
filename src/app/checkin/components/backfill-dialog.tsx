'use client'

import { useEffect, useMemo, useState } from 'react'
import { DialogModal } from '@/components/dialog-modal'
import type { CheckinEvent, CheckinRecord } from '../services/checkin-data-service'

function parseDate(s: string) {
	const [y, m, d] = s.split('-').map(Number)
	return new Date(y, m - 1, d)
}

function weekdayCn(s: string) {
	const d = parseDate(s)
	return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
}

function isRunningOn(ev: CheckinEvent, date: string) {
	if (ev.start && date < ev.start) return false
	if (ev.end && date > ev.end) return false
	return true
}

export default function BackfillDialog({
	open,
	date,
	events,
	records,
	onClose,
	onCommit
}: {
	open: boolean
	date: string | null
	events: CheckinEvent[]
	records: CheckinRecord[]
	onClose: () => void
	onCommit: (date: string, checkedIds: string[]) => void
}) {
	const initial = useMemo(() => {
		if (!date) return new Set<string>()
		return new Set(records.filter(r => r.date === date).map(r => r.eventId))
	}, [date, records])

	const [selected, setSelected] = useState<Set<string>>(initial)

	useEffect(() => {
		setSelected(new Set(initial))
	}, [initial])

	const eligibleEvents = useMemo(() => (date ? events.filter(ev => isRunningOn(ev, date)) : []), [date, events])

	const toggle = (id: string) => {
		setSelected(prev => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const handleSave = () => {
		if (!date) return
		onCommit(date, Array.from(selected))
	}

	const dirty = useMemo(() => {
		if (selected.size !== initial.size) return true
		for (const id of selected) if (!initial.has(id)) return true
		return false
	}, [selected, initial])

	return (
		<DialogModal open={open} onClose={onClose}>
			<div className='flex max-h-[80vh] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-xl'>
				<div className='shrink-0 border-b border-gray-100 px-6 py-5'>
					<div className='text-xs text-secondary'>补打/编辑</div>
					<div className='mt-0.5 flex items-baseline gap-2'>
						<h3 className='text-lg font-semibold text-primary'>{date}</h3>
						{date && <span className='text-xs text-secondary'>{weekdayCn(date)}</span>}
					</div>
				</div>

				<div className='min-h-0 flex-1 overflow-y-auto px-6 py-4'>
					{eligibleEvents.length === 0 ? (
						<div className='py-6 text-center text-xs text-secondary/60'>当日没有进行中的事件</div>
					) : (
						<div className='space-y-1.5'>
							{eligibleEvents.map(ev => {
								const isChecked = selected.has(ev.id)
								return (
									<button
										key={ev.id}
										onClick={() => toggle(ev.id)}
										className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 transition ${
											isChecked ? 'border-transparent bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
										}`}>
										<div className='flex min-w-0 items-center gap-2'>
											<span className='h-3 w-3 shrink-0 rounded-full' style={{ background: ev.color }} />
											<span className='truncate text-sm text-primary'>{ev.name}</span>
										</div>
										<span
											className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition ${
												isChecked ? 'border-transparent text-white shadow-sm' : 'border-gray-300 bg-white text-transparent'
											}`}
											style={isChecked ? { background: ev.color } : undefined}>
											✓
										</span>
									</button>
								)
							})}
						</div>
					)}
				</div>

				<div className='flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-3'>
					<button onClick={onClose} className='rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-secondary transition hover:bg-gray-50'>
						取消
					</button>
					<button
						onClick={handleSave}
						disabled={!dirty || eligibleEvents.length === 0}
						className='rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'>
						保存
					</button>
				</div>
			</div>
		</DialogModal>
	)
}
