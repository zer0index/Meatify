"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Flame, CheckCircle, AlertTriangle, Thermometer } from "lucide-react"
import type { Sensor, MeatType } from "@/lib/types"
import { formatTemp, getMeatInfo } from "@/lib/utils"

interface CookSessionPanelProps {
  sensors: Sensor[]
  selectedMeats: Record<number, MeatType | null>
  isCelsius: boolean
  sessionStartTime: Date | null
  isSessionActive: boolean
}

export function CookSessionPanel({ sensors, selectedMeats, isCelsius, sessionStartTime, isSessionActive }: CookSessionPanelProps) {
  const [elapsedTime, setElapsedTime] = useState("00:00:00")

  // Update timer every second using the global session timing
  useEffect(() => {
    if (!isSessionActive || !sessionStartTime) {
      setElapsedTime("00:00:00")
      return
    }

    const intervalId = setInterval(() => {
      const now = new Date()
      const diff = now.getTime() - sessionStartTime.getTime()

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`,
      )
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isSessionActive, sessionStartTime])

  // Calculate session highlights
  const getSessionHighlights = () => {
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

  const highlights = getSessionHighlights()
  const formattedStartTime = sessionStartTime
    ? `Started at ${sessionStartTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Session not started"

  return (
    <Card className="w-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-amber-600/30 shadow-lg">
      <CardContent className="p-4">
        {/* Session Timer */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-amber-500">Cook Session</h2>
          </div>
          <div className="flex flex-col">
            <div className="text-3xl md:text-4xl font-bold text-white font-mono tracking-wider">{elapsedTime}</div>
            <div className="text-xs text-gray-400 mt-1">{formattedStartTime}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent my-4"></div>

        {/* Live Highlights */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">LIVE HIGHLIGHTS</h3>

          <div className="space-y-3">
            {/* Average Grill Temperature */}
            {highlights && (
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/20 p-1.5 rounded-md">
                  <Thermometer className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Avg Grill Temp: {formatTemp(highlights.avgGrillTemp, isCelsius)}
                  </div>
                </div>
              </div>
            )}

            {/* Closest to Done */}
            {highlights?.closestToTarget &&
              typeof highlights.closestToTarget === "object" &&
              highlights.closestToTarget !== null &&
              "meatType" in highlights.closestToTarget &&
              "sensor" in highlights.closestToTarget &&
              "diff" in highlights.closestToTarget && (
                <div className="flex items-center gap-2">
                  <div className="bg-amber-500/20 p-1.5 rounded-md">
                    <Flame className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {getMeatInfo((highlights.closestToTarget as { sensor: Sensor; meatType: MeatType; diff: number }).meatType).label} @{" "}
                      {formatTemp((highlights.closestToTarget as { sensor: Sensor; meatType: MeatType; diff: number }).sensor.currentTemp, isCelsius)}
                    </div>
                    <div className="text-xs text-amber-500/80">
                      {formatTemp((highlights.closestToTarget as { sensor: Sensor; meatType: MeatType; diff: number }).diff, isCelsius)} from target
                    </div>
                  </div>
                </div>
              )}

            {/* Overheat Alert */}
            {highlights?.hasOverheatAlert && (
              <div className="flex items-center gap-2 animate-pulse">
                <div className="bg-red-500/20 p-1.5 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-sm font-medium text-red-400">Grill Overheat Alert!</div>
              </div>
            )}

            {/* Ready Meats */}
            {highlights?.readyMeats && highlights.readyMeats.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="bg-green-500/20 p-1.5 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-green-400">
                    Ready: {highlights.readyMeats.map((item) => getMeatInfo(item.meatType).label).join(", ")}
                  </div>
                </div>
              </div>
            )}

            {/* No highlights yet */}
            {(!highlights ||
              (!highlights.closestToTarget && !highlights.hasOverheatAlert && !highlights.readyMeats?.length)) && (
              <div className="text-sm text-gray-500 italic">No cooking highlights yet. Select meat types to begin.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
