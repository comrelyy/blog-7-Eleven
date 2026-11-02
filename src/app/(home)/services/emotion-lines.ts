export const EMOTION_LINE_STORAGE_KEY = 'emotion-line-card-v1'

type EmotionLine = { id: string; text: string; when: string; level?: 1 | 2 | 3 }
type EmotionLineGroup = { title: string; tag: string; lines: EmotionLine[] }

export const EMOTION_LINE_GROUPS: EmotionLineGroup[] = [
	{
		title: '一 · 对方语气重',
		tag: '先把方式拉回来',
		lines: [
			{ id: 'a1', text: '嗯，我听着，你慢慢说。', when: '只是语气有点硬', level: 1 },
			{ id: 'a2', text: '你先别急，我有点跟不上。', when: '明显压人，你在被动挨说', level: 2 },
			{ id: 'a3', text: '这个语气我有点接不住，我们停一下再说。', when: '对方带着火气冲你来', level: 3 },
			{ id: 'a4', text: '我愿意聊，但不想在火上聊。', when: '保留关系，同时守住边界', level: 3 }
		]
	},
	{
		title: '二 · 对方滔滔不绝',
		tag: '打断是救援',
		lines: [
			{ id: 'b1', text: '我打断一下——前面我理解了，后面我没跟上。', when: '信息过载，你已经接不住了' },
			{ id: 'b2', text: '我复述一下我听到的，你看对不对？', when: '最好用：让对方停下，也让他觉得被听见' },
			{ id: 'b3', text: '信息有点多，给我一分钟消化一下。', when: '需要喘口气，但不想走开' },
			{ id: 'b4', text: '这个我们改天专门聊，今天我先记下来。', when: '对方开始翻旧账、越扯越远' }
		]
	},
	{
		title: '三 · 你自己快炸了',
		tag: '紧急刹车',
		lines: [
			{ id: 'c1', text: '我需要去趟洗手间，五分钟。', when: '物理离开最有效，别当成逃避' },
			{ id: 'c2', text: '我现在情绪也上来了，怕说错话，我们十分钟后再谈。', when: '话已经说重了，两边都在往上冲' },
			{ id: 'c3', text: '先喝口水。', when: '真的很简单：用动作换三秒时间' }
		]
	},
	{
		title: '四 · 事后补一句',
		tag: '关系修复',
		lines: [
			{ id: 'd1', text: '昨天我有点被你带着走了，没接好，抱歉。', when: '当场没做到，隔天补，反而更有分量' },
			{ id: 'd2', text: '昨天那段我后来想了想，你当时是不是挺难受的？', when: '把错过的那次接住，补回来' }
		]
	}
]

export const EMOTION_LINES = EMOTION_LINE_GROUPS.flatMap(group => group.lines)

// Keep the supplied HTML's storage shape so existing same-origin practice data can be reused.
export type EmotionLinePractice = { id: string; date: string; reason: string; createdAt?: string }
export type EmotionLineState = { trigger: string; checked: Record<string, boolean>; records: Record<string, EmotionLinePractice[]> }

function emptyState(): EmotionLineState {
	return { trigger: '', checked: {}, records: {} }
}

export function getLocalPracticeDate(now = new Date()): string {
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function isPracticeDate(value: unknown): value is string {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
	const date = new Date(`${value}T12:00:00Z`)
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function recordEmotionLinePractice(state: EmotionLineState, lineId: string, date: string, reason: string, now = new Date()): EmotionLineState {
	if (!EMOTION_LINES.some(line => line.id === lineId)) throw new Error('未找到这句台词')
	if (!isPracticeDate(date)) throw new Error('请选择有效的练习日期')
	if (date > getLocalPracticeDate(now)) throw new Error('练习日期不能晚于今天')
	const trimmed = reason.trim()
	if (!trimmed) throw new Error('请填写触发缘由')
	const history = state.records[lineId] || []
	const record: EmotionLinePractice = { id: `${now.getTime()}-${lineId}-${history.length}`, date, reason: trimmed, createdAt: now.toISOString() }
	return {
		...state,
		checked: { ...state.checked, [lineId]: true },
		records: { ...state.records, [lineId]: [...history, record] }
	}
}

export function parseEmotionLineState(raw: string | null): EmotionLineState {
	try {
		const value: unknown = raw ? JSON.parse(raw) : null
		if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyState()
		const saved = value as Record<string, unknown>
		const records: EmotionLineState['records'] = {}
		const savedRecords = saved.records && typeof saved.records === 'object' ? (saved.records as Record<string, unknown>) : {}
		for (const line of EMOTION_LINES) {
			const list = savedRecords[line.id]
			if (!Array.isArray(list)) continue
			const valid = list.flatMap((item: unknown, index): EmotionLinePractice[] => {
				if (!item || typeof item !== 'object') return []
				const entry = item as Record<string, unknown>
				if (!isPracticeDate(entry.date) || typeof entry.reason !== 'string' || !entry.reason.trim()) return []
				return [
					{
						id: typeof entry.id === 'string' && entry.id ? entry.id : `saved-${index}`,
						date: entry.date,
						reason: entry.reason.trim(),
						...(typeof entry.createdAt === 'string' && Number.isFinite(Date.parse(entry.createdAt)) ? { createdAt: entry.createdAt } : {})
					}
				]
			})
			if (valid.length) records[line.id] = valid
		}
		return {
			trigger: typeof saved.trigger === 'string' ? saved.trigger : '',
			checked: Object.fromEntries(EMOTION_LINES.filter(line => saved[`c_${line.id}`] === true).map(line => [line.id, true])),
			records
		}
	} catch {
		return emptyState()
	}
}

export function serializeEmotionLineState(state: EmotionLineState): string {
	return JSON.stringify({
		trigger: state.trigger,
		records: state.records,
		...Object.fromEntries(EMOTION_LINES.filter(line => state.checked[line.id]).map(line => [`c_${line.id}`, true]))
	})
}
