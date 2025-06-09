import { NextRequest, NextResponse } from 'next/server'
import { loadSessionFromFile, saveSessionToFile, initializeStorage } from '@/lib/dataStore'
import type { GrillSession } from '@/lib/types'

// Initialize storage on server startup
initializeStorage()

export async function GET(): Promise<NextResponse> {
  try {
    const session = await loadSessionFromFile()
    
    if (!session) {
      return NextResponse.json({ 
        session: null,
        message: 'No session found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      session,
      lastSync: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to load session:', error)
    return NextResponse.json({ 
      error: 'Failed to load session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('PUT request received')
    const body = await req.json()
    console.log('Request body parsed:', JSON.stringify(body, null, 2))
    const session: GrillSession = body.session

    if (!session || !session.id) {
      console.log('Invalid session data:', session)
      return NextResponse.json({ 
        error: 'Invalid session data' 
      }, { status: 400 })
    }

    // Update lastSaved timestamp
    session.lastSaved = new Date()

    const success = await saveSessionToFile(session)
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to save session' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      session,
      saved: true,
      lastSync: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to save session:', error)
    return NextResponse.json({ 
      error: 'Failed to save session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    // Delete session from file storage
    const fs = await import('fs/promises')
    
    try {
      await fs.unlink(require('path').join(process.cwd(), './data/sessions/current.json'))
    } catch (error) {
      // File might not exist, which is fine
    }

    return NextResponse.json({ 
      cleared: true,
      message: 'Session cleared successfully',
      lastSync: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to clear session:', error)
    return NextResponse.json({ 
      error: 'Failed to clear session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
