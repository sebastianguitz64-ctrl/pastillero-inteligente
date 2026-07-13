import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Pastillero Inteligente',
        short_name: 'Pastillero',
        description: 'Web app para gestionar medicamentos y seguimiento del cumplimiento.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
            {
                src: '/icon-192.png',
                type: 'image/png',
                sizes: '192x192',
            },
            {
                src: '/icon-512.png',
                type: 'image/png',
                sizes: '512x512',
            },
            {
                src: '/icon.svg',
                type: 'image/svg+xml',
                sizes: 'any',
            },
        ],
    };
}