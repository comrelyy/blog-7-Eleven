'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { CARD_SPACING } from '@/consts'
import WeatherSVG from '@/svgs/weather.svg'
import { useConfigStore } from './stores/config-store'

export const styles = {
  width: 200,
  height: 100,
  order: 7
}

interface WeatherData {
  temperature: number
  condition: string
  location: string
}

export default function WeatherCard() {
  const center = useCenterStore()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { cardStyles } = useConfigStore()
  const hiCardStyles = cardStyles.hiCard
  const clockCardStyles = cardStyles.clockCard
  useEffect(() => {
    // 获取真实天气数据的函数
    const fetchWeather = async () => {
      try {
        setLoading(true)
        // 这里应该替换为真实的天气API调用
        // 例如使用 OpenWeatherMap API:
        /*
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Beijing&appid=YOUR_API_KEY&units=metric`
        )
        const data = await response.json()
        
        const weatherData: WeatherData = {
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].description,
          location: data.name
        }
        */
        
        // 目前仍然使用模拟数据，但您可以替换成上面的真实API调用
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const mockWeather: WeatherData = {
          temperature: 22,
          condition: '晴',
          location: '北京'
        }
        
        setWeather(mockWeather)
        setError(null)
      } catch (err) {
        setError('无法获取天气信息')
        console.error('Weather fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    // 初始获取天气数据
    fetchWeather()
    
    // 设置定时器每30分钟更新一次天气数据
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)
    
    // 清理函数
    return () => clearInterval(interval)
  }, [])

  // 计算天气卡片的位置（在时钟卡片右侧）
  const x = center.x + CARD_SPACING + hiCardStyles.width / 2 + clockCardStyles.width + CARD_SPACING
  const y = center.y - clockCardStyles.offset - styles.height

  return (
    <Card
      order={styles.order}
      width={styles.width}
      height={styles.height}
      x={x}
      y={y}
      className="p-4 flex flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <WeatherSVG className="w-6 h-6" />
        <h3 className="text-lg font-semibold">天气</h3>
      </div>
      
      {loading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm mt-1">加载中...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      ) : weather ? (
        <div className="text-center">
          <p className="text-xl font-bold">{weather.temperature}°C</p>
          <p className="text-sm">{weather.condition}</p>
          <p className="text-xs text-gray-500">{weather.location}</p>
        </div>
      ) : null}
    </Card>
  )
}