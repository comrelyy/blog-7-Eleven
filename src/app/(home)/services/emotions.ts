// 心境状态 —— 文案/颜色/增减都改这里即可。key 是内部标识，改 label 不影响已存数据
export type EmotionDef = { key: string; label: string; color: string }

export const EMOTIONS: EmotionDef[] = [
	{ key: 'lost', label: '翻涌', color: '#ef4444' },
	{ key: 'controlled', label: '沉静', color: '#10b981' }
]

// 迁移来的旧数据（只有次数、没有情绪类型）归到这里
export const UNCLASSIFIED: EmotionDef = { key: 'unknown', label: '未分类', color: '#cbd5e1' }

const MAP: Record<string, EmotionDef> = Object.fromEntries([...EMOTIONS, UNCLASSIFIED].map(e => [e.key, e]))

export function getEmotion(key: string): EmotionDef {
	return MAP[key] ?? UNCLASSIFIED
}

// 堆叠条/统计的展示顺序：枚举顺序在前，未分类垫底
export const EMOTION_ORDER: string[] = [...EMOTIONS.map(e => e.key), UNCLASSIFIED.key]
