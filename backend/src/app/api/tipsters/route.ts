import { NextResponse } from 'next/server'

const mockTipsters = [
  {
    id: 'tipster_001',
    name: 'Canal LaLiga Pro',
    source_type: 'telegram',
    active: true
  }
]

export async function GET() {
  return NextResponse.json({ ok: true, data: mockTipsters })
}
