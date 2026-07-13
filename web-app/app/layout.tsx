import type { Metadata } from 'next';
import './globals.css';
import RegisterSW from './register-sw';

export const metadata: Metadata = {
    title: 'Pastillero Inteligente',
    description: 'app para gestionar medicamentos',
    manifest: '/manifest.webmanifest',
    icons: {
        icon: '/icon.svg',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <body>
                {children}
                <RegisterSW />
            </body>
        </html>
    );
}
