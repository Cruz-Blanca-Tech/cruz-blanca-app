@AGENTS.md
# Instrucciones del proyecto Cruz Blanca

## Stack
- Next.js 15+ con App Router y TypeScript
- shadcn/ui + Tailwind CSS v4
- TanStack Table, React Hook Form + Zod, TanStack Query, Zustand
- Lucide React para iconos

## Reglas

### shadcn/ui
Cuando necesites un componente de shadcn (Table, Dialog, Tabs, Input, Select, Card, Badge, Dropdown, Sheet, Tooltip, etc.), instálalo con `npx shadcn@latest add [componente]` antes de usarlo. No crees componentes custom si shadcn ya tiene uno que sirve.

### Colores
Usa los tokens de CSS variables en globals.css. No hardcodees colores hex.

### Tipografías
- Alegreya Sans SC: títulos y subtítulos
- Alegreya Sans: cuerpo de texto
- Arimo: tablas, datos, código

### Iconos
Lucide React exclusivamente. Nunca emojis en la UI.

### Imágenes
Usa `next/image` (`<Image>`) por defecto, nunca `<img>` crudo. El lint `@next/next/no-img-element` está activo por algo: el `<img>` empeora el LCP y consume más ancho de banda. `<Image>` te da WebP/AVIF, tamaño responsive, lazy-load y reserva de espacio (anti layout shift) gratis.

- **Dimensiones**: pasa `width`/`height`, o usa `fill` dentro de un contenedor `relative` con tamaño definido (no uses `<img>` solo porque no sabes las dimensiones). Con `fill` define siempre `sizes` acorde al tamaño real para no servir resoluciones de más.
- **Excepciones legítimas** (solo aquí se permite `<img>` o `unoptimized`, y SIEMPRE con un comentario que diga cuál): `src` tipo `data:`/`blob:` (preview local de archivos; `<Image>` lo marca `unoptimized` solo), SVG (`unoptimized`, automático si el `src` termina en `.svg`), imágenes < 1KB / GIF animados, e imágenes que requieren autenticación.
- **Remotas con rate-limit/hotlink bloqueado** (p. ej. Google Drive): no embebas la URL externa directa. Sírvela por un route handler propio (`/api/...`) que la baje del lado del servidor y la cachee, y apunta `<Image>` a esa ruta local. Recuerda declarar rutas locales con query string en `images.localPatterns` (Next las bloquea si no).

### Estructura de carpetas
Cada pantalla va en su feature correspondiente en /src/features/. Las páginas en /src/app/(private)/ solo importan y renderizan el componente del feature.

### TypeScript
Tipado estricto, sin `any`.

### Validación con Zod
Valida con Zod todo dato que cruce un límite de confianza: respuestas de API/fetch, formularios, variables de entorno, `localStorage`, query params y cualquier `JSON.parse`. Para datos puramente internos y ya tipados estáticamente (props entre tus componentes, estado de stores, constantes), NO uses Zod: es sobre-ingeniería.

- **Tipos**: deriva los tipos de esos datos con `z.infer<typeof schema>`. No declares `interface`/`type` a mano para algo que ya describe un schema.
- **Respuestas de API**: valida en la frontera del service con `.safeParse` antes de devolver los datos (el genérico `<T>` del fetch no valida nada en runtime).
- **Formularios**: usa `zodResolver(schema)` con React Hook Form; el schema es la única fuente de validación, no repliques las reglas con `if`.
- **Ubicación**: los schemas viven en `schemas/` dentro de su feature (`src/features/<feature>/schemas/`). Reutilízalos; no dupliques un schema que ya existe.
- **APIs vigentes (Zod 4)**: usa los validadores de formato top-level (`z.email()`, `z.url()`, …) y el parámetro `error` para los mensajes. No uses APIs deprecadas: `z.string().email()`, `required_error`/`invalid_type_error`, `.flatten()`, `z.nativeEnum()`.

### Diseños de referencia
Los HTML de referencia visual están en /docs/designs/. Son solo guía visual — adaptar todo a React + shadcn/ui + Tailwind.