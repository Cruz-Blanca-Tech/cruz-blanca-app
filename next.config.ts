import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // El proxy de previews de Drive (`/api/drive-image`) recibe query dinámica
    // (`?id=...&sz=...`). Next 16 bloquea imágenes locales con query string salvo
    // que estén en esta allowlist. Omitimos `search` porque los params varían; la
    // validación anti-SSRF vive en el propio route handler (regex sobre id/sz).
    // Nota: `/api/case-doc-image` NO va aquí: se sirve con `<Image unoptimized>`
    // (el optimizador no reenvía la cookie de sesión que esa ruta exige).
    localPatterns: [{ pathname: '/api/drive-image' }],
  },
};

export default nextConfig;
