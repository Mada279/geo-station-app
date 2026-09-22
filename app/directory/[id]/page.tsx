import React from 'react';
import type { Metadata } from 'next';
import { supabase } from '@/utils/supabaseClient';
import { findMockProvider } from '@/utils/helpers';
import ProviderProfileClient, { ProviderData } from './ProviderProfileClient';

interface Props {
  params: { id: string };
}

async function fetchProviderData(id: string): Promise<ProviderData | null> {
  try {
    const { data: provData, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && provData) {
      let svcList: string[] = [];
      if (Array.isArray(provData.services)) {
        svcList = provData.services;
      } else if (typeof provData.services === 'string') {
        try {
          const parsed = JSON.parse(provData.services);
          if (Array.isArray(parsed)) svcList = parsed;
          else svcList = provData.services.split(',').map((s: string) => s.trim());
        } catch {
          svcList = provData.services.split(',').map((s: string) => s.trim());
        }
      }

      return {
        id: String(provData.id),
        name: provData.company_name || provData.name || 'مكتب مساحي معتمد',
        email: provData.email,
        phone: provData.phone || '01033134413',
        location: provData.location || 'القاهرة',
        status: provData.status || 'approved',
        created_at: provData.created_at,
        about: provData.about || `جهة مساحية متخصصة ومعتمدة على منصة Survsta لتقديم أرقى الحلول الهندسية وخدمات الرفع الطبوغرافي والمعايرة في نطاق ${provData.location || 'الجمهورية'}.`,
        services: svcList.length > 0 ? svcList : ['رفع مساحي طبوغرافي', 'تأجير أجهزة Total Station', 'شبكات GNSS'],
        logo_url: provData.logo_url || '/assets/img/hero-engineering-office.jpg',
      };
    }

    // Fallback to mock provider to guarantee zero-404 demo
    const mock = findMockProvider(id);
    if (mock) {
      return {
        id: mock.id,
        name: mock.name,
        email: mock.email,
        phone: mock.phone,
        location: mock.location,
        status: mock.status,
        created_at: mock.created_at,
        about: mock.about,
        services: mock.services,
        logo_url: '/assets/img/hero-engineering-office.jpg',
      };
    }
  } catch (err) {
    console.warn('[ProviderPage] Error fetching provider for SEO:', err);
    const mock = findMockProvider(id);
    if (mock) {
      return {
        id: mock.id,
        name: mock.name,
        email: mock.email,
        phone: mock.phone,
        location: mock.location,
        status: mock.status,
        created_at: mock.created_at,
        about: mock.about,
        services: mock.services,
        logo_url: '/assets/img/hero-engineering-office.jpg',
      };
    }
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const provider = await fetchProviderData(params.id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://survsta.com';

  if (!provider) {
    return {
      title: 'مكتب مساحي معتمد | Survsta',
      description: 'دليل المكاتب والشركات ومراكز المعايرة الهندسية المعتمدة في مصر عبر منصة Survsta.',
    };
  }

  const title = `${provider.name} - لخدمات المساحة | Survsta`;
  const description = provider.about || `خدمات مساحية وهندسية معتمدة مقدمة من ${provider.name} عبر منصة Survsta.`;
  const logoUrl = provider.logo_url || '/assets/img/hero-engineering-office.jpg';
  const absoluteImageUrl = logoUrl.startsWith('http') ? logoUrl : `${siteUrl}${logoUrl}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/directory/${provider.id}`,
      siteName: 'Survsta',
      locale: 'ar_EG',
      type: 'profile',
      images: [
        {
          url: absoluteImageUrl,
          width: 800,
          height: 600,
          alt: provider.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteImageUrl],
    },
  };
}

export default async function ProviderProfilePage({ params }: Props) {
  const provider = await fetchProviderData(params.id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://survsta.com';

  const localBusinessJsonLd = provider
    ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: provider.name,
        description: provider.about,
        telephone: provider.phone || '+201033134413',
        image: provider.logo_url?.startsWith('http')
          ? provider.logo_url
          : `${siteUrl}${provider.logo_url || '/assets/img/hero-engineering-office.jpg'}`,
        url: `${siteUrl}/directory/${provider.id}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: provider.location || 'القاهرة',
          addressCountry: 'EG',
        },
        priceRange: '$$',
      }
    : null;

  return (
    <>
      {localBusinessJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      )}
      <ProviderProfileClient initialProvider={provider} />
    </>
  );
}
