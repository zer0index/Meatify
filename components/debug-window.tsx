import { useEffect, useState } from 'react'

type DebugInfo = {
  dataSource: 'mock' | 'node-red'
  lastUpdate: string
  error?: string
  nodeRedStatus?: 'available' | 'unavailable' | 'error'
}

export function DebugWindow() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [minimized, setMinimized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        const response = await fetch('/api/data')
        if (response.ok) {
          const data = await response.json()
          setDebugInfo(data.debug)
          setError(null)
        } else {
          setError('Failed to fetch debug info')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    // Initial fetch
    fetchDebugInfo()

    // Set up polling interval
    const interval = setInterval(fetchDebugInfo, 5000)

    // Cleanup on unmount
    return () => clearInterval(interval)
  }, [])

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-md hover:bg-gray-700 z-50"
      >
        Show Debug Info
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Debug Info</h3>
        <button
          onClick={() => setMinimized(true)}
          className="text-gray-400 hover:text-gray-300"
        >
          Minimize
        </button>
      </div>

      {error ? (
        <div className="text-red-400 mb-2">Error: {error}</div>
      ) : debugInfo ? (
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Data Source: </span>
            <span className={debugInfo.dataSource === 'node-red' ? 'text-green-400' : 'text-yellow-400'}>
              {debugInfo.dataSource}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Node-RED Status: </span>
            <span className={`
              ${debugInfo.nodeRedStatus === 'available' && 'text-green-400'}
              ${debugInfo.nodeRedStatus === 'unavailable' && 'text-yellow-400'}
              ${debugInfo.nodeRedStatus === 'error' && 'text-red-400'}
            `}>
              {debugInfo.nodeRedStatus}
            </span>
          </div>

          {debugInfo.error && (
            <div className="text-red-400">
              <span className="font-medium">Error: </span>
              {debugInfo.error}
            </div>
          )}

          <div className="text-gray-400">
            <span className="font-medium">Last Update: </span>
            {new Date(debugInfo.lastUpdate).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="text-gray-400">Loading debug info...</div>
      )}
    </div>
  )
}
