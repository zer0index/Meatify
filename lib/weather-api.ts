import type { WeatherData } from "./types"

// Mock weather data
const mockWeatherConditions = ["sunny", "cloudy", "overcast", "rainy"]
const mockWeatherData: WeatherData = {
  current: {
    temperature: 22, // 72°F
    condition: "sunny",
    windSpeed: 8,
    humidity: 65,
    visibility: 10,
  },
  hourly: [],
}

// Generate mock hourly forecast
function generateHourlyForecast(): WeatherData["hourly"] {
  const forecast = []
  const now = new Date()

  for (let i = 1; i <= 12; i++) {
    const hour = new Date(now.getTime() + i * 60 * 60 * 1000)
    const timeString = hour.getHours().toString().padStart(2, "0") + ":00"

    // Simulate temperature variation throughout the day
    const baseTemp = 22
    const tempVariation = Math.sin(((hour.getHours() - 6) * Math.PI) / 12) * 8
    const randomVariation = (Math.random() - 0.5) * 4

    forecast.push({
      time: timeString,
      temperature: Math.round(baseTemp + tempVariation + randomVariation),
      condition: mockWeatherConditions[Math.floor(Math.random() * mockWeatherConditions.length)],
      precipitationChance: Math.random() > 0.7 ? Math.floor(Math.random() * 60) + 10 : 0,
    })
  }

  return forecast
}

// Simulate weather changes
function updateWeatherData(): WeatherData {
  const currentTemp = mockWeatherData.current.temperature
  const tempChange = (Math.random() - 0.5) * 2 // ±1°C change

  return {
    current: {
      ...mockWeatherData.current,
      temperature: Math.round((currentTemp + tempChange) * 10) / 10,
      condition: mockWeatherConditions[Math.floor(Math.random() * mockWeatherConditions.length)],
      windSpeed: Math.max(0, mockWeatherData.current.windSpeed + (Math.random() - 0.5) * 4),
      humidity: Math.max(20, Math.min(100, mockWeatherData.current.humidity + (Math.random() - 0.5) * 10)),
    },
    hourly: generateHourlyForecast(),
  }
}

// Mock API call to fetch weather data
export async function fetchWeatherData(): Promise<WeatherData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Update mock data
  const updatedWeather = updateWeatherData()
  mockWeatherData.current = updatedWeather.current
  mockWeatherData.hourly = updatedWeather.hourly

  return updatedWeather
}
