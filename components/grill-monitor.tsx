"use client"

import dynamic from "next/dynamic"
const MobileDashboard = dynamic(() => import("@/components/mobile-dashboard"), { ssr: false })

import { useEffect, useState } from "react"
import { AmbientSensorCard } from "@/components/ambient-sensor-card"
import { MeatSensorCard } from "@/components/meat-sensor-card"
import { MeatSelector } from "@/components/meat-selector"
import { SessionHeader } from "@/components/session-header"
import { LiveHighlightsCard } from "@/components/live-highlights-card"
import { WeatherWidget } from "@/components/weather-widget"
import { fetchSensorData } from "@/lib/api"
import type { Sensor, MeatType } from "@/lib/types"
import { 
  loadSession, 
  createNewSession, 
  updateSessionMeat, 
  updateSessionTarget, 
  updateSessionTemperatureHistory,
  startSession,
  getCurrentSession,
  isSessionRecent
} from "@/lib/dataStore"

const DEFAULT_SENSORS: Sensor[] = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  currentTemp: 0,
  targetTemp: i < 2 ? 180 : 70, // Default targets: 180°C for grill, 70°C for meat
  history: Array(15).fill(0)
}))

export default function GrillMonitor() {
  const [sensors, setSensors] = useState<Sensor[]>(DEFAULT_SENSORS)
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
  const [isMobile, setIsMobile] = useState(false)
  const [showSessionRestore, setShowSessionRestore] = useState(false)

  // Load saved session on component mount
  useEffect(() => {
    const savedSession = loadSession()
    if (savedSession && isSessionRecent()) {
      // Restore session state
      setSelectedMeats(savedSession.selectedMeats)
      setSessionStartTime(savedSession.startTime)
      setIsSessionActive(savedSession.isActive)
      
      // Apply saved target temperatures to sensors
      setSensors(prev => prev.map(sensor => ({
        ...sensor,
        targetTemp: savedSession.sensorTargets[sensor.id] || sensor.targetTemp
      })))
      
      setShowSessionRestore(false)
    } else if (savedSession) {
      // Session exists but is older - show restore option
      setShowSessionRestore(true)
    } else {
      // No saved session, create new one
      createNewSession()
    }
  }, [])
  useEffect(() => {
    // Initial data fetch
    fetchSensorData().then((data) => {
      if (data.length > 0) {
        setSensors(prevSensors => {
          const updatedSensors = data.map(sensor => {
            const prevSensor = prevSensors.find(s => s.id === sensor.id)
            return {
              ...sensor,
              targetTemp: prevSensor?.targetTemp || sensor.targetTemp
            }
          })
          
          // Update temperature history in session
          updateSessionTemperatureHistory(updatedSensors)
          return updatedSensors
        })
      }
    }).catch(console.error)

    // Set up polling for data updates
    const intervalId = setInterval(() => {
      fetchSensorData().then((data) => {
        if (data.length > 0) {
          setSensors(prevSensors => {
            const updatedSensors = data.map(sensor => {
              const prevSensor = prevSensors.find(s => s.id === sensor.id)
              return {
                ...sensor,
                targetTemp: prevSensor?.targetTemp || sensor.targetTemp
              }
            })
            
            // Update temperature history in session
            updateSessionTemperatureHistory(updatedSensors)
            return updatedSensors
          })
        }
      }).catch(console.error)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [])
  // Check if session should start
  useEffect(() => {
    if (!isSessionActive && sensors.length > 0) {
      const meatSensors = sensors.filter((sensor) => sensor.id >= 2)
      if (meatSensors.some((sensor) => sensor.currentTemp > 0)) {
        setIsSessionActive(true)
        const startTime = new Date()
        setSessionStartTime(startTime)
        // Update session in storage
        startSession()
      }
    }
  }, [sensors, isSessionActive])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const ambientSensors = sensors.filter((sensor) => sensor.id < 2)
  const meatSensors = sensors.filter((sensor) => sensor.id >= 2)
  const handleMeatSelection = (sensorId: number, meat: MeatType) => {
    setSelectedMeats((prev) => ({
      ...prev,
      [sensorId]: meat,
    }))
    setShowMeatSelector(null)
    // Save meat selection to session
    updateSessionMeat(sensorId, meat)
  }

  const handleTargetTempChange = (sensorId: number, temp: number) => {
    setSensors((prev) => prev.map((sensor) => (sensor.id === sensorId ? { ...sensor, targetTemp: temp } : sensor)))
    // Save target temperature to session
    updateSessionTarget(sensorId, temp)
  }

  const handleRestoreSession = () => {
    const savedSession = loadSession()
    if (savedSession) {
      setSelectedMeats(savedSession.selectedMeats)
      setSessionStartTime(savedSession.startTime)
      setIsSessionActive(savedSession.isActive)
      
      setSensors(prev => prev.map(sensor => ({
        ...sensor,
        targetTemp: savedSession.sensorTargets[sensor.id] || sensor.targetTemp
      })))
    }
    setShowSessionRestore(false)
  }

  const handleClearSession = () => {
    setSelectedMeats({ 2: null, 3: null, 4: null, 5: null, 6: null })
    setSessionStartTime(null)
    setIsSessionActive(false)
    setSensors(DEFAULT_SENSORS)
    createNewSession()
    setShowSessionRestore(false)
  }

  if (isMobile) {
    return (
      <MobileDashboard
        sensors={sensors}
        selectedMeats={selectedMeats}
        isCelsius={isCelsius}
        onMeatSelectorClick={setShowMeatSelector}
        onTargetTempChange={handleTargetTempChange}
        showMeatSelector={showMeatSelector}
        onMeatSelect={handleMeatSelection}
        onCloseMeatSelector={() => setShowMeatSelector(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">      {/* Session Timer Header */}
      <SessionHeader 
        sessionStartTime={sessionStartTime} 
        isSessionActive={isSessionActive} 
        onClearSession={handleClearSession}
      />

      <div className="container mx-auto px-4 py-6">        {/* Status Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
          <div className="h-[280px] flex flex-col">
            <LiveHighlightsCard sensors={sensors} selectedMeats={selectedMeats} isCelsius={isCelsius} />
          </div>
          <div className="h-[280px] flex flex-col">
            <WeatherWidget />
          </div>
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
        </section>        {showMeatSelector !== null && (
          <MeatSelector
            onSelect={(meat) => handleMeatSelection(showMeatSelector, meat)}
            onClose={() => setShowMeatSelector(null)}
          />
        )}

        {showSessionRestore && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 max-w-md mx-4">
              <h3 className="text-xl font-semibold text-amber-500 mb-4">Previous Session Found</h3>
              <p className="text-gray-300 mb-6">
                We found a previous grilling session. Would you like to restore your meat selections and temperature settings?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRestoreSession}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Restore Session
                </button>
                <button
                  onClick={handleClearSession}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
