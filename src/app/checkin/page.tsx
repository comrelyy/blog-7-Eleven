import CheckinClient from './components/checkin-client'

export default function CheckinPage() {
	return (
		<div className='flex flex-col items-center justify-center px-6 pt-32 pb-12 max-sm:pt-28'>
					<div className='w-full max-w-[840px]'>
						<div className='card relative w-full space-y-6 p-6'>
							<CheckinClient />
						</div>
					</div>
		</div>
	)
}
