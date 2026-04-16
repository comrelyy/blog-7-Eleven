'use client'

/**
 * 极简卡哇伊动物贴纸 — 圆脸豆豆眼风
 * 统一 64x64 viewBox，一笔勾线 + 淡彩填充
 */

type Props = { size?: number }

const STROKE = '#3a3028'
const BLUSH = '#ffb3b3'

function Wrapper({ children, size = 56 }: { children: React.ReactNode; size?: number }) {
	return (
		<svg width={size} height={size} viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg' fill='none' stroke={STROKE} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
			{children}
		</svg>
	)
}

export function CatSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 脸 */}
			<circle cx='32' cy='34' r='20' fill='#fff5dc' />
			{/* 耳朵 */}
			<path d='M16 22 L12 12 L24 18 Z' fill='#fff5dc' />
			<path d='M48 22 L52 12 L40 18 Z' fill='#fff5dc' />
			<path d='M18 18 L15 14 L21 16 Z' fill='#ffb3b3' stroke='none' />
			<path d='M46 18 L49 14 L43 16 Z' fill='#ffb3b3' stroke='none' />
			{/* 豆豆眼 */}
			<circle cx='24' cy='32' r='2.2' fill={STROKE} stroke='none' />
			<circle cx='40' cy='32' r='2.2' fill={STROKE} stroke='none' />
			{/* 腮红 */}
			<circle cx='20' cy='38' r='3' fill={BLUSH} stroke='none' opacity='0.7' />
			<circle cx='44' cy='38' r='3' fill={BLUSH} stroke='none' opacity='0.7' />
			{/* 嘴 */}
			<path d='M28 40 Q32 43 36 40' />
			<circle cx='32' cy='38' r='1' fill={STROKE} stroke='none' />
		</Wrapper>
	)
}

export function DogSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 垂耳 */}
			<ellipse cx='14' cy='28' rx='7' ry='12' fill='#d4a373' transform='rotate(-15 14 28)' />
			<ellipse cx='50' cy='28' rx='7' ry='12' fill='#d4a373' transform='rotate(15 50 28)' />
			{/* 脸 */}
			<circle cx='32' cy='34' r='18' fill='#fdf2d5' />
			{/* 豆豆眼 */}
			<circle cx='25' cy='32' r='2.2' fill={STROKE} stroke='none' />
			<circle cx='39' cy='32' r='2.2' fill={STROKE} stroke='none' />
			{/* 鼻子 */}
			<ellipse cx='32' cy='38' rx='2.5' ry='2' fill={STROKE} stroke='none' />
			{/* 嘴 */}
			<path d='M32 40 L32 43 M28 44 Q32 46 36 44' />
			{/* 腮红 */}
			<circle cx='22' cy='38' r='2.5' fill={BLUSH} stroke='none' opacity='0.6' />
			<circle cx='42' cy='38' r='2.5' fill={BLUSH} stroke='none' opacity='0.6' />
		</Wrapper>
	)
}

export function BunnySticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 长耳 */}
			<ellipse cx='24' cy='14' rx='4' ry='12' fill='#fff' />
			<ellipse cx='40' cy='14' rx='4' ry='12' fill='#fff' />
			<ellipse cx='24' cy='14' rx='1.5' ry='8' fill='#ffb3b3' stroke='none' />
			<ellipse cx='40' cy='14' rx='1.5' ry='8' fill='#ffb3b3' stroke='none' />
			{/* 脸 */}
			<circle cx='32' cy='38' r='16' fill='#fff' />
			{/* 豆豆眼 */}
			<circle cx='25' cy='36' r='2' fill={STROKE} stroke='none' />
			<circle cx='39' cy='36' r='2' fill={STROKE} stroke='none' />
			{/* 嘴 Y 形 */}
			<path d='M32 41 L32 43 M29 45 Q32 47 35 45' />
			<circle cx='32' cy='42.5' r='1' fill='#ffb3b3' stroke='none' />
			{/* 腮红 */}
			<circle cx='22' cy='42' r='2.5' fill={BLUSH} stroke='none' opacity='0.7' />
			<circle cx='42' cy='42' r='2.5' fill={BLUSH} stroke='none' opacity='0.7' />
		</Wrapper>
	)
}

export function BearSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 小圆耳 */}
			<circle cx='17' cy='20' r='6' fill='#c89868' />
			<circle cx='47' cy='20' r='6' fill='#c89868' />
			<circle cx='17' cy='20' r='2.5' fill='#a07850' stroke='none' />
			<circle cx='47' cy='20' r='2.5' fill='#a07850' stroke='none' />
			{/* 脸 */}
			<circle cx='32' cy='36' r='18' fill='#e8c49a' />
			{/* 嘴周 */}
			<ellipse cx='32' cy='42' rx='9' ry='7' fill='#fdf2d5' stroke='none' />
			{/* 豆豆眼 */}
			<circle cx='25' cy='34' r='2' fill={STROKE} stroke='none' />
			<circle cx='39' cy='34' r='2' fill={STROKE} stroke='none' />
			{/* 鼻 */}
			<ellipse cx='32' cy='40' rx='2' ry='1.5' fill={STROKE} stroke='none' />
			{/* 嘴 */}
			<path d='M32 42 L32 44 M29 45 Q32 47 35 45' />
		</Wrapper>
	)
}

export function PandaSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 黑耳 */}
			<circle cx='17' cy='20' r='6' fill={STROKE} stroke='none' />
			<circle cx='47' cy='20' r='6' fill={STROKE} stroke='none' />
			{/* 脸 */}
			<circle cx='32' cy='36' r='18' fill='#fff' />
			{/* 黑眼圈 */}
			<ellipse cx='25' cy='34' rx='4' ry='5' fill={STROKE} stroke='none' transform='rotate(-15 25 34)' />
			<ellipse cx='39' cy='34' rx='4' ry='5' fill={STROKE} stroke='none' transform='rotate(15 39 34)' />
			{/* 眼 */}
			<circle cx='25' cy='34' r='1.3' fill='#fff' stroke='none' />
			<circle cx='39' cy='34' r='1.3' fill='#fff' stroke='none' />
			{/* 鼻 */}
			<ellipse cx='32' cy='40' rx='2' ry='1.5' fill={STROKE} stroke='none' />
			<path d='M32 42 L32 44 M29 45 Q32 47 35 45' />
		</Wrapper>
	)
}

export function FoxSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 尖耳 */}
			<path d='M14 28 L18 10 L26 22 Z' fill='#e88a5a' />
			<path d='M50 28 L46 10 L38 22 Z' fill='#e88a5a' />
			<path d='M18 24 L18 14 L22 22 Z' fill='#fff' stroke='none' />
			<path d='M46 24 L46 14 L42 22 Z' fill='#fff' stroke='none' />
			{/* 脸 */}
			<path d='M14 32 Q14 26 20 24 L44 24 Q50 26 50 32 Q50 48 32 52 Q14 48 14 32 Z' fill='#e88a5a' />
			{/* 白嘴周 */}
			<path d='M22 38 Q22 46 32 50 Q42 46 42 38 L38 40 L32 42 L26 40 Z' fill='#fff' stroke='none' />
			{/* 眼 */}
			<circle cx='25' cy='34' r='2' fill={STROKE} stroke='none' />
			<circle cx='39' cy='34' r='2' fill={STROKE} stroke='none' />
			{/* 鼻 */}
			<ellipse cx='32' cy='40' rx='2' ry='1.5' fill={STROKE} stroke='none' />
			<path d='M32 42 L32 44' />
		</Wrapper>
	)
}

export function FrogSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 身体 */}
			<ellipse cx='32' cy='38' rx='20' ry='16' fill='#a8d08d' />
			{/* 大眼睛（凸出） */}
			<circle cx='22' cy='22' r='8' fill='#a8d08d' />
			<circle cx='42' cy='22' r='8' fill='#a8d08d' />
			<circle cx='22' cy='22' r='5' fill='#fff' stroke='none' />
			<circle cx='42' cy='22' r='5' fill='#fff' stroke='none' />
			<circle cx='22' cy='22' r='2.5' fill={STROKE} stroke='none' />
			<circle cx='42' cy='22' r='2.5' fill={STROKE} stroke='none' />
			<circle cx='23' cy='21' r='0.8' fill='#fff' stroke='none' />
			<circle cx='43' cy='21' r='0.8' fill='#fff' stroke='none' />
			{/* 嘴 */}
			<path d='M22 40 Q32 46 42 40' />
			{/* 腮红 */}
			<circle cx='18' cy='38' r='2.5' fill={BLUSH} stroke='none' opacity='0.6' />
			<circle cx='46' cy='38' r='2.5' fill={BLUSH} stroke='none' opacity='0.6' />
		</Wrapper>
	)
}

export function ChickSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 身体 */}
			<ellipse cx='32' cy='38' rx='18' ry='16' fill='#ffe066' />
			{/* 头上绒毛 */}
			<path d='M28 20 L30 14 L32 20 L34 14 L36 20' fill='#ffe066' />
			{/* 眼 */}
			<circle cx='27' cy='34' r='2' fill={STROKE} stroke='none' />
			<circle cx='37' cy='34' r='2' fill={STROKE} stroke='none' />
			{/* 喙 */}
			<path d='M30 40 L32 44 L34 40 Z' fill='#f4a261' />
			{/* 腮红 */}
			<circle cx='22' cy='40' r='2.5' fill={BLUSH} stroke='none' opacity='0.7' />
			<circle cx='42' cy='40' r='2.5' fill={BLUSH} stroke='none' opacity='0.7' />
			{/* 翅 */}
			<path d='M18 38 Q14 42 18 46' />
			<path d='M46 38 Q50 42 46 46' />
		</Wrapper>
	)
}

export function PigSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 脸 */}
			<circle cx='32' cy='34' r='20' fill='#f7b2ad' />
			{/* 小尖耳 */}
			<path d='M14 22 L18 14 L22 22 Z' fill='#f7b2ad' />
			<path d='M50 22 L46 14 L42 22 Z' fill='#f7b2ad' />
			{/* 大猪鼻 */}
			<ellipse cx='32' cy='38' rx='8' ry='5' fill='#f08a8a' />
			<circle cx='29' cy='38' r='1.2' fill={STROKE} stroke='none' />
			<circle cx='35' cy='38' r='1.2' fill={STROKE} stroke='none' />
			{/* 眼 */}
			<circle cx='24' cy='30' r='2' fill={STROKE} stroke='none' />
			<circle cx='40' cy='30' r='2' fill={STROKE} stroke='none' />
			{/* 嘴 */}
			<path d='M28 44 Q32 46 36 44' />
		</Wrapper>
	)
}

export function DuckSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 身体 */}
			<ellipse cx='32' cy='40' rx='20' ry='14' fill='#fff6cc' />
			{/* 头 */}
			<circle cx='32' cy='24' r='14' fill='#fff6cc' />
			{/* 眼 */}
			<circle cx='27' cy='22' r='2' fill={STROKE} stroke='none' />
			<circle cx='37' cy='22' r='2' fill={STROKE} stroke='none' />
			{/* 鸭嘴 */}
			<ellipse cx='32' cy='30' rx='6' ry='3' fill='#f4a261' />
			<path d='M26 30 L38 30' />
			{/* 翅 */}
			<path d='M18 40 Q15 44 19 48' />
			<path d='M46 40 Q49 44 45 48' />
			{/* 腮红 */}
			<circle cx='22' cy='26' r='2' fill={BLUSH} stroke='none' opacity='0.6' />
			<circle cx='42' cy='26' r='2' fill={BLUSH} stroke='none' opacity='0.6' />
		</Wrapper>
	)
}

// ══════════ 植物 & 小物件 ══════════

export function FlowerSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 花瓣 */}
			{[0, 72, 144, 216, 288].map(a => (
				<ellipse key={a} cx='32' cy='22' rx='6' ry='9' fill='#ffb3c6' transform={`rotate(${a} 32 32)`} />
			))}
			{/* 花心 */}
			<circle cx='32' cy='32' r='5' fill='#ffe066' />
			{/* 脸 */}
			<circle cx='30' cy='31' r='1.2' fill={STROKE} stroke='none' />
			<circle cx='34' cy='31' r='1.2' fill={STROKE} stroke='none' />
			<path d='M30 34 Q32 35 34 34' />
			{/* 茎 */}
			<path d='M32 41 L32 56' stroke='#6db36d' />
			<path d='M32 48 Q26 46 24 50' stroke='#6db36d' fill='none' />
		</Wrapper>
	)
}

export function PlantSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 花盆 */}
			<path d='M20 40 L22 56 L42 56 L44 40 Z' fill='#d4956a' />
			<rect x='18' y='38' width='28' height='4' fill='#b87a4f' />
			{/* 盆脸 */}
			<circle cx='28' cy='48' r='1.5' fill={STROKE} stroke='none' />
			<circle cx='36' cy='48' r='1.5' fill={STROKE} stroke='none' />
			<path d='M28 51 Q32 53 36 51' />
			{/* 叶子 */}
			<path d='M32 38 Q20 28 22 18 Q30 20 32 32' fill='#8bc48a' />
			<path d='M32 38 Q44 28 42 18 Q34 20 32 32' fill='#a8d08d' />
			<path d='M32 38 Q32 22 32 18' fill='#6db36d' />
		</Wrapper>
	)
}

export function SunflowerSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 花瓣放射 */}
			{Array.from({ length: 10 }).map((_, i) => {
				const a = i * 36
				return <ellipse key={i} cx='32' cy='18' rx='4' ry='8' fill='#ffd93d' transform={`rotate(${a} 32 30)`} />
			})}
			{/* 花心 */}
			<circle cx='32' cy='30' r='8' fill='#8b6914' />
			<circle cx='29' cy='29' r='1.3' fill='#fff' stroke='none' />
			<circle cx='35' cy='29' r='1.3' fill='#fff' stroke='none' />
			<path d='M29 33 Q32 35 35 33' />
			{/* 茎 */}
			<path d='M32 41 L32 56' stroke='#6db36d' />
			<path d='M32 48 Q38 46 40 50' stroke='#6db36d' fill='none' />
		</Wrapper>
	)
}

export function CoffeeSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 杯身 */}
			<path d='M18 24 L20 50 Q20 54 24 54 L40 54 Q44 54 44 50 L46 24 Z' fill='#fff' />
			{/* 咖啡 */}
			<ellipse cx='32' cy='26' rx='13' ry='3' fill='#8b4513' stroke='none' />
			<path d='M19 24 L45 24' />
			{/* 把手 */}
			<path d='M44 32 Q52 32 52 40 Q52 46 44 46' fill='none' />
			{/* 杯脸 */}
			<circle cx='28' cy='40' r='1.5' fill={STROKE} stroke='none' />
			<circle cx='36' cy='40' r='1.5' fill={STROKE} stroke='none' />
			<path d='M28 43 Q32 45 36 43' />
			<circle cx='22' cy='42' r='2' fill={BLUSH} stroke='none' opacity='0.6' />
			<circle cx='42' cy='42' r='2' fill={BLUSH} stroke='none' opacity='0.6' />
			{/* 热气 */}
			<path d='M24 18 Q26 14 24 10' stroke='#c8c8c8' fill='none' />
			<path d='M32 18 Q34 14 32 10' stroke='#c8c8c8' fill='none' />
			<path d='M40 18 Q42 14 40 10' stroke='#c8c8c8' fill='none' />
		</Wrapper>
	)
}

export function MushroomSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 菌盖 */}
			<path d='M12 34 Q12 16 32 14 Q52 16 52 34 Z' fill='#e85a5a' />
			{/* 白斑 */}
			<circle cx='22' cy='24' r='3' fill='#fff' stroke='none' />
			<circle cx='40' cy='22' r='2.5' fill='#fff' stroke='none' />
			<circle cx='32' cy='30' r='2' fill='#fff' stroke='none' />
			<circle cx='44' cy='30' r='1.8' fill='#fff' stroke='none' />
			{/* 柄 */}
			<path d='M24 34 L22 52 L42 52 L40 34 Z' fill='#fff5dc' />
			{/* 脸 */}
			<circle cx='28' cy='42' r='1.5' fill={STROKE} stroke='none' />
			<circle cx='36' cy='42' r='1.5' fill={STROKE} stroke='none' />
			<path d='M29 46 Q32 47 35 46' />
			<circle cx='24' cy='44' r='2' fill={BLUSH} stroke='none' opacity='0.6' />
			<circle cx='40' cy='44' r='2' fill={BLUSH} stroke='none' opacity='0.6' />
		</Wrapper>
	)
}

export function CloudSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 云朵 */}
			<path d='M14 38 Q10 30 18 28 Q20 20 30 22 Q34 16 42 22 Q52 22 52 30 Q56 34 52 40 Q50 44 42 42 L18 42 Q12 44 14 38 Z' fill='#e6f0fa' />
			{/* 脸 */}
			<circle cx='25' cy='32' r='1.8' fill={STROKE} stroke='none' />
			<circle cx='39' cy='32' r='1.8' fill={STROKE} stroke='none' />
			<path d='M27 36 Q32 38 37 36' />
			{/* 腮红 */}
			<circle cx='20' cy='36' r='2.5' fill={BLUSH} stroke='none' opacity='0.7' />
			<circle cx='44' cy='36' r='2.5' fill={BLUSH} stroke='none' opacity='0.7' />
		</Wrapper>
	)
}

export function StarSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 五角星 */}
			<path d='M32 8 L38 24 L54 24 L42 34 L46 50 L32 40 L18 50 L22 34 L10 24 L26 24 Z' fill='#ffd93d' />
			{/* 脸 */}
			<circle cx='28' cy='30' r='1.6' fill={STROKE} stroke='none' />
			<circle cx='36' cy='30' r='1.6' fill={STROKE} stroke='none' />
			<path d='M28 33 Q32 36 36 33' />
			<circle cx='24' cy='33' r='2' fill={BLUSH} stroke='none' opacity='0.7' />
			<circle cx='40' cy='33' r='2' fill={BLUSH} stroke='none' opacity='0.7' />
		</Wrapper>
	)
}

export function BalloonSticker({ size }: Props) {
	return (
		<Wrapper size={size}>
			{/* 气球 */}
			<ellipse cx='32' cy='24' rx='14' ry='17' fill='#ff9999' />
			{/* 高光 */}
			<ellipse cx='26' cy='18' rx='3' ry='5' fill='#ffcccc' stroke='none' />
			{/* 脸 */}
			<circle cx='28' cy='24' r='1.5' fill={STROKE} stroke='none' />
			<circle cx='36' cy='24' r='1.5' fill={STROKE} stroke='none' />
			<path d='M28 28 Q32 30 36 28' />
			{/* 结 */}
			<path d='M30 41 L32 44 L34 41 Z' fill='#ff9999' />
			{/* 绳 */}
			<path d='M32 44 Q30 50 32 56' stroke='#999' fill='none' />
		</Wrapper>
	)
}

export const STICKERS = [
	CatSticker,
	DogSticker,
	BunnySticker,
	BearSticker,
	PandaSticker,
	FoxSticker,
	FrogSticker,
	ChickSticker,
	PigSticker,
	DuckSticker,
	FlowerSticker,
	PlantSticker,
	SunflowerSticker,
	CoffeeSticker,
	MushroomSticker,
	CloudSticker,
	StarSticker,
	BalloonSticker,
]
