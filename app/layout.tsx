import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAdButton from '@/components/FloatingAdButton';
import TrustMarquee from '@/components/ui/TrustMarquee';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import './styles/font.css';
import './styles/tokens.css';
import './styles/style.css';
import './styles/portal.css';
import '@/app/globals.css';
import 'driver.js/dist/driver.css';

export const viewport: Viewport = {
  themeColor: '#0B1528',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://survsta.com';
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-FFCDYX5JBS';
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Survsta — المنصة الرقمية لقطاع المساحة والجيوماتكس',
    template: '%s | Survsta - سيرفستا',
  },
  description:
    'المنصة الهندسية المتخصصة في تأجير وبيع الأجهزة المساحية (Total Station, GPS RTK)، دليل المكاتب المساحية المعتمدة، وسوق الخدمات الهندسية والوظائف في مصر والشرق الأوسط.',
  applicationName: 'Survsta',
  keywords: [
    'Survsta',
    'سيرفستا',
    'أجهزة مساحة',
    'تأجير أجهزة مساحة',
    'توتال ستيشن',
    'Total Station',
    'GPS RTK',
    'ميزان قامة',
    'مكاتب مساحة معتمدة',
    'خدمات مساحية مصر',
    'وظائف مساحة مصر',
    'سوق المساحة والجيوماتكس',
    'Geomatics Egypt',
  ],
  authors: [{ name: 'Survsta Team', url: siteUrl }],
  creator: 'Survsta',
  publisher: 'Survsta',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Survsta',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: siteUrl,
    siteName: 'Survsta | سيرفستا',
    title: 'Survsta | سيرفستا - المنصة الرقمية للمساحة والجيوماتكس',
    description:
      'المنصة الرائدة لربط المهندسين والمقاولين بمزودي أجهزة Total Station و GPS RTK ومكاتب المساحة المعتمدة في مصر والشرق الأوسط.',
    images: [
      {
        url: '/images/survsta-og-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Survsta | سيرفستا - المنصة الرقمية للمساحة والجيوماتكس',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Survsta | سيرفستا - المنصة الرقمية للمساحة والجيوماتكس',
    description:
      'سوق أجهزة المساحة وتأجير المحطات وربط المكاتب الهندسية المعتمدة في مصر والشرق الأوسط.',
    images: ['/images/survsta-og-banner.jpg'],
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, '\\u003c') }}
        />
      </head>
      <body className="min-h-screen bg-[#f4f7fa] text-slate-800 antialiased selection:bg-cyan-500 selection:text-gray-950 flex flex-col justify-between">
        {/* Unified Sticky Header: Trust Marquee & Navbar welded together */}
        <header className="sticky top-0 z-[100] w-full flex flex-col bg-[#0B1528] shadow-lg">
          <TrustMarquee />
          <Navbar />
        </header>
        <main className="flex-grow">{children}</main>
        <Footer />
        <FloatingAdButton />
        <PwaInstallPrompt />

        {/* Analytics & Performance Tracking */}
        {gaMeasurementId && <GoogleAnalytics gaId={gaMeasurementId} />}

        {/* Meta Pixel (Facebook Pixel) */}
        {metaPixelId && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${metaPixelId}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt="Meta Pixel"
              />
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}
