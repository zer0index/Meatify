import type { Sensor, GrillSession, MeatType } from "./types"

let latestSensorData: Sensor[] | null = null
let lastPostTimestamp: string | null = null
let currentSession: GrillSession | null = null

// Existing sensor data functions
export function setLatestSensorData(data: Sensor[]) {
  latestSensorData = data
  lastPostTimestamp = new Date().toISOString()
}

export function getLatestSensorData() {
  return { data: latestSensorData, lastUpdate: lastPostTimestamp }
}

// Session management constants
const SESSION_STORAGE_KEY = 'meatify-grill-session'
const MAX_SESSION_AGE_HOURS = 24
const MAX_TEMPERATURE_HISTORY = 100

// Session management functions
export function createNewSession(): GrillSession {
  const session: GrillSession = {
    id: generateSessionId(),
    startTime: null,
    isActive: false,
    selectedMeats: { 2: null, 3: null, 4: null, 5: null, 6: null },
    sensorTargets: {},
    temperatureHistory: {},
    lastSaved: new Date()
  }
  currentSession = session
  return session
}

export function saveSession(session: GrillSession): boolean {
  try {
    const sessionToSave = {
      ...session,
      lastSaved: new Date()
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionToSave))
    currentSession = sessionToSave
    return true
  } catch (error) {
    console.warn('Failed to save session to localStorage:', error)
    return false
  }
}

export function loadSession(): GrillSession | null {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!saved) return null

    const session: GrillSession = JSON.parse(saved)
    
    // Check if session is too old
    const sessionAge = Date.now() - new Date(session.lastSaved).getTime()
    const maxAge = MAX_SESSION_AGE_HOURS * 60 * 60 * 1000
    
    if (sessionAge > maxAge) {
      clearSession()
      return null
    }

    // Convert date strings back to Date objects
    session.startTime = session.startTime ? new Date(session.startTime) : null
    session.lastSaved = new Date(session.lastSaved)
    
    currentSession = session
    return session
  } catch (error) {
    console.warn('Failed to load session from localStorage:', error)
    clearSession()
    return null
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    currentSession = null
  } catch (error) {
    console.warn('Failed to clear session from localStorage:', error)
  }
}

export function updateSession(updates: Partial<GrillSession>): boolean {
  if (!currentSession) {
    currentSession = createNewSession()
  }
  
  currentSession = {
    ...currentSession,
    ...updates,
    lastSaved: new Date()
  }
  
  return saveSession(currentSession)
}

export function updateSessionMeat(sensorId: number, meat: MeatType | null): boolean {
  return updateSession({
    selectedMeats: {
      ...currentSession?.selectedMeats || {},
      [sensorId]: meat
    }
  })
}

export function updateSessionTarget(sensorId: number, target: number): boolean {
  return updateSession({
    sensorTargets: {
      ...currentSession?.sensorTargets || {},
      [sensorId]: target
    }
  })
}

export function updateSessionTemperatureHistory(sensorData: Sensor[]): boolean {
  if (!currentSession) return false

  const newHistory: Record<number, number[]> = { ...currentSession.temperatureHistory }
  
  sensorData.forEach(sensor => {
    if (!newHistory[sensor.id]) {
      newHistory[sensor.id] = []
    }
    
    // Add current temperature to history
    newHistory[sensor.id].push(sensor.currentTemp)
    
    // Limit history length
    if (newHistory[sensor.id].length > MAX_TEMPERATURE_HISTORY) {
      newHistory[sensor.id] = newHistory[sensor.id].slice(-MAX_TEMPERATURE_HISTORY)
    }
  })

  return updateSession({ temperatureHistory: newHistory })
}

export function startSession(): boolean {
  return updateSession({
    startTime: new Date(),
    isActive: true
  })
}

export function stopSession(): boolean {
  return updateSession({
    isActive: false
  })
}

export function getCurrentSession(): GrillSession | null {
  return currentSession
}

export function getSessionAge(): number | null {
  if (!currentSession) return null
  return Date.now() - currentSession.lastSaved.getTime()
}

// Utility functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function isSessionRecent(): boolean {
  const age = getSessionAge()
  if (age === null) return false
  
  // Consider session recent if it's less than 1 hour old
  return age < (60 * 60 * 1000)
}
