'use client'

import { useMemo } from 'react'
import type { WeatherType } from '@/hooks/use-weather'

interface WeatherEffectProps {
	type: WeatherType
}

export default function WeatherEffect({ type }: WeatherEffectProps) {
	switch (type) {
		case 'sunny':
			return <SunEffect />
		case 'cloudy':
			return <CloudEffect />
		case 'fog':
			return <FogEffect />
		case 'rain':
			return <RainEffect count={20} />
		case 'heavy-rain':
			return <RainEffect count={40} heavy />
		case 'snow':
			return <SnowEffect />
		case 'thunder':
			return (
				<>
					<RainEffect count={30} heavy />
					<ThunderEffect />
				</>
			)
		default:
			return null
	}
}

// ─── Sunny: warm glow ───
function SunEffect() {
	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]'>
			<div
				className='absolute -right-4 -top-4 h-16 w-16 rounded-full'
				style={{
					background: 'radial-gradient(circle, rgba(255,200,50,0.35) 0%, rgba(255,200,50,0) 70%)',
					animation: 'sunPulse 3s ease-in-out infinite',
				}}
			/>
			{/* light rays */}
			<div
				className='absolute -right-2 -top-2 h-24 w-24'
				style={{
					background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,220,80,0.08) 10deg, transparent 20deg, transparent 40deg, rgba(255,220,80,0.08) 50deg, transparent 60deg, transparent 80deg, rgba(255,220,80,0.08) 90deg, transparent 100deg, transparent 120deg, rgba(255,220,80,0.06) 130deg, transparent 140deg, transparent 160deg, rgba(255,220,80,0.06) 170deg, transparent 180deg, transparent 200deg, rgba(255,220,80,0.06) 210deg, transparent 220deg, transparent 240deg, rgba(255,220,80,0.06) 250deg, transparent 260deg, transparent 280deg, rgba(255,220,80,0.06) 290deg, transparent 300deg, transparent 320deg, rgba(255,220,80,0.06) 330deg, transparent 340deg)',
					animation: 'sunSpin 20s linear infinite',
				}}
			/>
			<style>{`
				@keyframes sunPulse {
					0%, 100% { transform: scale(1); opacity: 0.8; }
					50% { transform: scale(1.2); opacity: 1; }
				}
				@keyframes sunSpin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	)
}

// ─── Cloudy: drifting clouds ───
function CloudEffect() {
	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]'>
			<div
				className='absolute'
				style={{
					width: 80,
					height: 28,
					top: 6,
					left: -20,
					borderRadius: '14px',
					background: 'rgba(180,190,200,0.2)',
					filter: 'blur(4px)',
					animation: 'cloudDrift1 12s ease-in-out infinite',
				}}
			/>
			<div
				className='absolute'
				style={{
					width: 60,
					height: 22,
					top: 18,
					left: 40,
					borderRadius: '11px',
					background: 'rgba(170,180,195,0.18)',
					filter: 'blur(3px)',
					animation: 'cloudDrift2 16s ease-in-out infinite',
				}}
			/>
			<style>{`
				@keyframes cloudDrift1 {
					0%, 100% { transform: translateX(0); }
					50% { transform: translateX(60px); }
				}
				@keyframes cloudDrift2 {
					0%, 100% { transform: translateX(10px); }
					50% { transform: translateX(-40px); }
				}
			`}</style>
		</div>
	)
}

// ─── Fog: misty overlay ───
function FogEffect() {
	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]'>
			<div
				className='absolute inset-0'
				style={{
					background: 'linear-gradient(90deg, transparent 0%, rgba(200,200,210,0.15) 30%, rgba(200,200,210,0.2) 50%, rgba(200,200,210,0.15) 70%, transparent 100%)',
					animation: 'fogShift 8s ease-in-out infinite alternate',
				}}
			/>
			<div
				className='absolute inset-0'
				style={{
					background: 'linear-gradient(90deg, transparent 0%, rgba(190,195,210,0.12) 40%, rgba(190,195,210,0.18) 60%, transparent 100%)',
					animation: 'fogShift 12s ease-in-out infinite alternate-reverse',
				}}
			/>
			<style>{`
				@keyframes fogShift {
					from { transform: translateX(-15px); }
					to { transform: translateX(15px); }
				}
			`}</style>
		</div>
	)
}

// ─── Rain: falling drops ───
function RainEffect({ count, heavy }: { count: number; heavy?: boolean }) {
	const drops = useMemo(
		() =>
			Array.from({ length: count }, (_, i) => ({
				id: i,
				left: Math.random() * 100,
				delay: Math.random() * 2,
				duration: heavy ? 0.4 + Math.random() * 0.3 : 0.6 + Math.random() * 0.4,
				height: heavy ? 12 + Math.random() * 8 : 8 + Math.random() * 6,
				opacity: 0.3 + Math.random() * 0.4,
			})),
		[count, heavy]
	)

	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]'>
			{drops.map(d => (
				<div
					key={d.id}
					className='absolute'
					style={{
						left: `${d.left}%`,
						top: -d.height,
						width: heavy ? 1.5 : 1,
						height: d.height,
						borderRadius: 1,
						background: `rgba(120,160,220,${d.opacity})`,
						animation: `rainFall ${d.duration}s linear ${d.delay}s infinite`,
					}}
				/>
			))}
			<style>{`
				@keyframes rainFall {
					from { transform: translateY(0); }
					to { transform: translateY(160px); }
				}
			`}</style>
		</div>
	)
}

// ─── Snow: falling flakes ───
function SnowEffect() {
	const flakes = useMemo(
		() =>
			Array.from({ length: 18 }, (_, i) => ({
				id: i,
				left: Math.random() * 100,
				delay: Math.random() * 4,
				duration: 3 + Math.random() * 3,
				size: 2 + Math.random() * 3,
				drift: -15 + Math.random() * 30,
				opacity: 0.4 + Math.random() * 0.4,
			})),
		[]
	)

	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]'>
			{flakes.map(f => (
				<div
					key={f.id}
					className='absolute rounded-full'
					style={{
						left: `${f.left}%`,
						top: -f.size,
						width: f.size,
						height: f.size,
						background: `rgba(230,235,245,${f.opacity})`,
						boxShadow: `0 0 ${f.size}px rgba(230,235,245,0.3)`,
						animation: `snowFall${f.id} ${f.duration}s ease-in-out ${f.delay}s infinite`,
					}}
				/>
			))}
			<style>{`
				${flakes
					.map(
						f => `
					@keyframes snowFall${f.id} {
						from { transform: translate(0, 0) rotate(0deg); opacity: ${f.opacity}; }
						to { transform: translate(${f.drift}px, 160px) rotate(360deg); opacity: 0; }
					}`
					)
					.join('\n')}
			`}</style>
		</div>
	)
}

// ─── Thunder: lightning flashes ───
function ThunderEffect() {
	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]'>
			<div
				className='absolute inset-0'
				style={{
					animation: 'lightning 6s ease-in-out infinite',
				}}
			/>
			<style>{`
				@keyframes lightning {
					0%, 100% { background: transparent; }
					92% { background: transparent; }
					93% { background: rgba(255,255,255,0.3); }
					94% { background: transparent; }
					96% { background: rgba(200,210,255,0.15); }
					97% { background: transparent; }
				}
			`}</style>
		</div>
	)
}
