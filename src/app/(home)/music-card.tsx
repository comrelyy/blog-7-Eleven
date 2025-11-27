import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { styles as hiCardStyles } from './hi-card'
import { styles as artCardStyles } from './art-card'
import { CARD_SPACING } from '@/consts'
import  MusicSVG  from '@/svgs/music.svg'
import PlaySVG from '@/svgs/play.svg'

export const styles = {
	width: 293,
	height: 66,
	order: 6
}

export default function MusicCard() {
	const center = useCenterStore()

	return (
		<Card
			order={styles.order}
			width={styles.width}
			height={styles.height}
			x={center.x + artCardStyles.width / 2 + CARD_SPACING}
			y={center.y - hiCardStyles.height / 2 - CARD_SPACING - artCardStyles.height / 2 - styles.height - CARD_SPACING / 2}
			className='flex items-center gap-3'>
			<MusicSVG className='h-8 w-8' />

			<div className='flex-1'>
				<div className='text-secondary text-sm'>随机音乐</div>

				<div className='mt-1 h-2 rounded-full bg-white/60'>
					<div className='bg-linear h-full w-1/2 rounded-full' />
				</div>
			</div>

			<button className='flex h-10 w-10 items-center justify-center rounded-full bg-white'>
				<PlaySVG className='text-brand ml-1 h-4 w-4' />
			</button>
		</Card>
	)
}