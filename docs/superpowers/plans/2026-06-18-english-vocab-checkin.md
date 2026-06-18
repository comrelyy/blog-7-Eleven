# 英语学习每日单词任务 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为标记为「单词任务」的打卡事件提供每日确定性的 20 词（词/音标/中文），打卡时把当天 20 词自动追加到当月碎碎念博客。

**Architecture:** 内置 ECDICT 筛选后的静态词库 JSON；纯函数按日期种子选词；EventCard 对 vocab 事件渲染单词列表，打卡复用现有 `submitJournal → appendLearningLog` 单次 commit 链路。

**Tech Stack:** Next.js 16 / React 19 / TypeScript / motion / Node 20。单测用 Node 内置 test runner + tsx 加载 TS。

## Global Constraints

- Prettier 风格（verbatim from project）：tab 缩进、**无分号**、单引号、jsxSingleQuote、printWidth 160、trailingComma none。
- 路径别名：`@/*` → `./src/*`。
- 组件默认 `'use client'`。
- 内容数据放 `public/`；打卡数据文件为 `public/checkin/data.json`。
- 不得改动非 vocab 事件的任何现有行为。
- 向后兼容：`CheckinEvent.vocab` 缺省即 `false`，旧 data.json 不受影响。

---

## File Structure

- Create: `scripts/build-vocab.mjs` — 从 ECDICT CSV 筛词、生成词库 JSON。
- Create: `public/checkin/vocab.json` — 词库静态资源（脚本产物）。
- Create: `src/app/checkin/services/daily-words.ts` — 选词纯函数 + markdown 格式化。
- Create: `src/app/checkin/services/daily-words.test.ts` — 选词单测。
- Modify: `package.json` — 加 `tsx` devDep 与 `test` 脚本。
- Modify: `src/app/checkin/services/checkin-data-service.ts` — `CheckinEvent` 加 `vocab?`。
- Modify: `src/app/checkin/components/event-form-dialog.tsx` — 加「每日单词任务」开关。
- Modify: `src/app/checkin/components/event-card.tsx` — vocab 事件的看词/打卡 UI。
- Modify: `src/app/checkin/components/checkin-client.tsx` — vocab 打卡接 `submitJournal`。

---

## Task 1: 测试基建（tsx + test 脚本）

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `pnpm test` 命令，可用 `node --import tsx --test <file.ts>` 跑 TS 单测。

- [ ] **Step 1: 安装 tsx 为 devDependency**

Run: `pnpm add -D tsx`
Expected: `package.json` devDependencies 出现 `tsx`，安装成功无报错。

- [ ] **Step 2: 加 test 脚本**

在 `package.json` 的 `scripts` 中，`svg` 行后加入（注意保持 tab 缩进、JSON 无尾逗号规则）：

```json
		"test": "node --import tsx --test src/app/checkin/services/daily-words.test.ts",
```

- [ ] **Step 3: 验证脚本可解析**

Run: `pnpm test`
Expected: 因测试文件还不存在而报 “Could not find ... daily-words.test.ts” 之类错误（命令本身可被 pnpm 识别，不是 “unknown script”）。

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: 加 tsx 与 test 脚本以支持 TS 单测"
```

---

## Task 2: 生成 ECDICT 词库 JSON

**Files:**
- Create: `scripts/build-vocab.mjs`
- Create: `public/checkin/vocab.json`（脚本产物）

**Interfaces:**
- Produces: `public/checkin/vocab.json`，内容为 `Array<{ word: string; phonetic: string; translation: string }>`，仅含 tag 命中 `cet4`/`cet6`/`ky` 或 `frq` 在高频阈值内的词。

**ECDICT 背景（实现者须知）：**
- 源仓库 `skywind3000/ECDICT`，`ecdict.csv` 表头为：`word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio`。
- `tag` 为空格分隔的标签集合，含 `zk gk cet4 cet6 ky toefl ielts gre` 等。
- `frq` 为当代语料库词频排名：`0` 表示未排名，`>0` 时**数值越小越高频**。
- CSV 字段带引号、字段内可能含逗号，需正确处理引号转义。

- [ ] **Step 1: 下载 ECDICT CSV 到本地临时文件**

Run:
```bash
curl -L -o /tmp/ecdict.csv https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv
```
Expected: 得到一个数十 MB 的 CSV 文件。验证表头：
```bash
head -1 /tmp/ecdict.csv
```
Expected 输出包含：`word,phonetic,definition,translation,...,tag,bnc,frq,...`
（若 raw 链接受限，改用 release 包 `ecdict-csv.7z` 解压得到同名 CSV；只要最终是上述表头的 CSV 即可。）

- [ ] **Step 2: 写词库构建脚本**

Create `scripts/build-vocab.mjs`：

```js
import { readFileSync, writeFileSync } from 'node:fs'

// 用法: node scripts/build-vocab.mjs <ecdict.csv 路径> [输出路径]
const srcPath = process.argv[2] || '/tmp/ecdict.csv'
const outPath = process.argv[3] || 'public/checkin/vocab.json'

const HIGH_FREQ_MAX = 7000 // frq 在 (0, 7000] 视为高频
const WANT_TAGS = new Set(['cet4', 'cet6', 'ky'])

// 极简 CSV 解析：处理双引号包裹与 "" 转义、字段内逗号与换行
function parseCsv(text) {
	const rows = []
	let row = []
	let field = ''
	let inQuotes = false
	for (let i = 0; i < text.length; i++) {
		const c = text[i]
		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"'
					i++
				} else {
					inQuotes = false
				}
			} else {
				field += c
			}
		} else if (c === '"') {
			inQuotes = true
		} else if (c === ',') {
			row.push(field)
			field = ''
		} else if (c === '\n') {
			row.push(field)
			rows.push(row)
			row = []
			field = ''
		} else if (c === '\r') {
			// 忽略 CR
		} else {
			field += c
		}
	}
	if (field.length > 0 || row.length > 0) {
		row.push(field)
		rows.push(row)
	}
	return rows
}

const text = readFileSync(srcPath, 'utf8')
const rows = parseCsv(text)
const header = rows[0]
const idx = name => header.indexOf(name)
const iWord = idx('word')
const iPhonetic = idx('phonetic')
const iTranslation = idx('translation')
const iTag = idx('tag')
const iFrq = idx('frq')

const out = []
const seen = new Set()
for (let r = 1; r < rows.length; r++) {
	const cols = rows[r]
	if (!cols || cols.length <= iTranslation) continue
	const word = (cols[iWord] || '').trim()
	const translation = (cols[iTranslation] || '').trim()
	if (!word || !translation) continue
	if (seen.has(word)) continue

	const tags = (cols[iTag] || '').split(/\s+/).filter(Boolean)
	const frq = Number(cols[iFrq] || 0)
	const tagHit = tags.some(t => WANT_TAGS.has(t))
	const freqHit = frq > 0 && frq <= HIGH_FREQ_MAX
	if (!tagHit && !freqHit) continue

	seen.add(word)
	out.push({
		word,
		phonetic: (cols[iPhonetic] || '').trim(),
		// 单行化：把字面 \n 与真实换行压成 "; "
		translation: translation.replace(/\\n/g, '; ').replace(/\s*\n\s*/g, '; ').trim()
	})
}

writeFileSync(outPath, JSON.stringify(out))
console.log(`wrote ${out.length} words -> ${outPath}`)
```

- [ ] **Step 3: 运行脚本生成词库**

Run:
```bash
node scripts/build-vocab.mjs /tmp/ecdict.csv public/checkin/vocab.json
```
Expected: 打印 `wrote <N> words -> public/checkin/vocab.json`，N 约在 8000–15000 之间。

- [ ] **Step 4: 校验产物结构**

Run:
```bash
node -e "const v=require('./public/checkin/vocab.json');console.log('count',v.length);console.log(v[0]);const ok=v.every(w=>w.word&&typeof w.translation==='string');console.log('shapeOK',ok)"
```
Expected: `count` 数千以上；首条形如 `{ word: '...', phonetic: '...', translation: '...' }`；`shapeOK true`。

- [ ] **Step 5: Commit**

```bash
git add scripts/build-vocab.mjs public/checkin/vocab.json
git commit -m "feat: 生成 ECDICT 筛选词库 (cet4/cet6/ky/高频)"
```

---

## Task 3: 选词纯函数 daily-words.ts（TDD）

**Files:**
- Create: `src/app/checkin/services/daily-words.ts`
- Create: `src/app/checkin/services/daily-words.test.ts`

**Interfaces:**
- Consumes: 词条类型 `{ word: string; phonetic: string; translation: string }`。
- Produces:
  - `export type VocabWord = { word: string; phonetic: string; translation: string }`
  - `export function pickDailyWords(dateStr: string, vocab: VocabWord[], count?: number): VocabWord[]`（默认 `count = 20`；按 `dateStr` 确定性选词；`vocab.length <= count` 时返回全部的稳定洗牌；空数组返回空数组）
  - `export function formatVocabSummary(words: VocabWord[]): string`（生成 markdown 有序列表）

- [ ] **Step 1: 写失败测试**

Create `src/app/checkin/services/daily-words.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test`
Expected: FAIL，报找不到模块 `./daily-words` 或导出未定义。

- [ ] **Step 3: 写实现**

Create `src/app/checkin/services/daily-words.ts`：

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test`
Expected: 全部 PASS（6 个用例）。

- [ ] **Step 5: Commit**

```bash
git add src/app/checkin/services/daily-words.ts src/app/checkin/services/daily-words.test.ts
git commit -m "feat: 每日确定性选词与 markdown 格式化纯函数"
```

---

## Task 4: CheckinEvent 加 vocab 字段 + 表单开关

**Files:**
- Modify: `src/app/checkin/services/checkin-data-service.ts:7`
- Modify: `src/app/checkin/components/event-form-dialog.tsx`

**Interfaces:**
- Consumes: 无。
- Produces: `CheckinEvent` 新增可选 `vocab?: boolean`；表单可设置该字段。

- [ ] **Step 1: 类型加字段**

修改 `src/app/checkin/services/checkin-data-service.ts` 的 `CheckinEvent` 定义，在末尾加 `vocab?: boolean`：

```ts
export type CheckinEvent = { id: string; name: string; color: string; category?: string; journal?: boolean; start?: string; end?: string; description?: string; vocab?: boolean }
```

- [ ] **Step 2: 表单加状态**

`event-form-dialog.tsx`，在 `const [journal, setJournal] = useState(false)` 之后加：

```ts
	const [vocab, setVocab] = useState(false)
```

- [ ] **Step 3: 重置时同步**

在 `useEffect` 里 `setJournal(initial?.journal ?? false)` 之后加：

```ts
		setVocab(initial?.vocab ?? false)
```

- [ ] **Step 4: 提交时带上字段**

在 `handleSubmit` 的 `next` 对象里，`journal: journal || undefined,` 之后加：

```ts
				vocab: vocab || undefined,
```

- [ ] **Step 5: 加开关 UI**

在「打卡时写学习总结」那个 `<label>…</label>` 之后、`</div>`（`space-y-4` 容器结束）之前，加入：

```tsx
					<label className='flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5'>
						<input type='checkbox' checked={vocab} onChange={e => setVocab(e.target.checked)} className='mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand' />
						<span className='text-xs text-secondary'>
							<span className='font-medium text-primary'>每日单词任务</span>
							<br />
							每天生成 20 个单词（词/音标/中文），打卡时追加到当月博客
						</span>
					</label>
```

- [ ] **Step 6: 类型检查**

Run: `npx tsc --noEmit --skipLibCheck`
Expected: 无新增错误（`open-next.config.ts` 的 Cloudflare 类型错误属预期，可忽略）。

- [ ] **Step 7: Commit**

```bash
git add src/app/checkin/services/checkin-data-service.ts src/app/checkin/components/event-form-dialog.tsx
git commit -m "feat: 事件支持每日单词任务开关 (vocab)"
```

---

## Task 5: EventCard 渲染单词列表与打卡

**Files:**
- Modify: `src/app/checkin/components/event-card.tsx`

**Interfaces:**
- Consumes: `pickDailyWords`、`formatVocabSummary`、`VocabWord` from `../services/daily-words`。
- Produces: `EventCard` 新增可选 prop `onVocabCheckin?: (summaryMarkdown: string) => void`；当 `event.vocab` 为真时，正面按钮变为「查看今日单词」、背面展示当天 20 词并提供「打卡并记入博客」。

- [ ] **Step 1: 引入依赖与 props**

`event-card.tsx` 顶部 import 区加：

```ts
import { useEffect } from 'react'
import { pickDailyWords, formatVocabSummary, type VocabWord } from '../services/daily-words'
```
（注意：文件已 `import { useMemo, useState } from 'react'`，把 `useEffect` 合并进该行而非重复 import：改成 `import { useEffect, useMemo, useState } from 'react'`，删除上面单独的 useEffect import 行。）

在组件 props 解构里，`onDelete` 之后加 `onVocabCheckin`，并在类型块里加 `onVocabCheckin?: (summaryMarkdown: string) => void`。

- [ ] **Step 2: 加载词库并算今日单词**

在组件内 `const [confirmDelete, setConfirmDelete] = useState(false)` 之后加：

```ts
	const [vocabWords, setVocabWords] = useState<VocabWord[]>([])
	const [vocabError, setVocabError] = useState(false)

	useEffect(() => {
		if (!event.vocab) return
		let alive = true
		fetch('/checkin/vocab.json', { cache: 'force-cache' })
			.then(r => {
				if (!r.ok) throw new Error('vocab load failed')
				return r.json()
			})
			.then((all: VocabWord[]) => {
				if (alive) setVocabWords(pickDailyWords(today, all))
			})
			.catch(() => {
				if (alive) setVocabError(true)
			})
		return () => {
			alive = false
		}
	}, [event.vocab, today])
```

- [ ] **Step 3: 正面按钮分支**

把正面那段 `onToggleCheck` 的 `<button>` 用条件包裹：vocab 事件且未打卡时，按钮文案为「查看今日单词」、点击执行 `setFlipped(true)`；其余情况维持原样。将原 `<button …>{ended ? '打卡截止' : checkedToday ? '✓ 今日已打 · 取消' : '今日打卡'}</button>` 替换为：

```tsx
					{event.vocab && !checkedToday && !ended ? (
						<button
							type='button'
							onClick={() => setFlipped(true)}
							className='mt-4 rounded-full px-7 py-2.5 text-sm font-semibold text-white shadow-md transition active:scale-95'
							style={{ background: event.color, boxShadow: `0 6px 16px ${event.color}55` }}>
							查看今日单词
						</button>
					) : (
						<button
							type='button'
							disabled={disabled}
							onClick={onToggleCheck}
							aria-pressed={checkedToday}
							className='mt-4 rounded-full px-7 py-2.5 text-sm font-semibold shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
							style={{
								background: checkedToday ? '#e5e7eb' : event.color,
								color: checkedToday ? '#6b7280' : 'white',
								boxShadow: checkedToday ? undefined : `0 6px 16px ${event.color}55`
							}}>
							{ended ? '打卡截止' : checkedToday ? '✓ 今日已打 · 取消' : '今日打卡'}
						</button>
					)}
```

- [ ] **Step 4: 背面单词区**

在背面 `<div className='min-h-0 flex-1 overflow-y-auto …'>…</div>`（打卡记录区）之前，插入仅当 `event.vocab` 时显示的今日单词区：

```tsx
					{event.vocab && (
						<div className='mb-3 min-h-0 flex-1 overflow-y-auto rounded-xl bg-white/40 p-3'>
							<div className='mb-2 text-[11px] font-medium text-primary'>今日单词 · {vocabWords.length}</div>
							{vocabError ? (
								<div className='text-[11px] text-red-500/80'>词库加载失败</div>
							) : vocabWords.length === 0 ? (
								<div className='text-[11px] text-secondary/60'>加载中…</div>
							) : (
								<ol className='space-y-1.5 text-[11px] text-secondary'>
									{vocabWords.map((w, i) => (
										<li key={w.word} className='leading-snug'>
											<span className='font-semibold text-primary'>{i + 1}. {w.word}</span>
											{w.phonetic && <span className='ml-1 text-secondary/70'>{w.phonetic}</span>}
											<span className='ml-1'>{w.translation}</span>
										</li>
									))}
								</ol>
							)}
						</div>
					)}
```

注意：vocab 事件下，原「打卡记录」区会让背面过长。将原打卡记录外层 `<div className='min-h-0 flex-1 …'>` 改为：vocab 时该记录区用固定较矮高度而非 `flex-1`。具体把该 div 的 className 改为：

```tsx
					<div className={`${event.vocab ? 'max-h-24' : 'min-h-0 flex-1'} overflow-y-auto rounded-xl bg-white/40 p-3`}>
```

- [ ] **Step 5: 背面打卡按钮**

把背面原有的 `{onAppendJournal && checkedToday && (…)}` 追加总结按钮块之后，新增 vocab 打卡按钮（未打卡时显示）：

```tsx
					{event.vocab && !checkedToday && (
						<button
							onClick={() => onVocabCheckin?.(formatVocabSummary(vocabWords))}
							disabled={vocabWords.length === 0}
							className='mt-3 w-full rounded-xl py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50'
							style={{ background: event.color, boxShadow: `0 4px 12px ${event.color}44` }}>
							✓ 打卡并记入博客
						</button>
					)}
```

- [ ] **Step 6: 类型检查**

Run: `npx tsc --noEmit --skipLibCheck`
Expected: 无新增错误。

- [ ] **Step 7: Commit**

```bash
git add src/app/checkin/components/event-card.tsx
git commit -m "feat: 单词任务卡片展示今日 20 词并支持打卡"
```

---

## Task 6: checkin-client 接线 vocab 打卡

**Files:**
- Modify: `src/app/checkin/components/checkin-client.tsx`

**Interfaces:**
- Consumes: `EventCard` 的 `onVocabCheckin` prop；现有 `submitJournal(ev, text, nextRecords)`。
- Produces: vocab 事件打卡时，把 20 词 markdown 作为 summary 走 `submitJournal`，单次 commit 写入打卡记录 + 当月博客。

- [ ] **Step 1: 新增 vocab 打卡处理函数**

在 `submitJournal` 函数定义之后、`handleJournalConfirm` 之前，加入：

```ts
	// 单词任务打卡：把当天 20 词 markdown 作为总结，走 submitJournal 单次提交
	const handleVocabCheckin = async (ev: CheckinEvent, summaryMarkdown: string) => {
		if (!requireAuth()) return
		const already = records.some(r => r.eventId === ev.id && r.date === today)
		const nextRecords = already ? records : [...records, { eventId: ev.id, date: today }]
		if (!summaryMarkdown.trim()) {
			// 词库未就绪等异常：退化为普通打卡
			setRecords(nextRecords)
			fireConfetti(ev.color)
			setHasUnsavedChanges(true)
			return
		}
		await submitJournal(ev, summaryMarkdown, nextRecords)
	}
```

- [ ] **Step 2: 把 prop 传给 EventCard（进行中列表）**

在 `activeEvents.map(ev => (<EventCard …/>))` 的 `EventCard` 上，`onDelete` 之后加：

```tsx
								onVocabCheckin={ev.vocab ? summary => handleVocabCheckin(ev, summary) : undefined}
```

- [ ] **Step 3: 已结束列表无需单词打卡**

确认「已结束」分组里的 `EventCard` 不传 `onVocabCheckin`（保持原样即可，已结束事件 `checkedToday={false}` 且 `disabled`，不应触发打卡）。无需改动。

- [ ] **Step 4: 类型检查**

Run: `npx tsc --noEmit --skipLibCheck`
Expected: 无新增错误。

- [ ] **Step 5: 构建验证**

Run: `pnpm build`
Expected: 构建成功（忽略既有的 `open-next.config.ts` Cloudflare 类型告警）。

- [ ] **Step 6: Commit**

```bash
git add src/app/checkin/components/checkin-client.tsx
git commit -m "feat: 单词任务打卡接入博客追加链路"
```

---

## Task 7: 端到端手动验证

**Files:** 无（手动验证）。

- [ ] **Step 1: 启动 dev**

Run: `pnpm dev`，浏览器打开 `http://localhost:2025/checkin`。

- [ ] **Step 2: 导入密钥并开启单词任务**

导入密钥；编辑「英语学习」事件，勾选「每日单词任务」并保存。

- [ ] **Step 3: 验证看词**

该卡正面按钮显示「查看今日单词」；点击翻面，背面「今日单词 · 20」列出 20 条 `序号 单词 音标 中文`；刷新页面后为同一组词。

- [ ] **Step 4: 验证打卡入博客**

点「✓ 打卡并记入博客」；toast 提示追加成功；打卡记录 +1；检查 GitHub 上当月 `public/blogs/<YYYY-MM>/index.md` 出现当天小节，含 `***英语学习***` 与 20 词有序列表；`public/checkin/data.json` 同一 commit 内更新。

- [ ] **Step 5: 验证不回归**

确认非 vocab 事件（如「每日小结」）打卡、写总结、翻面历史等行为完全不变。

---

## Self-Review 记录

- **Spec 覆盖**：数据源(Task2)/选词(Task3)/事件标记(Task4)/卡片交互(Task5)/接线追加(Task6)/格式(Task3 formatVocabSummary)/错误处理(Task5 vocabError、Task6 退化)/测试(Task3 单测 + Task7 手动) 均有对应任务。
- **Placeholder 扫描**：无 TBD/TODO，代码步骤均给出完整代码。
- **类型一致**：`VocabWord`、`pickDailyWords`、`formatVocabSummary`、`onVocabCheckin`、`vocab?` 在各任务间命名一致。
- **遗留实现细节**：ECDICT 下载 URL 若受限改用 release 包（Task2 Step1 已注明）；`HIGH_FREQ_MAX=7000` 为初值，产物词数异常时可调整。
