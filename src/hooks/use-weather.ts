'use client'

import { useState, useEffect } from 'react'

export interface WeatherData {
	temperature: number
	description: string
	weatherCode: number
}

export type WeatherType = 'sunny' | 'cloudy' | 'fog' | 'rain' | 'heavy-rain' | 'snow' | 'thunder'

export function getWeatherType(code: number): WeatherType {
	if (code <= 1) return 'sunny'
	if (code <= 3) return 'cloudy'
	if (code <= 48) return 'fog'
	if (code <= 57) return 'rain'
	if (code <= 65) return 'rain'
	if (code <= 67) return 'rain'
	if (code <= 77) return 'snow'
	if (code <= 82) return 'heavy-rain'
	if (code <= 86) return 'snow'
	return 'thunder'
}

// WMO Weather interpretation codes -> Chinese descriptions
const WMO_CODES: Record<number, string> = {
	0: '晴',
	1: '大部晴',
	2: '多云',
	3: '阴',
	45: '雾',
	48: '雾凇',
	51: '小毛毛雨',
	53: '毛毛雨',
	55: '大毛毛雨',
	56: '冻毛毛雨',
	57: '冻雨',
	61: '小雨',
	63: '中雨',
	65: '大雨',
	66: '冻雨',
	67: '大冻雨',
	71: '小雪',
	73: '中雪',
	75: '大雪',
	77: '雪粒',
	80: '小阵雨',
	81: '阵雨',
	82: '大阵雨',
	85: '小阵雪',
	86: '大阵雪',
	95: '雷暴',
	96: '雷暴冰雹',
	99: '大雷暴冰雹',
}

function getWeatherDescription(code: number): string {
	return WMO_CODES[code] ?? '未知'
}

const CACHE_KEY = 'weather-cache'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

interface CachedWeather {
	data: WeatherData
	timestamp: number
}

function getCachedWeather(): WeatherData | null {
	try {
		const raw = localStorage.getItem(CACHE_KEY)
		if (!raw) return null
		const cached: CachedWeather = JSON.parse(raw)
		if (Date.now() - cached.timestamp < CACHE_DURATION) {
			return cached.data
		}
	} catch {}
	return null
}

function setCachedWeather(data: WeatherData) {
	try {
		const cached: CachedWeather = { data, timestamp: Date.now() }
		localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
	} catch {}
}

async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
	const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
	const res = await fetch(url)
	if (!res.ok) throw new Error('Weather API error')
	const data = await res.json()
	return {
		temperature: Math.round(data.current.temperature_2m),
		description: getWeatherDescription(data.current.weather_code),
		weatherCode: data.current.weather_code,
	}
}

function getPosition(): Promise<GeolocationPosition> {
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(resolve, reject, {
			timeout: 8000,
			maximumAge: CACHE_DURATION,
		})
	})
}

export function useWeather() {
	const [weather, setWeather] = useState<WeatherData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false

		const fetchWeather = async () => {
			// Try cache first
			const cached = getCachedWeather()
			if (cached) {
				setWeather(cached)
				setLoading(false)
				return
			}

			try {
				setLoading(true)
				// Default: Beijing
				let lat = 39.9
				let lon = 116.4

				try {
					const pos = await getPosition()
					lat = pos.coords.latitude
					lon = pos.coords.longitude
				} catch {
					// Geolocation denied, use default
				}

				const data = await fetchWeatherByCoords(lat, lon)
				if (!cancelled) {
					setWeather(data)
					setCachedWeather(data)
				}
			} catch {
				// Silently fail, weather is optional
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		fetchWeather()

		// Refresh every 30 minutes
		const timer = setInterval(fetchWeather, CACHE_DURATION)

		return () => {
			cancelled = true
			clearInterval(timer)
		}
	}, [])

	return { weather, loading }
}
