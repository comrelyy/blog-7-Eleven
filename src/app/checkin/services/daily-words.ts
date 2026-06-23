export type VocabWord = { word: string; phonetic: string; translation: string }

// 把日期字符串散列成 32 位无符号整数种子
function hashSeed(str: string): number {
	let h = 2166136261
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i)
		h = Math.imul(h, 16777619)
	}
	return h >>> 0
}

// mulberry32：由种子产生确定性伪随机序列
function mulberry32(seed: number): () => number {
	let a = seed >>> 0
	return () => {
		a |= 0
		a = (a + 0x6d2b79f5) | 0
		let t = Math.imul(a ^ (a >>> 15), 1 | a)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

export function pickDailyWords(dateStr: string, vocab: VocabWord[], count = 20): VocabWord[] {
	if (vocab.length === 0) return []
	const rand = mulberry32(hashSeed(dateStr))
	// Fisher–Yates 部分洗牌，确定性
	const arr = vocab.slice()
	const n = Math.min(count, arr.length)
	for (let i = 0; i < n; i++) {
		const j = i + Math.floor(rand() * (arr.length - i))
		const tmp = arr[i]
		arr[i] = arr[j]
		arr[j] = tmp
	}
	return arr.slice(0, n)
}

export function formatVocabSummary(words: VocabWord[]): string {
	return words
		.map((w, i) => {
			const phonetic = w.phonetic ? ` ${w.phonetic}` : ''
			return `${i + 1}. **${w.word}**${phonetic} ${w.translation}`.trim()
		})
		.join('\n')
}
