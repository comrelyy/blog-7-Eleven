 'use client'

import ArticlesList from './components/articles-list'

export default function Page() {
    return (
        <div className='flex flex-col items-center justify-center px-6 pt-32 pb-12'>
            <div className='w-full max-w-[1000px]'>
                <ArticlesList />
            </div>
        </div>
    )
}
