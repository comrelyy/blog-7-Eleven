'use client'

import type { PoetryMood } from './poetry-mood'

export function PoetryScene({ mood }: { mood: PoetryMood }) {
	switch (mood) {
		case 'moon':
			return <MoonScene />
		case 'spring':
			return <SpringScene />
		case 'autumn':
			return <AutumnScene />
		case 'winter':
			return <WinterScene />
		case 'war':
			return <WarScene />
		case 'river':
			return <RiverScene />
		case 'mountain':
			return <MountainScene />
		case 'rain':
			return <RainScene />
		case 'sunset':
			return <SunsetScene />
		case 'love':
			return <LoveScene />
		case 'farewell':
			return <FarewellScene />
		case 'nostalgia':
			return <NostalgiaScene />
		case 'pastoral':
			return <PastoralScene />
		case 'plum':
			return <PlumScene />
		case 'orchid':
			return <OrchidScene />
		case 'chrysanthemum':
			return <ChrysanthemumScene />
		default:
			return <DefaultScene />
	}
}

function SceneWrapper({ children }: { children: React.ReactNode }) {
	return (
		<svg viewBox='0 0 400 200' className='h-full w-full' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'>
			<defs>
				{/* 水墨毛笔飞白效果 */}
				<filter id='inkBrush'>
					<feTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='4' result='noise' />
					<feDisplacementMap in='SourceGraphic' in2='noise' scale='2' xChannelSelector='R' yChannelSelector='G' />
				</filter>
				{/* 淡墨晕染 */}
				<filter id='inkWash'>
					<feGaussianBlur stdDeviation='0.8' />
				</filter>
			</defs>
			{children}
		</svg>
	)
}

// 水墨山形 — 笔触边缘
function InkMountain({ d, fill = '#2c2c2c', opacity = 0.15 }: { d: string; fill?: string; opacity?: number }) {
	return <path d={d} fill={fill} opacity={opacity} filter='url(#inkBrush)' />
}

/* ═══════════ 写意人物 — 毛笔一气呵成的流畅线条 ═══════════ */

// 文人 — 宽袍大袖、束发、微躬，一笔写意
function Scholar({ x, y, scale = 1, opacity = 0.45, flip }: { x: number; y: number; scale?: number; opacity?: number; flip?: boolean }) {
	return (
		<g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`} opacity={opacity} filter='url(#inkWash)'>
			{/* 发髻 — 一撇 */}
			<path d='M1,-36 Q-1,-40 2,-42 Q5,-40 3,-36' fill='#1a1a1a' />
			{/* 头 — 侧脸轮廓 */}
			<path d='M-2,-34 Q-5,-30 -3,-25 Q0,-23 3,-25 Q5,-30 2,-34 Q0,-36 -2,-34Z' fill='#1a1a1a' />
			{/* 颈 → 身体 → 袍摆 — 一笔写下 */}
			<path d='M0,-23 C-2,-18 -3,-12 -5,-5 Q-8,4 -12,15 Q-8,17 0,18 Q8,17 12,15 Q8,4 5,-5 C3,-12 2,-18 0,-23Z' fill='#1a1a1a' />
			{/* 左袖 — 飘逸弧线 */}
			<path d='M-3,-16 C-8,-14 -14,-10 -18,-5 Q-20,-2 -17,0' stroke='#1a1a1a' strokeWidth='2.5' strokeLinecap='round' fill='none' />
			{/* 右袖 — 伸展 */}
			<path d='M3,-16 C8,-14 14,-10 19,-7 Q22,-5 20,-2' stroke='#1a1a1a' strokeWidth='2.5' strokeLinecap='round' fill='none' />
			{/* 折扇 — 扇面弧线 */}
			<path d='M20,-3 Q26,-10 24,-2 Q22,2 20,-3' fill='#1a1a1a' opacity='0.6' />
		</g>
	)
}

// 渔翁 — 斗笠蓑衣、持竿垂钓，寥寥数笔
function Fisherman({ x, y, scale = 1, opacity = 0.4 }: { x: number; y: number; scale?: number; opacity?: number }) {
	return (
		<g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity} filter='url(#inkWash)'>
			{/* 斗笠 — 一横一弧 */}
			<path d='M-10,-28 Q0,-35 10,-28' stroke='#1a1a1a' strokeWidth='2' fill='none' strokeLinecap='round' />
			<path d='M-10,-28 Q0,-26 10,-28' fill='#1a1a1a' opacity='0.4' />
			{/* 头 */}
			<path d='M-2,-26 Q0,-22 2,-26' fill='#1a1a1a' />
			{/* 蓑衣 — 蓬松散笔 */}
			<path d='M0,-22 C-4,-15 -7,-6 -8,2 Q-10,8 -7,12 Q-3,14 0,15 Q3,14 7,12 Q10,8 8,2 C7,-6 4,-15 0,-22Z' fill='#1a1a1a' />
			{/* 蓑衣纹理 — 短笔触 */}
			<path d='M-6,-10 Q-8,-6 -9,0' stroke='#333' strokeWidth='0.6' fill='none' opacity='0.4' />
			<path d='M-4,-14 Q-7,-8 -8,-2' stroke='#333' strokeWidth='0.6' fill='none' opacity='0.3' />
			<path d='M4,-12 Q7,-6 8,0' stroke='#333' strokeWidth='0.6' fill='none' opacity='0.3' />
			{/* 鱼竿 — 一笔长弧 */}
			<path d='M6,-16 Q18,-28 28,-38 Q34,-42 38,-44' stroke='#1a1a1a' strokeWidth='1.2' fill='none' strokeLinecap='round' />
			{/* 鱼线 — 细丝垂落 */}
			<path d='M38,-44 Q39,-34 37,-24 Q36,-18 37,-14' stroke='#1a1a1a' strokeWidth='0.4' fill='none' />
		</g>
	)
}

// 仕女 — 盘发飘裙、身姿婀娜，写意曲线
function Lady({ x, y, scale = 1, opacity = 0.4 }: { x: number; y: number; scale?: number; opacity?: number }) {
	return (
		<g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity} filter='url(#inkWash)'>
			{/* 盘发云髻 */}
			<path d='M-1,-38 Q-4,-42 0,-44 Q4,-42 2,-38' fill='#1a1a1a' />
			{/* 发簪 — 斜笔 */}
			<path d='M2,-41 Q6,-44 8,-43' stroke='#1a1a1a' strokeWidth='0.8' fill='none' strokeLinecap='round' />
			<circle cx='8.5' cy='-43' r='1' fill='#1a1a1a' opacity='0.6' />
			{/* 头 — 侧脸 */}
			<path d='M-2,-36 Q-4,-32 -3,-28 Q0,-26 3,-28 Q4,-32 2,-36 Q0,-38 -2,-36Z' fill='#1a1a1a' />
			{/* 身体+长裙 — S形曲线一笔 */}
			<path d='M0,-26 C-2,-20 -3,-12 -4,-4 Q-6,6 -10,16 Q-12,22 -14,26 Q-6,24 0,26 Q6,24 14,26 Q12,22 10,16 Q6,6 4,-4 C3,-12 2,-20 0,-26Z' fill='#1a1a1a' />
			{/* 飘带 — 写意飞动 */}
			<path d='M-4,-20 Q-12,-16 -18,-20 Q-22,-18 -20,-14' stroke='#1a1a1a' strokeWidth='1' fill='none' strokeLinecap='round'>
				<animate attributeName='d' values='M-4,-20 Q-12,-16 -18,-20 Q-22,-18 -20,-14;M-4,-20 Q-14,-15 -20,-18 Q-24,-16 -22,-12' dur='4s' repeatCount='indefinite' />
			</path>
			{/* 裙摆飘逸 */}
			<path d='M-14,26 Q-16,28 -15,30' stroke='#1a1a1a' strokeWidth='0.8' fill='none' opacity='0.5' />
			<path d='M14,26 Q16,28 18,27' stroke='#1a1a1a' strokeWidth='0.8' fill='none' opacity='0.5' />
		</g>
	)
}

// 将士 — 盔缨铠甲、持戟，粗笔刚劲
function Warrior({ x, y, scale = 1, opacity = 0.45 }: { x: number; y: number; scale?: number; opacity?: number }) {
	return (
		<g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity} filter='url(#inkWash)'>
			{/* 盔缨 — 飘动 */}
			<path d='M0,-42 Q4,-48 2,-52 Q0,-48 -2,-52 Q-4,-48 0,-42' fill='#1a1a1a' opacity='0.6'>
				<animate attributeName='d' values='M0,-42 Q4,-48 2,-52 Q0,-48 -2,-52 Q-4,-48 0,-42;M0,-42 Q5,-49 3,-53 Q0,-49 -3,-53 Q-5,-49 0,-42' dur='3s' repeatCount='indefinite' />
			</path>
			{/* 头盔 */}
			<path d='M-5,-34 Q0,-40 5,-34 Q3,-30 -3,-30Z' fill='#1a1a1a' />
			{/* 头 */}
			<path d='M-3,-30 Q-4,-27 0,-25 Q4,-27 3,-30' fill='#1a1a1a' />
			{/* 铠甲身体 — 刚硬笔触 */}
			<path d='M-6,-25 C-7,-15 -7,-5 -6,5 Q-4,10 0,12 Q4,10 6,5 C7,-5 7,-15 6,-25Z' fill='#1a1a1a' />
			{/* 肩甲 — 方笔 */}
			<path d='M-6,-25 Q-12,-24 -13,-20 Q-10,-19 -6,-21' fill='#1a1a1a' />
			<path d='M6,-25 Q12,-24 13,-20 Q10,-19 6,-21' fill='#1a1a1a' />
			{/* 长戟 — 粗笔一竖 */}
			<path d='M12,-20 L12,-55' stroke='#1a1a1a' strokeWidth='1.5' strokeLinecap='round' />
			{/* 戟刃 — 锋利 */}
			<path d='M10,-55 L12,-60 L14,-55 L12,-53Z' fill='#1a1a1a' />
			<path d='M9,-52 Q12,-50 11,-48' stroke='#1a1a1a' strokeWidth='0.8' fill='none' />
		</g>
	)
}

// 祥云纹 — 如意卷草
function CloudPattern({ x, y, scale = 1, opacity = 0.15 }: { x: number; y: number; scale?: number; opacity?: number }) {
	return (
		<g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
			<path d='M0,0 Q-3,-6 0,-10 Q4,-12 7,-8 Q10,-12 14,-10 Q17,-6 12,0' stroke='#1a1a1a' strokeWidth='1' fill='none' strokeLinecap='round' />
			<path d='M12,0 Q16,-4 20,-2 Q22,0 18,2' stroke='#1a1a1a' strokeWidth='0.8' fill='none' strokeLinecap='round' />
			{/* 如意尾 */}
			<path d='M-2,0 Q-5,2 -4,4' stroke='#1a1a1a' strokeWidth='0.6' fill='none' />
		</g>
	)
}

// 墨竹 — 竿节分明、叶如刀锋
function Bamboo({ x, y, opacity = 0.25 }: { x: number; y: number; opacity?: number }) {
	return (
		<g transform={`translate(${x},${y})`} opacity={opacity} filter='url(#inkWash)'>
			{/* 竿 — 中锋用笔 */}
			<path d='M0,0 L-1,-15 L0,-16 L1,-15 L0,-30 L-1,-31 L0,-32 L1,-31 L0,-48 L-0.5,-55 L0,-60' stroke='#1a1a1a' strokeWidth='2' fill='none' strokeLinecap='round' />
			{/* 竹节 */}
			<line x1='-2' y1='-16' x2='2' y2='-16' stroke='#1a1a1a' strokeWidth='1.5' strokeLinecap='round' />
			<line x1='-2' y1='-32' x2='2' y2='-32' stroke='#1a1a1a' strokeWidth='1.5' strokeLinecap='round' />
			<line x1='-1.5' y1='-48' x2='1.5' y2='-48' stroke='#1a1a1a' strokeWidth='1.2' strokeLinecap='round' />
			{/* 竹叶 — 撇捺写意 */}
			<path d='M0,-20 Q-5,-23 -14,-21' stroke='#1a1a1a' strokeWidth='2' fill='none' strokeLinecap='round' />
			<path d='M-1,-22 Q-4,-27 -11,-28' stroke='#1a1a1a' strokeWidth='1.5' fill='none' strokeLinecap='round' />
			<path d='M0,-36 Q6,-40 13,-37' stroke='#1a1a1a' strokeWidth='2' fill='none' strokeLinecap='round' />
			<path d='M1,-38 Q5,-44 10,-45' stroke='#1a1a1a' strokeWidth='1.5' fill='none' strokeLinecap='round' />
			<path d='M0,-50 Q-6,-54 -11,-51' stroke='#1a1a1a' strokeWidth='1.5' fill='none' strokeLinecap='round' />
			<path d='M-1,-52 Q-4,-57 -8,-56' stroke='#1a1a1a' strokeWidth='1.2' fill='none' strokeLinecap='round' />
		</g>
	)
}

// 亭台 — 飞檐翘角，笔意舒展
function Pavilion({ x, y, scale = 1, opacity = 0.3 }: { x: number; y: number; scale?: number; opacity?: number }) {
	return (
		<g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity} filter='url(#inkWash)'>
			{/* 飞檐 — 两笔弧线上翘 */}
			<path d='M-24,-30 Q-20,-34 -12,-32 Q0,-38 12,-32 Q20,-34 24,-30' stroke='#1a1a1a' strokeWidth='1.8' fill='none' strokeLinecap='round' />
			{/* 屋脊 */}
			<path d='M-16,-32 Q0,-36 16,-32' fill='#1a1a1a' opacity='0.3' />
			{/* 柱 — 中锋竖笔 */}
			<line x1='-10' y1='-30' x2='-10' y2='0' stroke='#1a1a1a' strokeWidth='1.5' strokeLinecap='round' />
			<line x1='10' y1='-30' x2='10' y2='0' stroke='#1a1a1a' strokeWidth='1.5' strokeLinecap='round' />
			{/* 栏杆 — 细笔 */}
			<line x1='-10' y1='-8' x2='10' y2='-8' stroke='#1a1a1a' strokeWidth='0.6' />
			{/* 台基 */}
			<path d='M-14,0 L14,0' stroke='#1a1a1a' strokeWidth='2' strokeLinecap='round' />
		</g>
	)
}

// 墨梅 — 虬枝横斜、花蕊点点
function PlumBlossom({ x, y, scale = 1, opacity = 0.3 }: { x: number; y: number; scale?: number; opacity?: number }) {
	return (
		<g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity} filter='url(#inkWash)'>
			{/* 主干 — 苍劲虬曲 */}
			<path d='M0,0 Q-4,-10 -2,-20 Q2,-28 -4,-36 Q-8,-42 -6,-50' stroke='#1a1a1a' strokeWidth='2.5' fill='none' strokeLinecap='round' />
			{/* 分枝 — 横斜逸出 */}
			<path d='M-2,-20 Q4,-24 12,-22 Q18,-20 22,-22' stroke='#1a1a1a' strokeWidth='1.5' fill='none' strokeLinecap='round' />
			<path d='M-4,-36 Q-10,-34 -16,-36 Q-20,-38 -22,-36' stroke='#1a1a1a' strokeWidth='1.2' fill='none' strokeLinecap='round' />
			<path d='M-2,-20 Q-8,-16 -14,-18' stroke='#1a1a1a' strokeWidth='1' fill='none' strokeLinecap='round' />
			{/* 梅花 — 圈点法，五瓣如圈 */}
			{[[12, -24], [20, -22], [16, -26], [-15, -37], [-20, -35], [-12, -40], [-6, -48], [-10, -18], [6, -28]].map(([cx, cy], i) => (
				<g key={i}>
					<circle cx={cx} cy={cy} r={2.2} fill='none' stroke='#1a1a1a' strokeWidth='0.8' opacity={0.7 + (i % 3) * 0.1} />
					{/* 花蕊 — 点 */}
					<circle cx={cx} cy={cy} r={0.6} fill='#1a1a1a' opacity='0.5' />
				</g>
			))}
			{/* 花苞 — 小点 */}
			{[[24, -21], [-22, -34], [-8, -52]].map(([cx, cy], i) => (
				<circle key={i} cx={cx} cy={cy} r={1.2} fill='#1a1a1a' opacity='0.4' />
			))}
		</g>
	)
}

// 兰草 — 撇叶如剑、花茎纤细
function Orchid({ x, y, scale = 1, opacity = 0.25 }: { x: number; y: number; scale?: number; opacity?: number }) {
	return (
		<g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity} filter='url(#inkWash)'>
			{/* 兰叶 — 一笔长撇，起笔重收笔轻 */}
			<path d='M0,0 Q-6,-15 -18,-30 Q-22,-36 -28,-38' stroke='#1a1a1a' strokeWidth='2' fill='none' strokeLinecap='round' />
			<path d='M2,0 Q8,-18 20,-32 Q24,-36 30,-37' stroke='#1a1a1a' strokeWidth='1.8' fill='none' strokeLinecap='round' />
			<path d='M0,-2 Q-2,-16 -8,-28 Q-12,-34 -10,-38' stroke='#1a1a1a' strokeWidth='1.5' fill='none' strokeLinecap='round' />
			<path d='M1,-1 Q5,-14 14,-26 Q18,-30 16,-34' stroke='#1a1a1a' strokeWidth='1.3' fill='none' strokeLinecap='round' />
			{/* 交叉叶 — 破凤眼 */}
			<path d='M-1,0 Q4,-12 2,-24 Q-2,-32 -6,-36' stroke='#1a1a1a' strokeWidth='1.2' fill='none' strokeLinecap='round' />
			{/* 花茎 */}
			<path d='M0,-2 Q-1,-10 2,-18 Q3,-22 2,-26' stroke='#1a1a1a' strokeWidth='0.8' fill='none' />
			{/* 兰花 — 点厾法 */}
			<path d='M2,-26 Q0,-30 -2,-28 Q0,-26 2,-28 Q4,-30 2,-26' stroke='#1a1a1a' strokeWidth='0.8' fill='none' />
			<path d='M1,-27 Q3,-32 5,-30' stroke='#1a1a1a' strokeWidth='0.6' fill='none' />
			<path d='M1,-27 Q-1,-32 -3,-30' stroke='#1a1a1a' strokeWidth='0.6' fill='none' />
			{/* 花蕊点 */}
			<circle cx='1.5' cy='-28' r='0.5' fill='#1a1a1a' />
		</g>
	)
}

// 秋菊 — 花瓣放射、叶片锯齿
function Chrysanthemum({ x, y, scale = 1, opacity = 0.25 }: { x: number; y: number; scale?: number; opacity?: number }) {
	return (
		<g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity} filter='url(#inkWash)'>
			{/* 茎 */}
			<path d='M0,0 Q-1,-12 0,-24 Q1,-30 0,-36' stroke='#1a1a1a' strokeWidth='1.2' fill='none' strokeLinecap='round' />
			{/* 叶 — 锯齿边 */}
			<path d='M0,-12 Q-6,-14 -12,-10 Q-10,-8 -6,-10 Q-4,-8 0,-12' fill='#1a1a1a' opacity='0.5' />
			<path d='M0,-20 Q6,-22 12,-18 Q10,-16 6,-18 Q4,-16 0,-20' fill='#1a1a1a' opacity='0.5' />
			{/* 花头 — 放射状花瓣，勾线法 */}
			{Array.from({ length: 12 }, (_, i) => {
				const angle = (i * 30 * Math.PI) / 180
				const r1 = 4
				const r2 = 8 + (i % 3)
				const x1 = Math.cos(angle) * r1
				const y1 = -36 + Math.sin(angle) * r1
				const x2 = Math.cos(angle) * r2
				const y2 = -36 + Math.sin(angle) * r2
				const cx = Math.cos(angle + 0.2) * (r1 + r2) / 2
				const cy = -36 + Math.sin(angle + 0.2) * (r1 + r2) / 2
				return (
					<path key={i} d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`} stroke='#1a1a1a' strokeWidth={i % 2 === 0 ? '1' : '0.7'} fill='none' strokeLinecap='round' />
				)
			})}
			{/* 花心 */}
			<circle cx='0' cy='-36' r='3' fill='#1a1a1a' opacity='0.2' />
			{/* 花蕊点 */}
			{[[0, -36], [-1, -37], [1, -35]].map(([cx, cy], i) => (
				<circle key={i} cx={cx} cy={cy} r='0.5' fill='#1a1a1a' opacity='0.5' />
			))}
		</g>
	)
}

// ═══════════ 场景 ═══════════

// 月夜：文人望月、亭台、竹影、梅
function MoonScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='nightSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#0a1628' />
					<stop offset='60%' stopColor='#162544' />
					<stop offset='100%' stopColor='#1a3a5c' />
				</linearGradient>
				<radialGradient id='moonGlow' cx='78%' cy='22%' r='25%'>
					<stop offset='0%' stopColor='#ffeaa7' stopOpacity='0.5' />
					<stop offset='100%' stopColor='#ffeaa7' stopOpacity='0' />
				</radialGradient>
			</defs>
			<rect width='400' height='200' fill='url(#nightSky)' />
			<rect width='400' height='200' fill='url(#moonGlow)' />
			{/* 星辰 */}
			{[[50, 28], [130, 15], [200, 40], [260, 20], [340, 32], [90, 55], [380, 18]].map(([cx, cy], i) => (
				<circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 1 : 0.6} fill='#ffeaa7' opacity='0.4'>
					<animate attributeName='opacity' values='0.3;0.7;0.3' dur={`${2 + (i % 3)}s`} repeatCount='indefinite' />
				</circle>
			))}
			{/* 明月 */}
			<circle cx='320' cy='42' r='20' fill='#ffeaa7' opacity='0.85' />
			<circle cx='327' cy='38' r='16' fill='#162544' opacity='0.25' />
			{/* 水墨远山 */}
			<InkMountain d='M0,155 Q60,110 130,140 Q200,100 280,130 Q340,110 400,135 L400,200 L0,200Z' fill='#0d1f38' opacity={0.7} />
			<InkMountain d='M0,172 Q100,148 200,165 Q300,145 400,160 L400,200 L0,200Z' fill='#091526' opacity={0.8} />
			{/* 云纹 */}
			<CloudPattern x={60} y={70} opacity={0.08} />
			<CloudPattern x={230} y={55} scale={0.8} opacity={0.06} />
			{/* 亭台 */}
			<Pavilion x={120} y={158} scale={0.7} opacity={0.5} />
			{/* 文人望月 */}
			<Scholar x={160} y={155} scale={0.8} opacity={0.55} />
			{/* 竹影 */}
			<Bamboo x={360} y={165} opacity={0.2} />
			{/* 墨梅 */}
			<PlumBlossom x={40} y={162} scale={0.6} opacity={0.3} />
		</SceneWrapper>
	)
}

// 春景：仕女踏青、柳枝、桃花、蝴蝶
function SpringScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='springSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#e8f5e9' />
					<stop offset='50%' stopColor='#f1f8e9' />
					<stop offset='100%' stopColor='#fff8e1' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#springSky)' />
			{/* 水墨远山 */}
			<InkMountain d='M0,120 Q80,80 160,105 Q240,75 320,100 Q370,85 400,95 L400,200 L0,200Z' opacity={0.08} />
			{/* 翠绿丘陵 */}
			<path d='M-20,160 Q60,120 140,140 Q220,110 300,135 Q360,118 420,138 L420,200 L-20,200Z' fill='#66bb6a' opacity='0.2' />
			<path d='M-20,175 Q100,150 200,163 Q300,145 420,162 L420,200 L-20,200Z' fill='#81c784' opacity='0.25' />
			{/* 柳树 */}
			<line x1='55' y1='80' x2='55' y2='168' stroke='#5d4037' strokeWidth='2' opacity='0.3' />
			{[[50, 110, 40, 145], [55, 95, 48, 135], [58, 100, 65, 140], [53, 85, 42, 125]].map(([x1, y1, x2, y2], i) => (
				<path key={i} d={`M${x1},${y1} Q${(x1 + x2) / 2 + (i % 2 ? 5 : -5)},${(y1 + y2) / 2 + 10} ${x2},${y2}`} stroke='#4caf50' strokeWidth='0.8' fill='none' opacity='0.3'>
					<animate attributeName='d' values={`M${x1},${y1} Q${(x1 + x2) / 2 + 5},${(y1 + y2) / 2 + 10} ${x2},${y2};M${x1},${y1} Q${(x1 + x2) / 2 - 5},${(y1 + y2) / 2 + 10} ${x2 - 3},${y2}`} dur='4s' repeatCount='indefinite' />
				</path>
			))}
			{/* 桃花 */}
			{[[80, 150], [130, 155], [200, 148], [260, 155], [320, 150], [170, 160]].map(([cx, cy], i) => (
				<circle key={i} cx={cx} cy={cy} r={2 + (i % 2)} fill={i % 2 === 0 ? '#f48fb1' : '#fce4ec'} opacity='0.6' />
			))}
			{/* 飘落花瓣 */}
			{[[100, 50], [180, 35], [280, 60], [350, 45]].map(([cx, cy], i) => (
				<ellipse key={i} cx={cx} cy={cy} rx='2' ry='1.2' fill='#f48fb1' opacity='0.4' transform={`rotate(${i * 40},${cx},${cy})`}>
					<animateTransform attributeName='transform' type='translate' values={`0,0;${i % 2 ? 6 : -6},25`} dur={`${4 + i * 0.5}s`} repeatCount='indefinite' />
				</ellipse>
			))}
			{/* 仕女踏青 */}
			<Lady x={240} y={158} scale={0.75} opacity={0.4} />
			{/* 云纹 */}
			<CloudPattern x={300} y={40} scale={0.7} opacity={0.06} />
			{/* 蝴蝶 */}
			<g transform='translate(270,90)' opacity='0.3'>
				<path d='M0,0 Q-4,-3 -2,-6 Q0,-4 0,0Z' fill='#e91e63'>
					<animate attributeName='d' values='M0,0 Q-4,-3 -2,-6 Q0,-4 0,0Z;M0,0 Q-2,-2 -1,-5 Q0,-3 0,0Z' dur='0.5s' repeatCount='indefinite' />
				</path>
				<path d='M0,0 Q4,-3 2,-6 Q0,-4 0,0Z' fill='#e91e63'>
					<animate attributeName='d' values='M0,0 Q4,-3 2,-6 Q0,-4 0,0Z;M0,0 Q2,-2 1,-5 Q0,-3 0,0Z' dur='0.5s' repeatCount='indefinite' />
				</path>
			</g>
			{/* 兰草 */}
			<Orchid x={330} y={158} scale={0.7} opacity={0.2} />
		</SceneWrapper>
	)
}

// 秋景：文人登高、枫林、落叶、菊
function AutumnScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='autumnSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#fff3e0' />
					<stop offset='100%' stopColor='#ffe0b2' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#autumnSky)' />
			{/* 水墨远山 */}
			<InkMountain d='M0,115 Q80,70 160,100 Q250,60 340,95 Q380,80 400,90 L400,200 L0,200Z' opacity={0.08} />
			{/* 枫林山丘 */}
			<path d='M0,150 Q100,110 200,138 Q300,105 400,130 L400,200 L0,200Z' fill='#8d6e63' opacity='0.2' />
			{/* 枫树 */}
			{[[90, 140, 14], [140, 135, 12], [320, 130, 13]].map(([x, y, r], i) => (
				<g key={i}>
					<line x1={x} y1={y} x2={x} y2={(y as number) + 25} stroke='#5d4037' strokeWidth='2' opacity='0.35' />
					<circle cx={x} cy={(y as number) - (r as number) / 2} r={r} fill={i === 1 ? '#e65100' : '#ef6c00'} opacity='0.3' />
				</g>
			))}
			{/* 落叶 */}
			{[[120, 50], [200, 65], [260, 40], [180, 90], [330, 55], [70, 70]].map(([cx, cy], i) => (
				<ellipse key={i} cx={cx} cy={cy} rx='2.5' ry='1.5' fill={i % 2 === 0 ? '#ff6d00' : '#ffab00'} opacity='0.4' transform={`rotate(${i * 30},${cx},${cy})`}>
					<animateTransform attributeName='transform' type='translate' values={`0,0;${3 - i},18`} dur={`${3 + i * 0.4}s`} repeatCount='indefinite' />
				</ellipse>
			))}
			{/* 地面 */}
			<path d='M0,170 Q100,158 200,165 Q300,155 400,162 L400,200 L0,200Z' fill='#a1887f' opacity='0.2' />
			{/* 云纹 */}
			<CloudPattern x={50} y={35} opacity={0.06} />
			{/* 文人登高 */}
			<Scholar x={230} y={132} scale={0.7} opacity={0.4} />
			{/* 飞雁 */}
			{[[280, 30], [295, 25], [310, 30], [325, 27]].map(([cx, cy], i) => (
				<path key={i} d={`M${cx},${cy} Q${(cx as number) + 4},${(cy as number) - 3} ${(cx as number) + 8},${cy}`} stroke='#2c2c2c' strokeWidth='0.8' fill='none' opacity='0.25' />
			))}
			{/* 秋菊 */}
			<Chrysanthemum x={60} y={162} scale={0.7} opacity={0.25} />
		</SceneWrapper>
	)
}

// 冬雪：渔翁独钓、枯树、墨梅、飘雪
function WinterScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='winterSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#cfd8dc' />
					<stop offset='60%' stopColor='#e8e8e8' />
					<stop offset='100%' stopColor='#f5f5f5' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#winterSky)' />
			{/* 水墨远山 */}
			<InkMountain d='M0,110 Q80,65 170,95 Q260,55 350,88 Q385,72 400,80 L400,200 L0,200Z' opacity={0.06} />
			{/* 雪地 */}
			<path d='M0,155 Q100,142 200,150 Q300,138 400,148 L400,200 L0,200Z' fill='#eceff1' opacity='0.8' />
			<path d='M0,168 Q100,158 200,165 Q300,155 400,162 L400,200 L0,200Z' fill='#fff' opacity='0.9' />
			{/* 枯树 */}
			<g opacity='0.3'>
				<line x1='100' y1='155' x2='100' y2='95' stroke='#2c2c2c' strokeWidth='2' />
				<line x1='100' y1='110' x2='85' y2='90' stroke='#2c2c2c' strokeWidth='1.2' />
				<line x1='100' y1='115' x2='118' y2='92' stroke='#2c2c2c' strokeWidth='1.2' />
				<line x1='100' y1='128' x2='88' y2='115' stroke='#2c2c2c' strokeWidth='0.8' />
			</g>
			{/* 水面 — 江雪 */}
			<path d='M150,170 Q250,165 350,170 L350,185 Q250,180 150,185Z' fill='#90a4ae' opacity='0.15' />
			{/* 孤舟 */}
			<path d='M230,172 Q240,176 250,172 L248,172 Q240,175 232,172Z' fill='#2c2c2c' opacity='0.3' />
			{/* 渔翁独钓 — 千山鸟飞绝 */}
			<Fisherman x={240} y={168} scale={0.55} opacity={0.4} />
			{/* 飘雪 */}
			{Array.from({ length: 18 }, (_, i) => (
				<circle key={i} cx={25 + i * 22} cy={15 + (i % 5) * 28} r={0.8 + (i % 3) * 0.4} fill='#fff' opacity='0.6'>
					<animate attributeName='cy' values={`${15 + (i % 5) * 28};200`} dur={`${4 + (i % 3) * 2}s`} repeatCount='indefinite' />
					<animate attributeName='cx' values={`${25 + i * 22};${30 + i * 22 + (i % 2 ? 8 : -8)}`} dur={`${4 + (i % 3) * 2}s`} repeatCount='indefinite' />
				</circle>
			))}
			{/* 云纹 */}
			<CloudPattern x={280} y={50} opacity={0.05} />
			{/* 寒梅 — 梅花香自苦寒来 */}
			<PlumBlossom x={310} y={152} scale={0.5} opacity={0.25} />
		</SceneWrapper>
	)
}

// 边塞：将士戍边、烽火台、苍茫大漠
function WarScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='warSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#37474f' />
					<stop offset='50%' stopColor='#546e7a' />
					<stop offset='100%' stopColor='#78909c' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#warSky)' />
			{/* 大漠远山 */}
			<InkMountain d='M0,130 Q60,90 130,115 Q200,80 280,108 Q350,88 400,105 L400,200 L0,200Z' fill='#455a64' opacity={0.25} />
			{/* 沙地 */}
			<path d='M0,155 Q100,142 200,150 Q300,138 400,148 L400,200 L0,200Z' fill='#8d6e63' opacity='0.3' />
			<path d='M0,170 Q150,160 300,167 Q380,162 400,166 L400,200 L0,200Z' fill='#795548' opacity='0.25' />
			{/* 城墙 */}
			<rect x='250' y='115' width='50' height='40' fill='#4e342e' opacity='0.4' />
			<rect x='248' y='112' width='54' height='5' fill='#5d4037' opacity='0.4' />
			{/* 城垛 */}
			{[252, 262, 272, 282, 292].map((x, i) => (
				<rect key={i} x={x} y='107' width='5' height='5' fill='#4e342e' opacity='0.4' />
			))}
			{/* 烽火 */}
			<ellipse cx='275' cy='100' rx='5' ry='8' fill='#ff6d00' opacity='0.35'>
				<animate attributeName='ry' values='8;12;8' dur='1.5s' repeatCount='indefinite' />
			</ellipse>
			{/* 旌旗 */}
			<line x1='260' y1='112' x2='260' y2='85' stroke='#2c2c2c' strokeWidth='1' opacity='0.4' />
			<path d='M260,85 Q268,88 266,95 L260,92Z' fill='#b71c1c' opacity='0.35'>
				<animate attributeName='d' values='M260,85 Q268,88 266,95 L260,92Z;M260,85 Q270,87 268,95 L260,92Z' dur='2s' repeatCount='indefinite' />
			</path>
			{/* 将士 */}
			<Warrior x={140} y={153} scale={0.75} opacity={0.4} />
			<Warrior x={170} y={155} scale={0.7} opacity={0.35} />
			{/* 苍鹰 */}
			<path d='M80,45 Q88,38 96,45 Q88,42 80,45Z' fill='#263238' opacity='0.3' />
			{/* 云纹 */}
			<CloudPattern x={30} y={30} opacity={0.06} />
		</SceneWrapper>
	)
}

// 江河：渔翁泛舟、远山如黛、波纹
function RiverScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='riverSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#e3f2fd' />
					<stop offset='50%' stopColor='#e8f5e9' />
					<stop offset='100%' stopColor='#f1f8e9' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#riverSky)' />
			{/* 远山如黛 */}
			<InkMountain d='M0,95 Q70,50 140,80 Q210,40 280,72 Q340,48 400,65 L400,115 L0,115Z' opacity={0.1} />
			<InkMountain d='M0,110 Q80,80 160,100 Q250,70 340,95 Q380,85 400,90 L400,120 L0,120Z' opacity={0.08} />
			{/* 水面 */}
			<rect y='118' width='400' height='82' fill='#81d4fa' opacity='0.12' />
			{/* 波纹 */}
			{[128, 142, 156, 170].map((y, i) => (
				<path key={i} d={`M0,${y} Q50,${y - 2} 100,${y} Q150,${y + 2} 200,${y} Q250,${y - 2} 300,${y} Q350,${y + 2} 400,${y}`} stroke='#2c2c2c' strokeWidth='0.5' fill='none' opacity={0.08 - i * 0.01}>
					<animate attributeName='d' values={`M0,${y} Q50,${y - 2} 100,${y} Q150,${y + 2} 200,${y} Q250,${y - 2} 300,${y} Q350,${y + 2} 400,${y};M0,${y} Q50,${y + 2} 100,${y} Q150,${y - 2} 200,${y} Q250,${y + 2} 300,${y} Q350,${y - 2} 400,${y}`} dur={`${3 + i}s`} repeatCount='indefinite' />
				</path>
			))}
			{/* 孤舟 */}
			<path d='M220,130 Q232,136 244,130 L241,130 Q232,134 223,130Z' fill='#2c2c2c' opacity='0.25' />
			{/* 渔翁 */}
			<Fisherman x={232} y={126} scale={0.5} opacity={0.35} />
			{/* 远处亭台 */}
			<Pavilion x={80} y={108} scale={0.45} opacity={0.15} />
			{/* 竹 */}
			<Bamboo x={370} y={120} opacity={0.12} />
			{/* 兰草 */}
			<Orchid x={30} y={118} scale={0.5} opacity={0.15} />
			{/* 云纹 */}
			<CloudPattern x={180} y={30} opacity={0.06} />
			<CloudPattern x={320} y={42} scale={0.7} opacity={0.05} />
		</SceneWrapper>
	)
}

// 山岳：文人登山、层峦叠嶂、松、云
function MountainScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='mtSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#e8eaf6' />
					<stop offset='50%' stopColor='#f3f4f6' />
					<stop offset='100%' stopColor='#f5f5f5' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#mtSky)' />
			{/* 层峦叠嶂 */}
			<InkMountain d='M0,100 L70,30 L140,80 L220,20 L300,70 L400,35 L400,200 L0,200Z' opacity={0.06} />
			<InkMountain d='M0,130 L80,60 L160,105 L250,50 L340,95 L400,70 L400,200 L0,200Z' opacity={0.1} />
			<InkMountain d='M0,160 L100,100 L200,140 L300,95 L400,130 L400,200 L0,200Z' opacity={0.14} />
			{/* 松树 */}
			{[[50, 155], [340, 148]].map(([x, y], i) => (
				<g key={i} opacity='0.25'>
					<line x1={x} y1={y} x2={x} y2={(y as number) - 30} stroke='#2c2c2c' strokeWidth='1.5' />
					<path d={`M${(x as number) - 8},${(y as number) - 18} Q${x},${(y as number) - 30} ${(x as number) + 8},${(y as number) - 18}`} fill='#2e7d32' opacity='0.5' />
					<path d={`M${(x as number) - 6},${(y as number) - 24} Q${x},${(y as number) - 34} ${(x as number) + 6},${(y as number) - 24}`} fill='#388e3c' opacity='0.4' />
				</g>
			))}
			{/* 云雾 */}
			<CloudPattern x={120} y={55} scale={1.2} opacity={0.08} />
			<CloudPattern x={280} y={45} opacity={0.06} />
			<ellipse cx='200' cy='85' rx='40' ry='6' fill='#fff' opacity='0.3' />
			{/* 文人登山（持杖） */}
			<Scholar x={180} y={138} scale={0.65} opacity={0.35} />
			{/* 小径 */}
			<path d='M160,170 Q170,155 180,145 Q195,140 210,142' stroke='#2c2c2c' strokeWidth='0.6' fill='none' opacity='0.1' strokeDasharray='3,3' />
		</SceneWrapper>
	)
}

// 风雨：行人持伞、乌云、斜雨、柳岸
function RainScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='rainSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#78909c' />
					<stop offset='50%' stopColor='#90a4ae' />
					<stop offset='100%' stopColor='#b0bec5' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#rainSky)' />
			{/* 乌云 */}
			<CloudPattern x={80} y={25} scale={2} opacity={0.12} />
			<CloudPattern x={250} y={30} scale={1.8} opacity={0.1} />
			{/* 远山 */}
			<InkMountain d='M0,120 Q100,80 200,110 Q300,75 400,105 L400,200 L0,200Z' opacity={0.08} />
			{/* 地面 */}
			<path d='M0,168 Q100,158 200,165 Q300,155 400,162 L400,200 L0,200Z' fill='#78909c' opacity='0.15' />
			{/* 柳树 */}
			<line x1='80' y1='100' x2='80' y2='168' stroke='#5d4037' strokeWidth='2' opacity='0.2' />
			{[[75, 108, 60, 145], [80, 105, 72, 140], [82, 110, 90, 148]].map(([x1, y1, x2, y2], i) => (
				<path key={i} d={`M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 + 8} ${x2},${y2}`} stroke='#4caf50' strokeWidth='0.7' fill='none' opacity='0.2' />
			))}
			{/* 行人持伞 */}
			<g transform='translate(220,165)' opacity='0.4'>
				{/* 伞 */}
				<path d='M-10,-35 Q0,-42 10,-35Z' fill='#2c2c2c' />
				<line x1='0' y1='-35' x2='0' y2='-20' stroke='#2c2c2c' strokeWidth='0.8' />
				{/* 身体 */}
				<circle cx='0' cy='-18' r='3' fill='#2c2c2c' />
				<path d='M0,-14 Q-4,-4 -5,5 Q-3,8 0,10 Q3,8 5,5 Q4,-4 0,-14Z' fill='#2c2c2c' />
			</g>
			{/* 斜雨 */}
			{Array.from({ length: 22 }, (_, i) => {
				const x = 10 + i * 18
				return (
					<line key={i} x1={x} y1={40 + (i % 4) * 10} x2={x - 10} y2={200} stroke='#b0bec5' strokeWidth='0.6' opacity='0.2'>
						<animate attributeName='y1' values={`${40 + (i % 4) * 10};${20 + (i % 4) * 10}`} dur='0.6s' begin={`${(i % 6) * 0.1}s`} repeatCount='indefinite' />
					</line>
				)
			})}
		</SceneWrapper>
	)
}

// 夕阳：牧童骑牛、晚霞、远山
function SunsetScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='sunsetSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#ffe082' />
					<stop offset='30%' stopColor='#ff9800' />
					<stop offset='60%' stopColor='#f44336' stopOpacity='0.5' />
					<stop offset='100%' stopColor='#7b1fa2' stopOpacity='0.2' />
				</linearGradient>
				<radialGradient id='sunGlow' cx='72%' cy='48%' r='20%'>
					<stop offset='0%' stopColor='#fff9c4' />
					<stop offset='100%' stopColor='#ff9800' stopOpacity='0' />
				</radialGradient>
			</defs>
			<rect width='400' height='200' fill='url(#sunsetSky)' />
			<rect width='400' height='200' fill='url(#sunGlow)' />
			{/* 落日 */}
			<circle cx='300' cy='95' r='18' fill='#ff9800' opacity='0.6' />
			{/* 远山剪影 */}
			<InkMountain d='M0,140 Q70,100 140,128 Q220,90 300,120 Q360,100 400,115 L400,200 L0,200Z' fill='#4a148c' opacity={0.15} />
			<InkMountain d='M0,165 Q120,148 240,158 Q340,145 400,155 L400,200 L0,200Z' fill='#311b92' opacity={0.12} />
			{/* 小路 */}
			<path d='M80,190 Q120,172 160,168 Q200,165 240,167' stroke='#2c2c2c' strokeWidth='0.6' fill='none' opacity='0.08' />
			{/* 牧童骑牛 */}
			<g transform='translate(160,160)' opacity='0.35'>
				{/* 牛身 */}
				<ellipse cx='0' cy='0' rx='14' ry='7' fill='#2c2c2c' />
				{/* 牛头 */}
				<ellipse cx='14' cy='-3' rx='5' ry='4' fill='#2c2c2c' />
				{/* 牛角 */}
				<path d='M17,-7 Q19,-12 16,-10' stroke='#2c2c2c' strokeWidth='1' fill='none' />
				<path d='M12,-6 Q10,-11 13,-10' stroke='#2c2c2c' strokeWidth='1' fill='none' />
				{/* 牛腿 */}
				<line x1='-8' y1='7' x2='-9' y2='14' stroke='#2c2c2c' strokeWidth='1.5' />
				<line x1='8' y1='7' x2='7' y2='14' stroke='#2c2c2c' strokeWidth='1.5' />
				{/* 牧童 */}
				<circle cx='-2' cy='-14' r='3' fill='#2c2c2c' />
				<path d='M-2,-11 Q-4,-5 -3,0' fill='#2c2c2c' stroke='#2c2c2c' strokeWidth='1' />
				{/* 笛子 */}
				<line x1='0' y1='-12' x2='8' y2='-14' stroke='#2c2c2c' strokeWidth='0.6' />
			</g>
			{/* 飞鸟归巢 */}
			{[[80, 60], [100, 50], [115, 58]].map(([cx, cy], i) => (
				<path key={i} d={`M${cx},${cy} Q${(cx as number) + 4},${(cy as number) - 3} ${(cx as number) + 8},${cy}`} stroke='#2c2c2c' strokeWidth='0.8' fill='none' opacity='0.2' />
			))}
			{/* 云纹 */}
			<CloudPattern x={50} y={40} opacity={0.05} />
		</SceneWrapper>
	)
}

// 离愁：仕女倚窗、月影、落花、小桥
function LoveScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='loveSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#e1bee7' />
					<stop offset='50%' stopColor='#f3e5f5' />
					<stop offset='100%' stopColor='#fce4ec' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#loveSky)' />
			{/* 月影 */}
			<circle cx='330' cy='38' r='14' fill='#fff9c4' opacity='0.4' />
			<circle cx='334' cy='35' r='11' fill='#f3e5f5' opacity='0.6' />
			{/* 远山 */}
			<InkMountain d='M0,130 Q80,95 160,120 Q250,85 340,112 Q380,100 400,108 L400,200 L0,200Z' opacity={0.06} />
			{/* 水面 */}
			<path d='M0,170 Q100,162 200,168 Q300,160 400,165 L400,200 L0,200Z' fill='#ce93d8' opacity='0.1' />
			{/* 小桥 */}
			<path d='M160,168 Q180,158 200,168' stroke='#2c2c2c' strokeWidth='1.5' fill='none' opacity='0.15' />
			<line x1='165' y1='168' x2='165' y2='175' stroke='#2c2c2c' strokeWidth='0.8' opacity='0.12' />
			<line x1='195' y1='168' x2='195' y2='175' stroke='#2c2c2c' strokeWidth='0.8' opacity='0.12' />
			{/* 亭台 */}
			<Pavilion x={100} y={158} scale={0.6} opacity={0.2} />
			{/* 仕女凭栏 */}
			<Lady x={105} y={150} scale={0.6} opacity={0.35} />
			{/* 竹 */}
			<Bamboo x={50} y={165} opacity={0.15} />
			{/* 兰草 — 佳人如兰 */}
			<Orchid x={340} y={168} scale={0.55} opacity={0.18} />
			{/* 飘落花瓣 */}
			{Array.from({ length: 12 }, (_, i) => {
				const cx = 30 + i * 32
				const cy = 25 + (i % 4) * 22
				return (
					<ellipse key={i} cx={cx} cy={cy} rx='2' ry='1.2' fill={i % 3 === 0 ? '#f48fb1' : '#f8bbd0'} opacity={0.35 + (i % 3) * 0.08} transform={`rotate(${i * 28},${cx},${cy})`}>
						<animateTransform attributeName='transform' type='translate' values={`0,0;${i % 2 ? 6 : -6},28`} dur={`${4 + i * 0.3}s`} repeatCount='indefinite' />
					</ellipse>
				)
			})}
			{/* 云纹 */}
			<CloudPattern x={240} y={30} scale={0.8} opacity={0.05} />
		</SceneWrapper>
	)
}

// 送别：长亭古道、友人执手、柳岸、远行
function FarewellScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='farewellSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#e8eaf6' />
					<stop offset='50%' stopColor='#f3e5f5' />
					<stop offset='100%' stopColor='#fce4ec' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#farewellSky)' />
			{/* 远山 */}
			<InkMountain d='M0,110 Q80,70 170,98 Q260,60 350,90 Q385,78 400,85 L400,200 L0,200Z' opacity={0.07} />
			{/* 古道 */}
			<path d='M0,180 Q60,170 120,168 Q200,164 280,166 Q340,168 400,175' stroke='#2c2c2c' strokeWidth='0.8' fill='none' opacity='0.1' />
			<path d='M0,185 Q60,175 120,173 Q200,169 280,171 Q340,173 400,180' stroke='#2c2c2c' strokeWidth='0.5' fill='none' opacity='0.06' />
			{/* 长亭 */}
			<Pavilion x={180} y={162} scale={0.65} opacity={0.25} />
			{/* 柳树 */}
			<line x1='120' y1='105' x2='120' y2='168' stroke='#5d4037' strokeWidth='2' opacity='0.2' />
			{[[115, 112, 100, 148], [120, 108, 112, 142], [122, 115, 132, 150]].map(([x1, y1, x2, y2], i) => (
				<path key={i} d={`M${x1},${y1} Q${(x1 + x2) / 2 + (i % 2 ? 4 : -4)},${(y1 + y2) / 2 + 8} ${x2},${y2}`} stroke='#4caf50' strokeWidth='0.7' fill='none' opacity='0.2'>
					<animate attributeName='d' values={`M${x1},${y1} Q${(x1 + x2) / 2 + 4},${(y1 + y2) / 2 + 8} ${x2},${y2};M${x1},${y1} Q${(x1 + x2) / 2 - 4},${(y1 + y2) / 2 + 8} ${x2 - 2},${y2}`} dur='4s' repeatCount='indefinite' />
				</path>
			))}
			{/* 送别者 — 文人拱手 */}
			<Scholar x={200} y={158} scale={0.65} opacity={0.4} />
			{/* 远行者 — 背影渐远 */}
			<g transform='translate(300,162)' opacity='0.25'>
				<circle cx='0' cy='-18' r='3' fill='#2c2c2c' />
				<path d='M0,-14 Q-3,-5 -4,4 Q-2,7 0,8 Q2,7 4,4 Q3,-5 0,-14Z' fill='#2c2c2c' />
				{/* 行囊 */}
				<line x1='2' y1='-14' x2='8' y2='-20' stroke='#2c2c2c' strokeWidth='0.8' />
				<circle cx='9' cy='-21' r='2.5' fill='none' stroke='#2c2c2c' strokeWidth='0.8' />
			</g>
			{/* 飞鸟 */}
			{[[60, 45], [80, 38], [95, 44]].map(([cx, cy], i) => (
				<path key={i} d={`M${cx},${cy} Q${(cx as number) + 4},${(cy as number) - 3} ${(cx as number) + 8},${cy}`} stroke='#2c2c2c' strokeWidth='0.7' fill='none' opacity='0.15' />
			))}
			{/* 云纹 */}
			<CloudPattern x={280} y={35} scale={0.8} opacity={0.05} />
			{/* 酒壶 */}
			<g transform='translate(210,155)' opacity='0.2'>
				<rect x='-2' y='-6' width='4' height='6' rx='1' fill='#2c2c2c' />
				<rect x='-1' y='-8' width='2' height='2' rx='0.5' fill='#2c2c2c' />
			</g>
		</SceneWrapper>
	)
}

// 怀古：废墟城楼、文人凭吊、残碑、江水东流
function NostalgiaScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='nostalgiaSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#bcaaa4' />
					<stop offset='50%' stopColor='#d7ccc8' />
					<stop offset='100%' stopColor='#efebe9' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#nostalgiaSky)' />
			{/* 远山 */}
			<InkMountain d='M0,105 Q90,60 180,90 Q270,50 360,80 Q390,68 400,75 L400,200 L0,200Z' opacity={0.08} />
			{/* 残垣断壁 */}
			<g opacity='0.3'>
				{/* 城门 */}
				<rect x='250' y='110' width='40' height='50' fill='#2c2c2c' opacity='0.3' />
				<path d='M258,160 Q270,140 282,160' fill='#8d6e63' opacity='0.2' />
				{/* 城墙残段 */}
				<rect x='240' y='108' width='50' height='5' fill='#2c2c2c' opacity='0.25' />
				{/* 残垣 */}
				<rect x='290' y='120' width='15' height='35' fill='#2c2c2c' opacity='0.2' />
				<path d='M290,120 L295,115 L300,118 L305,120' fill='none' stroke='#2c2c2c' strokeWidth='0.8' opacity='0.2' />
			</g>
			{/* 残碑 */}
			<g transform='translate(140,155)' opacity='0.25'>
				<rect x='-4' y='-20' width='8' height='20' rx='1' fill='#2c2c2c' />
				<rect x='-6' y='0' width='12' height='3' fill='#2c2c2c' />
				{/* 碑上模糊文字 */}
				<line x1='-1' y1='-15' x2='1' y2='-15' stroke='#8d6e63' strokeWidth='0.5' />
				<line x1='-1' y1='-11' x2='1' y2='-11' stroke='#8d6e63' strokeWidth='0.5' />
				<line x1='-1' y1='-7' x2='1' y2='-7' stroke='#8d6e63' strokeWidth='0.5' />
			</g>
			{/* 地面 */}
			<path d='M0,165 Q100,155 200,162 Q300,152 400,158 L400,200 L0,200Z' fill='#8d6e63' opacity='0.12' />
			{/* 江水东流 */}
			<path d='M0,175 Q100,170 200,173 Q300,168 400,172 L400,200 L0,200Z' fill='#90a4ae' opacity='0.1' />
			{[178, 185].map((y, i) => (
				<path key={i} d={`M0,${y} Q100,${y - 2} 200,${y} Q300,${y + 2} 400,${y}`} stroke='#2c2c2c' strokeWidth='0.4' fill='none' opacity='0.06'>
					<animate attributeName='d' values={`M0,${y} Q100,${y - 2} 200,${y} Q300,${y + 2} 400,${y};M0,${y} Q100,${y + 2} 200,${y} Q300,${y - 2} 400,${y}`} dur={`${3 + i}s`} repeatCount='indefinite' />
				</path>
			))}
			{/* 文人凭吊 */}
			<Scholar x={170} y={152} scale={0.65} opacity={0.35} />
			{/* 枯树 */}
			<g opacity='0.2'>
				<line x1='80' y1='165' x2='80' y2='115' stroke='#2c2c2c' strokeWidth='1.8' />
				<line x1='80' y1='128' x2='68' y2='112' stroke='#2c2c2c' strokeWidth='1' />
				<line x1='80' y1='135' x2='95' y2='118' stroke='#2c2c2c' strokeWidth='1' />
			</g>
			{/* 秋菊 — 怀古常伴菊 */}
			<Chrysanthemum x={340} y={158} scale={0.55} opacity={0.2} />
			{/* 云纹 */}
			<CloudPattern x={30} y={35} opacity={0.05} />
			<CloudPattern x={320} y={30} scale={0.7} opacity={0.04} />
		</SceneWrapper>
	)
}

// 田园：茅屋篱笆、农人荷锄、鸡犬、炊烟
function PastoralScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='pastoralSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#e8f5e9' />
					<stop offset='50%' stopColor='#f1f8e9' />
					<stop offset='100%' stopColor='#fffde7' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#pastoralSky)' />
			{/* 远山 */}
			<InkMountain d='M0,100 Q90,65 180,88 Q270,55 360,80 Q390,70 400,75 L400,200 L0,200Z' opacity={0.06} />
			{/* 田野 */}
			<path d='M0,160 Q100,148 200,155 Q300,145 400,152 L400,200 L0,200Z' fill='#81c784' opacity='0.15' />
			<path d='M0,175 Q120,168 240,172 Q340,165 400,170 L400,200 L0,200Z' fill='#a5d6a7' opacity='0.2' />
			{/* 田埂线 */}
			{[165, 172, 180].map((y, i) => (
				<line key={i} x1={50 + i * 30} y1={y} x2={150 + i * 40} y2={y - 2} stroke='#2c2c2c' strokeWidth='0.3' opacity='0.08' />
			))}
			{/* 茅屋 */}
			<g transform='translate(280,145)' opacity='0.3'>
				{/* 茅草屋顶 */}
				<path d='M-18,-15 Q0,-25 18,-15Z' fill='#2c2c2c' />
				{/* 屋身 */}
				<rect x='-14' y='-15' width='28' height='18' fill='#2c2c2c' opacity='0.8' />
				{/* 门 */}
				<rect x='-3' y='-8' width='6' height='11' fill='#8d6e63' opacity='0.3' />
				{/* 窗 */}
				<rect x='-11' y='-11' width='5' height='4' fill='#8d6e63' opacity='0.2' />
				{/* 炊烟 */}
				<path d='M10,-15 Q12,-22 10,-28 Q8,-34 10,-40' stroke='#2c2c2c' strokeWidth='0.8' fill='none' opacity='0.3'>
					<animate attributeName='d' values='M10,-15 Q12,-22 10,-28 Q8,-34 10,-40;M10,-15 Q8,-22 10,-28 Q12,-34 10,-40' dur='3s' repeatCount='indefinite' />
				</path>
			</g>
			{/* 篱笆 */}
			{[240, 248, 256, 264, 272].map((x, i) => (
				<line key={i} x1={x} y1='155' x2={x} y2='165' stroke='#2c2c2c' strokeWidth='0.6' opacity='0.15' />
			))}
			<line x1='238' y1='158' x2='274' y2='158' stroke='#2c2c2c' strokeWidth='0.4' opacity='0.12' />
			<line x1='238' y1='162' x2='274' y2='162' stroke='#2c2c2c' strokeWidth='0.4' opacity='0.12' />
			{/* 农人荷锄 */}
			<g transform='translate(150,162)' opacity='0.35'>
				{/* 头 — 戴斗笠 */}
				<path d='M-6,-28 Q0,-33 6,-28Z' fill='#2c2c2c' />
				<circle cx='0' cy='-24' r='3.5' fill='#2c2c2c' />
				{/* 身体 */}
				<path d='M0,-20 Q-4,-8 -5,4 Q-3,8 0,10 Q3,8 5,4 Q4,-8 0,-20Z' fill='#2c2c2c' />
				{/* 锄头 */}
				<line x1='4' y1='-16' x2='22' y2='-30' stroke='#2c2c2c' strokeWidth='1' />
				<path d='M22,-30 L26,-28 L22,-24Z' fill='#2c2c2c' />
			</g>
			{/* 鸡 */}
			<g transform='translate(310,168)' opacity='0.2'>
				<ellipse cx='0' cy='0' rx='4' ry='3' fill='#2c2c2c' />
				<circle cx='4' cy='-2' r='1.5' fill='#2c2c2c' />
				<path d='M5.5,-2 L7,-2' stroke='#2c2c2c' strokeWidth='0.5' />
				<line x1='-1' y1='3' x2='-1' y2='5' stroke='#2c2c2c' strokeWidth='0.5' />
				<line x1='1' y1='3' x2='1' y2='5' stroke='#2c2c2c' strokeWidth='0.5' />
			</g>
			<g transform='translate(325,170)' opacity='0.15'>
				<ellipse cx='0' cy='0' rx='3' ry='2.5' fill='#2c2c2c' />
				<circle cx='3' cy='-1.5' r='1.2' fill='#2c2c2c' />
			</g>
			{/* 竹 */}
			<Bamboo x={50} y={165} opacity={0.12} />
			{/* 云纹 */}
			<CloudPattern x={180} y={30} scale={0.8} opacity={0.05} />
		</SceneWrapper>
	)
}

// 梅：月下寒梅、文人赏梅、疏影横斜
function PlumScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='plumSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#e1e8f5' />
					<stop offset='50%' stopColor='#eef1f8' />
					<stop offset='100%' stopColor='#f5f5f5' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#plumSky)' />
			{/* 淡月 */}
			<circle cx='310' cy='45' r='16' fill='#fff9c4' opacity='0.4' />
			<circle cx='314' cy='42' r='13' fill='#eef1f8' opacity='0.7' />
			{/* 远山 */}
			<InkMountain d='M0,115 Q80,75 170,100 Q260,65 350,92 Q385,80 400,88 L400,200 L0,200Z' opacity={0.06} />
			{/* 雪地 */}
			<path d='M0,165 Q100,155 200,162 Q300,150 400,160 L400,200 L0,200Z' fill='#fff' opacity='0.8' />
			{/* 主体墨梅 — 大 */}
			<PlumBlossom x={140} y={165} scale={1.8} opacity={0.55} />
			<PlumBlossom x={260} y={168} scale={1.4} opacity={0.4} />
			<PlumBlossom x={60} y={170} scale={0.9} opacity={0.3} />
			{/* 文人赏梅 */}
			<Scholar x={200} y={160} scale={0.75} opacity={0.4} />
			{/* 飘落花瓣 */}
			{Array.from({ length: 8 }, (_, i) => {
				const cx = 30 + i * 45
				const cy = 30 + (i % 3) * 25
				return (
					<circle key={i} cx={cx} cy={cy} r={1.5} fill='none' stroke='#1a1a1a' strokeWidth='0.6' opacity='0.4'>
						<animate attributeName='cy' values={`${cy};${cy + 30}`} dur={`${4 + i * 0.4}s`} repeatCount='indefinite' />
						<animate attributeName='opacity' values='0.4;0.1' dur={`${4 + i * 0.4}s`} repeatCount='indefinite' />
					</circle>
				)
			})}
			{/* 云纹 */}
			<CloudPattern x={50} y={40} opacity={0.05} />
		</SceneWrapper>
	)
}

// 兰：幽谷空山、君子赏兰、数丛兰草
function OrchidScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='orchidSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#e8f5e9' />
					<stop offset='50%' stopColor='#f1f8e9' />
					<stop offset='100%' stopColor='#f9fbe7' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#orchidSky)' />
			{/* 空谷远山 */}
			<InkMountain d='M0,100 Q60,50 130,85 Q200,45 280,80 Q340,60 400,75 L400,200 L0,200Z' opacity={0.08} />
			<InkMountain d='M0,135 Q80,95 160,120 Q250,85 340,115 Q380,105 400,110 L400,200 L0,200Z' opacity={0.1} />
			{/* 岩石 */}
			<path d='M20,175 Q35,160 55,168 Q70,172 75,178 Q45,180 20,178Z' fill='#1a1a1a' opacity='0.15' filter='url(#inkBrush)' />
			<path d='M300,172 Q320,158 340,165 Q355,170 360,175 Q330,178 300,175Z' fill='#1a1a1a' opacity='0.12' filter='url(#inkBrush)' />
			{/* 主体兰草群 */}
			<Orchid x={80} y={172} scale={1.4} opacity={0.45} />
			<Orchid x={130} y={175} scale={1.1} opacity={0.35} />
			<Orchid x={320} y={170} scale={1.2} opacity={0.4} />
			<Orchid x={360} y={172} scale={0.9} opacity={0.3} />
			{/* 文人赏兰 */}
			<Scholar x={210} y={170} scale={0.75} opacity={0.4} />
			{/* 蝴蝶 */}
			<g transform='translate(180,110)' opacity='0.3'>
				<path d='M0,0 Q-4,-3 -2,-6 Q0,-4 0,0Z' fill='#1a1a1a'>
					<animate attributeName='d' values='M0,0 Q-4,-3 -2,-6 Q0,-4 0,0Z;M0,0 Q-2,-2 -1,-5 Q0,-3 0,0Z' dur='0.5s' repeatCount='indefinite' />
				</path>
				<path d='M0,0 Q4,-3 2,-6 Q0,-4 0,0Z' fill='#1a1a1a'>
					<animate attributeName='d' values='M0,0 Q4,-3 2,-6 Q0,-4 0,0Z;M0,0 Q2,-2 1,-5 Q0,-3 0,0Z' dur='0.5s' repeatCount='indefinite' />
				</path>
			</g>
			{/* 竹 */}
			<Bamboo x={50} y={172} opacity={0.15} />
			{/* 云纹 */}
			<CloudPattern x={240} y={35} scale={0.8} opacity={0.05} />
		</SceneWrapper>
	)
}

// 菊：采菊东篱、陶渊明式、南山
function ChrysanthemumScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='chrySky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#fff8e1' />
					<stop offset='50%' stopColor='#fff3e0' />
					<stop offset='100%' stopColor='#efebe9' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#chrySky)' />
			{/* 南山 */}
			<InkMountain d='M0,100 Q80,55 170,85 Q260,50 350,78 Q385,68 400,72 L400,200 L0,200Z' opacity={0.1} />
			<InkMountain d='M0,135 Q100,105 200,125 Q300,100 400,120 L400,200 L0,200Z' opacity={0.08} />
			{/* 田野 */}
			<path d='M0,165 Q100,155 200,162 Q300,150 400,160 L400,200 L0,200Z' fill='#d7ccc8' opacity='0.3' />
			{/* 东篱 */}
			{[260, 270, 280, 290, 300, 310].map((x, i) => (
				<line key={i} x1={x} y1='160' x2={x} y2='172' stroke='#1a1a1a' strokeWidth='0.8' opacity='0.3' />
			))}
			<line x1='258' y1='164' x2='312' y2='164' stroke='#1a1a1a' strokeWidth='0.5' opacity='0.25' />
			<line x1='258' y1='169' x2='312' y2='169' stroke='#1a1a1a' strokeWidth='0.5' opacity='0.25' />
			{/* 主体菊花丛 */}
			<Chrysanthemum x={90} y={170} scale={1.5} opacity={0.4} />
			<Chrysanthemum x={135} y={173} scale={1.2} opacity={0.35} />
			<Chrysanthemum x={175} y={170} scale={1.0} opacity={0.3} />
			<Chrysanthemum x={285} y={172} scale={0.9} opacity={0.3} />
			{/* 采菊人 */}
			<g transform='translate(220,168)' opacity='0.4'>
				<path d='M1,-34 Q-1,-38 2,-40 Q5,-38 3,-34' fill='#1a1a1a' />
				<path d='M-2,-32 Q-5,-28 -3,-23 Q0,-21 3,-23 Q5,-28 2,-32 Q0,-34 -2,-32Z' fill='#1a1a1a' />
				{/* 弯腰姿态 */}
				<path d='M0,-21 C-2,-14 -6,-8 -8,0 Q-6,5 0,8 Q8,5 10,0 Q6,-8 4,-14 C3,-17 2,-20 0,-21Z' fill='#1a1a1a' />
				{/* 伸手采菊 */}
				<path d='M-5,-12 C-10,-8 -14,-4 -16,0' stroke='#1a1a1a' strokeWidth='2.2' strokeLinecap='round' fill='none' />
				<path d='M5,-12 C10,-8 13,-4 14,0' stroke='#1a1a1a' strokeWidth='2.2' strokeLinecap='round' fill='none' />
			</g>
			{/* 飞雁 — 悠然见南山 */}
			{[[80, 50], [95, 45], [110, 50]].map(([cx, cy], i) => (
				<path key={i} d={`M${cx},${cy} Q${(cx as number) + 4},${(cy as number) - 3} ${(cx as number) + 8},${cy}`} stroke='#1a1a1a' strokeWidth='0.7' fill='none' opacity='0.2' />
			))}
			{/* 飘落菊瓣 */}
			{Array.from({ length: 6 }, (_, i) => {
				const cx = 50 + i * 55
				const cy = 40 + (i % 3) * 20
				return (
					<ellipse key={i} cx={cx} cy={cy} rx='2' ry='1' fill='#1a1a1a' opacity='0.25' transform={`rotate(${i * 40},${cx},${cy})`}>
						<animateTransform attributeName='transform' type='translate' values={`0,0;${i % 2 ? 5 : -5},25`} dur={`${4 + i * 0.4}s`} repeatCount='indefinite' />
					</ellipse>
				)
			})}
			{/* 云纹 */}
			<CloudPattern x={30} y={35} scale={0.8} opacity={0.05} />
		</SceneWrapper>
	)
}

// 默认：水墨山水、文人、竹
function DefaultScene() {
	return (
		<SceneWrapper>
			<defs>
				<linearGradient id='defSky' x1='0' y1='0' x2='0' y2='1'>
					<stop offset='0%' stopColor='#f5f5f5' />
					<stop offset='100%' stopColor='#eeeeee' />
				</linearGradient>
			</defs>
			<rect width='400' height='200' fill='url(#defSky)' />
			<InkMountain d='M0,120 Q100,70 200,105 Q300,65 400,95 L400,200 L0,200Z' opacity={0.08} />
			<InkMountain d='M0,155 Q120,130 240,148 Q340,128 400,142 L400,200 L0,200Z' opacity={0.1} />
			<CloudPattern x={150} y={40} opacity={0.06} />
			<Bamboo x={350} y={160} opacity={0.12} />
			<Scholar x={200} y={152} scale={0.6} opacity={0.3} />
		</SceneWrapper>
	)
}
