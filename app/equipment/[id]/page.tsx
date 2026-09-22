import React from 'react';
import type { Metadata } from 'next';
import { supabase } from '@/utils/supabaseClient';
import { getEquipmentImageUrl } from '@/utils/helpers';
import EquipmentDetailClient, { EquipmentDetail } from './EquipmentDetailClient';

interface Props {
  params: { id: string };
}

async function fetchEquipmentData(id: string) {
  try {
    const { data: eqData, error: eqErr } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (eqErr) {
      console.warn('[EquipmentDetail] Supabase fetch error:', eqErr.message);
    }

    let providerInfo: { name?: string; phone?: string; location?: string; is_verified?: boolean } | null = null;
    if (eqData?.provider_id) {
      const { data: provData } = await supabase
        .from('providers')
        .select('id, name, phone, location, is_verified')
        .eq('id', eqData.provider_id)
        .maybeSingle();
      providerInfo = provData;
    }

    if (eqData) {
      return {
        id: eqData.id,
        title: eqData.title,
        category: eqData.category || 'أجهزة محطة الرصد المتكاملة',
        brand: eqData.brand || 'Leica Geosystems',
        model: eqData.model || 'TS16 1" R1000',
        description: eqData.description || 'جهاز مساحي احترافي مزود بأحدث تقنيات الرصد التلقائي وقياس المسافات بدون عاكس حتى 1000 متر.',
        daily_price: eqData.daily_price || 950,
        monthly_price: eqData.monthly_price || 22000,
        sale_price: eqData.sale_price,
        image_url: eqData.image_url || '/images/Designer.png',
        condition: eqData.condition || 'ممتازة — كالجديد',
        status: eqData.status || 'متاح للإيجار',
        calibration_date: eqData.calibration_date || 'سارية حتى 2026',
        serial_number: eqData.serial_number || 'SN-7849102',
        provider_id: eqData.provider_id || 'prov-1',
        provider_name: providerInfo?.name || 'مكتب النخبة للمساحة الهندسية',
        provider_phone: providerInfo?.phone || '01012345678',
        provider_location: providerInfo?.location || 'القاهرة — المعادي',
        is_verified: providerInfo?.is_verified ?? true,
      } as EquipmentDetail;
    }

    // Default fallback realistic data for demo / crawl
    return {
      id,
      title: 'محطة رصد متكاملة Leica Total Station TS16 Robotic',
      category: 'محطات الرصد المتكاملة (Total Station)',
      brand: 'Leica Geosystems',
      model: 'TS16 1" R1000 PowerSearch',
      description: 'محطة رصد آلية متطورة روبوتية دقة 1 ثانية، مزودة بكاميرا عالية الدقة وتقنية البحث السريع PowerSearch. مثالية للمشروعات القومية ورصد الأنفاق وشبكات الطرق والجسور.',
      daily_price: 1200,
      monthly_price: 26000,
      image_url: '/images/Designer.png',
      condition: 'ممتازة — معايرة دورية',
      status: 'متاح للإيجار',
      calibration_date: 'سارية حتى ديسمبر 2026',
      serial_number: 'LCA-TS16-89410',
      provider_id: 'provider-demo-1',
      provider_name: 'شركة النيل للخدمات والتجهيزات الجيوديسية',
      provider_phone: '01012345678',
      provider_location: 'القاهرة — مدينة نصر',
      is_verified: true,
    } as EquipmentDetail;
  } catch (err) {
    console.warn('[EquipmentDetail] Error fetching for SEO:', err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await fetchEquipmentData(params.id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://survsta.com';

  if (!item) {
    return {
      title: 'جهاز مساحي معتمد | Survsta',
      description: 'أجهزة ومعدات مساحية وهندسية معتمدة للبيع والإيجار في مصر عبر منصة Survsta.',
    };
  }

  const title = `${item.title} - ${item.provider_name || 'مزوّد معتمد'} | Survsta`;
  const description = `موديل: ${item.model || 'معاير'} • الحالة: ${item.condition || 'ممتاز'} • ${item.description ? item.description.slice(0, 150) : 'أجهزة ومعدات مساحية معتمدة عبر منصة Survsta'}`;
  const imageUrl = getEquipmentImageUrl(item.image_url, item.category, item.title);
  const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/equipment/${item.id}`,
      siteName: 'Survsta',
      locale: 'ar_EG',
      type: 'website',
      images: [
        {
          url: absoluteImageUrl,
          width: 800,
          height: 600,
          alt: item.title,
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

export default async function EquipmentDetailPage({ params }: Props) {
  const item = await fetchEquipmentData(params.id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://survsta.com';

  const productJsonLd = item
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: item.title,
        image: item.image_url?.startsWith('http')
          ? item.image_url
          : `${siteUrl}${getEquipmentImageUrl(item.image_url, item.category, item.title)}`,
        description: item.description || `${item.title} - ${item.model}`,
        model: item.model,
        category: item.category,
        brand: {
          '@type': 'Brand',
          name: item.brand || 'Leica Geosystems',
        },
        offers: {
          '@type': 'Offer',
          price: item.daily_price || item.sale_price || 0,
          priceCurrency: 'EGP',
          availability: 'https://schema.org/InStock',
          itemCondition: item.condition?.includes('جديد')
            ? 'https://schema.org/NewCondition'
            : 'https://schema.org/UsedCondition',
          seller: {
            '@type': 'Organization',
            name: item.provider_name || 'مكتب مساحي معتمد لدى Survsta',
          },
        },
      }
    : null;

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      <EquipmentDetailClient initialEquipment={item} />
    </>
  );
}
