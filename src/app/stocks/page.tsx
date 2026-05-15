'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/hooks/use-auth'
import StocksClient from './components/stocks-client'

export default function StocksPage() {
	const router = useRouter()
	const { isAuth } = useAuthStore()
	const [checked, setChecked] = useState(false)

	useEffect(() => {
		if (!isAuth) {
			toast.error('请先在首页导入密钥后再访问股票追踪')
			router.replace('/')
			return
		}
		setChecked(true)
	}, [isAuth, router])

	if (!checked) return null

	return (
		<div className='flex flex-col items-center justify-center px-6 pt-32 pb-12 max-sm:pt-28 max-sm:px-3'>
			<StocksClient />
		</div>
	)
}
