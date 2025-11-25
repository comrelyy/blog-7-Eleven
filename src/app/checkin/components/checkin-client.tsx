'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { INIT_DELAY, ANIMATION_DELAY } from '@/consts'
import { DialogModal } from '@/components/dialog-modal'

interface CheckinRecord {
date: string
eventId: string
checked: boolean
}

// Event manager component (inline)
function EventManager({ events, onCreate, onDelete }: { events: CheckinEvent[]; onCreate: (e: CheckinEvent) => void; onDelete: (id: string) => void }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [color, setColor] = useState('#EF4444')
    const [start, setStart] = useState('')
    const [end, setEnd] = useState('')

    const create = () => {
        if (!name) return
        const id = String(Date.now())
        onCreate({ id, name, color, start: start || undefined, end: end || undefined })
        setName('')
        setColor('#EF4444')
        setStart('')
        setEnd('')
        setOpen(false)
    }

    return (
        <div>
            <button onClick={() => setOpen(v => !v)} className='rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors'>📋 管理事件</button>
            {open && (
                <div className='mt-2 rounded-lg border border-gray-200 p-4 bg-white shadow-md'>
                    <h4 className='text-sm font-semibold text-gray-700 mb-3'>新增事件</h4>
                    <div className='mb-3 flex flex-col gap-2'>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder='事件名称' className='rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand' />
                    </div>
                    <div className='mb-3 flex gap-3 items-center'>
                        <div className='flex gap-2 items-center'>
                            <input type='color' value={color} onChange={e => setColor(e.target.value)} className='rounded border border-gray-300 w-12 h-10 cursor-pointer' />
                            <div className='text-xs text-gray-600 font-mono'>{color}</div>
                        </div>
                    </div>
                    <div className='mb-3 flex gap-3'>
                        <div className='flex-1'>
                            <label className='block text-xs text-gray-600 mb-1'>开始日期（可选）</label>
                            <input type='date' value={start} onChange={e => setStart(e.target.value)} className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand' />
                        </div>
                        <div className='flex-1'>
                            <label className='block text-xs text-gray-600 mb-1'>结束日期（可选）</label>
                            <input type='date' value={end} onChange={e => setEnd(e.target.value)} className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand' />
                        </div>
                    </div>
                    <div className='flex gap-2'>
                        <button onClick={create} className='rounded-lg bg-brand text-white px-4 py-2 text-sm font-medium hover:bg-brand/90 transition-colors'>➕ 新增事件</button>
                        <button onClick={() => setOpen(false)} className='rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 transition-colors'>关闭</button>
                    </div>
                    {events.length > 0 && (
                        <div className='mt-4 pt-4 border-t border-gray-200 space-y-2'>
                            <h4 className='text-sm font-semibold text-gray-700'>现有事件</h4>
                            {events.map(ev => (
                                <div key={ev.id} className='flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50'>
                                    <div className='flex items-center gap-2'>
                                        <span className='inline-block h-5 w-5 rounded-full border border-gray-300' style={{ background: ev.color }} title={ev.color} />
                                        <div className='flex flex-col'>
                                            <div className='text-sm font-medium text-gray-900'>{ev.name}</div>
                                            <div className='text-xs text-gray-500'>{ev.start || ev.end ? `${ev.start || '—'} ~ ${ev.end || '—'}` : '长期坚持'}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => onDelete(ev.id)} className='text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50'>删除</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Date event picker modal
function DateEventPicker({ date, events, records, onToggle, onClose }: { date: string; events: CheckinEvent[]; records: CheckinRecord[]; onToggle: (date: string, eventId: string) => void; onClose: () => void }) {
return (
<div className='w-full max-w-sm rounded-lg bg-white p-4'>
<h3 className='text-lg font-medium mb-2'>选择打卡事件 — {date}</h3>
<div className='space-y-2'>
{events.length === 0 && <div className='text-sm text-gray-500'>当前无事件，请先新增。</div>}
{events.map(ev => {
const checked = records.some(r => r.date === date && r.eventId === ev.id && r.checked)
return (
<div key={ev.id} className='flex items-center justify-between gap-2 rounded p-2 border'>
<div className='flex items-center gap-2'>
<span className='inline-block h-4 w-4 rounded' style={{ background: ev.color }} />
<div>
<div className='text-sm font-medium'>{ev.name}</div>
<div className='text-xs text-gray-400'>{ev.start || ev.end ? `${ev.start || '开始'} → ${ev.end || '结束'}` : '长期'}</div>
</div>
</div>
<div className='flex items-center gap-2'>
<button onClick={() => onToggle(date, ev.id)} className={`rounded px-3 py-1 text-sm ${checked ? 'bg-green-500 text-white' : 'border'}`}>{checked ? '取消打卡' : '打卡'}</button>
</div>
</div>
)
})}
</div>
<div className='mt-4 flex justify-end gap-2'>
<button onClick={onClose} className='rounded px-3 py-1 border text-sm'>关闭</button>
</div>
</div>
)
}

type CheckinEvent = {
id: string
name: string
color: string
start?: string // YYYY-MM-DD
end?: string // YYYY-MM-DD
}

export default function CheckinClient() {
const [records, setRecords] = useState<CheckinRecord[]>([])
const [events, setEvents] = useState<CheckinEvent[]>([])
const [activeEventId, setActiveEventId] = useState<string | null>(null)
const [pickerDate, setPickerDate] = useState<string | null>(null)
const [pickerOpen, setPickerOpen] = useState(false)
const [currentMonth, setCurrentMonth] = useState(new Date())

useEffect(() => {
// load records and events; migrate legacy records (no eventId) to default event
const stored = localStorage.getItem('checkin-records')
const storedEvents = localStorage.getItem('checkin-events')

if (storedEvents) {
try {
setEvents(JSON.parse(storedEvents))
} catch (e) {
console.error('Failed to parse checkin events:', e)
}
}

if (stored) {
try {
const parsed = JSON.parse(stored)
// detect legacy shape: {date, checked}
if (Array.isArray(parsed) && parsed.length > 0 && parsed[0] && typeof parsed[0].checked === 'boolean' && !parsed[0].eventId) {
// migrate legacy records into per-date migrated events (no default)
const byDate: Record<string, CheckinRecord[]> = {}
parsed.forEach((r: any) => {
const date = r.date
if (!byDate[date]) byDate[date] = []
byDate[date].push({ date, eventId: `migrated-${date}`, checked: !!r.checked })
})
const migratedEvents: CheckinEvent[] = Object.keys(byDate).map(d => ({ id: `migrated-${d}`, name: `迁移 ${d}`, color: '#f97316', start: d }))
// flatten records
const migratedRecords: CheckinRecord[] = Object.values(byDate).flat()
setEvents(prev => {
const next = [...migratedEvents, ...prev]
localStorage.setItem('checkin-events', JSON.stringify(next))
return next
})
setRecords(migratedRecords)
} else {
setRecords(parsed)
}
} catch (e) {
console.error('Failed to parse checkin records:', e)
}
}
}, [])

useEffect(() => {
localStorage.setItem('checkin-records', JSON.stringify(records))
}, [records])

useEffect(() => {
localStorage.setItem('checkin-events', JSON.stringify(events))
}, [events])

// toggle checkin for a specific event on a date
const toggleCheckinForEvent = (date: string, eventId: string) => {
setRecords(prev => {
const existing = prev.find(r => r.date === date && r.eventId === eventId)
if (existing) {
return prev.map(r => (r.date === date && r.eventId === eventId ? { ...r, checked: !r.checked } : r))
} else {
return [...prev, { date, eventId, checked: true }]
}
})
}

const openPickerForDate = (date: string) => {
// only allow opening picker for today's date (no retroactive or future check-ins)
const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
if (date !== todayStr) {
// just open the picker read-only to show events/status, but disable check action
setPickerDate(date)
setPickerOpen(true)
return
}

setPickerDate(date)
setPickerOpen(true)
}

const closePicker = () => {
setPickerOpen(false)
setPickerDate(null)
}

const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
const checkedCount = records.filter(r => r.checked).length

// per-event counts for stats
const countsByEvent: { id: string; name: string; color: string; count: number }[] = events.map(ev => {
const c = records.filter(r => r.eventId === ev.id && r.checked).length
return { id: ev.id, name: ev.name, color: ev.color, count: c }
})

// helper: events that apply to a given date
const eventsForDate = (dateStr: string) => {
return events.filter(e => {
if (e.start && e.end) {
return dateStr >= e.start && dateStr <= e.end
}
if (e.start && !e.end) {
return dateStr >= e.start
}
// no range = long-term; assume always applicable
return true
})
}

const isCheckedForEvent = (dateStr: string, eventId: string) => {
return records.some(r => r.date === dateStr && r.eventId === eventId && r.checked)
}

// stats for active event
const activeEvent = events.find(e => e.id === activeEventId)
let activeTotalDays: number | null = null
let activeCheckedDays = 0
let activeRemaining: number | null = null
if (activeEvent) {
if (activeEvent.start && activeEvent.end) {
const start = new Date(activeEvent.start)
const end = new Date(activeEvent.end)
const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1
activeTotalDays = diff
// count checked within range
activeCheckedDays = records.filter(r => r.eventId === activeEvent.id && r.checked && r.date >= activeEvent.start! && r.date <= activeEvent.end!).length
activeRemaining = Math.max(0, activeTotalDays - activeCheckedDays)
} else {
// long-term
activeCheckedDays = records.filter(r => r.eventId === activeEvent.id && r.checked).length
}
}

const goToPreviousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
const goToToday = () => setCurrentMonth(new Date())

const isToday = (day: number): boolean => {
const today = new Date()
return (
day === today.getDate() &&
currentMonth.getMonth() === today.getMonth() &&
currentMonth.getFullYear() === today.getFullYear()
)
}

const isChecked = (day: number): boolean => {
const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
return records.some(r => r.date === dateStr && r.checked)
}

return (
<>
<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY }} className='mb-6 text-center'>
<motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY }} className='mb-4 text-4xl font-bold'>我的打卡</motion.h1>
<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY }} className='text-secondary text-lg'>坚持每一天，成就更好的自己</motion.p>
</motion.div>

{/* Event selector / manager */}
<div className='mt-4 mb-4 flex items-center justify-center gap-3'>
<select
value={activeEventId || ''}
onChange={e => setActiveEventId(e.target.value || null)}
className='rounded-lg border px-3 py-1'>
<option value=''>-- 选择事件（可选） --</option>
{events.map(ev => (
<option key={ev.id} value={ev.id}>{ev.name}</option>
))}
</select>
<EventManager events={events} onCreate={ev => setEvents(prev => [ev, ...prev])} onDelete={id => setEvents(prev => prev.filter(e => e.id !== id))} />
</div>

<div className='grid grid-cols-3 gap-4'>
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY }} className='rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center'>
<div className='text-3xl font-bold text-blue-600'>{checkedCount}</div>
<div className='text-sm text-gray-600'>总打卡次数</div>
</motion.div>

<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 2 }} className='rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 text-center'>
<div className='text-3xl font-bold text-green-600'>{daysInMonth}</div>
<div className='text-sm text-gray-600'>本月天数</div>
</motion.div>

<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 3 }} className='rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center'>
<div className='text-3xl font-bold text-purple-600'>{Math.round((checkedCount / daysInMonth) * 100)}%</div>
<div className='text-sm text-gray-600'>完成率</div>
</motion.div>
</div>

{/* Per-event stats */}
{countsByEvent.length > 0 && (
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 4 }} className='mt-6'>
<h3 className='text-lg font-semibold text-gray-900 mb-4'>事件统计</h3>
<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
{countsByEvent.map((stat, idx) => (
<motion.div
key={stat.id}
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ delay: INIT_DELAY + ANIMATION_DELAY * (5 + idx * 0.1) }}
className='rounded-lg border p-4 text-center hover:shadow-md transition-shadow'
style={{ borderColor: stat.color + '40', backgroundColor: stat.color + '08' }}
>
<div className='text-2xl font-bold mb-1' style={{ color: stat.color }}>{stat.count}</div>
<div className='text-xs text-gray-600 truncate'>{stat.name}</div>
<div className='text-xs text-gray-500 mt-1'>次打卡</div>
</motion.div>
))}
</div>
</motion.div>
)}

<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 4 }} className='flex items-center justify-between mt-8'>
<button onClick={goToPreviousMonth} className='rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors'>← 上月</button>
<div className='flex items-center gap-4'>
<h2 className='text-lg font-semibold text-gray-900'>{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</h2>
<button onClick={goToToday} className='rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors'>今天</button>
</div>
<button onClick={goToNextMonth} className='rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors'>下月 →</button>
</motion.div>

<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 5 }} className='rounded-lg border border-gray-200 p-4 mt-4'>
<div className='mb-4 grid grid-cols-7 gap-2'>
{['日', '一', '二', '三', '四', '五', '六'].map(day => (
<div key={day} className='text-center text-sm font-semibold text-gray-500'>{day}</div>
))}
</div>

<div className='grid grid-cols-7 gap-2'>
{Array.from({ length: firstDayOfMonth }).map((_, i) => (
<div key={`empty-${i}`} />
))}
{days.map(day => {
const today = isToday(day)
const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
const eventList = eventsForDate(dateStr)
return (
<div key={day} className='relative'>
<button
onClick={() => openPickerForDate(dateStr)}
onMouseEnter={() => { /* hover handled by tooltip below via state */ }}
className={`aspect-square rounded-lg transition-all font-medium text-sm flex items-center justify-center px-1 py-1 shadow-sm ${
records.some(r => r.date === dateStr && r.checked)
? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-md hover:shadow-lg'
: today
? 'border-2 border-blue-400 bg-blue-50 text-gray-900 hover:bg-blue-100'
: 'border border-gray-200 text-gray-600 hover:bg-gray-50'
}`}>
<div className='flex flex-col items-center'>
<span className='text-sm'>{day}</span>
</div>
</button>

{/* event flags (up to 2) */}
<div className='absolute top-1 right-1 flex gap-1'>
{eventList.slice(0, 2).map(ev => (
<span key={ev.id} title={ev.name} className='flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white' style={{ background: ev.color }}>
🚩
</span>
))}
</div>
</div>
)
})}
</div>
</motion.div>

<p className='text-center text-sm text-gray-500 mt-4'>点击任意日期进行打卡 / 取消打卡</p>

{/* picker modal */}
<DialogModal open={pickerOpen} onClose={closePicker}>
{pickerDate && <DateEventPicker date={pickerDate} events={events} records={records} onToggle={(d, id) => { toggleCheckinForEvent(d, id) }} onClose={closePicker} />}
</DialogModal>
</>
)
}
