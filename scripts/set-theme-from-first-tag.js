#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const indexPath = path.resolve(__dirname, '../public/blogs/index.json')

function readIndex() {
  try {
    const raw = fs.readFileSync(indexPath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to read or parse index.json:', err.message)
    process.exit(1)
  }
}

function writeIndex(data) {
  try {
    const out = JSON.stringify(data, null, 2)
    fs.writeFileSync(indexPath, out + '\n', 'utf8')
  } catch (err) {
    console.error('Failed to write index.json:', err.message)
    process.exit(1)
  }
}

function main() {
  const items = readIndex()
  if (!Array.isArray(items)) {
    console.error('index.json is not an array')
    process.exit(1)
  }

  let changed = false
  const updated = items.map(item => {
    const tags = Array.isArray(item.tags) ? item.tags : []
    const firstTag = tags.length > 0 ? tags[0] : null
    const theme = firstTag || '未分类'
    if (item.theme !== theme) {
      changed = true
      return Object.assign({}, item, { theme })
    }
    return item
  })

  if (!changed) {
    console.log('No changes needed; all entries already have proper `theme`.')
    process.exit(0)
  }

  writeIndex(updated)
  console.log('Updated public/blogs/index.json — set `theme` from first tag for posts.')
}

main()
