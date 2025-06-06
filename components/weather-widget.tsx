"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye } from "lucide-react"
import { fetchWeatherData } from "@/lib/weather-api"
import type { WeatherData } from "@/lib/types"
import { convertTemp, formatTemp } from "@/lib/utils"

interface WeatherWidgetProps {
  isCelsius: boolean
}

export function WeatherWidget({ isCelsius }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initial weather fetch
    fetchWeatherData().then((data) => {
      setWeather(data)
      setIsLoading(false)
    })

    // Update weather every 30 minutes
    const intervalId = setInterval(
      () => {
        fetchWeatherData().then((data) => {
          setWeather(data)
        })
      },
      30 * 60 * 1000,
    )

    return () => clearInterval(intervalId)
  }, [])

  if (isLoading || !weather) {
    return (
      <Card className="w-full sm:w-auto">
        <CardContent className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-600 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-600 rounded w-16"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
      case "clear":
        return <Sun className="h-5 w-5 text-yellow-500" />
      case "cloudy":
      case "overcast":
        return <Cloud className="h-5 w-5 text-gray-400" />
      case "rainy":
      case "rain":
        return <CloudRain className="h-5 w-5 text-blue-400" />
      default:
        return <Cloud className="h-5 w-5 text-gray-400" />
    }
  }

  const currentTemp = isCelsius ? weather.current.temperature : convertTemp(weather.current.temperature, false)

  return (
    <div className="flex flex-col gap-4">
      {/* Current Weather */}
      <Card>
        <CardContent className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getWeatherIcon(weather.current.condition)}
              <span className="text-sm text-gray-400">Current Weather</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-white">{formatTemp(currentTemp, isCelsius)}</div>
              <div className="text-xs text-gray-400">{weather.current.condition}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3 text-gray-400" />
              <span className="text-gray-400">{weather.current.windSpeed} mph</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-gray-400" />
              <span className="text-gray-400">{weather.current.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-gray-400" />
              <span className="text-gray-400">{weather.current.visibility} mi</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Forecast */}
      <Card>
        <CardContent className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
          <div className="text-sm text-gray-400 mb-3">Next 6 Hours</div>
          <div className="grid grid-cols-6 gap-2">
            {weather.hourly.slice(0, 6).map((hour, index) => {
              const hourTemp = isCelsius ? hour.temperature : convertTemp(hour.temperature, false)
              return (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-400 mb-1">{hour.time}</div>
                  <div className="flex justify-center mb-1">{getWeatherIcon(hour.condition)}</div>
                  <div className="text-xs font-medium text-white">{Math.round(hourTemp)}°</div>
                  {hour.precipitationChance > 0 && (
                    <div className="text-xs text-blue-400">{hour.precipitationChance}%</div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
