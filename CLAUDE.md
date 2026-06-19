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

### Estructura de carpetas
Cada pantalla va en su feature correspondiente en /src/features/. Las páginas en /src/app/(private)/ solo importan y renderizan el componente del feature.

### TypeScript
Tipado estricto, sin `any`.

### Diseños de referencia
Los HTML de referencia visual están en /docs/designs/. Son solo guía visual — adaptar todo a React + shadcn/ui + Tailwind.