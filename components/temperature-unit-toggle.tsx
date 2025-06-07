"use client"

import { Switch } from "@/components/ui/switch"

interface TemperatureUnitToggleProps {
  isCelsius: boolean
  onChange: (isCelsius: boolean) => void
}

export function TemperatureUnitToggle({ isCelsius, onChange }: TemperatureUnitToggleProps) {
  return (
    <div className="flex items-center space-x-4 bg-gray-800 p-2 rounded-lg">
      <div className={`text-sm font-medium ${isCelsius ? "text-amber-500" : "text-gray-400"}`}>°C</div>
      <Switch
        checked={!isCelsius}
        onCheckedChange={(checked) => onChange(!checked)}
        className="data-[state=checked]:bg-amber-500"
      />
      <div className={`text-sm font-medium ${!isCelsius ? "text-amber-500" : "text-gray-400"}`}>°F</div>
    </div>
  )
}
