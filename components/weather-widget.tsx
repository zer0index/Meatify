"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye } from "lucide-react"
import { fetchWeatherForHallein } from "@/lib/weather-api"

const HALLEIN_LOCATION_LABEL = "Hallein, Salzburg, Austria"

function getWeatherIcon(condition: string) {
  switch (condition) {
    case "sunny":
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

function formatHour(isoString: string) {
  const date = new Date(isoString)
  return date.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWeather() {
      try {
        const data = await fetchWeatherForHallein()
        setWeather(data)
      } catch (e: any) {
        setError(e.message)
      }
    }
    fetchWeather()
  }, [])

  if (error) return <div>Fehler: {error}</div>
  if (!weather) return <div>Lädt Wetterdaten...</div>

  const currentTemp = weather.current.temperature

  return (
    <div className="flex flex-col gap-4">
      {/* Current Weather */}
      <Card>
        <CardContent className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
          <div className="text-xs text-blue-400 mb-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>{HALLEIN_LOCATION_LABEL}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getWeatherIcon(weather.current.condition)}
              <span className="text-sm text-gray-400">Aktuelles Wetter</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-white">{Math.round(currentTemp)}°C</div>
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
          <div className="text-sm text-gray-400 mb-3">Nächste 6 Stunden</div>
          <div className="grid grid-cols-6 gap-2">
            {weather.hourly.map((hour: any, index: number) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-400 mb-1">{formatHour(hour.time)}</div>
                <div className="flex justify-center mb-1">{getWeatherIcon(hour.condition)}</div>
                <div className="text-xs font-medium text-white">{Math.round(hour.temperature)}°</div>
                {hour.precipitationChance > 0 && (
                  <div className="text-xs text-blue-400">{hour.precipitationChance}%</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function mapWeatherCodeToCondition(code: number): string {
  if (code === 0) return "sunny"
  if ([1, 2, 3].includes(code)) return "cloudy"
  if ([45, 48].includes(code)) return "overcast"
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rainy"
  return "cloudy"
}
