import type { Sensor } from "./types"
import { createMockSensorsWithHistory } from "./historyUtils"

// Fetch sensor data from API
export async function fetchSensorData(): Promise<Sensor[]> {
  try {
    const response = await fetch('/api/data')
    const result = await response.json()

    if (!response.ok) {
      console.warn('Failed to fetch sensor data:', response.status, result.error || 'No error details')
      console.log('Falling back to mock data')
      return createMockSensorsWithHistory()
    }

    if (!result.data || !Array.isArray(result.data)) {
      console.warn('Invalid data format received:', result)
      console.log('Falling back to mock data')
      return createMockSensorsWithHistory()
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
    
    if (validSensors.length === 0) {
      console.warn('No valid sensors received, falling back to mock data')
      return createMockSensorsWithHistory()
    }

    return validSensors
  } catch (error) {
    console.warn('Error fetching sensor data:', error)
    console.log('Falling back to mock data')
    return createMockSensorsWithHistory()
  }
}
