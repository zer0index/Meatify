import type { Sensor, GrillSession, MeatType } from "./types"

let latestSensorData: Sensor[] | null = null
let lastPostTimestamp: string | null = null
let currentSession: GrillSession | null = null

// File-based storage variables
let lastFileSync = 0
const SYNC_INTERVAL = 30000 // Sync every 30 seconds instead of 5 seconds
let syncInProgress = false

// Session change event system
type SessionChangeListener = (session: GrillSession | null, source: 'local' | 'remote') => void
const sessionChangeListeners: Set<SessionChangeListener> = new Set()

export function addSessionChangeListener(listener: SessionChangeListener): () => void {
  sessionChangeListeners.add(listener)
  return () => sessionChangeListeners.delete(listener)
}

function notifySessionChange(session: GrillSession | null, source: 'local' | 'remote' = 'local') {
  sessionChangeListeners.forEach(listener => {
    try {
      listener(session, source)
    } catch (error) {
      console.error('Session change listener error:', error)
    }
  })
}

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
    
    // Server-first approach: save to API if client-side
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/session', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: sessionToSave })
        })
        
        if (response.ok) {
          // Also save to localStorage as backup
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionToSave))
          currentSession = sessionToSave
          notifySessionChange(sessionToSave, 'local')
          return true
        } else {
          console.warn('Failed to save to server, using localStorage fallback')
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionToSave))
        }
      } catch (error) {
        console.warn('Network error, using localStorage fallback:', error)
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionToSave))
      }
    }
    
    // Server-side: save to file directly
    if (isServer) {
      await saveSessionToFile(sessionToSave)
    }
    
    currentSession = sessionToSave
    notifySessionChange(sessionToSave, 'local')
    return true
  } catch (error) {
    console.warn('Failed to save session:', error)
    return false
  }
}

export async function loadSession(): Promise<GrillSession | null> {
  try {
    // Server-first approach: try to fetch from API if client-side
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/session')
        if (response.ok) {
          const data = await response.json()
          if (data.session) {
            // Convert date strings back to Date objects
            const session: GrillSession = {
              ...data.session,
              startTime: data.session.startTime ? new Date(data.session.startTime) : null,
              lastSaved: new Date(data.session.lastSaved)
            }
            
            // Update localStorage cache
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
            currentSession = session
            
            console.log('Session loaded from server:', session)
            return session
          }
        } else if (response.status === 404) {
          // No session found on server, this is normal for new installations
          console.log('No session found on server')
        } else {
          console.warn('Failed to load from server:', response.status)
        }
      } catch (error) {
        console.warn('Network error loading from server, trying localStorage:', error)
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem(SESSION_STORAGE_KEY)
      if (saved) {
        const session: GrillSession = JSON.parse(saved)
        
        // Check if session is too old
        const sessionAge = Date.now() - new Date(session.lastSaved).getTime()
        const maxAge = MAX_SESSION_AGE_HOURS * 60 * 60 * 1000
        
        if (sessionAge > maxAge) {
          console.log('Session too old, clearing:', sessionAge / 1000 / 60, 'minutes')
          await clearSession()
          return null
        }

        // Convert date strings back to Date objects
        session.startTime = session.startTime ? new Date(session.startTime) : null
        session.lastSaved = new Date(session.lastSaved)
        currentSession = session
        
        console.log('Session loaded from localStorage:', session)
        return session
      }
    }
    
    // Server-side: load from file directly
    if (isServer) {
      const fileSession = await loadSessionFromFile()
      if (fileSession) {
        currentSession = fileSession
        return fileSession
      }
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
    // Server-first approach: clear from API if client-side
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/session', {
          method: 'DELETE'
        })
        
        if (response.ok) {
          // Also clear localStorage
          localStorage.removeItem(SESSION_STORAGE_KEY)
          localStorage.removeItem('meatify-device-id') // Reset device ID too
          currentSession = null
          notifySessionChange(null, 'local')
          return
        } else {
          console.warn('Failed to clear from server, clearing localStorage only')
          localStorage.removeItem(SESSION_STORAGE_KEY)
        }
      } catch (error) {
        console.warn('Network error clearing from server, clearing localStorage only:', error)
        localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }
    
    // Server-side: clear from file directly
    if (isServer) {
      try {
        const fs = await import('fs/promises')
        await fs.unlink(CURRENT_SESSION_FILE)
      } catch (error) {
        // File might not exist
      }
    }
    
    currentSession = null
    notifySessionChange(null, 'local')
  } catch (error) {
    console.warn('Failed to clear session:', error)
  }
}

export async function updateSession(updates: Partial<GrillSession>): Promise<boolean> {
  if (!currentSession) {
    console.warn('No current session exists, cannot update. Load session first.')
    return false
  }
  
  currentSession = {
    ...currentSession,
    ...updates,
    lastSaved: new Date()
  }
  
  return await saveSession(currentSession)
}

export async function ensureSessionExists(): Promise<GrillSession> {
  if (!currentSession) {
    // Try to load existing session first
    const loadedSession = await loadSession()
    if (loadedSession) {
      return loadedSession
    }
    
    // If no session exists, create a new one
    currentSession = createNewSession()
    await saveSession(currentSession)
  }
  return currentSession
}

export async function updateSessionMeat(sensorId: number, meat: MeatType | null): Promise<boolean> {
  await ensureSessionExists()
  return await updateSession({
    selectedMeats: {
      ...currentSession?.selectedMeats || {},
      [sensorId]: meat
    }
  })
}

export async function updateSessionTarget(sensorId: number, target: number): Promise<boolean> {
  await ensureSessionExists()
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
  await ensureSessionExists()
  return await updateSession({
    startTime: new Date(),
    isActive: true
  })
}

export async function stopSession(): Promise<boolean> {
  await ensureSessionExists()
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
  if (syncInProgress) {
    console.log('Sync already in progress, skipping')
    return currentSession
  }
  
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
      // On client: check for updates from server
      try {
        const response = await fetch('/api/session')
        if (response.ok) {
          const data = await response.json()
          if (data.session) {
            const serverSession: GrillSession = {
              ...data.session,
              startTime: data.session.startTime ? new Date(data.session.startTime) : null,
              lastSaved: new Date(data.session.lastSaved)
            }
            
            if (currentSession) {
              // Check if server has newer data
              if (serverSession.lastSaved > currentSession.lastSaved) {
                console.log('Syncing newer session data from server - server:', serverSession.lastSaved, 'local:', currentSession.lastSaved)
                // Merge server changes with local changes
                const mergedSession = mergeSessions(currentSession, serverSession)
                currentSession = mergedSession
                
                // Update localStorage cache
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mergedSession))
                
                // Notify components of remote session changes
                notifySessionChange(mergedSession, 'remote')
                return mergedSession
              } else {
                console.log('Local session is newer or equal, no sync needed')
              }
            } else {
              // No local session, use server session
              console.log('Loading session from server (no local session)')
              currentSession = serverSession
              localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(serverSession))
              notifySessionChange(serverSession, 'remote')
              return serverSession
            }
          } else {
            console.log('No session data from server')
          }
        } else {
          console.warn('Sync request failed:', response.status)
        }
      } catch (error) {
        console.warn('Background sync failed:', error)
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
  console.log('Merging sessions - local lastSaved:', local.lastSaved, 'remote lastSaved:', remote.lastSaved)
  
  // Use the session with the most recent lastSaved timestamp as base
  const base = local.lastSaved > remote.lastSaved ? local : remote
  const other = local.lastSaved > remote.lastSaved ? remote : local
  
  console.log('Using base session from:', base === local ? 'local' : 'remote')
  
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
  
  // Merge selected meats - be very conservative, prefer any non-null value
  const mergedSelectedMeats: Record<number, MeatType | null> = {}
  const allMeatSensorIds = new Set([
    ...Object.keys(base.selectedMeats || {}),
    ...Object.keys(other.selectedMeats || {})
  ])
  
  for (const sensorIdStr of allMeatSensorIds) {
    const sensorId = parseInt(sensorIdStr)
    const baseMeat = base.selectedMeats?.[sensorId]
    const otherMeat = other.selectedMeats?.[sensorId]
    
    // Prefer any non-null value to avoid losing meat selections
    if (baseMeat !== null && baseMeat !== undefined) {
      mergedSelectedMeats[sensorId] = baseMeat
    } else if (otherMeat !== null && otherMeat !== undefined) {
      mergedSelectedMeats[sensorId] = otherMeat
    } else {
      mergedSelectedMeats[sensorId] = null
    }
  }  
  // Merge sensor targets - prefer any non-zero values
  const mergedTargets: Record<number, number> = {}
  const allTargetSensorIds = new Set([
    ...Object.keys(base.sensorTargets || {}),
    ...Object.keys(other.sensorTargets || {})
  ])
  
  for (const sensorIdStr of allTargetSensorIds) {
    const sensorId = parseInt(sensorIdStr)
    const baseTarget = base.sensorTargets?.[sensorId]
    const otherTarget = other.sensorTargets?.[sensorId]
    
    // Prefer any non-zero value to avoid losing target temperatures
    if (baseTarget && baseTarget > 0) {
      mergedTargets[sensorId] = baseTarget
    } else if (otherTarget && otherTarget > 0) {
      mergedTargets[sensorId] = otherTarget
    } else {
      mergedTargets[sensorId] = baseTarget || otherTarget || 0
    }
  }

  const mergedSession = {
    ...base,
    selectedMeats: mergedSelectedMeats,
    sensorTargets: mergedTargets,
    temperatureHistory: mergedHistory,
    lastSaved: new Date() // Always update to current time
  }
  
  console.log('Merged session result:', mergedSession)
  return mergedSession
}

// Auto-sync mechanism
let autoSyncInterval: NodeJS.Timeout | null = null
let autoSyncStarted = false

export function startAutoSync(): void {
  // Prevent multiple auto-sync processes
  if (autoSyncInterval || autoSyncStarted) {
    console.log('Auto-sync already running, skipping')
    return
  }
  
  autoSyncStarted = true
  console.log('Starting auto-sync for multi-device session synchronization')
  
  autoSyncInterval = setInterval(async () => {
    try {
      await syncSession()
    } catch (error) {
      console.error('Auto-sync failed:', error)
    }
  }, SYNC_INTERVAL)
  
  // Also run an immediate sync after a delay to avoid conflicts with initial load
  setTimeout(() => {
    syncSession().catch(error => {
      console.error('Initial sync failed:', error)
    })
  }, 2000) // Increased delay to avoid race conditions
}

export function stopAutoSync(): void {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval)
    autoSyncInterval = null
  }
  autoSyncStarted = false
  console.log('Auto-sync stopped')
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
