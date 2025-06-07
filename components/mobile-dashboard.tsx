"use client"

import { useState } from "react"
import { MeatSensorCard } from "./meat-sensor-card"
import { AmbientSensorCard } from "./ambient-sensor-card"
import { LiveHighlightsCard } from "./live-highlights-card"
import { WeatherWidget } from "./weather-widget"
import { MeatSelector } from "./meat-selector"
import type { Sensor, MeatType } from "@/lib/types"

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "highlights", label: "Live Highlights" },
  { key: "weather", label: "Weather" },
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

  // Overview Tab: All sensors minimized, tap to expand
  const renderOverview = () => (
    <div className="flex flex-col h-full justify-between p-2">
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

  return (
    <div className="fixed inset-0 flex flex-col bg-black">
      <div className="flex-1 overflow-hidden">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "highlights" && renderHighlights()}
        {activeTab === "weather" && renderWeather()}
      </div>
      {/* Bottom Navigation Bar */}
      <nav className="flex justify-around items-center h-16 bg-gray-900 border-t border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 py-2 text-center ${activeTab === tab.key ? "text-amber-500 font-bold" : "text-gray-400"}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
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
