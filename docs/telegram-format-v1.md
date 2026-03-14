# Telegram Premium Format v1

Plantilla corta para publicar tips en canal premium con `parse_mode=HTML` o `parse_mode=MarkdownV2`.

## 1) Plantilla (HTML)

```html
<b>⚽ TIP PREMIUM</b>
<b>Evento:</b> {event}
<b>Mercado:</b> {market_type}
<b>Selección:</b> {selection}
<b>Cuota:</b> {odds}
<b>Stake:</b> {stake}/10
<b>Casa:</b> {bookmaker}
<b>Fuente:</b> {tipster_source}
<b>Hora fuente:</b> {source_timestamp}
```

## 2) Plantilla (MarkdownV2)

```text
*⚽ TIP PREMIUM*
*Evento:* {event}
*Mercado:* {market_type}
*Selección:* {selection}
*Cuota:* {odds}
*Stake:* {stake}/10
*Casa:* {bookmaker}
*Fuente:* {tipster_source}
*Hora fuente:* {source_timestamp}
```

## 3) Reglas de escaping

### HTML (`parse_mode=HTML`)
- Escapar siempre: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`.
- Si vienen comillas en atributos (si los usas), escapar también `"` y `'`.
- No mezclar etiquetas no soportadas por Telegram.

### MarkdownV2 (`parse_mode=MarkdownV2`)
Escapar con `\` estos caracteres:  
`_ * [ ] ( ) ~ ` > # + - = | { } . !`

Ejemplo rápido:
- `Over 2.5` → `Over 2\.5`
- `Inter -0.5` → `Inter \-0\.5`
- `Milan (AH -1.0)` → `Milan \(AH \-1\.0\)`

## 4) Ejemplos reales

### A) Fútbol 1X2
**HTML**
```html
<b>⚽ TIP PREMIUM</b>
<b>Evento:</b> Real Madrid vs Sevilla
<b>Mercado:</b> 1X2
<b>Selección:</b> Real Madrid
<b>Cuota:</b> 1.78
<b>Stake:</b> 6/10
<b>Casa:</b> Bet365
<b>Fuente:</b> @tipster_laliga
<b>Hora fuente:</b> 2026-03-14T09:15:00Z
```

**MarkdownV2**
```text
*⚽ TIP PREMIUM*
*Evento:* Real Madrid vs Sevilla
*Mercado:* 1X2
*Selección:* Real Madrid
*Cuota:* 1\.78
*Stake:* 6/10
*Casa:* Bet365
*Fuente:* @tipster\_laliga
*Hora fuente:* 2026\-03\-14T09:15:00Z
```

### B) Fútbol Over/Under
**HTML**
```html
<b>⚽ TIP PREMIUM</b>
<b>Evento:</b> Liverpool vs Tottenham
<b>Mercado:</b> Over/Under
<b>Selección:</b> Over 2.5
<b>Cuota:</b> 1.92
<b>Stake:</b> 5/10
<b>Casa:</b> Pinnacle
<b>Fuente:</b> Canal Pro Goals
<b>Hora fuente:</b> 2026-03-14T10:00:00Z
```

**MarkdownV2**
```text
*⚽ TIP PREMIUM*
*Evento:* Liverpool vs Tottenham
*Mercado:* Over/Under
*Selección:* Over 2\.5
*Cuota:* 1\.92
*Stake:* 5/10
*Casa:* Pinnacle
*Fuente:* Canal Pro Goals
*Hora fuente:* 2026\-03\-14T10:00:00Z
```

### C) Fútbol Hándicap
**HTML**
```html
<b>⚽ TIP PREMIUM</b>
<b>Evento:</b> Inter vs Roma
<b>Mercado:</b> Hándicap Asiático
<b>Selección:</b> Inter -0.5
<b>Cuota:</b> 2.04
<b>Stake:</b> 4/10
<b>Casa:</b> Marathonbet
<b>Fuente:</b> @seriea_value
<b>Hora fuente:</b> 2026-03-14T11:20:00Z
```

**MarkdownV2**
```text
*⚽ TIP PREMIUM*
*Evento:* Inter vs Roma
*Mercado:* Hándicap Asiático
*Selección:* Inter \-0\.5
*Cuota:* 2\.04
*Stake:* 4/10
*Casa:* Marathonbet
*Fuente:* @seriea\_value
*Hora fuente:* 2026\-03\-14T11:20:00Z
```
