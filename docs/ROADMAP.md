# ROADMAP — ApuestasTelegram

## Objetivo
Construir una plataforma de curación y distribución de tips en Telegram con parsing IA, validación y métricas de rendimiento.

## Fase 0 — Reinicio limpio (hoy)
- [x] Eliminar despliegue de prueba ("hola mundo")
- [x] Crear estructura de proyecto (docs + tareas)
- [ ] Definir alcance MVP cerrado

## Fase 1 — MVP operativo
- [ ] Ingesta Telegram con Hydrogram (5-10 canales)
- [ ] Parsing estructurado (OpenAI + fallback Claude)
- [ ] Persistencia en Supabase (`tips`, `tipsters`, `events`)
- [ ] Dashboard admin para aprobar/rechazar
- [ ] Publicación en canal premium vía Bot API

## Fase 2 — Tracking y métricas
- [ ] Liquidación de picks (win/loss/push)
- [ ] Integrar API-Football (resultados)
- [ ] Integrar The Odds API (closing odds)
- [ ] Métricas: yield, drawdown, CLV

## Fase 3 — Monetización
- [ ] Alta de suscripciones (crypto-first)
- [ ] Webhooks de alta/baja en canal premium
- [ ] Flujos de renovación y revocación automáticos

## Riesgos críticos
1. Riesgo de cuenta userbot (mitigar con uso pasivo y cuenta robusta)
2. Restricciones de pagos en servicios relacionados con apuestas
3. Riesgo legal por reutilización de contenido de terceros
