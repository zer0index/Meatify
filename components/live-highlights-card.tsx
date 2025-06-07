"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Thermometer, AlertTriangle, CheckCircle } from "lucide-react"
import type { Sensor, MeatType } from "@/lib/types"
import { formatTemp, getMeatInfo, formatFloat } from "@/lib/utils"

interface LiveHighlightsCardProps {
  sensors: Sensor[]
  selectedMeats: Record<number, MeatType | null>
  isCelsius: boolean
  compact?: boolean // NEW: compact mode for minimal display
}

export function LiveHighlightsCard({ sensors, selectedMeats, isCelsius, compact = false }: LiveHighlightsCardProps) {
  const getHighlights = () => {
    if (sensors.length === 0) return null

    const meatSensors = sensors.filter((sensor) => sensor.id >= 2)
    const grillSensors = sensors.filter((sensor) => sensor.id < 2)

    // Calculate average grill temperature
    const avgGrillTemp = grillSensors.reduce((sum, sensor) => sum + sensor.currentTemp, 0) / grillSensors.length

    // Check for overheat alerts
    const overheatedSensors = grillSensors.filter((sensor) => sensor.currentTemp > sensor.targetTemp)
    const hasOverheatAlert = overheatedSensors.length > 0

    // Find closest to done meat
    let closestToTarget: { sensor: Sensor; meatType: MeatType; diff: number } | null = null

    meatSensors.forEach((sensor) => {
      const meatType = selectedMeats[sensor.id]
      if (!meatType) return

      const diff = sensor.targetTemp - sensor.currentTemp
      if (diff > 0 && (!closestToTarget || diff < closestToTarget.diff)) {
        closestToTarget = { sensor, meatType, diff }
      }
    })

    // Find ready meats
    const readyMeats = meatSensors
      .filter((sensor) => {
        const meatType = selectedMeats[sensor.id]
        return meatType && sensor.currentTemp >= sensor.targetTemp
      })
      .map((sensor) => ({
        sensor,
        meatType: selectedMeats[sensor.id] as MeatType,
      }))

    return {
      avgGrillTemp,
      hasOverheatAlert,
      closestToTarget,
      readyMeats,
    }
  }

  const highlights = getHighlights()

  if (compact) {
    // Minimal, horizontal, no card header, smaller paddings
    return (
      <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-900/80 border border-gray-700 mb-2">
        {highlights ? (
          <div className="flex flex-wrap gap-2 items-center justify-between text-xs">
            {/* Avg Grill Temp */}
            <div className="flex items-center gap-1">
              <Thermometer className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-white">{formatTemp(Number(formatFloat(highlights.avgGrillTemp)), isCelsius)}</span>
            </div>
            {/* Closest to Done */}
            {highlights.closestToTarget &&
              typeof highlights.closestToTarget === "object" &&
              "meatType" in highlights.closestToTarget &&
              "sensor" in highlights.closestToTarget && (
                <div className="flex items-center gap-1">
                  <span className="text-orange-500 text-xs">🥩</span>
                  <span className="text-white font-medium">
                    {getMeatInfo((highlights.closestToTarget as { sensor: Sensor; meatType: MeatType }).meatType).label}
                  </span>
                  <span className="text-orange-400">
                    {formatTemp(Number(formatFloat((highlights.closestToTarget as { sensor: Sensor; meatType: MeatType }).sensor.currentTemp)), isCelsius)}
                  </span>
                </div>
              )}
            {/* Overheat Alert */}
            {highlights.hasOverheatAlert && (
              <div className="flex items-center gap-1 animate-pulse">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-400 font-semibold">Overheat!</span>
              </div>
            )}
            {/* Ready Meats */}
            {highlights.readyMeats && highlights.readyMeats.length > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-400 font-semibold">Ready: {highlights.readyMeats.map((item) => getMeatInfo(item.meatType).label).join(", ")}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-500 italic">No data</span>
        )}
      </div>
    )
  }

  return (
    <Card className="h-[280px] bg-gray-900/60 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-amber-500">
          <Flame className="h-5 w-5" />
          Live Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {highlights ? (
          <>
            {/* Average Grill Temperature */}
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2 rounded-lg">
                <Thermometer className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  Avg Grill Temp: {formatTemp(Number(formatFloat(highlights.avgGrillTemp)), isCelsius)}
                </div>
              </div>
            </div>

            {/* Closest to Done */}
            {highlights.closestToTarget &&
              typeof highlights.closestToTarget === "object" &&
              highlights.closestToTarget !== null &&
              "meatType" in highlights.closestToTarget &&
              "sensor" in highlights.closestToTarget &&
              "diff" in highlights.closestToTarget && (
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/20 p-2 rounded-lg">
                    <span className="text-orange-500 text-sm">🥩</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {getMeatInfo((highlights.closestToTarget as { sensor: Sensor; meatType: MeatType; diff: number }).meatType).label} @{" "}
                      {formatTemp(Number(formatFloat((highlights.closestToTarget as { sensor: Sensor; meatType: MeatType; diff: number }).sensor.currentTemp)), isCelsius)}
                    </div>
                    <div className="text-xs text-orange-400">
                      ({formatFloat((highlights.closestToTarget as { sensor: Sensor; meatType: MeatType; diff: number }).diff)}
                      °{isCelsius ? "C" : "F"} from target)
                    </div>
                  </div>
                </div>
              )}

            {/* Overheat Alert */}
            {highlights.hasOverheatAlert && (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-sm font-medium text-red-400">🔥 Grill Overheat Alert</div>
              </div>
            )}

            {/* Ready Meats */}
            {highlights.readyMeats && highlights.readyMeats.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-green-400">
                    ✅ Ready: {highlights.readyMeats.map((item) => getMeatInfo(item.meatType).label).join(", ")}
                  </div>
                </div>
              </div>
            )}

            {/* No active highlights */}
            {!highlights.closestToTarget && !highlights.hasOverheatAlert && !highlights.readyMeats?.length && (
              <div className="text-sm text-gray-500 italic">Select meat types to see cooking highlights</div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500 italic">No sensor data available</div>
        )}
      </CardContent>
    </Card>
  )
}
