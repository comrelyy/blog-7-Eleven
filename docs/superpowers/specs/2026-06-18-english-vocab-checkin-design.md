# 「英语学习」每日单词任务 — 设计文档

日期：2026-06-18
状态：已确认设计，待出实现计划

## 背景

打卡系统（`src/app/checkin/`）已支持：事件、打卡记录、`journal` 类事件打卡时把总结追加到当月碎碎念博客。
数据存于 `public/checkin/data.json`，通过 GitHub App 提交。

用户新建了「英语学习」打卡事件（id `1781008754038`，`journal: true`），希望：

- 每天有一组**固定的 20 个单词**作为当天打卡任务；
- 每个单词展示 **单词 + 音标 + 中文释义**；
- 打卡时按现有「学习类」逻辑，把这 20 个词**自动追加到当月碎碎念博客**。

## 目标 / 非目标

**目标**
- 为标记为「单词任务」的事件，提供每日确定性的 20 词列表（词/音标/中文）。
- 打卡即把当天 20 词追加到当月博客，复用现有 `appendLearningLog` 单次 commit 链路。

**非目标（YAGNI）**
- 不做间隔复习 / SRS / 单词标记"已掌握"。
- 不做在线词典 API、不做翻译 API。
- 不改动非 vocab 事件的任何行为。

## 数据来源决策

带中文释义的在线词典 API（有道/网易等）需要密钥签名，浏览器直连有密钥暴露、CORS、限流问题，且本站是纯客户端 + Cloudflare Workers 部署，不适合。免费的 dictionaryapi.dev 无中文。

因此采用开源英汉词典数据集 **ECDICT**（github.com/skywind3000/ECDICT），它自带 `word / phonetic / translation(中文) / tag`。筛出 `cet4 / cet6 / ky(考研) / 高频` 词，打包为静态 JSON 内置进 `public/`。运行时零外部依赖、无密钥、CF 上稳定。

## 架构与组件

### 1. 词库数据（一次性构建）
- 脚本 `scripts/build-vocab.mjs`：下载/读取 ECDICT 源 CSV，筛选 tag 含 `cet4`/`cet6`/`ky`，并纳入高频词；每条只保留 `{ word, phonetic, translation }`。
- 输出 `public/checkin/vocab.json`（预计约 8000 词，1–2MB）。
- 脚本可重跑以更新词库。

数据结构：
```ts
type VocabWord = { word: string; phonetic: string; translation: string }
// vocab.json: VocabWord[]
```

### 2. 每日选词（纯函数，可测）
- 新建 `src/app/checkin/services/daily-words.ts`。
- `pickDailyWords(dateStr: string, vocab: VocabWord[], count = 20): VocabWord[]`
- 用 `dateStr`（`YYYY-MM-DD`）作为种子的确定性伪随机（如对日期做哈希后线性同余 / 洗牌），保证：当天任何时刻、任何设备打开都是同一组 20 词；无需在 data.json 存额外字段。
- 纯函数，无副作用，便于单测。

### 3. 事件标记
- 给 `CheckinEvent` 增加可选字段 `vocab?: boolean`（`checkin-data-service.ts` 的 type）。
- `EventFormDialog` 增加一个开关「每日单词任务」。
- 「英语学习」事件开启该开关即可；比按 `name === '英语学习'` 硬匹配更稳、可复用。
- 向后兼容：字段缺省即 `false`，旧数据不受影响。

### 4. 卡片交互（EventCard）
对 `event.vocab === true` 的事件：
- 正面「今日打卡」按钮替换为「查看今日单词」，点击翻面。
- 背面展示当天 20 个词的可滚动列表，每行：`单词  /音标/  中文释义`。
- 背面底部按钮「✓ 打卡并记入博客」：把 20 词格式化为 markdown，走现有 `submitJournal` 路径 → 单次 commit 同时写入打卡记录 + 追加当月博客。
- 已打卡当天：按钮显示已完成态，可取消打卡（取消只删记录，不回滚博客，与现有逻辑一致）。
- 非 vocab 事件：UI 与行为完全不变。

### 5. 博客追加格式
- 作为 `summary` 传给 `appendLearningLog`（复用，不改其签名）。
- 格式示例：
```
1. **abandon** /əˈbændən/ vt. 放弃，抛弃
2. **benefit** /ˈbenɪfɪt/ n. 利益 vt. 有益于
...
```

## 数据流

1. 卡片挂载（vocab 事件）→ fetch `vocab.json`（一次，可缓存）→ `pickDailyWords(today, vocab)` → 20 词。
2. 点「打卡并记入博客」→ 拼 markdown → `submitJournal(ev, markdown, nextRecords)` → `appendLearningLog`（打卡记录 + 当月博客合并为单次 commit）。

## 复用与改动点

- **复用**：`appendLearningLog`、`submitJournal`、`mergeMonthMarkdown`、JournalDialog 之外的整条提交链路。
- **新增**：`scripts/build-vocab.mjs`、`public/checkin/vocab.json`、`src/app/checkin/services/daily-words.ts`。
- **修改**：`CheckinEvent` 类型加 `vocab?`；`EventFormDialog` 加开关；`EventCard` 加 vocab 分支 UI；`checkin-client.tsx` 把 vocab 打卡接到 `submitJournal`。

## 错误处理

- `vocab.json` fetch 失败：卡片提示"词库加载失败"，打卡按钮禁用，不影响其他事件。
- 未导入密钥：沿用现有 `requireAuth` 提示。
- 提交失败：沿用 `appendLearningLog` 的重试与 toast。

## 测试

- `pickDailyWords` 单测：同一日期稳定返回同一组；不同日期不同；count 正确；vocab 少于 count 时的退化处理。
- 手动验证：开启开关的事件翻面看到 20 词；打卡后当月博客新增对应小节且打卡记录写入。
