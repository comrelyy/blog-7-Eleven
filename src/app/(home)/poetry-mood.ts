export type PoetryMood = 'moon' | 'spring' | 'autumn' | 'winter' | 'war' | 'river' | 'mountain' | 'rain' | 'sunset' | 'love' | 'farewell' | 'nostalgia' | 'pastoral' | 'default'

const MOOD_RULES: Array<{ mood: PoetryMood; keywords: string[] }> = [
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

export function getPoetryMood(poem: { title: string; content: string }): PoetryMood {
	const text = poem.title + poem.content
	let bestMood: PoetryMood = 'default'
	let bestScore = 0
	for (const rule of MOOD_RULES) {
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
