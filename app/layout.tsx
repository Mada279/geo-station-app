import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAdButton from '@/components/FloatingAdButton';
import './styles/font.css';
import './styles/tokens.css';
import './styles/style.css';
import './styles/portal.css';
import '@/app/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://survsta.com'),
  title: 'Survsta — المنصة الرقمية لقطاع المساحة والجيوماتكس',
  description: 'سوق الأجهزة المساحية والخدمات والوظائف الهندسية في مصر والشرق الأوسط',
  keywords: [
    'Survsta',
    'سيرفستا',
    'أجهزة مساحة',
    'تأجير محطات رصد',
    'Total Station',
    'GPS RTK',
    'مكاتب مساحة معتمدة',
    'وظائف مساحة مصر',
    'Geomatics Egypt',
  ],
  alternates: {
    canonical: 'https://survsta.com',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/Designer.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Survsta — المنصة الرقمية لقطاع المساحة والجيوماتكس',
    description: 'سوق الأجهزة المساحية والخدمات والوظائف الهندسية في مصر والشرق الأوسط',
    url: 'https://survsta.com',
    siteName: 'Survsta',
    locale: 'ar_EG',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Survsta Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Survsta | سيرفستا',
    description: 'سوق الأجهزة المساحية والخدمات الهندسية',
    images: ['/og-image.jpg'],
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Survsta',
  alternateName: 'منصة سيرفستا للمساحة والجيوماتكس',
  url: 'https://survsta.com',
  logo: 'https://survsta.com/images/Designer.png',
  description: 'المنصة الرقمية المتخصصة لقطاع المساحة والجيوماتكس في مصر والشرق الأوسط — دليل، سوق أجهزة، خدمات، وتدريب.',
  sameAs: [
    'https://www.facebook.com/share/1Cpz44dffG/',
    'https://www.linkedin.com/company/survsta/',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+201033134413',
    contactType: 'customer support',
    areaServed: 'EG',
    availableLanguage: ['Arabic', 'English'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#f4f7fa] text-slate-800 antialiased selection:bg-cyan-500 selection:text-gray-950 flex flex-col justify-between">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <FloatingAdButton />
        <GoogleAnalytics gaId="G-FFCDYX5JBS" />
      </body>
    </html>
  );
}
