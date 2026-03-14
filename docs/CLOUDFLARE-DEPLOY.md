# Cloudflare Deploy Status

Fecha: 2026-03-14

## Hecho
- Proyecto Pages creado: `apuestastelegram-frontend`
- Deploy publicado desde `frontend/out`
- URL Pages funcionando: `https://apuestastelegram-frontend.pages.dev` (HTTP 200)

## Dominio custom
- Dominio objetivo: `apuestas.entrelanzados.es`
- Domain añadido al proyecto Pages vía API.
- DNS CNAME actualizado de Vercel a Pages:
  - `apuestas.entrelanzados.es -> apuestastelegram-frontend.pages.dev`
- Estado en API Pages: `pending` (verification pendiente)

## Comandos de verificación
```bash
curl -I https://apuestastelegram-frontend.pages.dev
curl -I https://apuestas.entrelanzados.es
```

## Nota
Mientras Cloudflare Pages no termine verificación/certificado del custom domain, el subdominio puede devolver 522 temporal.
