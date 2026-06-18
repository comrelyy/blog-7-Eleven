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
		// 单行化：把字面 \n 与真实换行压成 "; "，去掉多余 \r
		translation: translation.replace(/\\n/g, '; ').replace(/\s*\n\s*/g, '; ').replace(/\\r/g, '').trim()
	})
}

writeFileSync(outPath, JSON.stringify(out))
console.log(`wrote ${out.length} words -> ${outPath}`)
