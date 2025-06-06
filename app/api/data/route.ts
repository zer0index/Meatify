import { NextResponse } from 'next/server';

let latestSensorData: any = null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    latestSensorData = body;
    console.log('Empfangene Sensordaten:', body);
    return NextResponse.json({ status: 'ok', received: body });
  } catch (error) {
    console.error('Fehler beim Empfangen der Daten:', error);
    return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 });
  }
}

export function getLatestSensorData() {
  return latestSensorData;
}
