import { MetadataRoute } from 'next';
import { supabase } from '@/utils/supabaseClient';
import { MOCK_PROFILES } from '@/utils/helpers';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://survsta.com';
  const now = new Date();

  // 1. Core Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/equipment`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/onboarding`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // 2. Dynamic Equipment Routes
  let equipmentRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: eqData } = await supabase
      .from('equipment')
      .select('id, created_at')
      .eq('is_flagged_stolen', false);

    if (eqData && eqData.length > 0) {
      equipmentRoutes = eqData.map((item) => ({
        url: `${baseUrl}/equipment/${item.id}`,
        lastModified: item.created_at ? new Date(item.created_at) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.warn('[sitemap] Error fetching equipment:', err);
  }

  // 3. Dynamic Provider Routes
  let providerRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: provData } = await supabase
      .from('providers')
      .select('id, created_at');

    if (provData && provData.length > 0) {
      providerRoutes = provData.map((prov) => ({
        url: `${baseUrl}/directory/${prov.id}`,
        lastModified: prov.created_at ? new Date(prov.created_at) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    } else {
      // Fallback to mock provider IDs to ensure rich sitemap
      providerRoutes = MOCK_PROFILES.map((p) => ({
        url: `${baseUrl}/directory/${p.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.warn('[sitemap] Error fetching providers:', err);
    providerRoutes = MOCK_PROFILES.map((p) => ({
      url: `${baseUrl}/directory/${p.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...equipmentRoutes, ...providerRoutes];
}
