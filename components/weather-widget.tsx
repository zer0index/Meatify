"use client"

import { useEffect, useState } from "react"
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

  if (error) return <div className="flex items-center justify-center h-full text-red-400">Fehler: {error}</div>
  if (!weather) return <div className="flex items-center justify-center h-full text-gray-400">Lädt Wetterdaten...</div>

  const currentTemp = weather.current.temperature
  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden h-[280px] flex flex-col">
        {/* Top Section - Location & Current Weather */}
        <div className="px-6 pt-4 pb-2">
          {/* Location Header */}
          <div className="text-xs text-blue-400 mb-4 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>{HALLEIN_LOCATION_LABEL}</span>
          </div>
          
          {/* Current Weather & Temperature - Restructured for better visual hierarchy */}
          <div className="flex items-start justify-between mb-5">
            {/* Left side - Current condition */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-blue-500/10 p-1.5 rounded-lg">
                  {getWeatherIcon(weather.current.condition)}
                </div>
                <span className="text-sm text-gray-300 font-medium">Aktuelles Wetter</span>
              </div>
              <div className="text-sm text-gray-400 pl-9">{weather.current.condition}</div>
            </div>
            
            {/* Right side - Current temperature */}
            <div className="text-right">
              <div className="text-3xl font-bold text-white leading-none">{Math.round(currentTemp)}°C</div>
              <div className="text-xs text-gray-400 mt-1">rainy</div>
            </div>
          </div>
          
          {/* Weather Stats - Improved visual appearance */}
          <div className="grid grid-cols-3 gap-3 mb-2">
            <div className="bg-gray-800/50 rounded-lg p-2 flex flex-col items-center">
              <Wind className="h-4 w-4 text-gray-300 mb-1" />
              <span className="text-xs text-gray-300 font-medium">{weather.current.windSpeed} kmh</span>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2 flex flex-col items-center">
              <Droplets className="h-4 w-4 text-gray-300 mb-1" />
              <span className="text-xs text-gray-300 font-medium">{weather.current.humidity}%</span>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2 flex flex-col items-center">
              <Eye className="h-4 w-4 text-gray-300 mb-1" />
              <span className="text-xs text-gray-300 font-medium">{weather.current.visibility} mi</span>
            </div>
          </div>
        </div>
        
        {/* Bottom Section - Hourly Forecast - Given more space */}
        <div className="mt-auto border-t border-gray-700 px-6 pt-3 pb-3">
          <div className="text-sm text-gray-300 font-medium mb-2">Nächste 6 Stunden</div>
          <div className="grid grid-cols-6 gap-2">
            {weather.hourly.map((hour: any, index: number) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-400 mb-1.5">{formatHour(hour.time)}</div>
                <div className="flex justify-center mb-1.5">{getWeatherIcon(hour.condition)}</div>
                <div className="text-xs font-medium text-white mb-0.5">{Math.round(hour.temperature)}°</div>
                {hour.precipitationChance > 0 && (
                  <div className="text-xs text-blue-400">{hour.precipitationChance}%</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
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
