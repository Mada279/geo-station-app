import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import '../public/assets/css/tokens.css';
import '../public/assets/css/font.css';
import '../public/assets/css/style.css';
import '../public/assets/css/portal.css';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Survsta — المنصة الرقمية لقطاع المساحة والجيوماتكس',
  description: 'سوق الأجهزة المساحية والخدمات والوظائف الهندسية في مصر والشرق الأوسط',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/Designer.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <html lang="ar" dir="rtl" className="dark">
      <head>
        <link rel="stylesheet" href="/assets/css/tokens.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/font.css" />
        <link rel="stylesheet" href="/assets/css/portal.css" />
      </head>
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased selection:bg-cyan-500 selection:text-gray-950">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
