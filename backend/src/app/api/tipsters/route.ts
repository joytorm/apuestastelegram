import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  const activeParam = request.nextUrl.searchParams.get('active');

  try {
    const supabase = createServiceRoleClient();
    let query = supabase
      .from('tipsters')
      .select('id, display_name, source_type, source_channel_id, source_channel_name, active, created_at')
      .order('created_at', { ascending: false });

    if (activeParam === 'true') {
      query = query.eq('active', true);
    }
    if (activeParam === 'false') {
      query = query.eq('active', false);
    }

    const { data, error } = await query;

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
