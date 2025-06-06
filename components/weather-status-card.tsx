"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Cloud, CloudRain, Sun, Wind, Droplets, MapPin } from "lucide-react"
import { fetchWeatherData } from "@/lib/weather-api"
import type { WeatherData } from "@/lib/types"
import { convertTemp, formatTemp } from "@/lib/utils"

interface WeatherStatusCardProps {
  isCelsius: boolean
  onUnitChange: (isCelsius: boolean) => void
}

export function WeatherStatusCard({ isCelsius, onUnitChange }: WeatherStatusCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWeatherData().then((data) => {
      setWeather(data)
      setIsLoading(false)
    })

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

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
      case "clear":
        return <Sun className="h-4 w-4 text-yellow-500" />
      case "cloudy":
      case "overcast":
        return <Cloud className="h-4 w-4 text-gray-400" />
      case "rainy":
      case "rain":
        return <CloudRain className="h-4 w-4 text-blue-400" />
      default:
        return <Cloud className="h-4 w-4 text-gray-400" />
    }
  }

  if (isLoading || !weather) {
    return (
      <Card className="h-[280px] bg-gray-900/60 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-600 rounded w-32"></div>
            <div className="h-6 bg-gray-600 rounded w-24"></div>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-600 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentTemp = isCelsius ? weather.current.temperature : convertTemp(weather.current.temperature, false)

  return (
    <Card className="h-[280px] bg-gray-900/60 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-400">
            <span>🌤️</span>
            Current Weather
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${isCelsius ? "text-blue-400" : "text-gray-500"}`}>°C</span>
            <Switch
              checked={!isCelsius}
              onCheckedChange={(checked) => onUnitChange(!checked)}
              className="data-[state=checked]:bg-blue-500"
            />
            <span className={`text-xs ${!isCelsius ? "text-blue-400" : "text-gray-500"}`}>°F</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Conditions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">{getWeatherIcon(weather.current.condition)}</div>
            <div>
              <div className="text-lg font-semibold text-white">{formatTemp(currentTemp, isCelsius)}</div>
              <div className="text-sm text-gray-400 capitalize">{weather.current.condition}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              <MapPin className="h-3 w-3" />
              <span>Austin, TX</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                <span>{weather.current.windSpeed} mph</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                <span>{weather.current.humidity}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6-Hour Forecast */}
        <div>
          <div className="text-sm text-gray-400 mb-2">Next 6 Hours</div>
          <div className="grid grid-cols-6 gap-1">
            {weather.hourly.slice(0, 6).map((hour, index) => {
              const hourTemp = isCelsius ? hour.temperature : convertTemp(hour.temperature, false)
              return (
                <div key={index} className="text-center bg-gray-800/50 rounded-lg p-2">
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
        </div>
      </CardContent>
    </Card>
  )
}
