"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Thermometer, AlertCircle } from "lucide-react"
import { TemperatureChart } from "@/components/temperature-chart"
import type { Sensor, MeatType } from "@/lib/types"
import { convertTemp, formatTemp, getMeatInfo } from "@/lib/utils"
import Image from "next/image"

interface MeatSensorCardProps {
  sensor: Sensor
  selectedMeat: MeatType | null
  isCelsius: boolean
  onMeatSelectorClick: () => void
  onTargetTempChange: (temp: number) => void
  compact?: boolean // NEW: compact mode for mobile grid
}

export function MeatSensorCard({
  sensor,
  selectedMeat,
  isCelsius,
  onMeatSelectorClick,
  onTargetTempChange,
  compact = false,
}: MeatSensorCardProps) {  
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const currentTemp = isCelsius ? sensor.currentTemp : convertTemp(sensor.currentTemp, false)
  
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
  const targetTemp = isCelsius ? sensor.targetTemp : convertTemp(sensor.targetTemp, false)
  const isOverTemp = currentTemp > targetTemp

  const meatInfo = selectedMeat ? getMeatInfo(selectedMeat) : null

  const handleEditStart = () => {
    setInputValue(targetTemp.toString())
    setIsEditing(true)
  }

  const handleEditComplete = () => {
    const newTemp = Number.parseFloat(inputValue)
    if (!isNaN(newTemp)) {
      // Convert back to Celsius if needed for storage
      const tempInCelsius = isCelsius ? newTemp : convertTemp(newTemp, true)
      onTargetTempChange(tempInCelsius)
    }
    setIsEditing(false)
  }
  if (compact) {
    // Calculate additional values for the enhanced card
    const temperatureToGo = targetTemp - currentTemp > 0 ? targetTemp - currentTemp : 0;
    
    // Calculate estimated time based on temperature rise rate from history
    const calculateEstimatedTime = () => {
      if (temperatureToGo <= 0) return 0;
      
      // If we have history, use it to calculate the rate of temperature change
      if (sensor.history && sensor.history.length >= 3) {
        const recentHistory = sensor.history.slice(-10); // Get last 10 readings
        const oldestTemp = recentHistory[0];
        const newestTemp = recentHistory[recentHistory.length - 1];
        const tempChange = newestTemp - oldestTemp;
        
        // If temperature is rising
        if (tempChange > 0) {
          // Assuming readings are 1 minute apart - adjust the rate per minute
          const ratePerMinute = tempChange / (recentHistory.length - 1);
          // Calculate minutes needed based on rate
          return Math.round(temperatureToGo / ratePerMinute);
        }
      }
      
      // Fallback: Assume 1 degree per 3 minutes on average
      return temperatureToGo * 3;
    };
    
    const estTimeMinutes = calculateEstimatedTime();
    
    // Determine cooking status based on temperature difference
    const getCookingStatus = () => {
      if (isOverTemp) return { text: "Done", color: "bg-green-500" };
      if (temperatureToGo <= 5) return { text: "Almost Done", color: "bg-yellow-500" };
      return { text: "Cooking", color: "bg-amber-500" };
    };
      const status = getCookingStatus();
    
    // Calculate progress percentage for temperature bar
    const minTemp = 0; // Minimum temperature for display
    const maxTemp = Math.max(targetTemp, 50); // Use target temp or minimum of 50°C for display
    const progress = Math.max(0, Math.min(100, ((currentTemp - minTemp) / (maxTemp - minTemp)) * 100));
      return (      <Card className="flex flex-col bg-gray-800 border border-gray-700 w-full h-[170px] shadow-md overflow-hidden">
        {/* Header Section */}
        <div className="flex justify-end items-center px-3 pt-2.5 pb-1">
          <div className={`text-xs font-medium text-white px-2 py-0.5 rounded-full shadow-sm transition-all duration-300 ${
            status.color} ${isTemperatureChanging ? 'scale-105' : ''}`}>
            {status.text}
          </div>
        </div>
        {/* Meat Name */}
        <div className="bg-gray-700/50 py-1 mx-2 rounded-md mb-1">
          <div className="text-sm font-medium text-white text-center px-1.5 truncate">
            <span className="transition-all duration-300 hover:underline cursor-pointer" onClick={onMeatSelectorClick}>
              {meatInfo?.label || "Select Meat"}
            </span>
          </div>
        </div>
          {/* Temperature Circle */}
        <div className="flex-1 flex items-center justify-center py-1">
          <div className="relative w-16 h-16">
            {/* Background circle with subtle glow */}
            <div className="absolute inset-0 rounded-full bg-gray-900/30 shadow-inner"></div>
            
            {/* Progress ring - dynamically set the stroke-dashoffset based on progress */}
            <svg className="w-full h-full absolute -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#374151" 
                strokeWidth="6"
              />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="6" 
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>            {/* Center with temperature value */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold text-white transition-all duration-300 ${
                isTemperatureChanging ? 'scale-110 text-amber-300' : ''
              }`}>
                {currentTemp}°
              </span>
            </div>
          </div>
        </div>
          {/* Temperature Range Bar */}
        <div className="w-full px-3">
          <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isOverTemp ? 'bg-red-500' : 
                temperatureToGo <= 5 ? 'bg-yellow-500' : 
                'bg-amber-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5 px-0.5">
            <span>{minTemp}°</span>
            <span>{maxTemp}°</span>
          </div>
        </div>
        {/* Footer Info */}
        <div className="flex justify-between text-xs px-3 py-2 mt-auto bg-gray-900/50 border-t border-gray-700/30">
          <div className="flex items-center">
            <span className="text-gray-400 whitespace-nowrap font-medium">To go:</span>
            <span className="text-white font-semibold ml-1.5">{temperatureToGo}°</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 whitespace-nowrap font-medium">Est. time:</span>
            <span className={`font-semibold ml-1.5 whitespace-nowrap ${
              estTimeMinutes === 0 ? 'text-green-400' : 
              estTimeMinutes < 15 ? 'text-yellow-400' : 
              'text-green-400'
            }`}>
              {estTimeMinutes > 0 ? 
                estTimeMinutes < 60 ? 
                  `${estTimeMinutes} min` : 
                  `${Math.floor(estTimeMinutes/60)}h ${estTimeMinutes % 60}m` 
                : "Ready"}
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
        {selectedMeat ? (
          <>
            <div
              className="relative h-32 mb-3 rounded-md overflow-hidden bg-center bg-cover cursor-pointer"
              onClick={onMeatSelectorClick}
            >
              {meatInfo?.image ? (
                <Image
                  src={meatInfo.image}
                  alt={meatInfo.label}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 600px) 100vw, 33vw"
                  priority={true}
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
              {isOverTemp && (
                <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                  <AlertCircle className="h-5 w-5" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-amber-500">{meatInfo?.label}</h3>
              <div className="flex items-center">
                <Thermometer className="h-4 w-4 text-amber-500 mr-1" />
                <span className="text-sm text-white">Sensor {sensor.id - 1}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-white text-xs">Current</div>
                <div className="text-xl font-bold text-white">{formatTemp(currentTemp, isCelsius)}</div>
              </div>

              <div>
                <div className="text-gray-400 text-xs">Target</div>
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

            <div className="h-[80px]">
              <TemperatureChart data={sensor.history} isCelsius={isCelsius} targetTemp={targetTemp} compact />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px]">
            <div className="text-gray-400 mb-3">No meat selected</div>
            <Button
              variant="outline"
              onClick={onMeatSelectorClick}
              className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
            >
              Select Meat
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
