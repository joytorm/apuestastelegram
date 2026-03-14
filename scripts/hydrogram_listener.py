#!/usr/bin/env python3
"""Hydrogram listener MVP (solo ingesta, bajo riesgo).

- Lee mensajes nuevos de canales permitidos (ALLOWED_CHANNELS)
- No envía mensajes ni realiza acciones de escritura
- Genera payload JSON normalizado y lo imprime por stdout
"""

from __future__ import annotations

import asyncio
import json
import os
import random
from datetime import datetime, timezone
from typing import Any

from hydrogram import Client, filters


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def parse_allowed_channels(raw: str | None) -> set[str]:
    """Acepta usernames (@canal) o IDs como texto, separados por coma."""
    if not raw:
        return set()
    return {item.strip().lower() for item in raw.split(",") if item.strip()}


def infer_media_type(message: Any) -> str | None:
    media_types = [
        "photo",
        "video",
        "document",
        "audio",
        "voice",
        "animation",
        "sticker",
        "video_note",
        "contact",
        "location",
        "venue",
        "poll",
        "dice",
    ]
    for mtype in media_types:
        if getattr(message, mtype, None) is not None:
            return mtype
    return None


def build_payload(message: Any, source_chat: Any) -> dict[str, Any]:
    media_type = infer_media_type(message)
    ts = None
    if getattr(message, "date", None) is not None:
        ts = message.date.astimezone(timezone.utc).isoformat()

    return {
        "event": "telegram_channel_message",
        "version": 1,
        "observed_at_utc": datetime.now(timezone.utc).isoformat(),
        "message": {
            "id": message.id,
            "date_utc": ts,
            "text": message.text or message.caption or "",
            "has_media": media_type is not None,
            "media_type": media_type,
            "views": getattr(message, "views", None),
            "forwards": getattr(message, "forwards", None),
        },
        "chat": {
            "id": source_chat.id,
            "title": source_chat.title,
            "username": source_chat.username,
            "type": source_chat.type.value if getattr(source_chat.type, "value", None) else str(source_chat.type),
        },
    }


async def maybe_random_delay(enabled: bool, min_s: int, max_s: int) -> None:
    if not enabled:
        return
    wait_s = random.randint(min_s, max_s)
    await asyncio.sleep(wait_s)


async def main() -> None:
    api_id = os.getenv("TG_API_ID", "").strip()
    api_hash = os.getenv("TG_API_HASH", "").strip()
    session_name = os.getenv("TG_SESSION_NAME", "hydrogram_mvp")
    allowed_channels = parse_allowed_channels(os.getenv("ALLOWED_CHANNELS"))

    random_delay_enabled = env_bool("RANDOM_DELAY_ENABLED", default=False)
    delay_min = int(os.getenv("RANDOM_DELAY_MIN", "5"))
    delay_max = int(os.getenv("RANDOM_DELAY_MAX", "30"))

    if not api_id or not api_hash:
        raise SystemExit("Faltan TG_API_ID y/o TG_API_HASH en entorno")

    if not allowed_channels:
        raise SystemExit("ALLOWED_CHANNELS vacío. Define canales permitidos antes de iniciar.")

    if delay_min > delay_max:
        raise SystemExit("RANGO de delay inválido: RANDOM_DELAY_MIN > RANDOM_DELAY_MAX")

    app = Client(name=session_name, api_id=int(api_id), api_hash=api_hash)

    @app.on_message(filters.channel)
    async def on_channel_message(_: Client, message: Any) -> None:
        chat = getattr(message, "chat", None)
        if not chat:
            return

        chat_id = str(chat.id).lower()
        chat_user = f"@{chat.username.lower()}" if getattr(chat, "username", None) else None

        allowed = chat_id in allowed_channels or (chat_user in allowed_channels if chat_user else False)
        if not allowed:
            return

        await maybe_random_delay(random_delay_enabled, delay_min, delay_max)

        payload = build_payload(message, chat)
        print(json.dumps(payload, ensure_ascii=False), flush=True)

    print("[hydrogram-listener] iniciado en modo SOLO-LECTURA", flush=True)
    print(f"[hydrogram-listener] canales permitidos cargados: {len(allowed_channels)}", flush=True)
    await app.start()
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
