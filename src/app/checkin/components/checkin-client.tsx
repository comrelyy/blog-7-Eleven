"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { INIT_DELAY, ANIMATION_DELAY } from "@/consts"
import LiquidGrass from "@/components/liquid-grass"
import { DialogModal } from "@/components/dialog-modal"
import { useAuthStore } from '@/hooks/use-auth'
import { readFileAsText } from '@/lib/file-utils'
import { toast } from 'sonner'
import { loadCheckinData, saveCheckinData, migrateLocalDataIfNeeded, type CheckinEvent, type CheckinRecord, type CheckinPosition } from '../services/checkin-data-service'
import { generateAndCacheToken } from '@/lib/auth'

// type CheckinEvent = { id: string; name: string; color: string; start?: string; end?: string }
// type CheckinRecord = { date: string; eventId: string }

function EventManager({ events, onCreate, onDelete, onCheckin, onEdit, inline }: { 
  events: CheckinEvent[]; 
  onCreate: (e: CheckinEvent) => void; 
  onDelete: (id: string) => void; 
  onCheckin?: (ev: CheckinEvent) => void; 
  onEdit?: (e: CheckinEvent) => void;
  inline?: boolean 
}) {
  const { isAuth, setPrivateKey } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [formExpanded, setFormExpanded] = useState(true) // 新增：用于控制表单区域展开/收起
  const [name, setName] = useState("")
  const [color, setColor] = useState("#EF4444")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [description, setDescription] = useState("")
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({}) // 新增：用于跟踪事件展开状态
  const [editingEvent, setEditingEvent] = useState<CheckinEvent | null>(null) // 新增：用于跟踪正在编辑的事件
  const [editModalOpen, setEditModalOpen] = useState(false) // 新增：用于控制编辑模态框的显示

  // 新增：切换事件展开/收起状态
  const toggleEventExpand = (id: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // 新增：切换表单区域展开/收起状态
  const toggleFormExpand = () => {
    setFormExpanded(!formExpanded)
  }

  // 新增：打开编辑模态框
 const openEditModal = (event: CheckinEvent) => {
    setEditingEvent(event)
    setName(event.name)
    setColor(event.color)
    setStart(event.start || "")
    setEnd(event.end || "")
    setDescription(event.description || "")
    setEditModalOpen(true)
  }

  // 新增：关闭编辑模态框
  const closeEditModal = () => {
    setEditingEvent(null)
    setName("")
    setColor("#EF4444")
    setStart("")
    setEnd("")
    setDescription("")
    setEditModalOpen(false)
  }

  // 新增：保存编辑
    // 新增：保存编辑
  const saveEdit = () => {
    if (!editingEvent || !name) return
    
    // 检查是否已导入密钥
    if (!isAuth) {
      toast.error('请先导入密钥再编辑事件')
      return
    }
    
    const updatedEvent: CheckinEvent = {
      ...editingEvent,
      name,
      color,
      start: start || undefined,
      end: end || undefined,
      description: description || undefined
    }
    
    onEdit?.(updatedEvent)
    closeEditModal()
  }

  const handlePrivateKeySelection = async (file: File) => {
    try {
      const pem = await readFileAsText(file)
      setPrivateKey(pem)
      await generateAndCacheToken()
      toast.success('密钥导入成功')
    } catch (error) {
      console.error(error)
      toast.error('读取密钥失败')
    }
  }

  const handleImportKey = () => {
    fileInputRef.current?.click()
  }

    const create = async () => {
    if (!name) return
    
    // 检查是否已导入密钥
    if (!isAuth) {
      toast.error('请先导入密钥再创建事件')
      return
    }
    
    const newEvent: CheckinEvent = { id: String(Date.now()), name, color, start: start || undefined, end: end || undefined, description: description || undefined }
    onCreate(newEvent)
    
    // 直接保存到GitHub
    try {
      // 这里需要获取当前的events和records状态来保存完整数据
      // 但由于我们只能访问这个组件的props，我们需要在父组件中处理保存
      toast.info('事件创建成功，正在保存到GitHub...')
    } catch (error) {
      console.error('保存事件到GitHub失败:', error)
      toast.error('事件保存到GitHub失败')
    }
    
    setName("")
    setColor("#EF4444")
    setStart("")
    setEnd("")
    setDescription("")
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
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-semibold text-primary">新增事件</h4>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleFormExpand}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title={formExpanded ? '收起' : '展开'}
              >
                {formExpanded ? (
                  // 向上的箭头图标表示收起
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // 向下的箭头图标表示展开
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              {!isAuth && (
                <button 
                  onClick={handleImportKey}
                  className="rounded-lg border border-white/30 bg-white/40 px-2 py-1 text-xs font-medium text-primary hover:bg-white/60 transition-colors shadow-sm"
                >
                  导入密钥
                </button>
              )}
            </div>
          </div>
          {formExpanded && (
            <>
               <div className="mb-3 flex flex-col gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="事件名称" className="rounded-xl border border-white/30 bg-white/50 px-3 py-2 text-sm text-primary placeholder-secondary/60 focus:ring-2 focus:ring-brand/30 transition" />
              </div>
              <div className="mb-3 flex flex-col gap-2">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="事件说明（可选）" rows={2} className="rounded-xl border border-white/30 bg-white/50 px-3 py-2 text-sm text-primary placeholder-secondary/60 focus:ring-2 focus:ring-brand/30 transition resize-none" />
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
            </>
          )}
          {events.length > 0 && (
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {events.map((ev) => (
                <div key={ev.id} className="flex flex-col bg-white/30 rounded-lg border border-white/20 hover:bg-white/40 transition cursor-pointer" onClick={() => onCheckin?.(ev)}>
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="h-4 w-4 rounded-full shadow-sm" style={{ background: ev.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-primary truncate">{ev.name}</div>
                        <div className="text-[10px] text-secondary">
                          {expandedEvents[ev.id] 
                            ? (ev.start || ev.end ? `${ev.start || '—'} ~ ${ev.end || '—'}` : '长期') 
                            : (ev.start || ev.end ? `${ev.start || '—'} ~ ${ev.end || '—'}` : '长期')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleEventExpand(ev.id) }} 
                        className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                      >
                        {expandedEvents[ev.id] ? '收起' : '展开'}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(ev) }} 
                        className="text-xs text-green-500 hover:text-green-600 font-medium ml-2"
                      >
                        编辑
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(ev.id) }} className="text-xs text-red-500 hover:text-red-600 font-medium ml-2">删除</button>
                    </div>
                  </div>
                  {expandedEvents[ev.id] && (
                    <div className="px-2 pb-2 text-[10px] text-secondary border-t border-white/20">
                      <div className="mt-1">
                        <strong>开始日期:</strong> {ev.start || '未设置'}
                      </div>
                      <div className="mt-1">
                        <strong>结束日期:</strong> {ev.end || '未设置'}
                      </div>
                      <div className="mt-1">
                        <strong>ID:</strong> {ev.id}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 编辑模态框 */}
      <DialogModal open={editModalOpen} onClose={closeEditModal}>
        {editingEvent && (
          <div className="w-full max-w-md bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block h-6 w-6 rounded-full" style={{ background: editingEvent.color }} />
              <h3 className="text-lg font-semibold">编辑事件</h3>
            </div>
                       <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">事件名称</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">事件说明</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" 
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer" 
                />
                <div className="text-xs font-mono text-gray-500">{color}</div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input 
                type="date" 
                value={start} 
                onChange={(e) => setStart(e.target.value)} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm appearance-none cursor-pointer" 
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input 
                type="date" 
                value={end} 
                onChange={(e) => setEnd(e.target.value)} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm appearance-none cursor-pointer" 
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={closeEditModal} 
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={saveEdit} 
                className="rounded-lg bg-blue-500 text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </DialogModal>
    </div>
  )
}

export default function CheckinClient() {
  const [events, setEvents] = useState<CheckinEvent[]>([])
  const [records, setRecords] = useState<CheckinRecord[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CheckinEvent | null>(null)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({}) // 新增：用于跟踪卡片展开状态
  const [isSaving, setIsSaving] = useState(false) // 新增：用于跟踪保存状态
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false) // 新增：跟踪是否有未保存的更改

  const containerRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})

  // 新增：处理事件编辑
  const handleEditEvent = async (updatedEvent: CheckinEvent) => {
    const newEvents = events.map(e => e.id === updatedEvent.id ? updatedEvent : e)
    setEvents(newEvents)
    setHasUnsavedChanges(true) // 标记有未保存的更改
    
    // 立即保存到GitHub
    try {
      await saveCheckinData({ events: newEvents, records, positions })
      toast.success('事件编辑成功并已保存到GitHub')
    } catch (error) {
      console.error('保存事件到GitHub失败:', error)
      toast.error('事件保存到GitHub失败')
    }
  }

  // 新增：切换卡片展开/收起状态
  const toggleCardExpand = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  useEffect(() => {
    const init = async () => {
      try {
        // 尝试从GitHub加载数据
        const migrated = await migrateLocalDataIfNeeded()
        
        if (migrated) {
          // 如果进行了数据迁移，重新加载数据
          const data = await loadCheckinData()
          if (data) {
            setEvents(data.events)
            setRecords(data.records)
            setPositions(data.positions)
          }
        } else {
          // 尝试从GitHub加载数据
          const data = await loadCheckinData()
          if (data) {
            setEvents(data.events)
            setRecords(data.records)
            setPositions(data.positions)
          }
        }
      } catch (error) {
        console.error('初始化打卡数据失败:', error)
        toast.error('初始化打卡数据失败')
      }
    }
    
    init()
  }, [])

  // 修改：只在有未保存更改时才保存数据
  useEffect(() => {
    // 如果没有未保存的更改，则不执行保存操作
    if (!hasUnsavedChanges) return;

    const saveData = async () => {
      setIsSaving(true)
      try {
        // 直接保存到GitHub，不使用localStorage作为后备
        await saveCheckinData({ events, records, positions })
        console.log('打卡数据已保存到GitHub')
        setHasUnsavedChanges(false) // 保存成功后清除未保存标记
      } catch (error) {
        // 如果保存到GitHub失败，显示错误但不回退到localStorage
        console.error('保存到GitHub失败:', error)
        toast.error('打卡数据保存到GitHub失败')
      } finally {
        setIsSaving(false)
      }
    }
    
    // 使用防抖避免频繁保存
    const timer = setTimeout(saveData, 1000)
    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, events, records, positions])

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
      setHasUnsavedChanges(true) // 标记有未保存的更改
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
    setHasUnsavedChanges(true) // 标记有未保存的更改
  }

  const handleCardDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    setRecords(prev => prev.filter(r => r.eventId !== id))
    setHasUnsavedChanges(true) // 标记有未保存的更改
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
    setHasUnsavedChanges(true) // 标记有未保存的更改
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
              <EventManager 
                inline 
                events={events} 
                onCreate={async (ev) => {
                  const newEvents = [ev, ...events]
                  setEvents(newEvents)
                  setHasUnsavedChanges(true) // 标记有未保存的更改
                  // 立即保存到GitHub
                  try {
                    await saveCheckinData({ events: newEvents, records, positions })
                    toast.success('事件创建成功并已保存到GitHub')
                  } catch (error) {
                    console.error('保存事件到GitHub失败:', error)
                    toast.error('事件保存到GitHub失败')
                  }
                }} 
                onDelete={async (id) => {
                  const newEvents = events.filter((e) => e.id !== id)
                  const newRecords = records.filter(r => r.eventId !== id)
                  setEvents(newEvents)
                  setRecords(newRecords)
                  setHasUnsavedChanges(true) // 标记有未保存的更改
                  // 立即保存到GitHub
                  try {
                    await saveCheckinData({ events: newEvents, records: newRecords, positions })
                    toast.success('事件删除成功并已保存到GitHub')
                  } catch (error) {
                    console.error('保存事件到GitHub失败:', error)
                    toast.error('事件保存到GitHub失败')
                  }
                }}
                onEdit={handleEditEvent}
                onCheckin={toggleTodayCheck}
              />
            </div>
          </LiquidGrass>
        </div>
      </div>

      <div ref={containerRef} className="relative min-h-[360px]">
        {events.length === 0 ? (
          <div className="text-center text-gray-500">暂无事件。使用右上角的"管理事件"新增。</div>
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

                      {/* Event description */}
                      {ev.description && (
                        <div className="text-sm text-gray-600 line-clamp-2 mt-1">{ev.description}</div>
                      )}

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
            {/* Detail Modal */}
      <DialogModal open={modalOpen} onClose={closeDetailModal}>
        {selectedEvent && (
          <div className="w-full max-w-md bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block h-6 w-6 rounded-full" style={{ background: selectedEvent.color }} />
              <h3 className="text-lg font-semibold">{selectedEvent.name}</h3>
            </div>
            {selectedEvent.description && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-1">说明</div>
                <div className="text-sm text-gray-600">{selectedEvent.description}</div>
              </div>
            )}
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