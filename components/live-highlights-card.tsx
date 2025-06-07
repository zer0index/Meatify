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

// Helper to get trend arrow for grill temp
function getGrillTempTrend(grillSensors: Sensor[]): "up" | "down" | "steady" {
  // Use the average of the last 3 readings for all grill sensors
  const histories = grillSensors.map((s) => s.history)
  // Take the shortest history length
  const minLen = Math.min(...histories.map((h) => h.length))
  if (minLen < 3) return "steady"
  // Average the last 3 values for each sensor
  const avgs = [0, 1, 2].map((i) => {
    const vals = grillSensors.map((s) => s.history[s.history.length - 3 + i])
    return vals.reduce((a, b) => a + b, 0) / vals.length
  })
  if (avgs[2] > avgs[1] && avgs[1] > avgs[0]) return "up"
  if (avgs[2] < avgs[1] && avgs[1] < avgs[0]) return "down"
  return "steady"
}

// Helper to estimate finish time for a meat sensor
function getEstimatedFinishTime(history: number[], target: number, isCelsius: boolean): string {
  if (!history || history.length < 3) return ""
  // Use the last 5 readings to estimate rate per minute
  const N = Math.min(5, history.length - 1)
  const recent = history.slice(-N - 1)
  const delta = recent[N] - recent[0]
  if (delta <= 0) return ""
  // Assume 1 reading per minute (or adjust if you know the interval)
  const ratePerMin = delta / N
  const remaining = target - recent[N]
  if (remaining <= 0) return "Now"
  const mins = remaining / ratePerMin
  if (!isFinite(mins) || mins < 0) return ""
  const eta = new Date(Date.now() + mins * 60000)
  return `~${eta.getHours().toString().padStart(2, "0")}:${eta.getMinutes().toString().padStart(2, "0")}`
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
    // Minimal, horizontal, no card header, smaller paddings, fixed height
    // Show at most 3 highlights: Avg Grill Temp, Closest to Done Meat (with progress bar), and either Overheat Alert or Ready Meats
    let highlightsList: React.ReactNode[] = []

    if (highlights) {
      // 1. Avg Grill Temp (always shown)
      const trend = getGrillTempTrend(sensors.filter((s) => s.id < 2))
      highlightsList.push(
        <div key="avg-grill-temp" className="flex items-center gap-1 min-w-0">
          <Thermometer className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-white truncate">{formatTemp(Number(formatFloat(highlights.avgGrillTemp)), isCelsius)}</span>
          {trend === "up" && <span className="text-green-400 ml-0.5">▲</span>}
          {trend === "down" && <span className="text-red-400 ml-0.5">▼</span>}
          {trend === "steady" && <span className="text-gray-400 ml-0.5">→</span>}
        </div>
      )

      // 2. Closest to Done Meat (with progress bar, doneness, and finish time)
      if (
        highlights.closestToTarget &&
        typeof highlights.closestToTarget === "object" &&
        highlights.closestToTarget !== null &&
        "meatType" in highlights.closestToTarget &&
        "sensor" in highlights.closestToTarget &&
        "diff" in highlights.closestToTarget
      ) {
        const { sensor, meatType } = highlights.closestToTarget as { sensor: Sensor; meatType: MeatType; diff: number }
        const progress = Math.max(0, Math.min(1, sensor.currentTemp / sensor.targetTemp))
        // Doneness label (simple: <50% rare, <80% medium, >=80% well)
        let doneness = "Rare"
        if (progress >= 0.8) doneness = "Well"
        else if (progress >= 0.5) doneness = "Medium"
        highlightsList.push(
          <div key="closest-meat" className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-orange-500 text-xs">🥩</span>
              <span className="text-white font-medium truncate">{getMeatInfo(meatType).label}</span>
              <span className="text-orange-400">{formatTemp(Number(formatFloat(sensor.currentTemp)), isCelsius)}</span>
              <span className="text-gray-400 text-xs">/ {formatTemp(Number(formatFloat(sensor.targetTemp)), isCelsius)}</span>
              <span className="ml-1 text-xs text-gray-400">{getEstimatedFinishTime(sensor.history, sensor.targetTemp, isCelsius)}</span>
            </div>
            <div className="w-full h-1 bg-gray-700 rounded mt-0.5">
              <div
                className={`h-1 rounded ${progress >= 0.8 ? "bg-green-500" : progress >= 0.5 ? "bg-yellow-400" : "bg-red-500"}`}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 mt-0.5">{doneness}</span>
          </div>
        )
      }

      // 3. Overheat Alert (priority) or Ready Meats
      if (highlights.hasOverheatAlert) {
        highlightsList.push(
          <div key="overheat" className="flex items-center gap-1 animate-pulse">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-red-400 font-semibold">Overheat!</span>
          </div>
        )
      } else if (highlights.readyMeats && highlights.readyMeats.length > 0) {
        highlightsList.push(
          <div key="ready-meats" className="flex items-center gap-1 min-w-0">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-green-400 font-semibold truncate">Ready: {highlights.readyMeats.map((item) => getMeatInfo(item.meatType).label).join(", ")}</span>
          </div>
        )
      }
      // Only show up to 3 highlights
      highlightsList = highlightsList.slice(0, 3)
    }

    return (
      <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-900/80 border border-gray-700 mb-2 h-20 min-h-16 max-h-24 overflow-hidden">
        {highlightsList.length > 0 ? (
          <div className="flex flex-wrap gap-2 items-center justify-between text-xs h-full w-full">
            {highlightsList.map((item, idx) => (
              <div key={idx} className="flex-1 min-w-0 truncate">
                {item}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-500 italic">No data</span>
        )}
      </div>
    )
  }

  // In the main (non-compact) render, replace:
  // {highlights.closestToTarget && ... && (
  //   ...
  // )}
  // with:
  // {sensor && meatType && typeof diff === 'number' && (
  //   <div className="flex items-center gap-3">
  //     <div className="bg-orange-500/20 p-2 rounded-lg">
  //       <span className="text-orange-500 text-sm">🥩</span>
  //     </div>
  //     <div>
  //       <div className="text-sm font-medium text-white">
  //         {getMeatInfo(meatType ?? '').label} @ {sensor ? formatTemp(Number(formatFloat(sensor.currentTemp)), isCelsius) : '--'}
  //       </div>
  //       <div className="text-xs text-orange-400">
  //         ({typeof diff === 'number' ? formatFloat(diff) : '--'}°{isCelsius ? 'C' : 'F'} from target)
  //         {sensor ? ` ${getEstimatedFinishTime(sensor.history, sensor.targetTemp, isCelsius)}` : ''}
  //       </div>
  //     </div>
  //   </div>
  // )}
  // Remove all lines that reference highlights.closestToTarget.sensor in the main (non-compact) render.

  return (
    <Card className="w-full h-full m-3 bg-gray-900/60 border-gray-700 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-amber-500">
          <Flame className="h-5 w-5" />
          Live Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col justify-start">
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

            {/* Trend arrow for Avg Grill Temp */}
            {/* {tempHistory.length === 3 && (
              <div className="flex items-center gap-1">
                {(() => {
                  const [first, second, third] = tempHistory
                  const trend = third.value - first.value
                  let trendColor = "text-gray-400"
                  if (trend > 0) trendColor = "text-green-400"
                  else if (trend < 0) trendColor = "text-red-400"
                  return (
                    <span className={`text-xs ${trendColor}`}>
                      {trend > 0 ? "▲" : trend < 0 ? "▼" : "→"} {Math.abs(trend).toFixed(1)}°
                    </span>
                  )
                })()}
              </div>
            )} */}

            {/* Closest to Done */}
            {(() => {
              let sensor: Sensor | undefined, meatType: MeatType | undefined, diff: number | undefined
              if (
                highlights.closestToTarget &&
                typeof highlights.closestToTarget === "object" &&
                "sensor" in highlights.closestToTarget &&
                "meatType" in highlights.closestToTarget &&
                "diff" in highlights.closestToTarget
              ) {
                ;({ sensor, meatType, diff } = highlights.closestToTarget as { sensor: Sensor; meatType: MeatType; diff: number })
              }
              return (
                sensor &&
                meatType &&
                typeof diff === "number" && (
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 p-2 rounded-lg">
                      <span className="text-orange-500 text-sm">🥩</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {getMeatInfo(meatType ?? "").label} @{" "}
                        {sensor ? formatTemp(Number(formatFloat(sensor.currentTemp)), isCelsius) : "--"}
                      </div>
                      <div className="text-xs text-orange-400">
                        ({typeof diff === "number" ? formatFloat(diff) : "--"}°{isCelsius ? "C" : "F"} from target)
                        {sensor ? ` ${getEstimatedFinishTime(sensor.history, sensor.targetTemp, isCelsius)}` : ""}
                      </div>
                    </div>
                  </div>
                )
              )
            })()}

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
