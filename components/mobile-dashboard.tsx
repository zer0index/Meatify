"use client"

import { getMeatInfo } from "@/lib/utils"
import { useEffect, useState } from "react"
import { MeatSensorCard } from "./meat-sensor-card"
import { AmbientSensorCard } from "./ambient-sensor-card"
import { LiveHighlightsCard } from "./live-highlights-card"
import { WeatherWidget } from "./weather-widget"
import { MeatSelector } from "./meat-selector"
import type { Sensor, MeatType } from "@/lib/types"
import { Home, History, Flame, Cloud, Bug } from "lucide-react"
import { TemperatureChart } from "./temperature-chart"

const TABS = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "history", label: "History", icon: History },
  { key: "highlights", label: "Live Highlights", icon: Flame },
  { key: "weather", label: "Weather", icon: Cloud },
  { key: "debug", label: "Debug", icon: Bug },
]

interface MobileDashboardProps {
  sensors: Sensor[]
  selectedMeats: Record<number, MeatType | null>
  isCelsius: boolean
  onMeatSelectorClick: (id: number) => void
  onTargetTempChange: (id: number, temp: number) => void
  showMeatSelector: number | null
  onMeatSelect: (id: number, meat: MeatType) => void
  onCloseMeatSelector: () => void
}

export default function MobileDashboard(props: MobileDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedSensor, setExpandedSensor] = useState<number | null>(null)

  // Split sensors
  const ambientSensors = props.sensors.filter((s) => s.id < 2)
  const meatSensors = props.sensors.filter((s) => s.id >= 2)

  // Debug info state and effect (moved from renderDebug)
  type DebugInfo = {
    dataSource: 'mock' | 'node-red'
    lastUpdate: string
    error?: string
    nodeRedStatus?: 'available' | 'unavailable' | 'error'
  }
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [debugError, setDebugError] = useState<string | null>(null)
  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        const response = await fetch('/api/data')
        if (response.ok) {
          const data = await response.json()
          setDebugInfo(data.debug)
          setDebugError(null)
        } else {
          setDebugError('Failed to fetch debug info')
        }
      } catch (err) {
        setDebugError(err instanceof Error ? err.message : 'Unknown error')
      }
    }
    fetchDebugInfo()
    const interval = setInterval(fetchDebugInfo, 5000)
    return () => clearInterval(interval)
  }, [])

  // Overview Tab: All sensors minimized, tap to expand
  const renderOverview = () => (
    <div className="flex flex-col h-full justify-between p-2">
      {/* Mini Live Highlights at the top */}
      <LiveHighlightsCard
        sensors={props.sensors}
        selectedMeats={props.selectedMeats}
        isCelsius={props.isCelsius}
        compact={true}
      />
      {/* Meat Sensors Section */}
      <div className="mb-2">
        <div className="text-amber-400 text-sm font-bold mb-1 pl-1">Meat Sensors</div>
        <div className="grid grid-cols-2 gap-2 w-full" style={{ minHeight: "28vh" }}>
          {meatSensors.map((sensor) => (
            <div
              key={sensor.id}
              onClick={() => setExpandedSensor(sensor.id)}
              style={{ cursor: "pointer" }}
            >
              <MeatSensorCard
                sensor={sensor}
                selectedMeat={props.selectedMeats[sensor.id]}
                isCelsius={props.isCelsius}
                onMeatSelectorClick={() => props.onMeatSelectorClick(sensor.id)}
                onTargetTempChange={(temp) => props.onTargetTempChange(sensor.id, temp)}
                compact={true}
              />
            </div>
          ))}
        </div>
      </div>
      {/* Grill Sensors Section */}
      <div>
        <div className="text-amber-400 text-sm font-bold mb-1 pl-1">Grill Sensors</div>
        <div className="flex gap-2 w-full" style={{ height: "18vh" }}>
          {ambientSensors.map((sensor) => (
            <div key={sensor.id} className="flex-1 min-w-0">
              <AmbientSensorCard
                sensor={sensor}
                isCelsius={props.isCelsius}
                onTargetTempChange={(temp) => props.onTargetTempChange(sensor.id, temp)}
                compact={true}
              />
            </div>
          ))}
        </div>
      </div>
      {/* Sensor Detail Modal */}
      {expandedSensor !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setExpandedSensor(null)}
        >
          <div
            className="w-full max-w-md bg-gray-900 rounded-lg p-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-white text-2xl"
              onClick={() => setExpandedSensor(null)}
              aria-label="Close"
            >
              ×
            </button>
            <MeatSensorCard
              sensor={meatSensors.find((s) => s.id === expandedSensor)!}
              selectedMeat={props.selectedMeats[expandedSensor]}
              isCelsius={props.isCelsius}
              onMeatSelectorClick={() => props.onMeatSelectorClick(expandedSensor)}
              onTargetTempChange={(temp) => props.onTargetTempChange(expandedSensor, temp)}
            />
          </div>
        </div>
      )}
    </div>
  )

  // Highlights Tab
  const renderHighlights = () => (
    <div className="p-2 h-full flex items-center justify-center">
      <LiveHighlightsCard sensors={props.sensors} selectedMeats={props.selectedMeats} isCelsius={props.isCelsius} />
    </div>
  )

  // Weather Tab
  const renderWeather = () => (
    <div className="p-2 h-full flex items-center justify-center">
      <WeatherWidget />
    </div>
  )

  // History Tab
  const renderHistory = () => (
    <div className="p-2 h-full overflow-y-auto flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-amber-500 mb-2">Temperature History</h2>
      {/* Meat Sensors Charts FIRST */}
      {meatSensors.map((sensor) => {
        const meatType = props.selectedMeats[sensor.id]
        const meatLabel = meatType ? getMeatInfo(meatType).label : `Meat Sensor #${sensor.id - 1}`
        return (
          <div key={sensor.id} className="mb-4">
            <div className="text-sm font-bold text-white mb-1">{meatLabel}</div>
            <div className="bg-gray-900 rounded-lg p-2">
              <TemperatureChart
                data={sensor.history}
                isCelsius={props.isCelsius}
                targetTemp={sensor.targetTemp}
                compact={false}
              />
            </div>
          </div>
        )
      })}
      {/* Grill Sensors Charts SECOND */}
      {ambientSensors.map((sensor) => (
        <div key={sensor.id} className="mb-4">
          <div className="text-sm font-bold text-white mb-1">Grill Sensor #{sensor.id + 1}</div>
          <div className="bg-gray-900 rounded-lg p-2">
            <TemperatureChart
              data={sensor.history}
              isCelsius={props.isCelsius}
              targetTemp={sensor.targetTemp}
              compact={false}
            />
          </div>
        </div>
      ))}
    </div>
  )

  // Debug Tab
  const renderDebug = () => {
    return (
      <div className="p-2 h-full overflow-y-auto flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-amber-500 mb-2">Debug & Diagnostics</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          {debugError ? (
            <div className="text-red-400 mb-2">Error: {debugError}</div>
          ) : debugInfo ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Data Source: </span>
                <span className={debugInfo.dataSource === 'node-red' ? 'text-green-400' : 'text-yellow-400'}>
                  {debugInfo.dataSource}
                </span>
              </div>
              <div>
                <span className="font-medium">Node-RED Status: </span>
                <span className={
                  debugInfo.nodeRedStatus === 'available' ? 'text-green-400' :
                  debugInfo.nodeRedStatus === 'unavailable' ? 'text-yellow-400' :
                  debugInfo.nodeRedStatus === 'error' ? 'text-red-400' : ''
                }>
                  {debugInfo.nodeRedStatus}
                </span>
              </div>
              {debugInfo.error && (
                <div className="text-red-400">
                  <span className="font-medium">Error: </span>
                  {debugInfo.error}
                </div>
              )}
              <div className="text-gray-400">
                <span className="font-medium">Last Update: </span>
                {debugInfo.lastUpdate ? new Date(debugInfo.lastUpdate).toLocaleString() : ''}
              </div>
            </div>
          ) : (
            <div className="text-gray-400">Loading debug info...</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <div className="flex-1 overflow-hidden">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "history" && renderHistory()}
        {activeTab === "highlights" && renderHighlights()}
        {activeTab === "weather" && renderWeather()}
        {activeTab === "debug" && renderDebug()}
      </div>
      {/* Bottom Navigation Bar with icons */}
      <nav className="flex justify-around items-center h-14 bg-gray-900 border-t border-gray-700">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              className={`flex-1 flex flex-col items-center justify-center py-1 ${activeTab === tab.key ? "text-amber-500" : "text-gray-400"}`}
              onClick={() => setActiveTab(tab.key)}
              aria-label={tab.label}
            >
              <Icon className="w-6 h-6 mb-0.5" />
              {/* Optionally, show label only for active tab or on long press */}
            </button>
          )
        })}
      </nav>
      {/* Meat Selector Dialog */}
      {props.showMeatSelector !== null && (
        <MeatSelector
          onSelect={(meat) => props.onMeatSelect(props.showMeatSelector!, meat)}
          onClose={props.onCloseMeatSelector}
        />
      )}
    </div>
  )
}
