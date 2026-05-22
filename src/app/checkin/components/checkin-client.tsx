'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { INIT_DELAY } from '@/consts'
import { useAuthStore } from '@/hooks/use-auth'
import { generateAndCacheToken } from '@/lib/auth'
import { readFileAsText } from '@/lib/file-utils'
import { loadCheckinData, migrateLocalDataIfNeeded, saveCheckinData, type CheckinEvent, type CheckinPosition, type CheckinRecord } from '../services/checkin-data-service'
import { appendLearningLog } from '../services/append-learning-log'
import AggregatedHeatmap from './aggregated-heatmap'
import EventCard from './event-card'
import EventFormDialog from './event-form-dialog'
import BackfillDialog from './backfill-dialog'
import JournalDialog from './journal-dialog'

function todayStr() {
	const t = new Date()
	return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

function statusFor(ev: CheckinEvent, today: string): 'upcoming' | 'active' | 'ended' {
	if (ev.start && today < ev.start) return 'upcoming'
	if (ev.end && today > ev.end) return 'ended'
	return 'active'
}

function fireConfetti(color: string, big = false) {
	if (typeof document === 'undefined') return
	const count = big ? 96 : 32
	const w = window.innerWidth
	const h = window.innerHeight
	const palette = big
		? [color, '#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#FFB347', '#FF6B9D', '#A78BFA']
		: [color, '#FFD700', '#FF69B4', '#87CEEB', '#98FB98']
	for (let i = 0; i < count; i++) {
		const p = document.createElement('div')
		p.style.position = 'fixed'
		p.style.pointerEvents = 'none'
		const size = big ? 8 + Math.random() * 6 : 6
		p.style.width = `${size}px`
		p.style.height = `${size}px`
		p.style.borderRadius = '50%'
		p.style.backgroundColor = palette[Math.floor(Math.random() * palette.length)]
		p.style.zIndex = '9999'
		p.style.left = `${Math.random() * w}px`
		p.style.top = `${big ? -20 : Math.random() * h}px`
		document.body.appendChild(p)
		const dx = (Math.random() - 0.5) * (w * (big ? 0.8 : 1.5))
		const dy = big ? h + 40 : (Math.random() - 0.5) * (h * 1.5)
		const rotate = (Math.random() - 0.5) * 1440
		const duration = big ? 4500 + Math.random() * 2500 : 3200 + Math.random() * 1800
		p.animate(
			[
				{ transform: 'translate(0px,0px) rotate(0deg) scale(1)', opacity: 1 },
				{ transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg) scale(${big ? 0.6 : 0.3})`, opacity: 0 }
			],
			{ duration, easing: big ? 'cubic-bezier(0.16, 0.4, 0.6, 1)' : 'cubic-bezier(0.22, 0.61, 0.36, 1)' }
		).onfinish = () => p.remove()
	}
}

export default function CheckinClient() {
	const { isAuth, setPrivateKey } = useAuthStore()
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const [events, setEvents] = useState<CheckinEvent[]>([])
	const [records, setRecords] = useState<CheckinRecord[]>([])
	const [positions, setPositions] = useState<Record<string, CheckinPosition>>({})
	const [loaded, setLoaded] = useState(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const [formOpen, setFormOpen] = useState(false)
	const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
	const [formInitial, setFormInitial] = useState<CheckinEvent | undefined>(undefined)

	const [backfillDate, setBackfillDate] = useState<string | null>(null)
	const [journalEvent, setJournalEvent] = useState<CheckinEvent | null>(null)
	const [journalSubmitting, setJournalSubmitting] = useState(false)
	const [allDoneTriggered, setAllDoneTriggered] = useState(false)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const today = useMemo(todayStr, [])

	useEffect(() => {
		const init = async () => {
			try {
				const migrated = await migrateLocalDataIfNeeded()
				const data = await loadCheckinData()
				if (data) {
					setEvents(data.events)
					setRecords(data.records)
					setPositions(data.positions ?? {})
				}
				if (migrated) toast.info('数据已从本地迁移到 GitHub')
			} catch (err) {
				console.error('初始化打卡数据失败:', err)
				toast.error('初始化打卡数据失败')
			} finally {
				setLoaded(true)
			}
		}
		init()
	}, [])

	useEffect(() => {
		if (!hasUnsavedChanges) return
		const timer = setTimeout(async () => {
			setIsSaving(true)
			try {
				const eventIdSet = new Set(events.map(e => e.id))
				const cleanRecords = records.filter(r => eventIdSet.has(r.eventId))
				await saveCheckinData({ events, records: cleanRecords, positions })
				if (cleanRecords.length !== records.length) setRecords(cleanRecords)
				setHasUnsavedChanges(false)
			} catch (err) {
				console.error('保存到 GitHub 失败:', err)
			} finally {
				setIsSaving(false)
			}
		}, 1000)
		return () => clearTimeout(timer)
	}, [hasUnsavedChanges, events, records, positions])

	const requireAuth = () => {
		if (!isAuth) {
			toast.error('请先导入密钥')
			return false
		}
		return true
	}

	const openEdit = (ev: CheckinEvent) => {
		if (!requireAuth()) return
		setFormMode('edit')
		setFormInitial(ev)
		setFormOpen(true)
	}

	const checkedTodaySet = useMemo(() => {
		const s = new Set<string>()
		for (const r of records) if (r.date === today) s.add(r.eventId)
		return s
	}, [records, today])

	const handleToggleCheck = (ev: CheckinEvent) => {
		if (!requireAuth()) return
		const exists = checkedTodaySet.has(ev.id)
		if (exists) {
			// 取消打卡只删当天记录；不回滚已追加的博客内容
			setRecords(prev => prev.filter(r => !(r.eventId === ev.id && r.date === today)))
			setHasUnsavedChanges(true)
			return
		}
		// 开启了「写学习总结」的事件：先弹输入框，由 handleJournalConfirm 记录打卡
		if (ev.journal) {
			setJournalEvent(ev)
			return
		}
		setRecords(prev => [...prev, { eventId: ev.id, date: today }])
		fireConfetti(ev.color)
		setHasUnsavedChanges(true)
	}

	const handleJournalConfirm = async (summary: string) => {
		const ev = journalEvent
		if (!ev || !requireAuth()) return
		const text = summary.trim()
		// 去重：重试（commit1 成功、博客追加失败）时不会重复插入打卡记录
		const already = records.some(r => r.eventId === ev.id && r.date === today)
		const nextRecords = already ? records : [...records, { eventId: ev.id, date: today }]

		// 无总结：等同普通打卡，走防抖自动保存
		if (!text) {
			setRecords(nextRecords)
			fireConfetti(ev.color)
			setHasUnsavedChanges(true)
			setJournalEvent(null)
			return
		}

		// 有总结：先提交打卡记录（commit 1），再追加到当月博客（commit 2）
		setJournalSubmitting(true)
		try {
			const eventIdSet = new Set(events.map(e => e.id))
			const cleanRecords = nextRecords.filter(r => eventIdSet.has(r.eventId))
			await saveCheckinData({ events, records: cleanRecords, positions })
			setRecords(cleanRecords)
			setHasUnsavedChanges(false)
			await appendLearningLog({ eventName: ev.name, summary: text, date: today })
			fireConfetti(ev.color)
			setJournalEvent(null)
		} catch (err) {
			console.error('打卡总结追加失败:', err)
			toast.error('追加博客失败，请重试')
		} finally {
			setJournalSubmitting(false)
		}
	}

	const handleCreate = async (ev: CheckinEvent) => {
		if (!requireAuth()) return
		const newEvents = [ev, ...events]
		setEvents(newEvents)
		setHasUnsavedChanges(true)
		setFormOpen(false)
		toast.success('事件已创建')
	}

	const handleEdit = async (ev: CheckinEvent) => {
		if (!requireAuth()) return
		setEvents(prev => prev.map(e => (e.id === ev.id ? ev : e)))
		setHasUnsavedChanges(true)
		setFormOpen(false)
		toast.success('已保存')
	}

	const handleDelete = (id: string) => {
		if (!requireAuth()) return
		setEvents(prev => prev.filter(e => e.id !== id))
		setRecords(prev => prev.filter(r => r.eventId !== id))
		setHasUnsavedChanges(true)
		toast.success('事件已删除')
	}

	const handleBackfillCommit = (date: string, checkedIds: string[]) => {
		if (!requireAuth()) {
			setBackfillDate(null)
			return
		}
		setRecords(prev => {
			const others = prev.filter(r => r.date !== date)
			return [...others, ...checkedIds.map(id => ({ eventId: id, date }))]
		})
		setHasUnsavedChanges(true)
		setBackfillDate(null)
		toast.success(`${date} 已更新`)
	}

	const handleImportKey = () => fileInputRef.current?.click()

	const handleKeyFile = async (file: File) => {
		try {
			const pem = await readFileAsText(file)
			setPrivateKey(pem)
			await generateAndCacheToken()
			toast.success('密钥已导入')
		} catch (err) {
			console.error(err)
			toast.error('读取密钥失败')
		}
	}

	const eventRank = (ev: CheckinEvent) => {
		const s = statusFor(ev, today)
		if (s === 'upcoming') return 1
		return checkedTodaySet.has(ev.id) ? 2 : 0
	}

	const activeEvents = useMemo(
		() => [...events].filter(ev => statusFor(ev, today) !== 'ended').sort((a, b) => eventRank(a) - eventRank(b)),
		[events, today, checkedTodaySet]
	)
	const existingCategories = useMemo(() => Array.from(new Set(events.map(e => e.category?.trim()).filter((c): c is string => !!c))), [events])
	const endedEvents = events.filter(ev => statusFor(ev, today) === 'ended')
	const todayActiveEvents = activeEvents.filter(ev => statusFor(ev, today) === 'active')
	const todayDone = todayActiveEvents.filter(ev => checkedTodaySet.has(ev.id)).length
	const todayTotal = todayActiveEvents.length
	const allDone = loaded && todayTotal > 0 && todayDone === todayTotal

	useEffect(() => {
		if (!loaded) return
		if (allDone && !allDoneTriggered) {
			setAllDoneTriggered(true)
			fireConfetti('#35bfab', true)
		} else if (!allDone && allDoneTriggered) {
			setAllDoneTriggered(false)
		}
	}, [allDone, allDoneTriggered, loaded])

	return (
		<div className='mx-auto w-full max-w-6xl'>
			<input
				ref={fileInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handleKeyFile(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: INIT_DELAY }}
				className='mb-6 flex flex-wrap items-end justify-between gap-4'>
				<div>
					<h1 className='mb-1 text-3xl font-bold text-primary max-sm:text-2xl'>我的打卡</h1>
					<p className='text-sm font-medium text-primary/85'>
						{!loaded ? (
							'加载中…'
						) : allDone ? (
							<span className='inline-flex items-center gap-2 rounded-full bg-brand/15 px-3 py-1 text-brand'>🎉 今日全部打卡完成 · {todayTotal}/{todayTotal}</span>
						) : (
							<>
								今日 <span className='font-bold text-primary'>{todayDone}</span>
								<span className='text-primary/60'> / {todayTotal} 已打</span>
								<span className='mx-2 text-primary/40'>·</span>
								进行中 <span className='font-bold text-primary'>{activeEvents.length}</span>
								{endedEvents.length > 0 && (
									<>
										<span className='mx-2 text-primary/40'>·</span>
										已结束 <span className='font-bold text-primary'>{endedEvents.length}</span>
									</>
								)}
							</>
						)}
					</p>
				</div>
				<div className='flex items-center gap-2'>
					{isSaving && <span className='text-[11px] text-secondary'>保存中…</span>}
					{mounted && !isAuth && (
						<button
							onClick={handleImportKey}
							className='rounded-full border border-white/40 bg-white/60 px-3 py-1.5 text-xs font-medium text-primary shadow-sm transition hover:bg-white'>
							导入密钥
						</button>
					)}
					<button
						onClick={() => {
							if (!requireAuth()) return
							setFormMode('create')
							setFormInitial(undefined)
							setFormOpen(true)
						}}
						className='rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90'>
						+ 新增事件
					</button>
				</div>
			</motion.div>

			{loaded && (
				<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + 0.05 }} className='mb-8'>
					<AggregatedHeatmap events={events} records={records} today={today} onClickDate={isAuth ? setBackfillDate : undefined} />
				</motion.div>
			)}

			{loaded && events.length === 0 && (
				<div className='rounded-2xl border border-dashed border-white/50 bg-white/30 p-12 text-center text-sm text-secondary backdrop-blur-md'>
					还没有打卡事件，点击右上角"+ 新增事件"开始
				</div>
			)}

			{activeEvents.length > 0 && (
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					<AnimatePresence initial={false}>
						{activeEvents.map(ev => (
							<EventCard
								key={ev.id}
								event={ev}
								records={records}
								today={today}
								checkedToday={checkedTodaySet.has(ev.id)}
								disabled={statusFor(ev, today) === 'upcoming'}
								onToggleCheck={() => handleToggleCheck(ev)}
								onEdit={() => openEdit(ev)}
								onDelete={() => handleDelete(ev.id)}
							/>
						))}
					</AnimatePresence>
				</div>
			)}

			{endedEvents.length > 0 && (
				<>
					<div className='mt-10 mb-4 flex items-center gap-3 text-xs text-secondary'>
						<div className='h-px flex-1 bg-secondary/20' />
						已结束 · {endedEvents.length}
						<div className='h-px flex-1 bg-secondary/20' />
					</div>
					<div className='grid grid-cols-1 gap-4 opacity-80 sm:grid-cols-2 lg:grid-cols-3'>
						{endedEvents.map(ev => (
							<EventCard
								key={ev.id}
								event={ev}
								records={records}
								today={today}
								checkedToday={false}
								disabled
								onToggleCheck={() => {}}
								onEdit={() => openEdit(ev)}
								onDelete={() => handleDelete(ev.id)}
							/>
						))}
					</div>
				</>
			)}

			<EventFormDialog
				open={formOpen}
				mode={formMode}
				initial={formInitial}
				existingCategories={existingCategories}
				onClose={() => setFormOpen(false)}
				onSubmit={formMode === 'create' ? handleCreate : handleEdit}
			/>

			<BackfillDialog
				open={backfillDate !== null}
				date={backfillDate}
				events={events}
				records={records}
				onClose={() => setBackfillDate(null)}
				onCommit={handleBackfillCommit}
			/>

			<JournalDialog
				open={journalEvent !== null}
				event={journalEvent ?? undefined}
				date={today}
				submitting={journalSubmitting}
				onClose={() => setJournalEvent(null)}
				onConfirm={handleJournalConfirm}
			/>
		</div>
	)
}
