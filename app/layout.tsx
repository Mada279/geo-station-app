import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAdButton from '@/components/FloatingAdButton';
import './styles/font.css';
import './styles/tokens.css';
import './styles/style.css';
import './styles/portal.css';
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
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-[#f4f7fa] text-slate-800 antialiased selection:bg-cyan-500 selection:text-gray-950 flex flex-col justify-between">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <FloatingAdButton />
      </body>
    </html>
  );
}
