import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  const limitParam = Number(request.nextUrl.searchParams.get('limit') ?? '50');
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 200)
    : 50;

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('tips')
      .select(
        'id, sport, event, market_type, selection, odds, stake, status, source_channel_name, source_timestamp, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { ok: false, error: 'DB_ERROR', detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNEXPECTED_ERROR',
        detail: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
