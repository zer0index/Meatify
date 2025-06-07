import { NextRequest, NextResponse } from 'next/server'
import type { Sensor } from '@/lib/types'
import { setLatestSensorData, getLatestSensorData } from '@/lib/dataStore'

const NODE_RED_URL = 'http://192.168.0.168:1880'

type DebugInfo = {
  dataSource: 'node-red' | 'posted'
  lastUpdate: string
  error?: string
  nodeRedStatus?: 'available' | 'unavailable' | 'error'
}

export async function GET(): Promise<NextResponse> {
  const debugInfo: DebugInfo = {
    dataSource: 'posted',
    lastUpdate: new Date().toISOString(),
    nodeRedStatus: 'unavailable'
  }

  // Zuerst versuchen, Daten von Node-RED zu erhalten
  try {
    const response = await fetch(`${NODE_RED_URL}/sensors`)
    if (response.ok) {
      const data: Sensor[] = await response.json()
      debugInfo.dataSource = 'node-red'
      debugInfo.nodeRedStatus = 'available'
      return NextResponse.json({
        data,
        debug: debugInfo
      })
    } else {
      debugInfo.error = `Node-RED gab den Status ${response.status} zurück`
      debugInfo.nodeRedStatus = 'error'
      console.warn('Node-RED nicht verfügbar, versuche es mit geposteten Daten')
    }
  } catch (error) {
    debugInfo.error = error instanceof Error ? error.message : 'Unbekannter Fehler'
    debugInfo.nodeRedStatus = 'error'
    console.warn('Fehler beim Abrufen von Node-RED, versuche es mit geposteten Daten:', error)
  }

  // Versuche, gepostete Daten als Fallback zu erhalten
  const { data: postedSensorData, lastUpdate } = getLatestSensorData()
  if (postedSensorData && postedSensorData.length > 0) {
    debugInfo.dataSource = 'posted'
    debugInfo.lastUpdate = lastUpdate || debugInfo.lastUpdate
    return NextResponse.json({
      data: postedSensorData,
      debug: debugInfo
    })
  }

  // Keine Daten verfügbar
  return NextResponse.json({ 
    error: 'Keine Sensordaten verfügbar',
    debug: {
      ...debugInfo,
      error: 'Keine Daten von Node-RED oder geposteten Daten verfügbar'
    }
  }, { status: 404 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (Array.isArray(body) && body.length > 0 && body[0].id !== undefined) {
      setLatestSensorData(body)
      console.log('📥 Sensordaten empfangen und gespeichert:', body)
      return NextResponse.json({ status: 'ok', received: body })
    } else {
      // Akzeptiere auch ein einzelnes Objekt
      if (body && body.id !== undefined) {
        setLatestSensorData([body])
        console.log('📥 Einzelne Sensordaten empfangen und gespeichert:', body)
        return NextResponse.json({ status: 'ok', received: body })
      }
      return NextResponse.json({ status: 'error', message: 'Ungültiges Sensor-Datenformat' }, { status: 400 })
    }
  } catch (err) {
    console.error('❌ Fehler in POST /api/data:', err)
    return NextResponse.json({ status: 'error', message: 'Ungültiges JSON' }, { status: 400 })
  }
}
