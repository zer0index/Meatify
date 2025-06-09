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
import type { Sensor, MeatType, TemperatureReading } from "@/lib/types"
import { createMockSensorsWithHistory } from "@/lib/historyUtils"
import { 
  loadSession, 
  createNewSession, 
  updateSessionMeat, 
  updateSessionTarget, 
  updateSessionTemperatureHistory,
  startSession,
  clearSession,
  getCurrentSession,
  isSessionRecent,
  addSessionChangeListener
} from "@/lib/dataStore"

const DEFAULT_SENSORS: Sensor[] = createMockSensorsWithHistory()

export default function GrillMonitor() {
  const [mounted, setMounted] = useState(false)
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [sessionHistory, setSessionHistory] = useState<Record<number, TemperatureReading[]>>({})
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
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false)

  // Set mounted to true after component mounts to prevent hydration mismatches
  useEffect(() => {
    setMounted(true)
    // Initialize with mock data only on client
    setSensors(DEFAULT_SENSORS)
  }, [])
    // Load saved session on component mount
  useEffect(() => {
    const loadSessionAsync = async () => {
      setHasAttemptedRestore(true)
      const savedSession = await loadSession()
      if (savedSession && isSessionRecent()) {
        // Restore session state
        setSelectedMeats(savedSession.selectedMeats)
        setSessionStartTime(savedSession.startTime)
        setIsSessionActive(savedSession.isActive)
        setSessionHistory(savedSession.temperatureHistory)
        
        // Apply saved target temperatures to sensors
        setSensors(prev => prev.map(sensor => ({
          ...sensor,
          targetTemp: savedSession.sensorTargets[sensor.id] || sensor.targetTemp
        })))
        
        setShowSessionRestore(false)
      } else if (savedSession) {
        // Session exists but is older - show restore option
        setShowSessionRestore(true)
        setSessionHistory(savedSession.temperatureHistory)
      } else {
        // No saved session, create new one
        createNewSession()
      }
    }
      loadSessionAsync()
  }, [])
  
  useEffect(() => {
    // Initial data fetch
    fetchSensorData().then(async (data) => {
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
      fetchSensorData().then(async (data) => {
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
        }      }).catch(console.error)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [])  // Check if session should start
  useEffect(() => {
    if (!isSessionActive && sensors.length > 0 && !sessionStartTime && hasAttemptedRestore) {
      // Only start a new session if we haven't restored one and restore attempt has completed
      const ambientSensors = sensors.filter(sensor => sensor.id < 2)
      const meatSensors = sensors.filter(sensor => sensor.id >= 2)
      
      const hasAmbientActivity = ambientSensors.some(sensor => sensor.currentTemp > 30)
      const hasMeatActivity = meatSensors.some(sensor => sensor.currentTemp > 10)
      
      if (hasAmbientActivity || hasMeatActivity) {
        setIsSessionActive(true)
        const startTime = new Date()
        setSessionStartTime(startTime)
        // Update session in storage
        startSession()
      }
    }
  }, [sensors, hasAttemptedRestore, isSessionActive, sessionStartTime])
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Handler functions
  const handleMeatSelection = async (sensorId: number, meat: MeatType) => {
    setSelectedMeats((prev) => ({
      ...prev,
      [sensorId]: meat,
    }))
    setShowMeatSelector(null)
    // Save meat selection to session
    await updateSessionMeat(sensorId, meat)
  }

  const handleTargetTempChange = async (sensorId: number, temp: number) => {
    setSensors((prev) => prev.map((sensor) => (sensor.id === sensorId ? { ...sensor, targetTemp: temp } : sensor)))
    // Save target temperature to session
    await updateSessionTarget(sensorId, temp)
  }
  const handleRestoreSession = async () => {
    const savedSession = await loadSession()
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
  const handleClearSession = async () => {
    setSelectedMeats({ 2: null, 3: null, 4: null, 5: null, 6: null })
    setSessionStartTime(null)
    setIsSessionActive(false)
    setSensors(DEFAULT_SENSORS)
    createNewSession()
    await clearSession()
    setShowSessionRestore(false)
  }

  const handleStartSession = async () => {
    if (!isSessionActive) {
      setIsSessionActive(true)
      const startTime = new Date()
      setSessionStartTime(startTime)
      await startSession()
    }
  }

  const handleResetSession = () => {
    // Stop current session
    setIsSessionActive(false)
    setSessionStartTime(null)
    // Clear all selections and reset sensors
    setSelectedMeats({ 2: null, 3: null, 4: null, 5: null, 6: null })
    setSensors(DEFAULT_SENSORS)
    // Create new session
    createNewSession()
  }

  // Session change listener to update history when session syncs
  useEffect(() => {
    const unsubscribe = addSessionChangeListener((session, source) => {
      if (session) {
        setSessionHistory(session.temperatureHistory)
        if (source === 'remote') {
          console.log('Session history updated from remote device')
        }
      }
    })
      return unsubscribe
  }, [])

  // Don't render until mounted to prevent hydration mismatches
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading grill monitor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ambientSensors = sensors.filter((sensor) => sensor.id < 2)
  const meatSensors = sensors.filter((sensor) => sensor.id >= 2)

  if (isMobile) {return (
      <MobileDashboard
        sensors={sensors}
        sessionHistory={sessionHistory}
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
        onStartSession={handleStartSession}
        onResetSession={handleResetSession}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">            {meatSensors.map((sensor) => (
              <MeatSensorCard
                key={sensor.id}
                sensor={sensor}
                selectedMeat={selectedMeats[sensor.id]}
                sessionHistory={sessionHistory[sensor.id]}
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
          <div className="grid grid-cols-2 gap-6">            {ambientSensors.map((sensor) => (
              <AmbientSensorCard
                key={sensor.id}
                sensor={sensor}
                sessionHistory={sessionHistory[sensor.id]}
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
