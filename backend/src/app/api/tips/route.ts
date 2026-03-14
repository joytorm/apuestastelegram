import { NextResponse } from 'next/server'

const mockTips = [
  {
    id: 'tip_001',
    sport: 'football',
    event: 'Real Madrid vs Sevilla',
    market_type: '1x2',
    selection: 'Real Madrid',
    odds: 1.78,
    stake: 6,
    status: 'pending'
  }
]

export async function GET() {
  return NextResponse.json({ ok: true, data: mockTips })
}
