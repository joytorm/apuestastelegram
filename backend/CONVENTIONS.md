# Panel Entrelanzados - Convenciones

## Layout de páginas
- **SIEMPRE** usar `PageContainer` de `@/components/layout/page-container` como wrapper principal.
- Props: `pageTitle`, `pageDescription`.
- El contenido va dentro de `<div className="flex flex-col gap-6">`.
- Esto garantiza padding consistente (`p-4 md:px-6`) en todas las páginas, desktop y móvil.
- **NO** usar `<div className="space-y-4">` como wrapper principal suelto.

## Ejemplo
```tsx
import PageContainer from '@/components/layout/page-container';

export default function MiPage() {
  return (
    <PageContainer pageTitle="Título" pageDescription="Descripción corta">
      <div className="flex flex-col gap-6">
        {/* contenido */}
      </div>
    </PageContainer>
  );
}
```
