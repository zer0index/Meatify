export type MeatType =
  | "beef_brisket"
  | "beef_ribs"
  | "beef_tenderloin"
  | "pork_shoulder"
  | "pork_ribs"
  | "pork_tenderloin"
  | "chicken_breast"
  | "chicken_thigh"
  | "lamb_chops"

export interface Sensor {
  id: number
  currentTemp: number
  targetTemp: number
  history: number[]
}

export interface MeatInfo {
  label: string
  image: string
  recommendedTemp: number
}

export interface WeatherData {
  current: {
    temperature: number // in Celsius
    condition: string
    windSpeed: number // in mph
    humidity: number // percentage
    visibility: number // in miles
  }
  hourly: Array<{
    time: string
    temperature: number // in Celsius
    condition: string
    precipitationChance: number // percentage
  }>
}
