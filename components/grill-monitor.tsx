"use client"

import { useEffect, useState } from "react"
import { AmbientSensorCard } from "@/components/ambient-sensor-card"
import { MeatSensorCard } from "@/components/meat-sensor-card"
import { MeatSelector } from "@/components/meat-selector"
import { SessionHeader } from "@/components/session-header"
import { LiveHighlightsCard } from "@/components/live-highlights-card"
import { WeatherWidget } from "@/components/weather-widget"
import { fetchSensorData } from "@/lib/api"
import type { Sensor, MeatType } from "@/lib/types"

export default function GrillMonitor() {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [selectedMeats, setSelectedMeats] = useState<Record<number, MeatType | null>>({
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  })
  const [isCelsius, setIsCelsius] = useState(true)
  const [showMeatSelector, setShowMeatSelector] = useState<number | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)

  useEffect(() => {
    // Initial data fetch
    fetchSensorData().then((data) => {
      setSensors(data)
    })

    // Set up polling for data updates
    const intervalId = setInterval(() => {
      fetchSensorData().then((data) => {
        setSensors(data)
      })
    }, 5000)

    return () => clearInterval(intervalId)
  }, [])

  // Check if session should start
  useEffect(() => {
    if (!isSessionActive && sensors.length > 0) {
      const meatSensors = sensors.filter((sensor) => sensor.id >= 2)
      if (meatSensors.some((sensor) => sensor.currentTemp > 0)) {
        setIsSessionActive(true)
        setSessionStartTime(new Date())
      }
    }
  }, [sensors, isSessionActive])

  const ambientSensors = sensors.filter((sensor) => sensor.id < 2)
  const meatSensors = sensors.filter((sensor) => sensor.id >= 2)

  const handleMeatSelection = (sensorId: number, meat: MeatType) => {
    setSelectedMeats((prev) => ({
      ...prev,
      [sensorId]: meat,
    }))
    setShowMeatSelector(null)
  }

  const handleTargetTempChange = (sensorId: number, temp: number) => {
    setSensors((prev) => prev.map((sensor) => (sensor.id === sensorId ? { ...sensor, targetTemp: temp } : sensor)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Session Timer Header */}
      <SessionHeader sessionStartTime={sessionStartTime} isSessionActive={isSessionActive} />

      <div className="container mx-auto px-4 py-6">
        {/* Status Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-start">
          <LiveHighlightsCard sensors={sensors} selectedMeats={selectedMeats} isCelsius={isCelsius} />
          <WeatherWidget />
        </div>

        {/* Meat Temperatures Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-500">Meat Temperatures</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {meatSensors.map((sensor) => (
              <MeatSensorCard
                key={sensor.id}
                sensor={sensor}
                selectedMeat={selectedMeats[sensor.id]}
                isCelsius={isCelsius}
                onMeatSelectorClick={() => setShowMeatSelector(sensor.id)}
                onTargetTempChange={(temp) => handleTargetTempChange(sensor.id, temp)}
              />
            ))}
          </div>
        </section>

        {/* Grill Temperature Section */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-amber-500">Grill Temperature</h2>
          <div className="grid grid-cols-2 gap-6">
            {ambientSensors.map((sensor) => (
              <AmbientSensorCard
                key={sensor.id}
                sensor={sensor}
                isCelsius={isCelsius}
                onTargetTempChange={(temp) => handleTargetTempChange(sensor.id, temp)}
              />
            ))}
          </div>
        </section>

        {showMeatSelector !== null && (
          <MeatSelector
            onSelect={(meat) => handleMeatSelection(showMeatSelector, meat)}
            onClose={() => setShowMeatSelector(null)}
          />
        )}
      </div>
    </div>
  )
}
