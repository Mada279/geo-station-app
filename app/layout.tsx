import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
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
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased selection:bg-cyan-500 selection:text-gray-950">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
