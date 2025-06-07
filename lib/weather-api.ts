import type { WeatherData } from "./types"

// Mock API call to fetch weather data
export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  // Open-Meteo API docs: https://open-meteo.com/en/docs
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch weather data")
  const data = await res.json()

  // Map Open-Meteo response to WeatherData type
  const current = {
    temperature: data.current_weather.temperature,
    condition: mapWeatherCodeToCondition(data.current_weather.weathercode),
    windSpeed: data.current_weather.windspeed,
    humidity: 50, // Open-Meteo free API does not provide current humidity
    visibility: 10, // Not available, set default
  }

  const hourly = (data.hourly?.time || []).slice(0, 12).map((time: string, i: number) => ({
    time: time.slice(11, 16),
    temperature: data.hourly.temperature_2m[i],
    condition: mapWeatherCodeToCondition(data.hourly.weathercode[i]),
    precipitationChance: data.hourly.precipitation_probability[i] || 0,
  }))

  return { current, hourly }
}

function mapWeatherCodeToCondition(code: number): string {
  // See https://open-meteo.com/en/docs#api_form for weather codes
  if (code === 0) return "sunny"
  if ([1, 2, 3].includes(code)) return "cloudy"
  if ([45, 48].includes(code)) return "overcast"
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rainy"
  return "cloudy"
}

// Hardcoded coordinates for Hallein, Salzburg, Austria
const lat = 47.6833
const lon = 13.0933
export const HALLEIN_LOCATION_LABEL = "Hallein, Salzburg, Austria"

// Map Open-Meteo API response to WeatherData structure
export async function fetchWeatherForHallein(): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&timezone=Europe/Vienna`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch weather")
  const data = await res.json()

  // Map current weather
  const current = {
    temperature: data.current_weather.temperature,
    condition: mapWeatherCodeToCondition(data.current_weather.weathercode),
    windSpeed: data.current_weather.windspeed,
    humidity: 50, // Not available in free API
    visibility: 10, // Not available in free API
  }

  const now = new Date()
  const hourlyTimes: string[] = data.hourly.time
  let startIdx = hourlyTimes.findIndex((t: string) => {
    // Parse as local time in Europe/Vienna
    const [datePart, timePart] = t.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour] = timePart.split(':').map(Number)
    const forecastDate = new Date(year, month - 1, day, hour)
    return forecastDate > now
  })
  if (startIdx === -1) startIdx = hourlyTimes.length - 6

  // Map next 6 hours from now
  const hourly = hourlyTimes.slice(startIdx, startIdx + 6).map((time: string, i: number) => ({
    time,
    temperature: data.hourly.temperature_2m[startIdx + i],
    condition: mapWeatherCodeToCondition(data.hourly.weathercode[startIdx + i]),
    precipitationChance: data.hourly.precipitation_probability[startIdx + i] || 0,
  }))

  return { current, hourly }
}
