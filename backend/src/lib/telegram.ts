/**
 * Telegram notification utility
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramAlert(message: string): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error('[Telegram] Send failed:', err);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Telegram] Error:', e);
    return false;
  }
}
