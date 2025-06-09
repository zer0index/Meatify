"use client"

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { addSessionChangeListener } from '@/lib/dataStore'

interface SyncStatusProps {
  className?: string
}

export function SyncStatus({ className = "" }: SyncStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setIsOnline(navigator.onLine)

    // Listen to session changes instead of intercepting fetch
    const unsubscribe = addSessionChangeListener((session, source) => {
      if (session && session.lastSaved) {
        setLastSync(new Date(session.lastSaved))
      }
      setIsSyncing(false)
    })

    // Monitor sync activity by listening to fetch events
    const handleBeforeUnload = () => setIsSyncing(true)
    
    // Use a custom event system instead of intercepting fetch
    const handleSyncStart = () => setIsSyncing(true)
    const handleSyncEnd = () => setIsSyncing(false)
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('meatify-sync-start', handleSyncStart)
    window.addEventListener('meatify-sync-end', handleSyncEnd)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('meatify-sync-start', handleSyncStart)
      window.removeEventListener('meatify-sync-end', handleSyncEnd)
      unsubscribe()
    }
  }, [])

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (isSyncing) return 'Syncing...'
    if (lastSync) {
      const now = new Date()
      const diffMs = now.getTime() - lastSync.getTime()
      const diffSecs = Math.floor(diffMs / 1000)
      
      if (diffSecs < 60) return `Synced ${diffSecs}s ago`
      if (diffSecs < 3600) return `Synced ${Math.floor(diffSecs / 60)}m ago`
      return `Synced ${Math.floor(diffSecs / 3600)}h ago`
    }
    return 'Not synced'
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-3 h-3 text-red-400" />
    if (isSyncing) return <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
    return <Wifi className="w-3 h-3 text-green-400" />
  }

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      {getStatusIcon()}
      <span className={`${
        !isOnline ? 'text-red-400' : 
        isSyncing ? 'text-blue-400' : 
        'text-gray-400'
      }`}>
        {getStatusText()}
      </span>
    </div>
  )
}
