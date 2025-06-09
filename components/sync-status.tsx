"use client"

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

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

    // Monitor sync activity by intercepting fetch calls to /api/session
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url] = args
      if (url === '/api/session') {
        setIsSyncing(true)
        try {
          const response = await originalFetch(...args)
          if (response.ok) {
            setLastSync(new Date())
          }
          return response
        } finally {
          setIsSyncing(false)
        }
      }
      return originalFetch(...args)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.fetch = originalFetch
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
