import type { Sensor, GrillSession, MeatType } from "./types"

let latestSensorData: Sensor[] | null = null
let lastPostTimestamp: string | null = null
let currentSession: GrillSession | null = null

// File-based storage variables
let lastFileSync = 0
const SYNC_INTERVAL = 5000 // Sync every 5 seconds
let syncInProgress = false

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

// File-based storage configuration
const isServer = typeof window === 'undefined'
// Use container path in production, relative path in development
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : './data'
const SESSIONS_DIR = `${DATA_DIR}/sessions`
const CURRENT_SESSION_FILE = `${SESSIONS_DIR}/current.json`
const LOCK_FILE = `${SESSIONS_DIR}/.lock`

// Session management functions
export async function initializeStorage(): Promise<void> {
  if (isServer) {
    try {
      const fs = await import('fs/promises')
      await fs.mkdir(DATA_DIR, { recursive: true })
      await fs.mkdir(SESSIONS_DIR, { recursive: true })
      await fs.mkdir(`${DATA_DIR}/backups`, { recursive: true })
      console.log('Storage directories initialized')
    } catch (error) {
      console.warn('Failed to initialize storage directories:', error)
    }
  }
}

// File locking for concurrent access
async function acquireLock(): Promise<boolean> {
  if (isServer) {
    try {
      const fs = await import('fs/promises')
      await fs.writeFile(LOCK_FILE, process.pid.toString(), { flag: 'wx' })
      return true
    } catch (error) {
      return false
    }
  }
  return true // No locking needed on client
}

async function releaseLock(): Promise<void> {
  if (isServer) {
    try {
      const fs = await import('fs/promises')
      await fs.unlink(LOCK_FILE)
    } catch (error) {
      // Lock file might not exist
    }
  }
}

// Device identification for multi-device tracking
function getDeviceId(): string {
  if (typeof window !== 'undefined') {
    let deviceId = localStorage.getItem('meatify-device-id')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('meatify-device-id', deviceId)
    }
    return deviceId
  }
  return 'server'
}

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

export async function saveSession(session: GrillSession): Promise<boolean> {
  try {
    const sessionToSave = {
      ...session,
      lastSaved: new Date()
    }
    
    // Save to localStorage first (always available)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionToSave))
    }
    
    // Also save to file if on server
    if (isServer) {
      await saveSessionToFile(sessionToSave)
    }
    
    currentSession = sessionToSave
    return true
  } catch (error) {
    console.warn('Failed to save session:', error)
    return false
  }
}

export async function loadSession(): Promise<GrillSession | null> {
  try {
    // Try to sync with file first if on server
    if (isServer) {
      const fileSession = await loadSessionFromFile()
      if (fileSession) {
        currentSession = fileSession
        return fileSession
      }
    }
    
    // Fall back to localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!saved) return null

      const session: GrillSession = JSON.parse(saved)
      
      // Check if session is too old
      const sessionAge = Date.now() - new Date(session.lastSaved).getTime()
      const maxAge = MAX_SESSION_AGE_HOURS * 60 * 60 * 1000
      
      if (sessionAge > maxAge) {
        await clearSession()
        return null
      }

      // Convert date strings back to Date objects
      session.startTime = session.startTime ? new Date(session.startTime) : null
      session.lastSaved = new Date(session.lastSaved)
      
      currentSession = session
      return session
    }
    
    return null
  } catch (error) {
    console.warn('Failed to load session:', error)
    await clearSession()
    return null
  }
}

export async function clearSession(): Promise<void> {
  try {
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
    
    // Clear from file if on server
    if (isServer) {
      try {
        const fs = await import('fs/promises')
        await fs.unlink(CURRENT_SESSION_FILE)
      } catch (error) {
        // File might not exist
      }
    }
    
    currentSession = null
  } catch (error) {
    console.warn('Failed to clear session:', error)
  }
}

export async function updateSession(updates: Partial<GrillSession>): Promise<boolean> {
  if (!currentSession) {
    currentSession = createNewSession()
  }
  
  currentSession = {
    ...currentSession,
    ...updates,
    lastSaved: new Date()
  }
  
  return await saveSession(currentSession)
}

export async function updateSessionMeat(sensorId: number, meat: MeatType | null): Promise<boolean> {
  return await updateSession({
    selectedMeats: {
      ...currentSession?.selectedMeats || {},
      [sensorId]: meat
    }
  })
}

export async function updateSessionTarget(sensorId: number, target: number): Promise<boolean> {
  return await updateSession({
    sensorTargets: {
      ...currentSession?.sensorTargets || {},
      [sensorId]: target
    }
  })
}

export async function updateSessionTemperatureHistory(sensorData: Sensor[]): Promise<boolean> {
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

  return await updateSession({ temperatureHistory: newHistory })
}

export async function startSession(): Promise<boolean> {
  return await updateSession({
    startTime: new Date(),
    isActive: true
  })
}

export async function stopSession(): Promise<boolean> {
  return await updateSession({
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

// File-based session storage functions
export async function saveSessionToFile(session: GrillSession): Promise<boolean> {
  if (!isServer) return false
  
  const lockAcquired = await acquireLock()
  if (!lockAcquired) {
    console.warn('Could not acquire lock for file save')
    return false
  }
  
  try {
    const fs = await import('fs/promises')
    const sessionWithMetadata = {
      ...session,
      deviceId: getDeviceId(),
      lastSyncTime: new Date().toISOString(),
      version: 1
    }
    
    // Create backup of current session if it exists
    try {
      const currentData = await fs.readFile(CURRENT_SESSION_FILE, 'utf-8')
      const backupFile = `${DATA_DIR}/backups/session_${Date.now()}.json`
      await fs.writeFile(backupFile, currentData)
    } catch (error) {
      // No existing file to backup
    }
    
    await fs.writeFile(CURRENT_SESSION_FILE, JSON.stringify(sessionWithMetadata, null, 2))
    return true
  } catch (error) {
    console.error('Failed to save session to file:', error)
    return false
  } finally {
    await releaseLock()
  }
}

export async function loadSessionFromFile(): Promise<GrillSession | null> {
  if (!isServer) return null
  
  try {
    const fs = await import('fs/promises')
    const data = await fs.readFile(CURRENT_SESSION_FILE, 'utf-8')
    const sessionWithMetadata = JSON.parse(data)
    
    // Remove metadata and convert dates
    const session: GrillSession = {
      id: sessionWithMetadata.id,
      startTime: sessionWithMetadata.startTime ? new Date(sessionWithMetadata.startTime) : null,
      isActive: sessionWithMetadata.isActive,
      selectedMeats: sessionWithMetadata.selectedMeats,
      sensorTargets: sessionWithMetadata.sensorTargets,
      temperatureHistory: sessionWithMetadata.temperatureHistory,
      lastSaved: new Date(sessionWithMetadata.lastSaved)
    }
    
    // Check if session is too old
    const sessionAge = Date.now() - session.lastSaved.getTime()
    const maxAge = MAX_SESSION_AGE_HOURS * 60 * 60 * 1000
    
    if (sessionAge > maxAge) {
      return null
    }
      return session
  } catch (error: any) {
    // Don't log warnings for missing files - this is expected for fresh installations
    if (error?.code !== 'ENOENT') {
      console.warn('Failed to load session from file:', error)
    }
    return null
  }
}

export async function syncSession(): Promise<GrillSession | null> {
  if (syncInProgress) return currentSession
  
  const now = Date.now()
  if (now - lastFileSync < SYNC_INTERVAL) {
    return currentSession
  }
  
  syncInProgress = true
  lastFileSync = now
  
  try {
    if (isServer) {
      // On server: load from file and merge with current session
      const fileSession = await loadSessionFromFile()
      if (fileSession && currentSession) {
        // Merge sessions, preferring the most recent data
        const mergedSession = mergeSessions(currentSession, fileSession)
        currentSession = mergedSession
        return mergedSession
      } else if (fileSession) {
        currentSession = fileSession
        return fileSession
      }
    } else {
      // On client: send current session to server if needed
      if (currentSession) {
        // In a real implementation, this would make an API call to sync with server
        // For now, we'll just save to localStorage
        saveSession(currentSession)
      }
    }
    
    return currentSession
  } catch (error) {
    console.error('Failed to sync session:', error)
    return currentSession
  } finally {
    syncInProgress = false
  }
}

// Helper function to merge two sessions intelligently
function mergeSessions(local: GrillSession, remote: GrillSession): GrillSession {
  // Use the session with the most recent lastSaved timestamp as base
  const base = local.lastSaved > remote.lastSaved ? local : remote
  const other = local.lastSaved > remote.lastSaved ? remote : local
  
  // Merge temperature history by combining arrays and removing duplicates
  const mergedHistory: Record<number, number[]> = {}
  const allSensorIds = new Set([
    ...Object.keys(base.temperatureHistory || {}),
    ...Object.keys(other.temperatureHistory || {})
  ])
  
  for (const sensorIdStr of allSensorIds) {
    const sensorId = parseInt(sensorIdStr)
    const baseHistory = base.temperatureHistory?.[sensorId] || []
    const otherHistory = other.temperatureHistory?.[sensorId] || []
    
    // Combine and limit history
    const combined = [...new Set([...baseHistory, ...otherHistory])]
    mergedHistory[sensorId] = combined.slice(-MAX_TEMPERATURE_HISTORY)
  }
  
  return {
    ...base,
    temperatureHistory: mergedHistory,
    lastSaved: new Date()
  }
}

// Auto-sync mechanism
let autoSyncInterval: NodeJS.Timeout | null = null

export function startAutoSync(): void {
  if (autoSyncInterval) return
  
  autoSyncInterval = setInterval(async () => {
    try {
      await syncSession()
    } catch (error) {
      console.error('Auto-sync failed:', error)
    }
  }, SYNC_INTERVAL)
}

export function stopAutoSync(): void {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval)
    autoSyncInterval = null
  }
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
