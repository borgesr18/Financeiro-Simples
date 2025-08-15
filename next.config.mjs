/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mantém SSR funcionando no Vercel (NÃO usar `output: 'export'`)
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  // Ajuda a reduzir o bundle de libs grandes (Next 14.2+)
  experimental: {
    optimizePackageImports: ['react-icons', 'highcharts-react-official'],
  },

  // Evita que o build falhe por lint em produção (opcional)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Se você usar <Image />, libere domínios remotos necessários
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },

  // Cabeçalhos úteis para PWA e assets
  async headers() {
    return [
      // Cache agressivo para ícones
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Manifest com cache mais curto (permite atualizar)
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=86400' }, // 1 dia
        ],
      },
      // CSS/JS gerados (defensivo; Vercel já define bons headers)
      {
        source: '/:all*(css|js)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
