import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

function getContentType(payload: { message?: { has_media?: boolean; media_type?: string } }) {
  const hasMedia = Boolean(payload?.message?.has_media);
  if (!hasMedia) return 'text';
  if (payload?.message?.media_type === 'photo') return 'image';
  return 'mixed';
}

export async function POST(request: NextRequest) {
  const sharedSecret = process.env.WEBHOOK_SHARED_SECRET;
  const incomingSecret = request.headers.get('x-webhook-secret');

  if (sharedSecret && incomingSecret !== sharedSecret) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const message = payload?.message ?? {};
  const chat = payload?.chat ?? {};

  try {
    const supabase = createServiceRoleClient();
    const sourceChannelId = String(chat.id ?? '');
    const sourceMessageId = String(message.id ?? '');

    const { data, error } = await supabase
      .from('tips')
      .insert({
        source_type: 'telegram',
        source_channel_id: sourceChannelId || null,
        source_channel_name: chat.title || chat.username || null,
        source_message_id: sourceMessageId || null,
        source_timestamp: message.date_utc ?? null,
        source_content_type: getContentType(payload),
        source_raw_text: String(message.text || '').trim() || null,
        source_raw_payload: payload,
        status: 'pending'
      })
      .select('id, status')
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: 'DB_ERROR', detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      tip_id: data?.id,
      status: data?.status ?? 'pending'
    });
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
