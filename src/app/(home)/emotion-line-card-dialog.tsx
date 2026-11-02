'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { toast } from 'sonner'
import { DialogModal } from '@/components/dialog-modal'
import {
	EMOTION_LINE_GROUPS,
	EMOTION_LINES,
	EMOTION_LINE_STORAGE_KEY,
	getLocalPracticeDate,
	parseEmotionLineState,
	recordEmotionLinePractice,
	serializeEmotionLineState,
	type EmotionLineState
} from './services/emotion-lines'

export default function EmotionLineCardDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
	const [state, setState] = useState<EmotionLineState>({ trigger: '', checked: {}, records: {} })
	const [loaded, setLoaded] = useState(false)
	const [dirty, setDirty] = useState(false)
	const [storageUnavailable, setStorageUnavailable] = useState(false)
	const [activeLine, setActiveLine] = useState<string | null>(null)
	const [practiceDate, setPracticeDate] = useState('')
	const [practiceReason, setPracticeReason] = useState('')
	const [formError, setFormError] = useState('')
	const dialogRef = useRef<HTMLElement>(null)
	const titleId = useId()
	const triggerId = useId()
	const completed = EMOTION_LINES.filter(line => state.checked[line.id]).length

	useEffect(() => {
		try {
			setState(parseEmotionLineState(localStorage.getItem(EMOTION_LINE_STORAGE_KEY)))
		} catch {
			setStorageUnavailable(true)
		}
		setLoaded(true)
	}, [])

	useEffect(() => {
		if (!loaded || !dirty) return
		try {
			localStorage.setItem(EMOTION_LINE_STORAGE_KEY, serializeEmotionLineState(state))
			setStorageUnavailable(false)
		} catch {
			setStorageUnavailable(true)
		}
	}, [state, loaded, dirty])

	useEffect(() => {
		if (!open) return
		const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
		const frame = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }))
		const trapFocus = (event: KeyboardEvent) => {
			if (event.key !== 'Tab' || !dialogRef.current) return
			const controls = Array.from(
				dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), summary, a[href]')
			).filter(control => control.getClientRects().length > 0)
			const first = controls[0],
				last = controls[controls.length - 1]
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault()
				last?.focus()
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault()
				first?.focus()
			}
		}
		document.addEventListener('keydown', trapFocus)
		return () => {
			cancelAnimationFrame(frame)
			document.removeEventListener('keydown', trapFocus)
			previous?.focus({ preventScroll: true })
		}
	}, [open])

	async function copyLine(text: string) {
		let copied = false
		try {
			await navigator.clipboard.writeText(text)
			copied = true
		} catch {
			const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
			const field = document.createElement('textarea')
			field.value = text
			field.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
			field.setAttribute('readonly', '')
			document.body.appendChild(field)
			try {
				field.select()
				copied = document.execCommand('copy')
			} catch {
				copied = false
			} finally {
				field.remove()
				active?.focus({ preventScroll: true })
			}
		}
		if (copied) toast.success(`已复制：${text.slice(0, 12)}${text.length > 12 ? '…' : ''}`)
		else toast.error('复制失败，可以选中文字后手动复制')
	}

	function clearPractice() {
		if (!window.confirm('清空所有练习记录、日期、触发缘由和触发器？')) return
		setDirty(true)
		setState({ trigger: '', checked: {}, records: {} })
		setActiveLine(null)
		setPracticeReason('')
		toast.success('已清空练习记录')
	}

	function startPractice(lineId: string) {
		if (activeLine === lineId) return
		if (activeLine && practiceReason.trim()) {
			toast.info('请先保存或取消正在填写的练习记录')
			return
		}
		setActiveLine(lineId)
		setPracticeDate(getLocalPracticeDate())
		setPracticeReason('')
		setFormError('')
	}

	function finishPractice() {
		dialogRef.current?.querySelector<HTMLInputElement>(`[data-line-id="${activeLine}"] input[type="checkbox"]`)?.focus({ preventScroll: true })
		setActiveLine(null)
		setPracticeReason('')
		setFormError('')
	}

	function savePractice(event: React.FormEvent) {
		event.preventDefault()
		if (!activeLine) return
		try {
			const next = recordEmotionLinePractice(state, activeLine, practiceDate, practiceReason)
			setState(next)
			setDirty(true)
			finishPractice()
			toast.success('已记录练习日期和触发缘由')
		} catch (error) {
			setFormError(error instanceof Error ? error.message : '记录失败，请重试')
		}
	}

	return (
		<DialogModal open={open} onClose={onClose} className='max-w-full'>
			<section ref={dialogRef} className='emotion-line-card' role='dialog' aria-modal='true' aria-labelledby={titleId}>
				<header className='emotion-line-header'>
					<div>
						<h2 id={titleId}>情绪台词卡</h2>
						<p>不追求接住，只追求停一秒。练熟一句，就够用很久。</p>
					</div>
					<button type='button' className='emotion-line-close' aria-label='关闭情绪台词卡' onClick={onClose}>
						<X size={20} aria-hidden='true' />
					</button>
				</header>
				<div className='emotion-line-content'>
					{storageUnavailable && (
						<p className='emotion-line-storage-note' role='status'>
							浏览器暂时无法保存，记录仅保留到当前页面关闭。
						</p>
					)}
					<div className='emotion-line-progress' aria-live='polite'>
						<div className='emotion-line-number'>
							{completed}
							<span> / {EMOTION_LINES.length}</span>
						</div>
						<div
							className='emotion-line-bar'
							role='progressbar'
							aria-label='台词练习进度'
							aria-valuemin={0}
							aria-valuemax={EMOTION_LINES.length}
							aria-valuenow={completed}>
							<span style={{ width: `${(completed / EMOTION_LINES.length) * 100}%` }} />
						</div>
					</div>
					<div className='emotion-line-trigger'>
						<label htmlFor={triggerId}>我的触发器</label>
						<input
							id={triggerId}
							type='text'
							placeholder='例如：心跳加快 / 想插话插不进去'
							disabled={!loaded}
							value={state.trigger}
							onChange={event => {
								const trigger = event.target.value
								setDirty(true)
								setState(previous => ({ ...previous, trigger }))
							}}
							aria-describedby={`${triggerId}-hint`}
						/>
						<p id={`${triggerId}-hint`}>只填一个身体信号。当你感觉到它，就自动说下面某一句——不用思考，不用判断。</p>
					</div>
					{EMOTION_LINE_GROUPS.map(group => (
						<section className='emotion-line-group' key={group.title}>
							<div className='emotion-line-section-head'>
								<h3>{group.title}</h3>
								<span>{group.tag}</span>
							</div>
							{group.lines.map(line => {
								const records = state.records[line.id] || []
								const latest = records[records.length - 1]
								return (
									<div className={`emotion-line-item ${state.checked[line.id] ? 'is-done' : ''}`} key={line.id} data-line-id={line.id}>
										<label className='emotion-line-toggle'>
											<input
												type='checkbox'
												checked={state.checked[line.id] === true}
												disabled={!loaded}
												aria-label={`已练习：${line.text}`}
												onChange={event => {
													const checked = event.target.checked
													if (checked) {
														startPractice(line.id)
														return
													}
													setDirty(true)
													setState(previous => ({ ...previous, checked: { ...previous.checked, [line.id]: checked } }))
												}}
											/>
											<span aria-hidden='true'>{state.checked[line.id] && <Check size={14} strokeWidth={2.5} />}</span>
										</label>
										<div className='emotion-line-body'>
											<button
												type='button'
												className='emotion-line-copy'
												onClick={() => void copyLine(line.text)}
												aria-label={`复制台词：${line.text}`}
												title='点击复制台词'>
												<span className='emotion-line-text'>{line.text}</span>
												<span className='emotion-line-when'>
													{line.level && <span className={`emotion-line-level level-${line.level}`}>{['轻', '中', '重'][line.level - 1]}</span>}
													{line.when}
												</span>
												<Copy size={13} className='emotion-line-copy-icon' aria-hidden='true' />
											</button>
											{latest ? (
												<div className='emotion-practice-record'>
													<div className='emotion-practice-record-head'>
														<time dateTime={latest.date}>{latest.date}</time>
														<button type='button' onClick={() => startPractice(line.id)}>
															再记一次
														</button>
													</div>
													<p>{latest.reason}</p>
													{records.length > 1 && (
														<details className='emotion-practice-history'>
															<summary>历史记录（{records.length - 1}）</summary>
															<ol>
																{records
																	.slice(0, -1)
																	.reverse()
																	.map((record, index) => (
																		<li key={`${record.id}-${index}`}>
																			<time dateTime={record.date}>{record.date}</time>
																			<p>{record.reason}</p>
																		</li>
																	))}
															</ol>
														</details>
													)}
												</div>
											) : (
												state.checked[line.id] && (
													<div className='emotion-practice-legacy'>
														<span>旧练习尚未记录日期和缘由</span>
														<button type='button' onClick={() => startPractice(line.id)}>
															补充记录
														</button>
													</div>
												)
											)}
											{activeLine === line.id && (
												<form className='emotion-practice-form' onSubmit={savePractice} noValidate aria-label={`记录练习：${line.text}`}>
													<h4>记录这次练习</h4>
													<label>
														练习日期
														<input
															type='date'
															required
															value={practiceDate}
															max={getLocalPracticeDate()}
															onChange={event => {
																setPracticeDate(event.target.value)
																setFormError('')
															}}
														/>
													</label>
													<label>
														触发缘由
														<textarea
															required
															autoFocus
															rows={3}
															placeholder='跟谁、发生了什么，让你用到这句台词？'
															value={practiceReason}
															onChange={event => {
																setPracticeReason(event.target.value)
																setFormError('')
															}}
														/>
													</label>
													{formError && (
														<p className='emotion-practice-error' role='alert'>
															{formError}
														</p>
													)}
													<div className='emotion-practice-actions'>
														<button type='button' onClick={finishPractice}>
															取消
														</button>
														<button type='submit'>保存并勾选</button>
													</div>
												</form>
											)}
										</div>
									</div>
								)
							})}
						</section>
					))}
					<section className='emotion-line-rules'>
						<h3>使用要点</h3>
						<ol>
							<li>
								<b>一次只练一句。</b>挑最贴合你高频场景的那句，练到不用想。
							</li>
							<li>
								<b>说完要停住。</b>台词之后的三秒沉默，是整个技术的一半——一解释，压力就散了。
							</li>
							<li>
								<b>允许说得难听。</b>磕巴着说也没关系，对方接收到的是“你在乎这段对话”，不是措辞。
							</li>
							<li>
								<b>先低风险场景。</b>同事多话、客服态度差这种输了也无妨的场合，练出肌肉记忆再上家人伴侣。
							</li>
						</ol>
					</section>
					<button type='button' className='emotion-line-reset' disabled={!loaded} onClick={clearPractice}>
						清空练习记录
					</button>
					<footer>
						勾选时记录日期和缘由 · 取消勾选保留历史
						<br />
						点文字可复制 · 记录只存在这台设备
					</footer>
				</div>
			</section>
		</DialogModal>
	)
}
