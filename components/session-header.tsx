"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface SessionHeaderProps {
  sessionStartTime: Date | null
  isSessionActive: boolean
  onClearSession?: () => void
  onStartSession?: () => void
  onResetSession?: () => void
}

export function SessionHeader({ 
  sessionStartTime, 
  isSessionActive, 
  onClearSession,
  onStartSession,
  onResetSession 
}: SessionHeaderProps) {
  const [elapsedTime, setElapsedTime] = useState("00:00:00")

  useEffect(() => {
    if (!isSessionActive || !sessionStartTime) {
      setElapsedTime("00:00:00")
      return
    }

    const intervalId = setInterval(() => {
      const now = new Date()
      const diff = now.getTime() - sessionStartTime.getTime()

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`,
      )
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isSessionActive, sessionStartTime])

  const formatStartTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  return (
    <div className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700/50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-amber-500" />
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-white">Cook Session —</span>
              <span className="text-2xl font-bold font-mono text-amber-400 tracking-wider">{elapsedTime}</span>
              {sessionStartTime && (
                <span className="text-sm text-gray-400 hidden sm:inline">
                  (Started at {formatStartTime(sessionStartTime)})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isSessionActive && onStartSession && (
              <button
                onClick={onStartSession}
                className="px-4 py-2 text-sm bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 rounded-md transition-colors font-medium"
              >
                Start Session
              </button>
            )}
            {isSessionActive && onResetSession && (
              <button
                onClick={onResetSession}
                className="px-3 py-1 text-sm bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/30 rounded-md transition-colors"
              >
                Reset Session
              </button>
            )}
            {onClearSession && isSessionActive && (
              <button
                onClick={onClearSession}
                className="px-3 py-1 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-md transition-colors"
              >
                Clear Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
