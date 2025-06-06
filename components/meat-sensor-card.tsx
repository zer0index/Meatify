"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Thermometer, AlertCircle } from "lucide-react"
import { TemperatureChart } from "@/components/temperature-chart"
import type { Sensor, MeatType } from "@/lib/types"
import { convertTemp, formatTemp, getMeatInfo } from "@/lib/utils"

interface MeatSensorCardProps {
  sensor: Sensor
  selectedMeat: MeatType | null
  isCelsius: boolean
  onMeatSelectorClick: () => void
  onTargetTempChange: (temp: number) => void
}

export function MeatSensorCard({
  sensor,
  selectedMeat,
  isCelsius,
  onMeatSelectorClick,
  onTargetTempChange,
}: MeatSensorCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const currentTemp = isCelsius ? sensor.currentTemp : convertTemp(sensor.currentTemp, false)
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
              style={{ backgroundImage: `url(${meatInfo?.image})` }}
              onClick={onMeatSelectorClick}
            >
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
