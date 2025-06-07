"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Thermometer, Flame } from "lucide-react"
import { TemperatureChart } from "@/components/temperature-chart"
import type { Sensor } from "@/lib/types"
import { convertTemp, formatTemp } from "@/lib/utils"

interface AmbientSensorCardProps {
  sensor: Sensor
  isCelsius: boolean
  onTargetTempChange: (temp: number) => void
  compact?: boolean // NEW: compact mode for mobile grid
}

export function AmbientSensorCard({ sensor, isCelsius, onTargetTempChange, compact = false }: AmbientSensorCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const currentTemp = isCelsius ? sensor.currentTemp : convertTemp(sensor.currentTemp, false)
  const targetTemp = isCelsius ? sensor.targetTemp : convertTemp(sensor.targetTemp, false)
  const isOverTemp = currentTemp > targetTemp
  
  // Add state for animation
  const [isTemperatureChanging, setIsTemperatureChanging] = useState(false)
  const previousTemp = useRef(currentTemp)
  
  // Effect to detect temperature changes and trigger animation
  useEffect(() => {
    if (previousTemp.current !== currentTemp) {
      setIsTemperatureChanging(true)
      const timer = setTimeout(() => {
        setIsTemperatureChanging(false)
      }, 1000)
      previousTemp.current = currentTemp
      return () => clearTimeout(timer)
    }
  }, [currentTemp])

  const handleEditStart = () => {
    setInputValue(targetTemp.toString())
    setIsEditing(true)
  }

  const handleEditComplete = () => {
    const newTemp = Number.parseFloat(inputValue)
    if (!isNaN(newTemp)) {
      // Convert back to Celsius if needed for storage
      const tempInCelsius = isCelsius ? newTemp : convertTemp(newTemp, true)
      onTargetTempChange(tempInCelsius)    }
    setIsEditing(false)
  }
  
  if (compact) {
    return (
      <Card className="flex flex-col bg-gray-800 border border-gray-700 h-[100px] w-full shadow-md overflow-hidden">
        {/* Top section */}        <div className="flex-1 flex items-center justify-center pt-1">
          <div className={`w-12 h-12 rounded-full bg-gray-900/40 flex items-center justify-center shadow-inner transition-all duration-300 ${
            isTemperatureChanging ? 'bg-gray-800/60 scale-105' : ''
          }`}>
            <Thermometer className={`h-6 w-6 transition-colors ${
              isOverTemp ? 'text-red-500' : 'text-amber-500'
            }`} />
          </div>
        </div>
        
        {/* Label and Temperature */}
        <div className="bg-gray-900/50 border-t border-gray-700/30 pt-1 pb-2">
          <div className="text-sm font-semibold text-amber-500 text-center">
            Grill {sensor.id + 1}
          </div>
          <div className="text-2xl font-bold text-white text-center">
            <span className={`transition-all duration-300 ${
              isTemperatureChanging ? 'scale-110 text-amber-300' : ''
            }`}>
              {currentTemp}°C
            </span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 ${
        isOverTemp ? "shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse" : "shadow-lg"
      }`}
    >
      <CardContent className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-amber-500" />
            <h3 className="font-semibold text-white">Grill Sensor {sensor.id + 1}</h3>
          </div>
          {isOverTemp && (
            <div className="flex items-center text-red-500">
              <Flame className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Over Temp!</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-4 mb-4">
          <div>
            <div className="text-gray-400 text-xs mb-1">Current</div>
            <div className="text-2xl font-bold text-white">{formatTemp(currentTemp, isCelsius)}</div>
          </div>

          <div>
            <div className="text-gray-400 text-xs mb-1">Target</div>
            {isEditing ? (
              <div className="flex items-center">
                <Input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-16 h-7 text-sm"
                  autoFocus
                  onBlur={handleEditComplete}
                  onKeyDown={(e) => e.key === "Enter" && handleEditComplete()}
                />
                <span className="ml-1 text-sm">{isCelsius ? "°C" : "°F"}</span>
              </div>
            ) : (
              <div
                className="text-lg font-semibold text-amber-500 cursor-pointer hover:underline"
                onClick={handleEditStart}
              >
                {formatTemp(targetTemp, isCelsius)}
              </div>
            )}
          </div>
        </div>

        <div className="h-[100px]">
          <TemperatureChart data={sensor.history} isCelsius={isCelsius} targetTemp={targetTemp} compact />
        </div>
      </CardContent>
    </Card>
  )
}
