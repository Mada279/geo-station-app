import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Survsta - منصة المساحة الأولى',
    short_name: 'Survsta',
    description: 'المنصة الرقمية المتخصصة لقطاع المساحة والجيوماتكس في مصر والشرق الأوسط',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B1528',
    theme_color: '#0B1528',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
