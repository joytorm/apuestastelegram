# Hydrogram setup v1 (MVP seguro)

Este scaffold está diseñado **solo para ingesta**.
No envía mensajes, no responde, no edita nada en Telegram.

## 1) Prerrequisitos

- Python 3.10+
- Dependencias del proyecto instaladas previamente (incluyendo `hydrogram`)
- API ID y API HASH de Telegram (my.telegram.org)
- Cuenta con 2FA activa

> Este documento no instala paquetes. Solo describe configuración/ejecución.

## 2) Variables de entorno

Define estas variables antes de ejecutar:

- `TG_API_ID` → API ID de Telegram
- `TG_API_HASH` → API HASH de Telegram
- `TG_SESSION_NAME` → nombre de sesión local (ej: `hydrogram_mvp`)
- `ALLOWED_CHANNELS` → lista separada por comas de canales permitidos
  - acepta `@username` (ej: `@canal_alertas`)
  - acepta ID numérico como string (ej: `-1001234567890`)

Opcionales (delay aleatorio anti-patrón):

- `RANDOM_DELAY_ENABLED` → `true/false` (default: `false`)
- `RANDOM_DELAY_MIN` → segundos mínimos (default: `5`)
- `RANDOM_DELAY_MAX` → segundos máximos (default: `30`)

Ejemplo:

```bash
export TG_API_ID="1234567"
export TG_API_HASH="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TG_SESSION_NAME="hydrogram_mvp"
export ALLOWED_CHANNELS="@canal1,@canal2,-1001234567890"

export RANDOM_DELAY_ENABLED="true"
export RANDOM_DELAY_MIN="5"
export RANDOM_DELAY_MAX="30"
```

## 3) Notas anti-riesgo (operación)

- Usa cuenta dedicada para ingesta (separada de uso personal).
- Activa y conserva 2FA.
- Evita IPs inestables o datacenter “sospechoso”; mejor IP residencial estable.
- Mantén **sesión persistente** (`TG_SESSION_NAME` fijo) para evitar relogins repetidos.
- Mantén caché local de IDs/username permitidos (lista blanca) y no proceses nada fuera de ella.
- No amplíes permisos ni añadas acciones de envío en este MVP.
- Monitoriza logs para detectar errores de auth/rate-limit.

## 4) Ejecución en modo seguro

Desde la raíz del proyecto:

```bash
python3 scripts/hydrogram_listener.py
```

Qué hace:

- Se conecta a Telegram con Hydrogram.
- Escucha mensajes nuevos en canales.
- Filtra por `ALLOWED_CHANNELS`.
- Saca por stdout un JSON normalizado por cada mensaje permitido.

Qué **NO** hace:

- No envía mensajes.
- No responde automáticamente.
- No modifica chats/canales.

## 5) Salida esperada (ejemplo)

```json
{
  "event": "telegram_channel_message",
  "version": 1,
  "observed_at_utc": "2026-03-14T09:00:00+00:00",
  "message": {
    "id": 123,
    "date_utc": "2026-03-14T08:59:50+00:00",
    "text": "texto o caption",
    "has_media": true,
    "media_type": "photo",
    "views": 100,
    "forwards": 3
  },
  "chat": {
    "id": -1001234567890,
    "title": "Canal X",
    "username": "canalx",
    "type": "channel"
  }
}
```
