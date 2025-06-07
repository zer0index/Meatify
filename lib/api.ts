import type { Sensor } from "./types"

// Fetch sensor data from API
export async function fetchSensorData(): Promise<Sensor[]> {
  try {
    const response = await fetch('/api/data')
    const result = await response.json()

    if (!response.ok) {
      console.warn('Failed to fetch sensor data:', response.status, result.error || 'No error details')
      return []
    }

    if (!result.data || !Array.isArray(result.data)) {
      console.warn('Invalid data format received:', result)
      return []
    }

    // Validate sensor data
    const isValidSensor = (s: any): s is Sensor =>
      typeof s === 'object' &&
      typeof s.id === 'number' &&
      typeof s.currentTemp === 'number' &&
      typeof s.targetTemp === 'number' &&
      Array.isArray(s.history)

    const validSensors = result.data.filter(isValidSensor)
    if (validSensors.length !== result.data.length) {
      console.warn('Some sensor data was invalid and filtered out')
    }

    return validSensors
  } catch (error) {
    console.warn('Error fetching sensor data:', error)
    return []
  }
}
