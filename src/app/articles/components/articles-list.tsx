'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useBlogIndex } from '@/hooks/use-blog-index'
import { motion } from 'motion/react'
import { ANIMATION_DELAY, INIT_DELAY } from '@/consts'

export default function ArticlesList() {
    const { items, loading } = useBlogIndex()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTag, setSelectedTag] = useState<string>('all')

    const allTags = Array.from(new Set(items.flatMap(i => i.tags || [])))

    const filtered = items.filter(item => {
        const matchesSearch = (item.title || item.slug).toLowerCase().includes(searchTerm.toLowerCase()) || (item.summary || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesTag = selectedTag === 'all' || (item.tags || []).includes(selectedTag)
        return matchesSearch && matchesTag
    })

    // Group by theme: prefer explicit `theme`, otherwise fall back to first tag, else '未分类'
    const grouped = filtered.reduce<Record<string, typeof items>>((acc, item) => {
        const themeKey = item.theme || (item.tags && item.tags[0]) || '未分类'
        if (!acc[themeKey]) acc[themeKey] = []
        acc[themeKey].push(item)
        return acc
    }, {})

    const groupKeys = Object.keys(grouped).sort()

    return (
        <div className='mx-auto w-full px-6 pb-12'>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: INIT_DELAY }} className='mb-6 text-center'>
                <h1 className='mb-2 text-4xl font-bold'>我的博客</h1>
                <p className='text-secondary'>按主题分组的文章目录 — 可搜索与按标签筛选</p>
            </motion.div>

            <div className='mb-6 space-y-4'>
                <input
                    type='text'
                    placeholder='搜索文章标题或摘要...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='focus:ring-brand mx-auto block w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none'
                />

                <div className='flex flex-wrap justify-center gap-2'>
                    <button
                        onClick={() => setSelectedTag('all')}
                        className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                            selectedTag === 'all' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}>
                        全部
                    </button>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                                selectedTag === tag ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}>
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Render groups as directory-like sections */}
            <div className='space-y-8'>
                {groupKeys.map((groupKey, gIdx) => (
                    <section key={groupKey} className=''>
                        <motion.h2
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: INIT_DELAY + ANIMATION_DELAY * gIdx }}
                            className='mb-4 text-2xl font-semibold'>
                            {groupKey}
                        </motion.h2>

                        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                            {grouped[groupKey].map((item, idx) => (
                                <motion.article
                                    key={item.slug}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: INIT_DELAY + ANIMATION_DELAY * (gIdx * 6 + idx) }}
                                    className='card relative flex flex-col gap-3 p-6'>
                                    <div className='flex items-start justify-between gap-4'>
                                        <div>
                                            <Link href={`/blog/${item.slug}`} className='text-lg font-semibold hover:text-brand'>
                                                {item.title || item.slug}
                                            </Link>
                                            <div className='text-secondary mt-2 text-sm'>{item.summary}</div>
                                        </div>
                                        <div className='text-secondary text-xs'>{new Date(item.date).toLocaleDateString()}</div>
                                    </div>

                                    <div className='flex flex-wrap gap-2'>
                                        {(item.tags || []).map(t => (
                                            <span key={t} className='text-secondary text-sm'>
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {!loading && filtered.length === 0 && (
                <div className='mt-12 text-center text-gray-500'>
                    <p>暂无匹配的文章</p>
                </div>
            )}
        </div>
    )
}
