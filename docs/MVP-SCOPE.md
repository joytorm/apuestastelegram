# MVP-SCOPE — ApuestasTelegram

## Objetivo del MVP (versión cerrada)
Lanzar una primera versión operativa que permita:
1. Capturar tips desde canales de Telegram monitorizados.
2. Parsear tips a formato estructurado con IA.
3. Revisar y aprobar manualmente en dashboard.
4. Publicar tips curados en canal premium de Telegram.
5. Guardar estado completo y trazabilidad de cada tip.

---

## Qué entra en MVP (IN)

### 1) Ingesta Telegram (Hydrogram)
- Lectura pasiva de **5–10 canales**.
- Soporte para mensajes de texto y mensajes con imagen.
- Guardado de mensaje original (raw) + metadatos:
  - channel_id
  - message_id
  - fecha/hora original
  - tipo de contenido (texto/imagen)
  - hash/id de deduplicación

### 2) Parsing IA a JSON estructurado
- Modelo principal: OpenAI (económico).
- Fallback: Claude para casos ambiguos o error de parse.
- Esquema mínimo obligatorio por tip:
  - sport
  - event
  - market_type
  - selection
  - odds
  - stake
  - tipster_source
  - source_timestamp
- Resultado de parse con bandera de confianza (`parse_confidence`).

### 3) Persistencia en Supabase
- Tablas mínimas:
  - `tipsters`
  - `tips`
  - `events`
  - `subscribers` (preparada para fase monetización)
- Estados de tip:
  - `pending`
  - `approved`
  - `rejected`
  - `distributed`
  - `settled` (reservado para fase siguiente)

### 4) Dashboard admin (Next.js)
- Lista de tips `pending`.
- Vista detalle de tip + original raw.
- Acciones:
  - Aprobar
  - Rechazar
- Historial de últimos tips aprobados/publicados.

### 5) Distribución Telegram (Bot API)
- Bot admin en canal premium.
- Publicación tras aprobación (manual).
- Formato estándar del mensaje (HTML o MarkdownV2).
- Registro de publicación:
  - `distributed_at`
  - `telegram_chat_id`
  - `telegram_message_id`

### 6) Orquestación con n8n
Workflows MVP:
1. `telegram_ingest_parse_store`
2. `tip_approve_distribute`

### 7) Seguridad y operación mínima
- RLS activada (solo admin para tablas sensibles).
- Secrets por variables de entorno.
- Logs básicos por workflow para depuración.

---

## Qué NO entra en MVP (OUT)
- Liquidación automática completa (win/loss/push por mercado complejo).
- CLV, p-value, drawdown, Sharpe y analítica avanzada.
- Integración de pagos completa (Stripe/BTCPay/Stars/Bizum).
- Gestión automática de altas/bajas de suscriptores por pago.
- Scraping de membresías web con Playwright.
- Ingesta email (IMAP) en producción.
- Escalado >10 canales monitorizados.

---

## Criterios de éxito (Definition of Done)
El MVP se considera listo cuando:
1. Entran tips reales de al menos 5 canales durante 48h seguidas sin caída.
2. El parse estructurado supera **90%** en campos obligatorios completos.
3. Un operador puede aprobar/rechazar y publicar sin intervención técnica.
4. Cada tip publicado tiene trazabilidad completa desde origen hasta mensaje final.
5. Tiempo medio desde mensaje origen hasta publicación: **< 3 minutos** en flujo normal.

---

## Riesgos MVP y mitigación rápida
1. **Riesgo userbot Telegram**
   - Mitigar con uso pasivo, sesión persistente, delays aleatorios y cuenta robusta.
2. **Errores de parse en formatos raros**
   - Fallback a Claude + cola manual de revisión.
3. **Duplicados de mensajes**
   - Deduplicación por `channel_id + message_id` y hash de contenido.
4. **Bloqueos operativos en publicación**
   - Reintentos controlados y logging en n8n.

---

## Entregables inmediatos tras este scope
1. SQL inicial de esquema y RLS (`docs/db-schema-v1.sql`).
2. Contrato JSON del parser (`docs/parser-schema-v1.json`).
3. Especificación de formato de publicación (`docs/telegram-format-v1.md`).
