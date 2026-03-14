# n8n Parse → Store v1 (AT-004)

## Objetivo
Definir el flujo n8n que recibe payloads normalizados desde Hydrogram, parsea con IA y guarda en Supabase (`tips`) con trazabilidad completa.

## Workflow ID lógico
`telegram_parse_store_v1`

## Trigger de entrada
- Tipo: **Webhook** (`POST /webhooks/telegram-parse-store-v1`)
- Content-Type: `application/json`
- Espera payload base del listener:
  - `message.id`
  - `message.date_utc`
  - `message.text`
  - `message.has_media`
  - `message.media_type`
  - `chat.id`
  - `chat.title`
  - `chat.username`

## Nodos (orden)

1. **Webhook In**
   - Recibe payload raw.

2. **Code: normalize_input**
   - Crea objeto estándar para parser.
   - Calcula `source_content_hash` (sha256 de texto + chat.id + message.id).
   - Si no hay texto y no hay media → descartar.

3. **Supabase: dedupe_check**
   - Tabla: `tips`
   - Busca por `(source_type='telegram', source_channel_id, source_message_id)`.
   - Si existe → terminar con `status=duplicate`.

4. **Switch: route_parser**
   - Si `message.has_media=true` → parser visión (Claude recomendado).
   - Si no → parser texto (OpenAI por defecto).

5A. **AI Agent: parse_text_openai**
   - Modelo barato por defecto.
   - Salida obligatoria JSON conforme `docs/parser-schema-v1.json`.

5B. **AI Agent: parse_media_claude**
   - Para caption + imagen cuando aplique.
   - Misma salida JSON estructurada.

6. **IF: parse_valid?**
   - Valida required + tipos + rangos.
   - Si inválido → fallback parser (Claude texto).

7. **Code: map_to_tips_row**
   - Mapea a columnas Supabase.
   - Setea `status='pending'`.

8. **Supabase: insert_tip**
   - Inserta fila en `tips`.

9. **Respond**
   - `200` con `{ok:true, tip_id, status:'pending'}`

## Mapeo exacto a `tips`

### Source
- `source_type` = `telegram`
- `source_channel_id` = `chat.id` (string)
- `source_channel_name` = `chat.title || chat.username`
- `source_message_id` = `message.id` (string)
- `source_timestamp` = `message.date_utc`
- `source_content_type` =
  - `text` si no media
  - `image` si media_type=photo
  - `mixed` si texto + media no-photo
- `source_raw_text` = `message.text`
- `source_raw_payload` = payload completo
- `source_content_hash` = hash generado

### Parse
- `sport` = `parsed.sport`
- `event` = `parsed.event`
- `market_type` = `parsed.market_type`
- `selection` = `parsed.selection`
- `odds` = `parsed.odds`
- `stake` = `parsed.stake`
- `bookmaker` = `parsed.bookmaker || null`
- `parse_confidence` = `parsed.parse_confidence || null`
- `parser_model` = nombre modelo efectivo
- `parser_version` = `v1`
- `parse_error` = texto error si fallback agotado

### Workflow
- `status` = `pending`
- `created_at/updated_at` = por DB

## Reglas de fallback
1. OpenAI texto falla → Claude texto
2. Claude visión falla → Claude texto sobre caption/raw
3. Si ambos fallan:
   - guardar fila mínima con `status='pending'`
   - `parse_error` relleno
   - `sport/event/...` pueden ir null para revisión manual

## Reglas operativas
- Timeout por parser: 20s
- Reintentos parser: 1
- Reintentos Supabase insert: 2
- Concurrency inicial: 2 ejecuciones
- DLQ simple: workflow secundario `telegram_parse_store_deadletter_v1`

## Métricas mínimas a loguear
- `received_total`
- `deduped_total`
- `parsed_ok_total`
- `parsed_fallback_total`
- `parse_failed_total`
- `insert_failed_total`
- latencia total (`received_at` → insert)

## Criterio DoD de AT-004
- Flujo definido con nodos y mapeo exacto a DB.
- Contrato de payload y fallback documentado.
- Listo para implementación en n8n sin ambigüedad.
