'use client'

import StocksClient from './components/stocks-client'

export default function StocksPage() {
	return (
		<div className='flex flex-col items-center justify-center px-6 pt-32 pb-12 max-sm:pt-28 max-sm:px-3'>
			<StocksClient />
		</div>
	)
}
