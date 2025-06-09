"use client"

import { getMeatInfo } from "@/lib/utils"
import { useEffect, useState } from "react"
import { MeatSensorCard } from "./meat-sensor-card"
import { AmbientSensorCard } from "./ambient-sensor-card"
import { LiveHighlightsCard } from "./live-highlights-card"
import { WeatherWidget } from "./weather-widget"
import { MeatSelector } from "./meat-selector"
import type { Sensor, MeatType, TemperatureReading } from "@/lib/types"
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
  sessionHistory: Record<number, TemperatureReading[]>
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
    <div className="flex flex-col h-full w-full bg-black p-2 pb-0">
      {/* Mini Live Highlights at the top, now sticky */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-sm pb-2 w-full">
        <LiveHighlightsCard
          sensors={props.sensors}
          selectedMeats={props.selectedMeats}
          isCelsius={props.isCelsius}
          compact={true}
        />
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar w-full">
        {/* Meat Sensors Section */}
        <div className="pt-1 pb-3 w-full">
          <div className="grid grid-cols-2 gap-3 w-full px-1">
            {meatSensors.map((sensor) => (
              <div
                key={sensor.id}
                onClick={() => setExpandedSensor(sensor.id)}
                className="transform transition-transform active:scale-95"
              >                <MeatSensorCard
                  sensor={sensor}
                  selectedMeat={props.selectedMeats[sensor.id]}
                  sessionHistory={props.sessionHistory[sensor.id] || []}
                  isCelsius={props.isCelsius}
                  onMeatSelectorClick={() => props.onMeatSelectorClick(sensor.id)}
                  onTargetTempChange={(temp) => props.onTargetTempChange(sensor.id, temp)}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Visual Separator - more subtle and consistent */}
        <div className="w-full h-[1px] bg-gray-800 mb-3 mx-auto"></div>
        
        {/* Grill Sensors Section */}
        <div className="pb-3 px-1">
          <div className="flex gap-3 w-full">
            {ambientSensors.map((sensor) => (
              <div key={sensor.id} className="flex-1 min-w-0">                <AmbientSensorCard
                  sensor={sensor}
                  sessionHistory={props.sessionHistory[sensor.id] || []}
                  isCelsius={props.isCelsius}
                  onTargetTempChange={(temp) => props.onTargetTempChange(sensor.id, temp)}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
        {/* Sensor Detail Modal */}
      {expandedSensor !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setExpandedSensor(null)}
        >
          <div
            className="w-full max-w-full bg-gray-900 rounded-lg p-4 relative mx-2 my-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl z-10"
              onClick={() => setExpandedSensor(null)}
              aria-label="Close"
            >
              ×
            </button>            <MeatSensorCard
              sensor={meatSensors.find((s) => s.id === expandedSensor)!}
              selectedMeat={props.selectedMeats[expandedSensor]}
              sessionHistory={props.sessionHistory[expandedSensor] || []}
              isCelsius={props.isCelsius}
              onMeatSelectorClick={() => props.onMeatSelectorClick(expandedSensor)}
              onTargetTempChange={(temp) => props.onTargetTempChange(expandedSensor, temp)}
            />
          </div>
        </div>
      )}
    </div>
  )  // Highlights Tab
  const renderHighlights = () => (
    <div className="p-2 h-full w-full flex items-center justify-center">
      <div className="w-full max-w-full">
        <LiveHighlightsCard 
          sensors={props.sensors} 
          selectedMeats={props.selectedMeats} 
          isCelsius={props.isCelsius}
        />
      </div>
    </div>
  )

  // Weather Tab
  const renderWeather = () => (
    <div className="p-2 h-full w-full flex items-center justify-center">
      <div className="w-full max-w-full">
        <WeatherWidget />
      </div>
    </div>
  )
  // History Tab
  const renderHistory = () => (
    <div className="p-2 h-full w-full overflow-y-auto flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-amber-500 mb-2">Temperature History</h2>
      {/* Meat Sensors Charts FIRST */}
      {meatSensors.map((sensor) => {
        const meatType = props.selectedMeats[sensor.id]
        const meatLabel = meatType ? getMeatInfo(meatType).label : `Meat Sensor #${sensor.id - 1}`
        return (
          <div key={sensor.id} className="mb-4 w-full">
            <div className="text-sm font-bold text-white mb-1">{meatLabel}</div>
            <div className="bg-gray-900 rounded-lg p-2 w-full">
              <TemperatureChart
                data={sensor.history}
                sessionHistory={props.sessionHistory[sensor.id] || []}
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
        <div key={sensor.id} className="mb-4 w-full">
          <div className="text-sm font-bold text-white mb-1">Grill Sensor #{sensor.id + 1}</div>
          <div className="bg-gray-900 rounded-lg p-2 w-full">
            <TemperatureChart
              data={sensor.history}
              sessionHistory={props.sessionHistory[sensor.id] || []}
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
      <div className="p-2 h-full w-full overflow-y-auto flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-amber-500 mb-2">Debug & Diagnostics</h2>
        <div className="bg-gray-900 rounded-lg p-4 w-full">
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
    <div className="fixed inset-0 flex flex-col bg-black w-full h-full">
      <div className="flex-1 w-full overflow-hidden">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "history" && renderHistory()}
        {activeTab === "highlights" && renderHighlights()}
        {activeTab === "weather" && renderWeather()}
        {activeTab === "debug" && renderDebug()}
      </div>
      
      {/* Bottom Navigation Bar with icons */}
      <nav className="flex justify-around items-center h-16 bg-gray-900 border-t border-gray-700 shadow-lg w-full">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              className={`flex-1 flex flex-col items-center justify-center py-2 relative ${
                isActive ? "text-amber-500" : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActiveTab(tab.key)}
              aria-label={tab.label}
            >
              <Icon className={`w-6 h-6 transition-all duration-300 ${
                isActive ? 'scale-110' : ''
              }`} />
              
              {/* Small dot indicator for active tab */}
              {isActive && (
                <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              )}
              <span className="text-xs mt-0.5">{tab.label}</span>
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
