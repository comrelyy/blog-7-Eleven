import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCheck, ChevronRight, Code2, Copy, Image, Maximize2, PanelLeft, Pencil, Plus, RotateCcw, Search, Smartphone, X } from 'lucide-react'

const themes = [
  { id: 'workspace', name: '目录工作台', description: '随时查找，快速切换', number: '01' },
  { id: 'journal', name: '纸感手记', description: '像翻开自己的手记', number: '02' },
  { id: 'focus', name: '专注阅读', description: '把空间留给文字', number: '03' }
]
const initialNotes = [
  { id: 'react-hooks', title: 'React Hooks 学习笔记', summary: '把常用的规则和踩过的坑，整理在这里。', tags: ['React', '前端'], group: '前端学习', date: '2026.11.02', content: 'React Hooks 让函数组件也能使用状态和其他 React 特性，是我在日常开发中最常用，也觉得很值得深入理解的部分。这里记录一些核心规则、常见用法，以及我在实践中遇到的坑，方便之后快速回顾。\n\n## 先记住这两条规则\n\n- **只在组件顶层调用 Hook。** 不要在循环、条件判断或嵌套函数中调用 Hook，这样可以保证每次渲染时 Hook 的调用顺序一致。\n- **只在 React 组件或自定义 Hook 中调用。** 不要在普通的 JavaScript 函数中调用 Hook，在 React 组件和自定义 Hook 中使用它。\n\n## 一个简单的例子\n\n下面是一个最基本的计数器示例，使用 `useState` 管理状态：\n\n```jsx\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}\n```\n\n> 先写下理解，再在实践中修正。\n\n## 关于依赖数组\n\n依赖数组描述了 Effect 使用到的响应式值。与其反复调整数组，不如先想清楚：这个 Effect 真正需要同步什么？\n\n- 把与当前交互有关的逻辑放进事件处理函数。\n- 保持每个 Effect 的职责清晰。\n- 给需要清理的订阅写好清理函数。' },
  { id: 'typescript', title: 'TypeScript 类型收窄', summary: '从实际例子理解类型收窄的几种方式。', tags: ['TypeScript', '前端'], group: '前端学习', date: '2026.11.01', content: '类型不是一开始就必须确定得很具体。通过检查值，我们可以在不同分支中逐步确定它的类型。\n\n## 从 typeof 开始\n\n`typeof` 是最直接的一种检查。检查之后，编辑器也能知道分支中这个值的类型。\n\n```typescript\nfunction format(value: string | number) {\n  if (typeof value === "number") {\n    return value.toFixed(2);\n  }\n  return value.trim();\n}\n```\n\n## 让状态说清楚自己\n\n用明确的状态字段区分不同情况，通常比维护几个布尔值更容易理解。\n\n- **先定义状态。** 让每个分支都有清晰含义。\n- **再定义数据。** 只在对应状态下携带需要的字段。\n\n> 好的类型设计，也是在帮助自己整理思路。' },
  { id: 'css-layout', title: 'CSS 布局备忘', summary: '常用布局方法与场景记录。', tags: ['CSS', '前端'], group: '前端学习', date: '2026.10.30', content: '布局可以从内容的关系开始考虑：它们应该排成一行，还是组成一个网格？\n\n## 一维布局用 Flex\n\n让一组操作横向排列，或者让两个元素分别靠近左右两端，Flex 都很方便。\n\n```css\n.toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n}\n```\n\n## 二维布局用 Grid\n\n需要同时控制行与列时，我会先考虑 Grid。\n\n- 给内容留出呼吸空间。\n- 用 `minmax(0, 1fr)` 避免内容撑破网格。\n- 在窄屏上根据内容重新安排布局。\n\n> 先让内容自然排列，再添加必要的约束。' },
  { id: 'git', title: 'Git 常用操作', summary: '日常开发中最常用的几个命令。', tags: ['Git', '工具'], group: '开发工具', date: '2026.10.28', content: '把常用的命令放在一起，忘记时就回来看看。\n\n## 开始工作之前\n\n先检查当前分支和工作区状态，再决定下一步。\n\n```bash\ngit status\ngit branch --show-current\ngit log --oneline -5\n```\n\n## 整理一次提交\n\n每次提交解决一个清楚的问题，后面回顾时会轻松很多。\n\n- 先检查差异，确认改了什么。\n- 用具体的提交信息描述结果。\n- 提交之前完成必要的验证。\n\n> 把提交记录写给未来的自己。' },
  { id: 'daily', title: '日常想法', summary: '一些学习与生活中的小记录。', tags: ['想法', '生活'], group: '日常记录', date: '2026.10.25', content: '今天重新整理了自己的笔记。发现很多东西不是忘记了，只是没有一个方便找回它们的地方。\n\n## 给记录留一点空间\n\n不必等到想得很完整才开始写。几句话、一个问题、一段代码，都可以成为一篇笔记的起点。\n\n> 记录，也是整理思路。\n\n## 最近想做的事\n\n- 每天留十分钟整理今天的收获。\n- 把遇到的问题写成自己的语言。\n- 让每篇笔记都留下一个可以继续思考的问题。' }
]
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => part.startsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part.startsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part)
}
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)
  async function copy() { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) } }
  return <div className="code-block"><div className="code-top"><span>{language || 'text'}</span><button className="icon-button" aria-label={copied ? '代码已复制' : '复制代码'} title="复制代码" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}</button></div><pre><code>{code.split(/("[^"\n]*"|'[^'\n]*'|\b(?:function|const|return|if|typeof)\b|\b\d+\b)/g).map((token, i) => <span key={i} className={/^(function|const|return|if|typeof)$/.test(token) ? 'syntax-keyword' : /^['"]/.test(token) ? 'syntax-string' : /^\d+$/.test(token) ? 'syntax-number' : ''}>{token}</span>)}</code></pre></div>
}
function Markdown({ content }) {
  const blocks = []; const lines = content.split('\n'); let headingIndex = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    if (line.startsWith('```')) { const language = line.slice(3); const code = []; while (++i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]); blocks.push(<CodeBlock key={i} language={language} code={code.join('\n')} />) }
    else if (/^#{1,3} /.test(line)) blocks.push(<h2 id={`section-${headingIndex++}`} key={i}>{inline(line.replace(/^#{1,3} /, ''))}</h2>)
    else if (line.startsWith('- ')) { const items = [line.slice(2)]; while (lines[i + 1]?.startsWith('- ')) items.push(lines[++i].slice(2)); blocks.push(<ul key={i}>{items.map((item, n) => <li key={n}>{inline(item)}</li>)}</ul>) }
    else if (line.startsWith('> ')) blocks.push(<blockquote key={i}>{inline(line.slice(2))}</blockquote>)
    else { const paragraph = [line]; while (lines[i + 1]?.trim() && !/^(#{1,3} |```|- |> )/.test(lines[i + 1])) paragraph.push(lines[++i]); blocks.push(<p key={i}>{inline(paragraph.join(' '))}</p>) }
  }
  return blocks
}
export function App() {
  const [theme, setTheme] = useState(() => themes.some(t => t.id === new URLSearchParams(location.search).get('theme')) ? new URLSearchParams(location.search).get('theme') : 'workspace')
  const [notes, setNotes] = useState(initialNotes), [selected, setSelected] = useState('react-hooks'), [query, setQuery] = useState(''), [tag, setTag] = useState('全部')
  const [mobile, setMobile] = useState(false), [drawer, setDrawer] = useState(false), [editing, setEditing] = useState(false), [draft, setDraft] = useState(null)
  const [reference, setReference] = useState(false), [toast, setToast] = useState(''), [activeSection, setActiveSection] = useState('section-0')
  const searchRef = useRef(null), scrollRef = useRef(null)
  const note = notes.find(n => n.id === selected) || notes[0], currentTheme = themes.find(t => t.id === theme)
  const tags = ['全部', ...new Set(notes.flatMap(n => n.tags))]
  const filtered = notes.filter(n => (tag === '全部' || n.tags.includes(tag)) && `${n.title} ${n.summary} ${n.content}`.toLowerCase().includes(query.trim().toLowerCase()))
  const headings = note.content.split('\n').filter(line => /^#{1,3} /.test(line)).map(line => line.replace(/^#{1,3} /, ''))
  const noteIndex = notes.findIndex(n => n.id === note.id)
  useEffect(() => { const url = new URL(location.href); url.searchParams.set('theme', theme); history.replaceState(null, '', url); setDrawer(false) }, [theme])
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); setActiveSection('section-0') }, [selected, theme])
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 2600); return () => clearTimeout(id) }, [toast])
  useEffect(() => {
    function handleKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setDrawer(true); setTimeout(() => searchRef.current?.focus(), 50) }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); if (editing) save() }
      if (event.key === 'Escape') { setReference(false); setDrawer(false) }
    }
    window.addEventListener('keydown', handleKey); return () => window.removeEventListener('keydown', handleKey)
  }, [editing, draft, selected])
  function pick(id) { if (editing) { setToast('请先保存或取消当前编辑'); return } setSelected(id); setDrawer(false) }
  function save() {
    if (!draft.title.trim()) { setToast('给这篇笔记起个名字吧'); return }
    setNotes(previous => previous.map(n => n.id === selected ? { ...n, ...draft, title: draft.title.trim(), date: '2026.11.02' } : n))
    setEditing(false); setDraft(null); setToast('已保存到演示，三个主题同步更新')
  }
  function edit() { setDraft({ title: note.title, summary: note.summary, content: note.content }); setEditing(true) }
  function createNote() {
    if (editing) { setToast('请先保存或取消当前编辑'); return }
    const id = `new-${Date.now()}`, item = { id, title: '未命名笔记', summary: '', tags: ['想法'], group: '日常记录', date: '2026.11.02', content: '' }
    setNotes(previous => [item, ...previous]); setSelected(id); setQuery(''); setTag('全部'); setDraft({ title: item.title, summary: '', content: '' }); setEditing(true); setDrawer(false)
  }
  function reset() { setNotes(initialNotes); setSelected('react-hooks'); setEditing(false); setDraft(null); setQuery(''); setTag('全部'); setDrawer(false); setToast('已恢复初始示例') }
  function jump(index) { const id = `section-${index}`; setActiveSection(id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const search = <label className="search-box"><Search size={17} /><input ref={searchRef} aria-label="搜索笔记" placeholder="搜索笔记…" value={query} onChange={event => setQuery(event.target.value)} />{query ? <button className="icon-button" aria-label="清除搜索" onClick={() => setQuery('')}><X size={14} /></button> : <kbd>⌘ K</kbd>}</label>
  const noteRows = items => items.map(item => <button key={item.id} className={`note-row ${item.id === selected ? 'selected' : ''}`} onClick={() => pick(item.id)} aria-current={item.id === selected ? 'page' : undefined}><div className="note-row-top"><span>{item.title}</span><time>{item.date.slice(5)}</time></div>{theme === 'workspace' && <p>{item.summary || '写下一个新的想法…'}</p>}</button>)
  const sidebar = <aside className={`sidebar ${drawer ? 'drawer-open' : ''}`} aria-label="笔记列表">
    {theme === 'workspace' ? <><div className="sidebar-brand"><span>77&&Eleven</span><i>/</i><span>笔记</span></div><div className="search-row">{search}<button className="new-icon icon-button" aria-label="新建笔记" title="新建笔记" onClick={createNote}><Pencil size={18} /></button></div></> : <><p className="sidebar-eyebrow">持续记录 · 慢慢积累</p><div className="sidebar-heading"><h2>我的手记</h2><button className="icon-button drawer-close" aria-label="关闭笔记列表" onClick={() => setDrawer(false)}><X size={20} /></button></div><button className="primary new-note" onClick={createNote}><Plus size={18} />写一篇笔记</button>{search}</>}
    {theme !== 'workspace' && tag !== '全部' && <div className="active-filter"><span>标签：{tag}</span><button className="icon-button" aria-label="清除标签筛选" onClick={() => setTag('全部')}><X size={13} /></button></div>}
    <div className="note-list">{theme === 'workspace' ? <><div className="list-label">{query ? `搜索结果 · ${filtered.length}` : '最近更新'}<span>{filtered.length} 篇</span></div>{noteRows(filtered)}</> : [...new Set(filtered.map(n => n.group))].map(group => <section className="note-group" key={group}><h3>{group}</h3>{noteRows(filtered.filter(n => n.group === group))}</section>)}{!filtered.length && <div className="empty"><Search size={26} /><strong>没有找到相关笔记</strong><p>试试其他关键词，或查看全部。</p><button onClick={() => { setQuery(''); setTag('全部') }}>清除筛选</button></div>}</div>
    {theme === 'workspace' && <div className="tag-section"><div className="list-label">标签</div><div className="tag-options">{tags.map(t => <button key={t} className={t === tag ? 'active' : ''} onClick={() => setTag(t)}>{t}</button>)}</div></div>}
    <div className="sidebar-footer">{theme === 'workspace' ? <><BookOpen size={16} /><span>记录，也是整理思路。</span></> : '记录，也是整理思路。'}</div>
  </aside>
  const actions = <div className="article-actions">{editing ? <><span className="editing-indicator">编辑中</span><button className="text-button" onClick={() => { setEditing(false); setDraft(null) }}>取消</button><button className="primary" onClick={save}><Check size={16} />保存笔记</button></> : <><span className="updated-at">更新于 {note.date}</span><button className={theme === 'journal' ? 'text-button edit-journal' : 'primary'} onClick={edit}><Pencil size={16} />{theme === 'journal' ? '编辑' : '编辑笔记'}</button></>}</div>
  const article = <article className={`document ${editing ? 'is-editing' : ''}`}>
    {theme === 'focus' && <div className="article-breadcrumb"><button onClick={() => setDrawer(true)}>全部笔记</button><ChevronRight size={12} /><span>{note.tags[note.tags.length - 1] || '笔记'}</span><ChevronRight size={12} /><span>{note.tags[0]}</span></div>}
    <header className="document-header">{theme !== 'workspace' && <div className="document-kicker">{theme === 'focus' && <span>LEARNING NOTES</span>}<time>{note.date}</time>{theme === 'journal' && <span>· 星期{({ '2026.11.02': '一', '2026.11.01': '日', '2026.10.30': '五', '2026.10.28': '三', '2026.10.25': '日' })[note.date] || '一'}</span>}</div>}
      {editing ? <><input className="edit-title" aria-label="笔记标题" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /><input className="edit-summary" aria-label="笔记摘要" placeholder="用一句话记录这篇笔记的内容（可选）" value={draft.summary} onChange={event => setDraft({ ...draft, summary: event.target.value })} /></> : <><h1>{note.title}</h1>{note.summary && <p className="document-summary">{note.summary}</p>}</>}
      <div className="document-tags">{note.tags.map(t => <button key={t} onClick={() => { setTag(t); setQuery(''); if (theme !== 'workspace') setDrawer(true) }}>{t}</button>)}</div>
    </header>
    {editing ? <div className="editor"><div className="editor-caption"><span><Code2 size={15} />Markdown</span><span>支持标题、列表、代码与引用</span></div><textarea aria-label="笔记正文" autoFocus placeholder="从一个想法开始写…" value={draft.content} onChange={event => setDraft({ ...draft, content: event.target.value })} /><div className="editor-footer"><span>{draft.content.length} 字符</span><span>保存仅用于原型演示，不会修改博客</span></div></div> : <><div className="prose"><Markdown content={note.content} /></div><nav className="adjacent-notes" aria-label="相邻笔记">{noteIndex > 0 ? <button onClick={() => pick(notes[noteIndex - 1].id)}><span><ArrowLeft size={13} />上一篇</span><strong>{notes[noteIndex - 1].title}</strong></button> : <span />}{noteIndex < notes.length - 1 && <button onClick={() => pick(notes[noteIndex + 1].id)}><span>下一篇<ArrowRight size={13} /></span><strong>{notes[noteIndex + 1].title}</strong></button>}</nav></>}
  </article>
  return <>
    <div className="comparison-bar"><div className="comparison-identity"><span className="comparison-mark"><BookOpen size={20} /></span><div><strong>笔记主题实验室</strong><span>同一篇笔记，三种阅读方式</span></div></div><div className="theme-switcher" role="group" aria-label="选择原型主题">{themes.map(t => <button key={t.id} className={theme === t.id ? 'active' : ''} aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}><span className="theme-number">{t.number}</span>{t.name}</button>)}</div><div className="comparison-actions"><button className={mobile ? 'active' : ''} aria-pressed={mobile} title={mobile ? '切换桌面宽度' : '查看手机宽度'} onClick={() => setMobile(!mobile)}>{mobile ? <Maximize2 size={17} /> : <Smartphone size={17} />}<span>{mobile ? '桌面' : '手机'}</span></button><button onClick={() => setReference(true)} title="查看原始视觉稿"><Image size={17} /><span>视觉稿</span></button><button className="reset-button" onClick={reset} title="恢复所有示例笔记" aria-label="重置示例"><RotateCcw size={16} /></button></div></div>
    <div className="comparison-caption"><span><span className="caption-dot" />{currentTheme.name}</span><p>{currentTheme.description}</p><span className="demo-label">交互演示 · 示例内容</span></div>
    <div className={`preview-stage ${mobile ? 'mobile-preview' : ''}`}><div className={`notebook theme-${theme} ${drawer ? 'has-drawer' : ''}`}>
      {theme !== 'workspace' && <header className="notebook-header"><div className="notebook-brand">77&&Eleven</div><span className="brand-divider" /><button className="nav-active" onClick={() => { setTag('全部'); setQuery(''); if (theme === 'focus') setDrawer(!drawer) }}>笔记</button>{theme === 'focus' ? <button className="all-notes" onClick={() => setDrawer(!drawer)} aria-expanded={drawer}><PanelLeft size={18} /><span>全部笔记</span></button> : <span className="header-note-count">{notes.length} 篇记录</span>}<div className="header-spacer" />{theme === 'focus' ? <><button className="icon-button header-search" aria-label="打开搜索" onClick={() => { setDrawer(true); setTimeout(() => searchRef.current?.focus(), 50) }}><Search size={21} /></button>{actions}</> : <div className="header-journal-search"><button className="text-button" onClick={() => { setDrawer(true); setTimeout(() => searchRef.current?.focus(), 50) }}><Search size={18} /><span>搜索笔记</span><kbd>⌘ K</kbd></button></div>}</header>}
      <div className="notebook-body">{drawer && <button className="drawer-backdrop" aria-label="关闭笔记列表" onClick={() => setDrawer(false)} />}{sidebar}<main className="reading-pane" ref={scrollRef}>
        {theme === 'workspace' && <div className="workspace-toolbar"><button className="icon-button mobile-menu" aria-label="打开笔记列表" onClick={() => setDrawer(true)}><PanelLeft size={20} /></button><div className="workspace-breadcrumb"><span>全部笔记</span><span>/</span><span>{note.title}</span></div>{actions}</div>}
        {theme === 'journal' && <div className="journal-toolbar"><button className="icon-button mobile-menu" aria-label="打开笔记列表" onClick={() => setDrawer(true)}><PanelLeft size={20} /></button>{actions}</div>}
        <div className="reading-layout">{article}{!editing && theme !== 'journal' && <aside className="toc" aria-label="文章目录"><p>{theme === 'workspace' ? '文章目录' : '本页目录'}</p>{headings.map((heading, i) => <button key={i} className={activeSection === `section-${i}` ? 'active' : ''} onClick={() => jump(i)}>{theme === 'focus' && <span>{String(i + 1).padStart(2, '0')}</span>}{heading}</button>)}</aside>}</div>
      </main></div>
    </div></div>
    {reference && <div className="modal-backdrop" onClick={() => setReference(false)}><section className="reference-modal" role="dialog" aria-modal="true" aria-label="当前主题视觉稿" onClick={event => event.stopPropagation()}><header><div><strong>{currentTheme.name}</strong><span>原始视觉稿 · 交互原型针对屏幕尺寸自适应</span></div><button className="icon-button" autoFocus aria-label="关闭视觉稿" onClick={() => setReference(false)}><X size={22} /></button></header><img src={`/mocks/${theme}.png`} alt={`${currentTheme.name}视觉稿`} /></section></div>}
    {toast && <div className="toast" role="status"><CheckCheck size={17} />{toast}</div>}
  </>
}
