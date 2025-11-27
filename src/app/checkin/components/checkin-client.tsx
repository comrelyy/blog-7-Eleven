"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { INIT_DELAY, ANIMATION_DELAY } from "@/consts"
import LiquidGrass from "@/components/liquid-grass"
import { DialogModal } from "@/components/dialog-modal"
import { useAuthStore } from '@/hooks/use-auth'
import { readFileAsText } from '@/lib/file-utils'
import { toast } from 'sonner'

type CheckinEvent = { id: string; name: string; color: string; start?: string; end?: string }
type CheckinRecord = { date: string; eventId: string }

function EventManager({ events, onCreate, onDelete, inline }: { events: CheckinEvent[]; onCreate: (e: CheckinEvent) => void; onDelete: (id: string) => void; inline?: boolean }) {
  const { isAuth, setPrivateKey } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [color, setColor] = useState("#EF4444")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")

  const handlePrivateKeySelection = async (file: File) => {
    try {
      const pem = await readFileAsText(file)
      setPrivateKey(pem)
      toast.success('密钥导入成功')
    } catch (error) {
      console.error(error)
      toast.error('读取密钥失败')
    }
  }

  const handleImportKey = () => {
    fileInputRef.current?.click()
  }

  const create = () => {
    if (!name) return
    onCreate({ id: String(Date.now()), name, color, start: start || undefined, end: end || undefined })
    setName("")
    setColor("#EF4444")
    setStart("")
    setEnd("")
    setOpen(false)
  }

  // If inline is provided, always show the manager content (used for fixed right-side card)
  const containerClass = inline
    ? 'w-80 p-4 bg-white/40 rounded-2xl border border-white/50 shadow-lg backdrop-blur-md'
    : ''

  return (
    <div>
      <input
        ref={fileInputRef}
        type='file'
        accept='.pem'
        className='hidden'
        onChange={async e => {
          const f = e.target.files?.[0]
          if (f) await handlePrivateKeySelection(f)
          if (e.currentTarget) e.currentTarget.value = ''
        }}
      />
      {!inline && (
        <button onClick={() => setOpen((v) => !v)} className="rounded-xl border border-white/30 bg-white/40 px-4 py-2 text-sm font-medium text-primary hover:bg-white/60 transition-colors shadow-sm">📋 管理事件</button>
      )}
      {(open || inline) && (
        <div className={`${containerClass} mt-2 relative`}> 
          <h4 className="text-sm font-semibold text-primary mb-4">新增事件</h4>
          {!isAuth && (
            <button 
              onClick={handleImportKey}
              className="absolute top-2 right-2 rounded-lg border border-white/30 bg-white/40 px-2 py-1 text-xs font-medium text-primary hover:bg-white/60 transition-colors shadow-sm"
            >
              导入密钥
            </button>
          )}
          <div className="mb-3 flex flex-col gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="事件名称" className="rounded-xl border border-white/30 bg-white/50 px-3 py-2 text-sm text-primary placeholder-secondary/60 focus:ring-2 focus:ring-brand/30 transition" />
          </div>
          <div className="mb-3 flex items-center gap-3">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded-lg border border-white/30 cursor-pointer" />
            <div className="text-xs font-mono text-secondary">{color}</div>
          </div>
          <div className="mb-3 flex gap-2 flex-col text-xs text-secondary">
            <label>开始日期</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-xl border border-white/30 bg-white/50 px-3 py-2 text-sm text-primary appearance-none cursor-pointer" />
          </div>
          <div className="mb-4 flex gap-2 flex-col text-xs text-secondary">
            <label>结束日期</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-xl border border-white/30 bg-white/50 px-3 py-2 text-sm text-primary appearance-none cursor-pointer" />
          </div>
          <div className="flex gap-2 mb-3">
            <button onClick={create} className="flex-1 brand-btn text-xs justify-center">新增</button>
            {!inline && <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-white/30 bg-white/30 px-3 py-2 text-xs font-medium text-primary hover:bg-white/50 transition">关闭</button>}
          </div>
          {events.length > 0 && (
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-2 bg-white/30 rounded-lg border border-white/20 hover:bg-white/40 transition">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="h-4 w-4 rounded-full shadow-sm" style={{ background: ev.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-primary truncate">{ev.name}</div>
                      <div className="text-[10px] text-secondary">{ev.start || ev.end ? `${ev.start || '—'} ~ ${ev.end || '—'}` : '长期'}</div>
                    </div>
                  </div>
                  <button onClick={() => onDelete(ev.id)} className="text-xs text-red-500 hover:text-red-600 font-medium ml-2">删除</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CheckinClient() {
  const [events, setEvents] = useState<CheckinEvent[]>([])
  const [records, setRecords] = useState<CheckinRecord[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CheckinEvent | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})

  useEffect(() => {
    const stored = localStorage.getItem("checkin-events")
    if (stored) {
      try { setEvents(JSON.parse(stored)) } catch (e) { console.error(e) }
    }
    const storedRecords = localStorage.getItem("checkin-records")
    if (storedRecords) {
      try { setRecords(JSON.parse(storedRecords)) } catch (e) { console.error(e) }
    }
    const storedPos = localStorage.getItem('checkin-positions')
    if (storedPos) {
      try { setPositions(JSON.parse(storedPos)) } catch (e) { console.error(e) }
    }
  }, [])

  useEffect(() => { localStorage.setItem("checkin-events", JSON.stringify(events)) }, [events])
  useEffect(() => { localStorage.setItem("checkin-records", JSON.stringify(records)) }, [records])
  useEffect(() => { localStorage.setItem('checkin-positions', JSON.stringify(positions)) }, [positions])

  // apply stored positions to card elements when refs are available
  useEffect(() => {
    if (!positions) return
    Object.entries(positions).forEach(([id, pos]) => {
      const el = cardRefs.current[id]
      if (el) {
        el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      }
    })
  }, [positions, events])

  const todayStr = (() => {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  })()

  const handleCardClick = (ev: CheckinEvent) => {
    // record today's open date
    const exists = records.some(r => r.eventId === ev.id && r.date === todayStr)
    if (!exists) {
      setRecords(prev => [...prev, { eventId: ev.id, date: todayStr }])
      // trigger confetti animation near the card
      const el = cardRefs.current[ev.id]
      triggerConfetti(ev.color, el)
    }
  }

  const triggerConfetti = (color: string, _elSource?: HTMLElement | null) => {
    // Full-screen colored confetti particles with longer duration
    if (typeof document === 'undefined') return
    const count = 32
    const w = window.innerWidth
    const h = window.innerHeight
    const colors = [color, '#FFD700', '#FF69B4', '#87CEEB', '#98FB98']

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div')
      p.style.position = 'fixed'
      p.style.pointerEvents = 'none'
      p.style.width = '6px'
      p.style.height = '6px'
      p.style.borderRadius = '50%'
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      p.style.zIndex = '9999'
      
      // random start position across full screen
      const startX = Math.random() * w
      const startY = Math.random() * h
      p.style.left = `${startX}px`
      p.style.top = `${startY}px`
      p.style.opacity = '1'
      document.body.appendChild(p)

      // trajectory: drift in a random direction with rotation
      const dx = (Math.random() - 0.5) * (w * 1.5)
      const dy = (Math.random() - 0.5) * (h * 1.5)
      const rotate = (Math.random() - 0.5) * 1080
      const duration = 3200 + Math.random() * 1800 // 3.2s - 5s

      p.animate(
        [
          { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg) scale(0.3)`, opacity: 0 }
        ],
        { duration, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }
      ).onfinish = () => p.remove()
    }
  }

  const toggleTodayCheck = (ev: CheckinEvent) => {
    const exists = records.some(r => r.eventId === ev.id && r.date === todayStr)
    if (exists) {
      setRecords(prev => prev.filter(r => !(r.eventId === ev.id && r.date === todayStr)))
    } else {
      setRecords(prev => [...prev, { eventId: ev.id, date: todayStr }])
      const el = cardRefs.current[ev.id]
      triggerConfetti(ev.color, el)
    }
  }

  const handleCardDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    setRecords(prev => prev.filter(r => r.eventId !== id))
  }

  const openDetailModal = (ev: CheckinEvent) => {
    setSelectedEvent(ev)
    setModalOpen(true)
  }

  const closeDetailModal = () => {
    setModalOpen(false)
    setSelectedEvent(null)
  }

  const checkedCountFor = (ev: CheckinEvent) => records.filter(r => r.eventId === ev.id).length
  const requiredDaysFor = (ev: CheckinEvent) => {
    if (ev.start && ev.end) {
      const s = new Date(ev.start)
      const e = new Date(ev.end)
      const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1
      return diff
    }
    return null
  }

  // improved collision: track velocity and separate cards with spring-like nudge
  const onDragEnd = (id: string, info: any) => {
    const src = cardRefs.current[id]
    if (!src || !containerRef.current) return
    const srcRect = src.getBoundingClientRect()
    Object.entries(cardRefs.current).forEach(([otherId, el]) => {
      if (!el || otherId === id) return
      const r = el.getBoundingClientRect()
      if (rectsOverlap(srcRect, r)) {
        // separation vector from src to other
        const dx = r.x + r.width/2 - (srcRect.x + srcRect.width/2)
        const dy = r.y + r.height/2 - (srcRect.y + srcRect.height/2)
        const mag = Math.sqrt(dx*dx + dy*dy) || 1
        // larger separation proportional to overlap
        const separation = 48
        const nx = (dx/mag) * separation
        const ny = (dy/mag) * separation
        // apply spring-like nudge using Animate API with elastic easing
        el.animate([
          { transform: 'translate(0px,0px)', offset: 0 },
          { transform: `translate(${nx*0.6}px, ${ny*0.6}px)`, offset: 0.5 },
          { transform: 'translate(0px,0px)', offset: 1 }
        ], { duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' })
      }
    })

    // after drag end, persist current transforms for all cards
    const newPos: Record<string, { x: number; y: number }> = {}
    Object.entries(cardRefs.current).forEach(([key, el]) => {
      if (!el) return
      const t = window.getComputedStyle(el).transform
      let x = 0, y = 0
      if (t && t !== 'none') {
        const m = t.match(/matrix\((.+)\)/)
        if (m) {
          const parts = m[1].split(',').map(v => Number(v.trim()))
          x = parts[4] || 0
          y = parts[5] || 0
        } else {
          const m3 = t.match(/matrix3d\((.+)\)/)
          if (m3) {
            const parts = m3[1].split(',').map(v => Number(v.trim()))
            x = parts[12] || 0
            y = parts[13] || 0
          }
        }
      }
      newPos[key] = { x, y }
    })
    setPositions(newPos)
  }

  function rectsOverlap(a: DOMRect, b: DOMRect) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
  }

  return (
    <div>
      <div className="relative mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY }} className="text-center">
          <motion.h1 className="mb-4 text-4xl font-bold">我的打卡</motion.h1>
          <motion.p className="text-secondary text-lg">坚持每一天，成就更好的自己</motion.p>
        </motion.div>

        <div className="fixed right-6 top-1/4 z-50">
          <LiquidGrass inline width={300} height={220} className="rounded-lg">
            <div className="p-2">
              <EventManager inline events={events} onCreate={(ev) => setEvents((prev) => [ev, ...prev])} onDelete={(id) => setEvents((prev) => prev.filter((e) => e.id !== id))} />
            </div>
          </LiquidGrass>
        </div>
      </div>

      <div ref={containerRef} className="relative min-h-[360px]">
        {events.length === 0 ? (
          <div className="text-center text-gray-500">暂无事件。使用右上角的“管理事件”新增。</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {events.map((ev) => {
              const checkedToday = records.some(r => r.eventId === ev.id && r.date === todayStr)
              const checkedCount = checkedCountFor(ev)
              const required = requiredDaysFor(ev)
              return (
                <motion.div
                  key={ev.id}
                  ref={(el) => { cardRefs.current[ev.id] = el }}
                  drag
                  dragConstraints={containerRef}
                  dragElastic={0.6}
                  onDragEnd={(e, info) => onDragEnd(ev.id, info)}
                  className="cursor-grab group">
                  <LiquidGrass inline width={260} height={140} className="rounded-lg overflow-hidden">
                    <div className={`h-full w-full flex flex-col justify-center items-start gap-2 p-4 transition-all relative ${
                      checkedToday
                        ? `bg-[${ev.color}30] shadow-lg`
                        : 'hover:shadow-md'
                    }`}>
                      {/* Toggle check button (top-right) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleTodayCheck(ev) }}
                        aria-pressed={checkedToday}
                        title={checkedToday ? '已打卡，点击取消' : '未打卡，点击打卡'}
                        className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm shadow ${checkedToday ? 'bg-green-500' : 'bg-red-500'}`}>
                        ✓
                      </button>

                      <div className="flex items-center gap-3 w-full justify-between">
                        <div className="flex items-center gap-3">
                          <span className="inline-block h-6 w-6 rounded-full" style={{ background: ev.color }} />
                          <div className="text-lg font-semibold">{ev.name}</div>
                        </div>
                      </div>

                      {/* Stats on its own line */}
                      <div className="w-full mt-2 text-sm text-gray-600">
                        <div>已打卡 {checkedCount}天</div>
                        {required !== null && <div>需 {required} 天</div>}
                      </div>

                      <div className="text-xs text-gray-400 mt-2">{ev.start || ev.end ? `${ev.start || '—'} → ${ev.end || '—'}` : '长期'}</div>

                      {/* Hover actions (only detail) */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetailModal(ev) }}
                          className="rounded px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                          📅
                        </button>
                      </div>
                    </div>
                  </LiquidGrass>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DialogModal open={modalOpen} onClose={closeDetailModal}>
        {selectedEvent && (
          <div className="w-full max-w-md bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block h-6 w-6 rounded-full" style={{ background: selectedEvent.color }} />
              <h3 className="text-lg font-semibold">{selectedEvent.name}</h3>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {selectedEvent.start || selectedEvent.end ? `${selectedEvent.start || '—'} → ${selectedEvent.end || '—'}` : '长期'}
            </div>
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">打卡历史</div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {records
                  .filter(r => r.eventId === selectedEvent.id)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((r) => (
                    <div key={r.date} className="text-sm text-gray-600">
                      ✓ {r.date}
                    </div>
                  ))}
                {records.filter(r => r.eventId === selectedEvent.id).length === 0 && (
                  <div className="text-sm text-gray-400">暂无打卡记录</div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={closeDetailModal} className="rounded px-4 py-2 border text-sm hover:bg-gray-50 transition-colors">
                关闭
              </button>
            </div>
          </div>
        )}
      </DialogModal>
    </div>
  )
}