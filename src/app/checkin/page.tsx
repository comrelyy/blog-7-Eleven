'use client'

import CheckinClient from './components/checkin-client'

export default function CheckinPage() {
	return (
		<div className='flex flex-col items-center justify-center px-6 pt-32 pb-12 max-sm:pt-28'>
			<CheckinClient />
		</div>
	)
}