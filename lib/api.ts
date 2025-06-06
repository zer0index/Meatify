import type { Sensor } from "./types"
import { getLatestSensorData } from "@/app/api/data/route"

// Mock data for sensors
const mockSensors: Sensor[] = [
  {
    id: 0,
    currentTemp: 180,
    targetTemp: 200,
    history: generateRandomHistory(180, 10),
  },
  {
    id: 1,
    currentTemp: 190,
    targetTemp: 180,
    history: generateRandomHistory(190, 15),
  },
  {
    id: 2,
    currentTemp: 65,
    targetTemp: 70,
    history: generateRandomHistory(65, 15),
  },
  {
    id: 3,
    currentTemp: 72,
    targetTemp: 75,
    history: generateRandomHistory(72, 15),
  },
  {
    id: 4,
    currentTemp: 58,
    targetTemp: 60,
    history: generateRandomHistory(58, 15),
  },
  {
    id: 5,
    currentTemp: 82,
    targetTemp: 80,
    history: generateRandomHistory(82, 15),
  },
  {
    id: 6,
    currentTemp: 45,
    targetTemp: 55,
    history: generateRandomHistory(45, 15),
  },
]

// Generate random temperature history
function generateRandomHistory(currentTemp: number, points: number): number[] {
  const history = []
  let temp = currentTemp

  // Generate history going backwards in time
  for (let i = 0; i < points; i++) {
    history.unshift(temp)
    // Random fluctuation between -2 and +2 degrees
    const fluctuation = Math.random() * 4 - 2
    temp = Math.round((temp + fluctuation) * 10) / 10
  }

  return history
}

// Simulate temperature changes
function updateSensorTemps(sensors: Sensor[]): Sensor[] {
  return sensors.map((sensor) => {
    // Random fluctuation between -1 and +1 degrees
    const fluctuation = Math.random() * 2 - 1
    const newTemp = Math.round((sensor.currentTemp + fluctuation) * 10) / 10

    // Update history by removing oldest and adding newest
    const newHistory = [...sensor.history.slice(1), newTemp]

    return {
      ...sensor,
      currentTemp: newTemp,
      history: newHistory,
    }
  })
}

// Mock API call to fetch sensor data
export async function fetchSensorData(): Promise<Sensor[]> {
  // Try to get latest data from Node-RED POST endpoint
  let latestData = getLatestSensorData && getLatestSensorData();
  if (latestData && Array.isArray(latestData)) {
    return latestData;
  }
  // Fallback to mock data
  await new Promise((resolve) => setTimeout(resolve, 500));
  const updatedSensors = updateSensorTemps(mockSensors);
  mockSensors.forEach((sensor, index) => {
    mockSensors[index] = updatedSensors[index];
  });
  return updatedSensors;
}
