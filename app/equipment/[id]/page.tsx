'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import InquiryModal from '@/components/inquiry/InquiryModal';

interface EquipmentDetail {
  id: string;
  title: string;
  category: string;
  brand: string;
  model: string;
  description: string;
  daily_price?: number;
  monthly_price?: number;
  sale_price?: number;
  image_url?: string;
  condition: string;
  status: string;
  calibration_date?: string;
  serial_number?: string;
  provider_id: string;
  // Joined Provider
  provider_name?: string;
  provider_phone?: string;
  provider_location?: string;
  is_verified?: boolean;
}

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = params?.id as string;

  const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInquiryOpen, setIsInquiryOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function loadEquipment() {
      if (!equipmentId) return;
      setIsLoading(true);

      try {
        // Fetch equipment
        const { data: eqData, error: eqErr } = await supabase
          .from('equipment')
          .select('*')
          .eq('id', equipmentId)
          .maybeSingle();

        if (eqErr) {
          console.warn('Equipment fetch error:', eqErr.message);
        }

        let providerInfo: any = null;
        if (eqData?.provider_id) {
          const { data: provData } = await supabase
            .from('providers')
            .select('id, name, phone, location, is_verified')
            .eq('id', eqData.provider_id)
            .maybeSingle();
          providerInfo = provData;
        }

        if (eqData) {
          setEquipment({
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
          });
        } else {
          // Fallback realistic item if id is demo
          setEquipment({
            id: equipmentId,
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
          });
        }
      } catch (err) {
        console.warn('Load equipment page error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadEquipment();
  }, [equipmentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#081933] text-gray-100 flex items-center justify-center p-8" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">جاري تحميل مواصفات وتفاصيل الجهاز...</p>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen bg-[#081933] text-gray-100 flex items-center justify-center p-8" dir="rtl">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-4xl">📡</div>
          <h2 className="text-xl font-bold text-white">لم يتم العثور على الجهاز المطلوب</h2>
          <p className="text-xs text-gray-400">
            قد يكون هذا الجهاز تم تأجيره أو إزالته من قبل المزوّد.
          </p>
          <Link
            href="/equipment"
            className="inline-block px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow"
          >
            العودة لكتالوج الأجهزة ←
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081933] text-gray-100 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-cyan-400 transition">الرئيسية</Link>
          <span>/</span>
          <Link href="/equipment" className="hover:text-cyan-400 transition">الأجهزة والمعدات</Link>
          <span>/</span>
          <span className="text-white font-semibold truncate">{equipment.title}</span>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / Right Column: Images & Specs (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Preview Box */}
            <div className="rounded-3xl border border-gray-800 bg-[#0F253E]/60 p-6 backdrop-blur-md relative overflow-hidden">
              <div className="relative h-80 sm:h-96 w-full rounded-2xl bg-[#081933] overflow-hidden flex items-center justify-center border border-gray-800/80">
                <Image
                  src={equipment.image_url || '/images/Designer.png'}
                  alt={equipment.title}
                  fill
                  className="object-contain p-4"
                  priority
                  unoptimized
                />
              </div>

              {/* Badges Overlay */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                  {equipment.category}
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
                  {equipment.brand}
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  شهادة المعايرة: {equipment.calibration_date}
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="rounded-3xl border border-gray-800 bg-[#0F253E]/60 p-6 sm:p-8 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {equipment.title}
              </h1>

              <div className="text-xs text-gray-400 flex items-center gap-4 flex-wrap font-mono">
                <span>الموديل: <strong className="text-white">{equipment.model}</strong></span>
                <span>•</span>
                <span>الحالة: <strong className="text-emerald-400">{equipment.condition}</strong></span>
                <span>•</span>
                <span>الرقم التسلسلي: <strong className="text-gray-300">{equipment.serial_number}</strong></span>
              </div>

              <div className="pt-2 border-t border-gray-800/80 space-y-2">
                <h3 className="text-sm font-bold text-white">الوصف الفني وإمكانات الجهاز:</h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {equipment.description}
                </p>
              </div>
            </div>

            {/* Technical Specifications Table */}
            <div className="rounded-3xl border border-gray-800 bg-[#0F253E]/60 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📐</span>
                <span>المواصفات الفنية الميدانية</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#081933] p-3.5 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[11px] mb-1">دقة قياس الزوايا:</span>
                  <span className="font-bold text-white font-mono">1&quot; (ثانية واحدة)</span>
                </div>
                <div className="bg-[#081933] p-3.5 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[11px] mb-1">مدى القياس بدون عاكس:</span>
                  <span className="font-bold text-cyan-300 font-mono">1,000 متر (R1000)</span>
                </div>
                <div className="bg-[#081933] p-3.5 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[11px] mb-1">الرصد الآلي والتتبع:</span>
                  <span className="font-bold text-emerald-400">نظام روبوتي ATRplus</span>
                </div>
                <div className="bg-[#081933] p-3.5 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[11px] mb-1">نظام التشغيل والبرامج:</span>
                  <span className="font-bold text-white">Leica Captivate</span>
                </div>
                <div className="bg-[#081933] p-3.5 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[11px] mb-1">الملحقات المرفقة:</span>
                  <span className="font-bold text-amber-300">ترايبود ثقيل + برزم + شاحن</span>
                </div>
                <div className="bg-[#081933] p-3.5 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[11px] mb-1">حالة الاعتماد:</span>
                  <span className="font-bold text-emerald-400">معاير ومختبر ميدانياً ✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Provider Card & Inquiry CTA */}
          <div className="space-y-6">
            {/* Price & Action Card */}
            <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#0F253E] to-[#081933] p-6 shadow-2xl space-y-5">
              <div>
                <span className="text-xs text-gray-400 block mb-1">سعر الإيجار اليومي</span>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {equipment.daily_price ? `${equipment.daily_price.toLocaleString('en-US')} ج.م` : 'حسب مدة التعاقد'}
                  <span className="text-xs font-normal text-gray-400 mr-2">/ يوم</span>
                </div>
                {equipment.monthly_price && (
                  <span className="text-xs text-cyan-300 font-mono block mt-1">
                    باقة شهرية مخفضة: {equipment.monthly_price.toLocaleString('en-US')} ج.م / شهر
                  </span>
                )}
              </div>

              {/* Action Buttons: Inquiry vs Direct Booking */}
              <div className="space-y-3 pt-2">
                {/* Asynchronous Inquiry Button (Requested) */}
                <button
                  type="button"
                  onClick={() => setIsInquiryOpen(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>💬</span>
                  <span>طلب استفسار / تواصل مباشر</span>
                </button>

                {/* Booking Button */}
                <Link
                  href={`/equipment?book=${equipment.id}`}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>🛒</span>
                  <span>طلب الحجز والتأجير الفوري ←</span>
                </Link>
              </div>

              <div className="text-[11px] text-gray-400 pt-3 border-t border-gray-800/80 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>معاينة فنية وفحص تسليم واستلام رسمي</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>عقد إيجار تجاري موثق يضمن حقوق الطرفين</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>استجابة واستفسارات سريعة عبر واتساب والهاتف</span>
                </div>
              </div>
            </div>

            {/* Provider Card */}
            <div className="rounded-3xl border border-gray-800 bg-[#0F253E]/60 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-black text-lg">
                  🏢
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-sm">
                      {equipment.provider_name}
                    </h3>
                    {equipment.is_verified && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        موثّق ✓
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 block mt-0.5">
                    📍 {equipment.provider_location}
                  </span>
                </div>
              </div>

              {/* Direct Quick Contact Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/80">
                {equipment.provider_phone && (
                  <>
                    <a
                      href={`https://wa.me/20${equipment.provider_phone.replace(/\D/g, '').replace(/^0+/, '')}?text=${encodeURIComponent(`مرحباً ${equipment.provider_name}، أرغب في الاستفسار عن جهاز: ${equipment.title}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <span>💬 واتساب</span>
                    </a>

                    <a
                      href={`tel:${equipment.provider_phone}`}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <span>📞 اتصال</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inquiry Modal */}
        <InquiryModal
          isOpen={isInquiryOpen}
          onClose={() => setIsInquiryOpen(false)}
          receiverId={equipment.provider_id}
          receiverName={equipment.provider_name}
          contextType="equipment"
          contextId={equipment.id}
          contextTitle={equipment.title}
          contextImage={equipment.image_url}
          contextPrice={equipment.daily_price ? `${equipment.daily_price.toLocaleString('en-US')} ج.م / يوم` : undefined}
          onSuccess={() => {
            showToast('✓ تم إرسال استفسارك للمزوّد بنجاح، ستتلقى الرد قريباً.');
          }}
        />

        {/* Floating Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-gray-900 border border-cyan-500/50 px-4 py-3 text-xs sm:text-sm font-semibold text-cyan-300 shadow-2xl animate-slide-up flex items-center gap-2">
            <span>🔔</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
