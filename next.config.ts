import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
      "img-src 'self' data: blob: https://*.googleusercontent.com https://drive.google.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://ca-cruzblanca-backend.happyforest-a0b724a4.centralus.azurecontainerapps.io https://accounts.google.com https://www.googleapis.com",
      "frame-src 'self' https://accounts.google.com https://docs.google.com https://drive.google.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    unoptimized: true,
    localPatterns: [{ pathname: '/api/drive-image' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
