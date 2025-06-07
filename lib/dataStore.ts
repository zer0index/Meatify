import type { Sensor } from "./types"

let latestSensorData: Sensor[] | null = null
let lastPostTimestamp: string | null = null

export function setLatestSensorData(data: Sensor[]) {
  latestSensorData = data
  lastPostTimestamp = new Date().toISOString()
}

export function getLatestSensorData() {
  return { data: latestSensorData, lastUpdate: lastPostTimestamp }
}
