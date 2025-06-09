"use client"

import { useState, useEffect } from 'react'
import { getCurrentSession, addSessionChangeListener, loadSession, startAutoSync } from './dataStore'
import type { GrillSession } from './types'

export function useSession() {
  const [session, setSession] = useState<GrillSession | null>(getCurrentSession())
  const [isLoading, setIsLoading] = useState(false)
  const [lastSyncSource, setLastSyncSource] = useState<'local' | 'remote' | null>(null)

  useEffect(() => {
    // Load session on mount
    setIsLoading(true)
    loadSession()
      .then(loadedSession => {
        setSession(loadedSession)
        if (loadedSession) {
          setLastSyncSource('remote')
        }
        // Start auto-sync after session is loaded
        startAutoSync()
      })
      .catch(error => {
        console.error('Failed to load session:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })

    // Subscribe to session changes
    const unsubscribe = addSessionChangeListener((newSession, source) => {
      setSession(newSession)
      setLastSyncSource(source)
      
      if (source === 'remote') {
        console.log('Session updated from another device')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    session,
    isLoading,
    lastSyncSource,
    isFromRemoteDevice: lastSyncSource === 'remote'
  }
}

export function useSessionValue<T>(
  selector: (session: GrillSession | null) => T,
  defaultValue: T
): T {
  const { session } = useSession()
  return session ? selector(session) : defaultValue
}
