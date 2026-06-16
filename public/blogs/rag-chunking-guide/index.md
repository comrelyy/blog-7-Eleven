# RAG 文档切片优化指南


## 0. 总纲：切片质量决定 RAG 上限

切片是检索质量的第一道关卡`文章一`：切太粗，关键信息淹没在噪音里；切太细，上下文丢失；边界切错，跨边界事实永远召回不全。而文章二补充了上限的另一半：**切得再好，文档之间仍是平的**——粒度混乱（"问为什么返回怎么实现"）要靠层次和结构解决`文章二`。

四方实践收敛出的共同骨架惊人地一致：

```
解析降噪 → 结构检测 → 策略选择(自动推荐+人工确认) → 切分(带降级链)
        → 切后清理 → 父子拓扑 → 元数据完备的入库 → 评测迭代
```

![切片处理八步骨架：解析降噪→结构检测→策略选择→切分→切后清理→父子拓扑→元数据入库→评测迭代，末端闭环回流](/blogs/rag-chunking-guide/4e9a5d2a28c4a3c7.png)

本指南按这条链路逐段给出最佳实践，每条规则标注来源与采纳建议。

---

## 1. 切片前：降噪与结构检测

> **规则 1.1：切片前先降噪，噪音入块是最隐蔽的质量杀手。**

super-agent 是四方中唯一系统化做这件事的`super-agent`：页码（"第 1 页"、"Page 5"、"5 / 12"）、版权页脚、出现 ≥3 次的重复页眉、重复文档标题，全部用正则 + 频次统计识别为 NOISE 信号（置信度 0.98-0.99）后剔除。kb-mvp 的 ChunkSanitizer 只在切后兜底过滤空块/纯符号，**切前降噪是缺口**。

> **规则 1.2：结构检测值得做成带置信度的信号系统，而不是简单正则匹配。**

super-agent 的 `DocumentStructureSignalExtractor` 用 21 个模式把每个逻辑行分类为 DOCUMENT_TITLE / HEADING / HEADING_CANDIDATE / STEP_ITEM / LIST_ITEM / TABLE_ROW / QUOTE / BODY / NOISE，每类带置信度`super-agent`。关键设计：

- **歧义显式建模**——中文序号"一、二、三"既可能是标题也可能是列表项：连续编号 → 列表（0.93），孤立出现 → 标题候选（0.58-0.62）；
- **低置信度信号交 LLM 消解**——置信度落在 [0.45, 0.80] 区间的歧义信号，批量（≤8 个/次）带 ±2 行上下文送 LLM 裁决；
- **上下文判定纯文本标题**——前后空行隔离 + 无句末标点 + ≤32 字 + 无语气助词才算标题。

对比：kb-mvp 的 detector（markdown heading / docx 大纲 / pdf outline+启发式）是确定性判断，无置信度概念`kb-mvp`；文章一完全没有结构检测`文章一`。

> **规则 1.3：结构树要校验和修复，不能直接信任检测结果。**

super-agent 的 `DocumentStructureTreeValidator` 做六遍修复`super-agent`：折叠与文档标题重名的伪章节 → 按编号路径（"1.2.3"）重挂父子 → 修非法父节点 → 重算深度 → 重建 canonical path 和面包屑 → 重建兄弟链。现实文档的编号经常跳号、错层，这一步直接决定 section_path 元数据的可信度。

---

## 2. 策略体系：四方对照

| 能力维度 | `文章一` | `kb-mvp` | `super-agent` |
|---|---|---|---|
| 固定/滑动窗口 | SLIDING_WINDOW（段落感知 + 重叠） | GENERIC（TokenTextSplitter） | —（由递归覆盖） |
| 递归字符切分 | —（段落感知近似） | RECURSIVE（中文标点优先级） | RECURSIVE（段→行→句→定窗四级回退） |
| 语义切分 | SEMANTIC：**embedding 相似度骤降点**，三种断点算法 | SEMANTIC：**LLM(qwen-max) 直接分段**返回 JSON | SEMANTIC：**Jaccard 词面相似度**聚合，阈值 0.18 |
| LLM 切分 | PROPOSITION：拆原子命题再重组 | （SEMANTIC 即 LLM） | LLM：提示词引导切界（默认关闭） |
| 结构感知 | — | DOCUMENT_STRUCTURE + STRUCTURED_SEMANTIC | STRUCTURE（信号提取 + 树校验） |
| 领域专用 | — | SALES_QUOTE（xlsx 报价单） | — |
| 父子分块 | —（多模态 blockIndex 近似） | 父块 searchable=false + 子块检索 | 父子**双管线**（父 2200 字 / 子 700-800 字） |
| 策略编排 | 单选 | 单选 + 内嵌降级 | **管线**：PRIMARY/OPTIMIZE/FALLBACK/ENHANCE 角色序列 |
| 人工确认 | — | 推荐不覆盖管理员自定义；切后 split/merge 工作台 | 推荐 → WAIT_CONFIRM → 用户确认/改 → 再构建 |

> **互补性一目了然**：文章一贡献了最便宜的语义切分算法（embedding 断点）和最精细的事实切分（命题）；kb-mvp 贡献了切后人工维护和块级降级标记；super-agent 贡献了切前工程（降噪、信号、树校验）和策略管线编排。一套理想体系应该三者拼装。

![四方互补拼装：文章一/kb-mvp/super-agent 各补一块，拼成理想切片体系](/blogs/rag-chunking-guide/4a1a454742706817.png)

---

## 3. 策略编排：单选 vs 管线

> **规则 3.1：策略不是单选题，是带角色的管线。**

super-agent 把一次切分计划表达为步骤序列，每步有角色`super-agent`：**PRIMARY**（主策略）→ **OPTIMIZE**（优化，如语义细化）→ **FALLBACK**（递归兜底，几乎总是追加）→ **ENHANCE**（LLM 增强，低质量内容才推荐）。这比 kb-mvp 把降级写死在 chunker 内部更灵活——降级路径成为**可配置、可确认、可审计**的数据。

> **规则 3.2：自动推荐 + 人工确认是企业级标配，推荐逻辑要便宜。**

三方推荐信号对比：

- kb-mvp：categoryType + mime 两个信号（报价单分类+xlsx → SALES_QUOTE；md/docx → 结构）`kb-mvp`；
- super-agent：文件类型 + 结构等级 + 标题数 + 字符数 + 段落数 + 内容质量等级多信号打分（如 `semanticRecommended = 字数≥240 且 段落≥3 且 质量≥MEDIUM`）`super-agent`；
- 共同纪律：**昂贵策略永不自动推荐**——kb-mvp 的 SEMANTIC 必须手选，super-agent 的 LLM 默认 `llm-enabled: false` 且只对低质量内容推荐。

super-agent 多一个状态机环节：推荐结果落库为 WAIT_CONFIRM，用户确认或修改后才触发第二段 Kafka 构建——切分计划本身是一等公民实体（plan + steps 表）。

---

## 4. 递归切分：所有体系的地基

> **规则 4.1：递归字符切分是唯一的"永不失败"策略，所有降级链的终点都是它。**

kb-mvp 与 super-agent 的实现高度趋同：分隔符按优先级下钻（段落 `\n\n` → 行 `\n` → 句末标点 → 逗号 → 定窗硬切），**必须包含中文标点 `。！？；，`**，切完贪心合并短片 + 尾部 overlap`kb-mvp``super-agent`。文章一的"段落感知 + 超长段落 1.5 倍兜底强切"是它的简化版`文章一`。

> **规则 4.2：overlap 上限设为 chunkSize 的一半。**

超过一半意味着新窗口大部分是重复内容，浪费索引和 token`文章一`。实践值：kb-mvp 512/80（≈16%），super-agent 800/120（15%），文章一默认 500/50（10%）——**10%-20% 是共识区间**。

---

## 5. 语义切分：三种实现的成本光谱

四方给出了语义切分的完整成本光谱，这是本指南最有信息量的对照：

| 实现 | 原理 | 成本 | 质量 | 来源 |
|---|---|---|---|---|
| **Jaccard 词面相似度** | 相邻句词面交并比 < 0.18 即断开；中文按字、英文按词 | 零 API，纯本地 | 低-中（词面≠语义，同义改写会误断） | `super-agent` |
| **Embedding 断点检测** | 逐句 embed，相邻余弦相似度骤降点为界；percentile / std-dev / IQR 三种阈值算法 | 每句 1 次 embedding（便宜） | 中-高 | `文章一` |
| **LLM 直接分段** | 把文本交给 LLM 按语义返回 JSON 数组（温度 0） | 每 3000 字 1 次 Chat（贵） | 高，但有截断风险（kb-mvp 超 12000 字 substring 硬截）和解析失败风险 | `kb-mvp` |
| **LLM 命题切分** | LLM 拆原子事实命题（保留数字/日期/名称，禁编造），再按 maxChunkSize 重组 | 最贵 | 最高（原子事实级，适合法律/规格/制度） | `文章一` |

![语义切分成本-质量光谱：Jaccard→Embedding 断点→LLM 直接分段→LLM 命题切分，从便宜·低质到贵·高质](/blogs/rag-chunking-guide/333d9355af575c87.png)

> **规则 5.1：按文档价值选档位，并允许逐档降级。**

普通文档用 embedding 断点（性价比最优）；高价值事实密集型文档用命题切分；Jaccard 只配做"零依赖环境的语义近似"。super-agent 的降级链印证了档位思维：**LLM 失败降到 Jaccard 语义（保住语义意图），语义失败才降递归**——而不是一律跌到底`super-agent`。

> **规则 5.2：LLM 切分的输出永远要合并碎片 + 校验。**

kb-mvp 的教训内建在代码里：LLM 爱切出"一个标题一块"，所以 `mergeSmallPieces` 贪心合并到 ≥200 字；返回只有 1 块、JSON 解析失败、空数组都抛异常走降级`kb-mvp`。文章一的命题重组同理：单命题十几个字向量化信息量不足，必须重组到合适粒度`文章一`。

---

## 6. 结构感知切分：树是最好的免费信号

> **规则 6.1：有结构用结构——heading 边界是作者亲手标注的语义边界，免费且最准。**

markdown heading / docx 样式大纲 / pdf 书签是显式结构；pdf 无书签时用正文启发式（kb-mvp 的 PdfHeadingHeuristicDetector）或信号系统（super-agent 的 21 模式）补`kb-mvp``super-agent`。检测到的 `heading_path` 同时服务三件事：切分边界、面包屑元数据（section_path）、未来的结构化检索路由`文章二`。

> **规则 6.2：碎 section 要合并，方向有讲究。**

目录、引言之类的碎 section（< 100 字）单独成块是噪音。kb-mvp 的合并优先级：同 heading_path 的前邻 → 同 path 的后邻 → 后邻 → 前邻，保留较大 section 的标题`kb-mvp`。`sections < 2` 视为"无结构"，整文降级。

> **规则 6.3：结构切出的超长 section 必须二次切分，且保留 section 元数据。**

三方一致：section > 阈值（kb-mvp 3000 字 / super-agent 2200 字）→ 用递归或语义二次切，子片继承完整 heading_path`kb-mvp``super-agent``文章一`。

---

## 7. 父子分块：检索粒度与上下文的解耦

> **这是 kb-mvp 和 super-agent 共同超出两篇文章的核心设计**：检索要细粒度（小块向量更聚焦），生成要粗上下文（大块语义完整）。父子分块同时满足两者——小块负责被搜到，父块负责喂给 LLM。

![父子分块 small-to-big：query 命中 searchable 子块，经 parent_chunk_id 回填到父块，父块作为完整上下文喂给 LLM](/blogs/rag-chunking-guide/e8df4d24ba657d86.png)

| 维度 | `kb-mvp` | `super-agent` |
|---|---|---|
| 父块界定 | 长 section（>3000 字）→ 父块存全文，searchable=false | 独立父管线切出 2000-2200 字"语义单元" |
| 子块界定 | 父块内 LLM 语义切，level=1，searchable=true | 独立子管线（语义 700 / 递归 800 字） |
| 关联方式 | metadata: parent_chunk_id / level / searchable | parentBlockId / parentBlockNo / chunkId / chunkNo |
| 检索行为 | 只搜 searchable=true 的块 | 子块被 embed 检索，父块作为答案上下文返回 |
| 独有亮点 | 人工 split/merge 可逆调整父子拓扑（merge 不重 embedding） | 父子各自独立的策略管线和参数集 |

> **规则 7.1：父子参数要解耦。** super-agent 给父管线单独一套参数（递归 2200/180、语义 1600/480）而不是复用子块参数`super-agent`——父块目标是"完整语义单元"，子块目标是"精准可召回"，两个目标对应两组尺寸。

> **规则 7.2：限制嵌套层级。** kb-mvp 上限 3 层`kb-mvp`。两层（父+子）够用，三层是给人工再细分留的余量；不设上限会把检索端的去重和扩展逻辑搞崩。

---

## 8. 降级设计：失败是常态

LLM 超时、JSON 解析失败、结构检测不到、xlsx 不是报价单……切分管线里的每个智能环节都会失败。四方的降级设计合并成三条纪律：

> **规则 8.1：降级要分粒度——能局部降就不要整体降。**

kb-mvp 是粒度最细的：SEMANTIC 切分按 3000 字粗块逐块调 LLM，**哪块失败哪块走递归兜底**，成功的块不受影响`kb-mvp`。文章一的 PROPOSITION → SLIDING_WINDOW 是整体替换，浪费了已成功的部分。

> **规则 8.2：降级要降到"最近的下一档"，不是一律跌到底。**

super-agent：LLM 失败 → Jaccard 语义（保住语义意图）→ 才到递归`super-agent`；kb-mvp：STRUCTURED_SEMANTIC 无结构 → SEMANTIC（保住语义切分）→ 粗块失败才递归`kb-mvp`。

![阶梯式优雅降级：LLM 切分→(失败)Jaccard/语义→(失败)递归兜底，每次降一档不跌到底；旁注三层痕迹（块级标记/任务级 warning/日志）](/blogs/rag-chunking-guide/2611fc16c8f1ed30.png)

> **规则 8.3：每次降级都要留下可观测的痕迹。**

三层痕迹缺一不可：**块级标记**（`semantic_fallback / structure_fallback`，或文章一的 `fallbackFrom/fallbackReason`）→ 知道哪些块质量打折；**任务级 warning**（kb-mvp 的 `SEMANTIC_PARTIAL_RECURSIVE_FALLBACK` 等，经 IndexingContext 持久化、前端 TaskTimeline 可见）→ 运营能发现；**日志** → 工程能排查。`kb-mvp``文章一`

> **规则 8.4：用户显式选择的策略，缺依赖时应报错而非静默降级。**

文章一的洞察：SEMANTIC 缺 EmbeddingModel 直接抛异常，因为静默降级违背用户预期；只有系统自动选择的路径才允许静默兜底`文章一`。

---

## 9. 切后处理：清理、去重、合并

> **规则 9.1：设一道所有策略必经的集中清理闸。**

各 chunker 自己的过滤逻辑参差不齐（kb-mvp 的 GenericChunker 走 Spring 的 TokenTextSplitter 就没有空块过滤）。kb-mvp 的 ChunkSanitizer 按序丢弃：空块 → 纯符号块 → 超短块（<5 字符）→ 文档内精确重复块；纪律是**"只过滤、去重、标记，绝不重写正文"**——重写会让 offset、高亮、父子映射全部失真`kb-mvp`。

> **规则 9.2：去重键要含位置信息，不能只看文本。**

super-agent 的去重键是 `canonicalPath + "||" + itemIndex + "||" + text``super-agent`——同一句话出现在两个章节是合法的（各自语境不同），同一位置的重复才是真重复。kb-mvp 用纯 text 去重，对"免责声明每章一遍"类文档会误删，是可改进点。

> **规则 9.3：丢弃要有统计并上报。** kb-mvp 把丢弃数按类别（空/纯符号/超短/重复）汇总成 `CHUNK_SANITIZED` warning`kb-mvp`——静默丢块和静默入库垃圾一样危险。

---

## 10. 元数据设计清单

合并四方实践，一个 chunk 入库时应携带四组元数据：

| 组 | 字段 | 用途 | 来源 |
|---|---|---|---|
| **溯源** | doc_id / file_id、filename、doc_token、source(channel)、updated_at | 定位原文、增量重建、新鲜度审计`文章二` | 四方共有 |
| **结构** | section_path（人读面包屑）、canonical_path（机器路径如 /document/1-2-3）、heading_level、heading_path、chunk_index、item_index | 引用展示、结构化路由、上下文扩展 | `kb-mvp``super-agent` |
| **拓扑** | parent_chunk_id / parentBlockId、level、searchable | small-to-big 检索、父块回填上下文 | `kb-mvp``super-agent` |
| **质量/审计** | chunker(策略名)、**strategy_version**、semantic_fallback / structure_fallback、token_count（精确计数，非估算）、char_count | 降级追踪、策略升级迁移、预算控制 | `文章一`(version) `kb-mvp`(其余) |

> **最易被忽略的两个字段**：① `strategy_version`——只有文章一做了；没有它，切块算法升级后无法识别旧块做迁移。② `canonical_path` 与 `section_path` 分离——super-agent 的设计；人读路径会随标题改名漂移，机器路径保持稳定。

---

## 11. 参数速查与起步值

| 参数 | `文章一` | `kb-mvp` | `super-agent` | 建议起步值 |
|---|---|---|---|---|
| 子块 chunkSize | 500 字符 | 512（索引）/ 200（再细分） | 递归 800 / 语义 700 | **500-800 字符** |
| overlap | 50（上限 size/2） | 80 / 30 | 120 | **size 的 10%-20%** |
| 最小块（防碎片） | 80-120 | 200（语义合并下限）/ 100（碎 section） | 240（语义） | **100-240** |
| 父块尺寸 | — | 3000（父块阈值） | 2200（递归）/ 1600（语义） | **1600-3000** |
| LLM 单次输入 | 3000（命题分批） | 3000 粗切（12000 硬上限） | 3500 | **3000-3500，超长预切而非截断** |
| 语义断点阈值 | percentile 95 | —（LLM 自主） | Jaccard 0.18 | percentile 95 起步 |
| 可索引最短块 | — | 5 字符 | — | 5（极保守，防误删表格单元） |
| 最大嵌套层级 | — | 3 | 2（父+子） | 2-3 |

---

## 12. 评测与迭代闭环

> **规则 12.1：切片优化必须有评测闭环，否则全是玄学。**

文章二给出方法论模板：QA 对（带 ground truth 文档 ID）+ Hit@K / MRR / Context Precision / Context Recall，按查询类型分维度看（代码细节/排障/概念/跨文档关联/导航）`文章二`。kb-mvp 的 Eval 子系统（cases/runs/diff/leaderboard/rank 直方图/score-separation）已具备同款能力且是真实检索——**把不同切块策略作为不同 run config 跑同一 case 集，就是切片 A/B 实验**`kb-mvp`。

> **规则 12.2：提供切块预览，让人在入库前看到结果。**

文章一的 `chunk-preview` 端点（预览与正式分块同一逻辑）`文章一` + super-agent 的"策略确认前可查询 plan"`super-agent`：预览是策略确认环节的眼睛。

> **规则 12.3：切完不是结束——保留人工修正通道，并让修正反哺策略。**

kb-mvp 的 split/merge 工作台是四方唯一的切后修正能力`kb-mvp`。进阶方向：统计哪些文档被人工修正最多，那就是自动策略的盲区（呼应文章二"新人提问暴露文档缺口"的反馈环思想`文章二`）。

---

## 13. 决策树与检查清单

### 策略决策树（综合四方）

```
文档进来
 ├─ 是否特定领域格式（报价单 xlsx / 表格型）？
 │   └─ 是 → 领域专用 chunker（启发式抽字段 + LLM 兜底）
 ├─ 有显式结构（md heading / docx 大纲 / pdf 书签，sections ≥ 2）？
 │   ├─ 是，且有 LLM 预算 → 结构父块 + 语义子块（父子双管线）
 │   ├─ 是，无 LLM → 结构切分 + 超长 section 递归子切
 │   └─ 否 ↓
 ├─ 无显式结构但像规整文档（pdf/doc，标题数 ≥ 2）？
 │   └─ 是 → 先跑启发式/信号结构检测，成功按上面走，失败 ↓
 ├─ 是否事实密集 + 高价值（法律/规格/制度）且有 LLM 预算？
 │   └─ 是 → 命题切分（LLM 拆原子事实再重组）
 ├─ 是否多主题长文 + 有 Embedding？
 │   └─ 是 → embedding 断点语义切分（percentile 95）
 └─ 其余一切 → 递归字符切分（500-800 字 / 10-20% overlap，中文标点优先级）

 所有路径共同尾巴：
   → 集中清理闸（空/符号/超短/同位置重复）
   → 元数据四组齐全（溯源/结构/拓扑/质量）
   → 降级痕迹三层（块标记 + warning + 日志）
```

![切片策略决策树：文档进来后逐级判断（领域格式/显式结构/规整文档/事实密集高价值/多主题长文），其余落到递归兜底；所有路径共同尾巴=清理闸+元数据四组+降级痕迹三层](/blogs/rag-chunking-guide/d6552c7484a5c9df.png)
### 上线前检查清单

| # | 检查项 | 不满足的代价 |
|---|---|---|
| 1 | 切前降噪：页眉页脚/页码/重复标题已剔除？ | 噪音块垄断 Top-K |
| 2 | 递归切分包含中文标点分隔符？ | 中文句子被腰斩 |
| 3 | overlap 在 size 的 10%-20%？上限 ≤ 1/2？ | 跨边界丢失 / 重复浪费 |
| 4 | LLM/语义输出有碎片合并 + 最小块下限？ | "一个标题一块"污染索引 |
| 5 | 超长输入预切而非 substring 截断？ | 文档尾部静默丢失 |
| 6 | 每个智能环节有降到"最近下一档"的降级链？ | 单点失败导致整文件索引失败 |
| 7 | 降级有块级标记 + 任务级 warning？ | 质量打折无人知晓 |
| 8 | 集中清理闸（只过滤不重写）？ | 空块/重复块入库 |
| 9 | 元数据含 parent_chunk_id / searchable / strategy_version？ | 没法做 small-to-big；算法升级没法迁移 |
| 10 | 有 chunk-preview + 策略确认环节？ | 错误策略批量入库才发现 |
| 11 | 有按策略对比的检索评测（Hit@K 分维度）？ | 优化全靠感觉 |
| 12 | 昂贵策略（LLM）默认关闭/不自动推荐？ | 成本失控 |

> **给 kb-mvp 的三条增量行动**（按本指南对照出的最短板）：
> 1. 切前降噪——借鉴 super-agent 的 NOISE 信号（页码/页眉/重复标题正则 + 频次），加在 DocumentExtractor 之后、chunker 之前；
> 2. 去重键加位置——ChunkSanitizer 的 `seen` 集合从纯 text 改为 `section_path + text`；
> 3. metadata 加 `strategy_version`——一行成本，为策略升级留迁移依据。

