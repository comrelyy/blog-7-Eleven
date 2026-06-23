import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickDailyWords, formatVocabSummary, type VocabWord } from './daily-words'

const VOCAB: VocabWord[] = Array.from({ length: 200 }, (_, i) => ({
	word: `word${i}`,
	phonetic: `/p${i}/`,
	translation: `释义${i}`
}))

test('同一日期稳定返回同一组', () => {
	const a = pickDailyWords('2026-06-18', VOCAB)
	const b = pickDailyWords('2026-06-18', VOCAB)
	assert.deepEqual(a, b)
})

test('默认取 20 个且互不重复', () => {
	const a = pickDailyWords('2026-06-18', VOCAB)
	assert.equal(a.length, 20)
	assert.equal(new Set(a.map(w => w.word)).size, 20)
})

test('不同日期结果不同', () => {
	const a = pickDailyWords('2026-06-18', VOCAB)
	const b = pickDailyWords('2026-06-19', VOCAB)
	assert.notDeepEqual(a, b)
})

test('词库不足 count 时返回全部', () => {
	const small = VOCAB.slice(0, 5)
	const a = pickDailyWords('2026-06-18', small, 20)
	assert.equal(a.length, 5)
})

test('空词库返回空数组', () => {
	assert.deepEqual(pickDailyWords('2026-06-18', [], 20), [])
})

test('formatVocabSummary 生成有序列表', () => {
	const md = formatVocabSummary([{ word: 'abandon', phonetic: '/əˈbændən/', translation: 'vt. 放弃' }])
	assert.equal(md, '1. **abandon** /əˈbændən/ vt. 放弃')
})

test('formatVocabSummary 音标为空时不留双空格', () => {
	const md = formatVocabSummary([{ word: 'benefit', phonetic: '', translation: 'n. 利益' }])
	assert.equal(md, '1. **benefit** n. 利益')
})
