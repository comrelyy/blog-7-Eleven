export type PoetryMood =
	| 'moon'
	| 'spring'
	| 'autumn'
	| 'winter'
	| 'war'
	| 'river'
	| 'mountain'
	| 'rain'
	| 'sunset'
	| 'love'
	| 'farewell'
	| 'nostalgia'
	| 'pastoral'
	| 'plum'
	| 'orchid'
	| 'chrysanthemum'
	| 'default'

// 规则按优先级排列：靠前的优先匹配（四君子 > 场景 > 情感）
const MOOD_RULES: Array<{ mood: PoetryMood; keywords: string[] }> = [
	{ mood: 'plum', keywords: ['梅', '寒梅', '疏影', '暗香'] },
	{ mood: 'orchid', keywords: ['兰', '幽兰', '空谷'] },
	{ mood: 'chrysanthemum', keywords: ['菊', '采菊', '东篱', '黄花'] },
	{ mood: 'farewell', keywords: ['送', '别', '去', '行', '长亭', '古道', '远', '归', '客', '酒', '杯'] },
	{ mood: 'nostalgia', keywords: ['古', '怀', '英雄', '千古', '往', '昔', '故', '遗', '废', '朝', '代', '帝', '王'] },
	{ mood: 'pastoral', keywords: ['田', '园', '农', '村', '鸡', '犬', '桑', '麻', '篱', '牧', '耕', '庄'] },
	{ mood: 'moon', keywords: ['月', '夜', '星', '梦', '烛'] },
	{ mood: 'spring', keywords: ['春', '花', '莺', '燕', '柳', '草', '桃', '杏'] },
	{ mood: 'autumn', keywords: ['秋', '落叶', '菊', '霜', '枫', '重阳'] },
	{ mood: 'winter', keywords: ['雪', '寒', '冰', '冻', '冬', '梅'] },
	{ mood: 'war', keywords: ['剑', '戈', '军', '征', '将', '怒', '壮', '兵', '甲', '铁'] },
	{ mood: 'river', keywords: ['江', '河', '海', '水', '湖', '波', '舟', '船', '渔'] },
	{ mood: 'mountain', keywords: ['山', '岭', '峰', '岳', '崖', '岩'] },
	{ mood: 'rain', keywords: ['雨', '雾', '云', '阴', '风'] },
	{ mood: 'sunset', keywords: ['夕阳', '黄昏', '晚', '暮', '残阳', '斜照', '日'] },
	{ mood: 'love', keywords: ['情', '思', '恨', '愁', '泪', '相思', '离', '忆'] },
]

// 高优先级意境（四君子、送别、怀古、田园）— 命中任一关键词即立即选用
const PRIORITY_MOODS: PoetryMood[] = ['plum', 'orchid', 'chrysanthemum', 'farewell', 'nostalgia', 'pastoral']

export function getPoetryMood(poem: { title: string; content: string }): PoetryMood {
	const text = poem.title + poem.content

	// 优先匹配高优先级意境
	for (const rule of MOOD_RULES) {
		if (!PRIORITY_MOODS.includes(rule.mood)) continue
		for (const kw of rule.keywords) {
			if (text.includes(kw)) return rule.mood
		}
	}

	// 否则按关键词命中数取最高分
	let bestMood: PoetryMood = 'default'
	let bestScore = 0
	for (const rule of MOOD_RULES) {
		if (PRIORITY_MOODS.includes(rule.mood)) continue
		let score = 0
		for (const kw of rule.keywords) {
			if (text.includes(kw)) score++
		}
		if (score > bestScore) {
			bestScore = score
			bestMood = rule.mood
		}
	}
	return bestMood
}
