import assert from 'node:assert/strict'
import test from 'node:test'
import { parseEmotionLineState, recordEmotionLinePractice, serializeEmotionLineState } from './emotion-lines'

const now = new Date('2026-11-02T12:00:00Z')

test('a practice requires a real date and a nonempty reason before the line is checked', () => {
	const state = parseEmotionLineState(null)
	for (const [date, reason] of [
		['', '争执'],
		['2026-02-30', '争执'],
		['2026-11-04', '争执'],
		['2026-11-02', '  ']
	]) {
		assert.throws(() => recordEmotionLinePractice(state, 'a1', date, reason, now))
	}
	assert.throws(() => recordEmotionLinePractice(state, 'unknown', '2026-11-02', '争执', now))
	assert.deepEqual(state, { trigger: '', checked: {}, records: {} })
})

test('practice logs survive refresh, repeated practice, and unchecking', () => {
	const first = recordEmotionLinePractice(parseEmotionLineState(null), 'a1', '2026-11-01', '  讨论安排时对方语气很重  ', now)
	const second = recordEmotionLinePractice(first, 'a1', '2026-11-02', '开会时想插话', now)
	assert.equal(first.records.a1.length, 1)
	assert.equal(second.records.a1.length, 2)
	assert.notEqual(second.records.a1[0].id, second.records.a1[1].id)
	assert.equal(second.checked.a1, true)
	assert.equal(second.records.a1[0].reason, '讨论安排时对方语气很重')
	const unchecked = { ...second, checked: { ...second.checked, a1: false } }
	const restored = parseEmotionLineState(serializeEmotionLineState(unchecked))
	assert.equal(restored.checked.a1, undefined)
	assert.deepEqual(restored.records, second.records)
	assert.equal(restored.records.a1[1].date, '2026-11-02')
})

test('old checked lines keep their status without inventing practice dates or reasons', () => {
	const legacy = parseEmotionLineState('{"trigger":"心跳加快","c_a1":true,"c_b2":false}')
	assert.deepEqual(legacy, { trigger: '心跳加快', checked: { a1: true }, records: {} })
	assert.deepEqual(parseEmotionLineState(serializeEmotionLineState(legacy)), legacy)
})

test('corrupt records do not remove valid records or old checkmarks', () => {
	const state = parseEmotionLineState(
		JSON.stringify({
			c_a1: true,
			records: {
				a1: [{ date: '2026-11-02', reason: '有效缘由' }, { date: '2026-02-30', reason: '不存在的日期' }, { date: '2026-11-02', reason: '  ' }, null],
				unknown: [{ date: '2026-11-02', reason: '未知台词' }]
			}
		})
	)
	assert.equal(state.checked.a1, true)
	assert.equal(state.records.a1.length, 1)
	assert.equal(state.records.a1[0].reason, '有效缘由')
	assert.equal(state.records.unknown, undefined)
	for (const raw of ['{bad', 'null', '[]', '"wrong"']) assert.deepEqual(parseEmotionLineState(raw), { trigger: '', checked: {}, records: {} })
})
