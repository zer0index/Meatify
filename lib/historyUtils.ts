import type { Sensor, TemperatureReading } from "./types"

/**
 * Utility functions for managing temperature history data
 */

// Constants
export const MAX_CHART_HISTORY_MINUTES = 30 // Show last 30 minutes in charts
export const HISTORY_CLEANUP_HOURS = 24 // Keep detailed history for 24 hours
export const TEMPERATURE_READING_INTERVAL_MS = 5000 // 5 seconds between readings

/**
 * Ensures a timestamp value is a Date object
 * Handles both Date objects and string timestamps
 */
function ensureDate(timestamp: Date | string): Date {
  if (timestamp instanceof Date) {
    return timestamp
  }
  return new Date(timestamp)
}

/**
 * Converts legacy number array history to TemperatureReading array
 * Used for backward compatibility with existing session data
 */
export function convertLegacyHistory(numberArray: number[], endTime: Date = new Date()): TemperatureReading[] {
  return numberArray.map((temperature, index) => ({
    temperature,
    timestamp: new Date(endTime.getTime() - (numberArray.length - 1 - index) * TEMPERATURE_READING_INTERVAL_MS)
  }))
}

/**
 * Merges live sensor history with persistent session history
 * Returns combined history sorted by timestamp for chart display
 */
export function mergeHistoryForChart(
  sensorHistory: number[], // Live data from API (ephemeral)
  sessionHistory: TemperatureReading[] = [], // Persistent data from session
  maxMinutes: number = MAX_CHART_HISTORY_MINUTES
): TemperatureReading[] {
  const now = new Date()
  const cutoffTime = new Date(now.getTime() - maxMinutes * 60 * 1000)
  
  // Convert live sensor history to TemperatureReading format
  const liveHistory = convertLegacyHistory(sensorHistory, now)
  
  // Filter session history to only include recent data
  const recentSessionHistory = sessionHistory.filter(reading => ensureDate(reading.timestamp) >= cutoffTime)
  
  // Combine and deduplicate based on timestamp (prefer live data for recent readings)
  const combined = new Map<number, TemperatureReading>()
  
  // Add session history first
  recentSessionHistory.forEach(reading => {
    const timestampKey = ensureDate(reading.timestamp).getTime()
    combined.set(timestampKey, reading)
  })
  
  // Add live history (will override session data for same timestamps)
  liveHistory.forEach(reading => {
    const timestampKey = reading.timestamp.getTime()
    combined.set(timestampKey, reading)
  })
  
  // Return sorted by timestamp
  return Array.from(combined.values()).sort((a, b) => ensureDate(a.timestamp).getTime() - ensureDate(b.timestamp).getTime())
}

/**
 * Merges temperature history from multiple devices/sessions
 * Handles conflicts by keeping the most recent reading for overlapping timestamps
 */
export function mergeMultiDeviceHistory(
  existingHistory: TemperatureReading[],
  newHistory: TemperatureReading[]
): TemperatureReading[] {
  const combined = new Map<number, TemperatureReading>()
  
  // Add existing history
  existingHistory.forEach(reading => {
    const timestampKey = ensureDate(reading.timestamp).getTime()
    combined.set(timestampKey, reading)
  })
  
  // Add new history (will override existing for same timestamps)
  newHistory.forEach(reading => {
    const timestampKey = ensureDate(reading.timestamp).getTime()
    const existing = combined.get(timestampKey)
    
    // Keep the reading with the most recent data source
    if (!existing || ensureDate(reading.timestamp) >= ensureDate(existing.timestamp)) {
      combined.set(timestampKey, reading)
    }
  })
  
  return Array.from(combined.values()).sort((a, b) => ensureDate(a.timestamp).getTime() - ensureDate(b.timestamp).getTime())
}

/**
 * Adds new temperature reading to session history
 * Manages history length and cleanup
 */
export function addTemperatureReading(
  existingHistory: TemperatureReading[],
  temperature: number,
  timestamp: Date = new Date()
): TemperatureReading[] {
  const newReading: TemperatureReading = { temperature, timestamp }
  
  // Ensure all existing history has proper Date objects for timestamps
  const normalizedHistory = existingHistory.map(reading => ({
    ...reading,
    timestamp: ensureDate(reading.timestamp)
  }))
  
  const updated = [...normalizedHistory, newReading]
  
  // Sort by timestamp
  updated.sort((a, b) => ensureDate(a.timestamp).getTime() - ensureDate(b.timestamp).getTime())
  
  // Clean up old readings (keep last 24 hours of detailed data)
  const cutoffTime = new Date(timestamp.getTime() - HISTORY_CLEANUP_HOURS * 60 * 60 * 1000)
  const filtered = updated.filter(reading => ensureDate(reading.timestamp) >= cutoffTime)
  
  return filtered
}

/**
 * Gets chart-ready data arrays from temperature readings
 */
export function getChartData(history: TemperatureReading[]): {
  temperatures: number[]
  labels: string[]
  timestamps: Date[]
} {
  if (history.length === 0) {
    return { temperatures: [], labels: [], timestamps: [] }
  }
  
  const now = new Date()
  const temperatures = history.map(reading => reading.temperature)
  const timestamps = history.map(reading => ensureDate(reading.timestamp))
  
  const labels = history.map(reading => {
    const minutesAgo = Math.round((now.getTime() - ensureDate(reading.timestamp).getTime()) / (60 * 1000))
    return minutesAgo === 0 ? "now" : `-${minutesAgo}m`
  })
  
  return { temperatures, labels, timestamps }
}

/**
 * Generates mock temperature history for development/offline use
 */
export function generateMockHistory(
  sensorId: number,
  durationMinutes: number = 30,
  currentTemp: number = 25
): TemperatureReading[] {
  const history: TemperatureReading[] = []
  const now = new Date()
  const startTime = new Date(now.getTime() - durationMinutes * 60 * 1000)
  
  // Different temperature patterns for different sensor types
  const isGrillSensor = sensorId < 2
  const isMeatSensor = sensorId >= 2
  
  // Simple deterministic random function to prevent hydration mismatches
  const deterministicRandom = (seed: number): number => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  
  for (let i = 0; i <= durationMinutes * 12; i++) { // Every 5 seconds
    const timestamp = new Date(startTime.getTime() + i * 5000)
    let temperature: number
    
    if (isGrillSensor) {
      // Grill sensors: heating up pattern with some fluctuation
      const progress = i / (durationMinutes * 12)
      const targetTemp = currentTemp || 180
      const heatingCurve = targetTemp * (1 - Math.exp(-progress * 3))
      const fluctuation = (deterministicRandom(sensorId * 1000 + i) - 0.5) * 10
      temperature = Math.max(20, heatingCurve + fluctuation)
    } else if (isMeatSensor) {
      // Meat sensors: slower, more gradual heating
      const progress = i / (durationMinutes * 12)
      const targetTemp = currentTemp || 65
      const heatingCurve = 20 + (targetTemp - 20) * (1 - Math.exp(-progress * 2))
      const fluctuation = (deterministicRandom(sensorId * 1000 + i) - 0.5) * 3
      temperature = Math.max(15, heatingCurve + fluctuation)
    } else {
      // Default pattern
      temperature = currentTemp + (deterministicRandom(sensorId * 1000 + i) - 0.5) * 5
    }
    
    history.push({
      temperature: Math.round(temperature * 10) / 10, // Round to 1 decimal
      timestamp
    })
  }
  
  return history
}

/**
 * Creates realistic mock sensor data with history
 * Uses deterministic values to prevent hydration mismatches
 */
export function createMockSensorsWithHistory(): Sensor[] {
  return Array.from({ length: 7 }, (_, i) => {
    const isGrill = i < 2
    // Use deterministic values based on sensor ID to prevent hydration mismatches
    const seedValue = i * 123.456 // Simple seed based on sensor ID
    const currentTemp = isGrill 
      ? 120 + (seedValue % 40) 
      : 20 + (seedValue % 50)
    const targetTemp = isGrill ? 180 : 70
    
    // Generate deterministic history for charts
    const recentHistory = generateMockHistory(i, 15, currentTemp)
    const historyTemps = recentHistory.map(r => r.temperature)
    
    return {
      id: i,
      currentTemp: Math.round(currentTemp * 10) / 10,
      targetTemp,
      history: historyTemps.slice(-15) // Last 15 readings for immediate chart display
    }
  })
}
