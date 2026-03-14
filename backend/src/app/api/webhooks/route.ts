import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)

  return NextResponse.json({
    ok: true,
    received: Boolean(payload),
    kind: payload?.event ?? 'unknown'
  })
}
