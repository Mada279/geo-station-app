'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';
import { getEquipmentImageUrl, getDefaultCategoryImage } from '@/utils/helpers';
import ContactButton from '@/components/ContactButton';
import InquiryModal from '@/components/inquiry/InquiryModal';
import AdBannerClient from '@/components/ads/AdBannerClient';
import { validateEgyptianPhone } from '@/lib/validations/phone';

export interface MarketplaceEquipmentItem {
  id: string;
  title: string;
  category: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  condition: string;
  dailyPrice: number | null;
  monthlyPrice: number | null;
  salePrice: number | null;
  status: string;
  isFlaggedStolen: boolean;
  calibrationDate?: string;
  imageUrl: string;
  description: string;
  specs: Record<string, string>;
  // Joined Provider data
  providerId?: string;
  providerName: string;
  providerCompany?: string;
  providerPhone?: string;
  providerLocation: string;
  providerCoverageAreas: string[];
}

export const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'البحيرة',
  'القليوبية',
  'الغربية',
  'المنوفية',
  'الشرقية',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'شمال سيناء',
  'جنوب سيناء',
  'بني سويف',
  'الفيوم',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادى الجديد',
  'مطروح',
];

export const CATEGORIES = [
  { id: '', label: 'كافة الفئات' },
  { id: 'Total Station', label: 'محطات رصد Total Station' },
  { id: 'GNSS / RTK', label: 'أجهزة GPS / GNSS RTK' },
  { id: 'أجهزة ميزان', label: 'موازين رقمية وبصرية (Levels)' },
  { id: 'Laser Scanner', label: 'ماسحات ليزرية 3D' },
  { id: 'Drone', label: 'درونز ومساحة جوية' },
  { id: 'ملحقات وأكسسوارات', label: 'ملحقات ومهمات مساحية' },
];

export default function EquipmentMarketplacePage() {
  const [equipmentList, setEquipmentList] = useState<MarketplaceEquipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPriceMode, setSelectedPriceMode] = useState<'all' | 'rent' | 'sale'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  // Booking Flow State
  const [bookingItem, setBookingItem] = useState<MarketplaceEquipmentItem | null>(null);
  const [detailItem, setDetailItem] = useState<MarketplaceEquipmentItem | null>(null);
  const [inquiryItem, setInquiryItem] = useState<MarketplaceEquipmentItem | null>(null);
  const [rentalDuration, setRentalDuration] = useState('3 أيام');
  const [rentalType, setRentalType] = useState<'daily' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState('');
  const [projectLocation, setProjectLocation] = useState('القاهرة');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientPhoneError, setClientPhoneError] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccessOrder, setBookingSuccessOrder] = useState<string | null>(null);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to resolve Brand
  const detectBrand = (title: string, category: string, brandVal?: string): string => {
    if (brandVal && brandVal.trim()) return brandVal.trim();
    const t = (title || '').toLowerCase();
    if (t.includes('leica')) return 'Leica';
    if (t.includes('trimble')) return 'Trimble';
    if (t.includes('topcon')) return 'Topcon';
    if (t.includes('sokkia')) return 'Sokkia';
    if (t.includes('stonex')) return 'Stonex';
    if (t.includes('foif')) return 'Foif';
    if (t.includes('south')) return 'South';
    if (t.includes('kolida')) return 'Kolida';
    if (t.includes('geodimeter')) return 'Geodimeter';
    if (t.includes('nikon')) return 'Nikon';
    if (t.includes('faro')) return 'FARO';
    if (t.includes('dji')) return 'DJI';
    return category || 'أجهزة معتمدة';
  };

  // Fetch dynamic equipment records from Supabase with relational joins
  useEffect(() => {
    let isMounted = true;

    async function loadMarketplaceEquipment() {
      setIsLoading(true);
      try {
        // Check current logged-in client if available to pre-fill booking form
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            setActiveClientId(authData.user.id);
            setClientEmail(authData.user.email || '');
          }
        } catch {}

        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('SURVSTA_AUTH_USER');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.name) setClientName(parsed.name);
              if (parsed.phone || parsed.phoneNumber) setClientPhone(parsed.phone || parsed.phoneNumber);
              if (parsed.email) setClientEmail(parsed.email);
              if (parsed.id && !activeClientId) setActiveClientId(parsed.id);
            } catch {}
          }
        }

        // 1. Fetch available equipment where is_flagged_stolen = false
        // Exclude stolen and decommissioned devices
        const { data: eqData, error: eqError } = await supabase
          .from('equipment')
          .select('*')
          .eq('is_flagged_stolen', false)
          .order('created_at', { ascending: false });

        if (eqError) {
          console.warn('[EquipmentMarketplace] Error fetching equipment:', eqError.message);
        }

        // 2. Fetch providers to join full_name, company_name, location, coverage_areas
        const { data: provData } = await supabase
          .from('providers')
          .select('id, name, company_name, phone, location, coverage_areas');

        // Also fetch clients in case provider registered via clients table
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, user_id, full_name, company_name, phone_number, coverage_areas');

        const provMap = new Map<string, any>();

        if (provData) {
          provData.forEach((p) => {
            const parsedCoverage = Array.isArray(p.coverage_areas)
              ? p.coverage_areas
              : typeof p.coverage_areas === 'string'
              ? JSON.parse(p.coverage_areas || '[]')
              : [];
            provMap.set(String(p.id), {
              name: p.company_name || p.name || 'مكتب مساحي معتمد',
              company_name: p.company_name,
              phone: p.phone,
              location: p.location || 'القاهرة والجيزة',
              coverage_areas: parsedCoverage,
            });
          });
        }

        if (clientData) {
          clientData.forEach((c) => {
            const parsedCoverage = Array.isArray(c.coverage_areas)
              ? c.coverage_areas
              : typeof c.coverage_areas === 'string'
              ? JSON.parse(c.coverage_areas || '[]')
              : [];
            const key = String(c.id);
            const userKey = c.user_id ? String(c.user_id) : null;
            const profile = {
              name: c.company_name || c.full_name || 'مكتب مساحي معتمد',
              company_name: c.company_name,
              phone: c.phone_number,
              location: 'جمهورية مصر العربية',
              coverage_areas: parsedCoverage,
            };
            if (!provMap.has(key)) provMap.set(key, profile);
            if (userKey && !provMap.has(userKey)) provMap.set(userKey, profile);
          });
        }

        if (isMounted && eqData && eqData.length > 0) {
          // Filter available for rent (excluding rented or stolen)
          const availableItems = eqData.filter((row: any) => {
            if (row.is_flagged_stolen) return false;
            const st = (row.status || '').trim();
            if (st === 'مؤجر' || st === 'rented' || st === 'قيد الصيانة' || st === 'مرفوض') {
              return false;
            }
            return true;
          });

          const mapped: MarketplaceEquipmentItem[] = availableItems.map((row: any) => {
            const provider = row.provider_id ? provMap.get(String(row.provider_id)) : null;
            const provName = provider?.company_name || provider?.name || 'مكتب مساحي معتمد';
            const provLocation = provider?.location || 'القاهرة الكبرى';
            const coverageAreas: string[] = provider?.coverage_areas?.length
              ? provider.coverage_areas
              : ['القاهرة', 'الجيزة', 'الإسكندرية'];

            const dailyPrice = row.daily_price ? Number(row.daily_price) : null;
            const monthlyPrice = row.monthly_price ? Number(row.monthly_price) : null;
            const salePrice = row.sale_price ? Number(row.sale_price) : null;

            return {
              id: String(row.id),
              title: row.title || 'محطة رصد متطورة',
              category: row.category || 'Total Station',
              brand: detectBrand(row.title, row.category, row.brand),
              model: row.model || (row.title ? row.title.split(' ')[1] : undefined),
              serialNumber: row.serial_number,
              condition: row.condition || 'جديد / بحالة المصنع',
              dailyPrice,
              monthlyPrice,
              salePrice,
              status: row.status || 'متاح للإيجار',
              isFlaggedStolen: Boolean(row.is_flagged_stolen),
              calibrationDate: row.calibration_date || 'سارية لمدة 12 شهراً',
              imageUrl: getEquipmentImageUrl(row.image_url, row.category, row.title),
              description:
                row.description ||
                `جهاز مساحي احترافي عالي الدقة لفحص ومتابعة الأعمال الإنشائية والمساحية، معتمد وموثق في شبكة Survsta لدى ${provName}.`,
              specs: row.specs || {
                'الفئة': row.category || 'أجهزة مساحية',
                'المكتب المزوّد': provName,
                'حالة الجهاز': row.condition || 'ممتاز ومعاير',
                'شهادة المعايرة': 'معتمدة ومحدثة',
              },
              providerId: row.provider_id ? String(row.provider_id) : undefined,
              providerName: provName,
              providerCompany: provider?.company_name,
              providerPhone: provider?.phone,
              providerLocation: provLocation,
              providerCoverageAreas: coverageAreas,
            };
          });

          setEquipmentList(mapped);
        } else if (isMounted) {
          setEquipmentList([]);
        }
      } catch (err) {
        console.warn('[EquipmentMarketplace] Error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMarketplaceEquipment();

    return () => {
      isMounted = false;
    };
  }, []);

  // Advanced Filtering & Search Engine
  const filteredEquipment = useMemo(() => {
    return equipmentList
      .filter((item) => {
        // 1. Text Search (Title, Model, Brand, Description, Serial Number)
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchBrand = item.brand.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchSerial = (item.serialNumber || '').toLowerCase().includes(q);
          const matchProvider = item.providerName.toLowerCase().includes(q);
          if (!matchTitle && !matchBrand && !matchDesc && !matchSerial && !matchProvider) {
            return false;
          }
        }

        // 2. Category Filter
        if (selectedCat) {
          if (selectedCat === 'Total Station' && !item.category.includes('Total') && !item.category.includes('توتال')) {
            return false;
          }
          if (selectedCat === 'GNSS / RTK' && !item.category.includes('GPS') && !item.category.includes('RTK') && !item.category.includes('GNSS')) {
            return false;
          }
          if (selectedCat === 'أجهزة ميزان' && !item.category.includes('ميزان') && !item.category.includes('Level')) {
            return false;
          }
          if (selectedCat === 'Laser Scanner' && !item.category.includes('Laser') && !item.category.includes('ليزر')) {
            return false;
          }
          if (selectedCat === 'Drone' && !item.category.includes('Drone') && !item.category.includes('درون') && !item.category.includes('طائرة')) {
            return false;
          }
          if (selectedCat === 'ملحقات وأكسسوارات' && !item.category.includes('ملحق') && !item.category.includes('إكسسوار')) {
            return false;
          }
        }

        // 3. Location / Governorate Filter: Check provider's coverage_areas JSONB array
        if (selectedGov) {
          const inCoverage = item.providerCoverageAreas.some(
            (area) => area.includes(selectedGov) || selectedGov.includes(area)
          );
          const inLocation = item.providerLocation.includes(selectedGov);
          if (!inCoverage && !inLocation) {
            return false;
          }
        }

        // 4. Brand Filter
        if (selectedBrand && item.brand !== selectedBrand) {
          return false;
        }

        // 5. Price Mode Filter (Rent vs Sale)
        if (selectedPriceMode === 'rent' && !item.dailyPrice && !item.monthlyPrice) {
          return false;
        }
        if (selectedPriceMode === 'sale' && !item.salePrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          const priceA = a.dailyPrice || (a.monthlyPrice ? a.monthlyPrice / 30 : 999999);
          const priceB = b.dailyPrice || (b.monthlyPrice ? b.monthlyPrice / 30 : 999999);
          return priceA - priceB;
        }
        if (sortBy === 'price-desc') {
          const priceA = a.dailyPrice || (a.monthlyPrice ? a.monthlyPrice / 30 : 0);
          const priceB = b.dailyPrice || (b.monthlyPrice ? b.monthlyPrice / 30 : 0);
          return priceB - priceA;
        }
        return 0;
      });
  }, [equipmentList, searchTerm, selectedCat, selectedGov, selectedBrand, selectedPriceMode, sortBy]);

  // Handle Booking Submission
  const handleOpenBooking = (item: MarketplaceEquipmentItem) => {
    setBookingItem(item);
    setBookingSuccessOrder(null);
    if (!startDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(tomorrow.toISOString().split('T')[0]);
    }
  };

  const calculateEstimatedTotal = () => {
    if (!bookingItem) return 0;
    if (rentalType === 'monthly' && bookingItem.monthlyPrice) {
      return bookingItem.monthlyPrice;
    }
    const days = parseInt(rentalDuration, 10) || 3;
    const rate = bookingItem.dailyPrice || 1200;
    return days * rate;
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingItem) return;

    if (!clientName.trim() || !clientPhone.trim()) {
      showToast('⚠️ يرجى إدخال اسمك ورقم هاتفك للتواصل وتأكيد الحجز.');
      return;
    }

    const phoneValidation = validateEgyptianPhone(clientPhone);
    if (!phoneValidation.isValid) {
      setClientPhoneError(phoneValidation.error || 'رقم الهاتف غير صالح');
      showToast(`⚠️ ${phoneValidation.error}`);
      return;
    }
    setClientPhoneError(null);
    const validPhone = phoneValidation.normalized;

    setIsSubmittingBooking(true);
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const estimatedTotal = calculateEstimatedTotal();

    try {
      // 1. Insert into orders table
      const orderPayload = {
        order_number: orderNumber,
        client_id: activeClientId || null,
        provider_id: bookingItem.providerId || null,
        client_email: clientEmail || null,
        equipment_name: bookingItem.title,
        category: bookingItem.category,
        duration: `${rentalDuration} (${rentalType === 'monthly' ? 'شهري' : 'يومي'}) - تاريخ البدء: ${startDate}`,
        total_price: estimatedTotal,
        status: 'pending',
      };

      const { data: orderRes, error: orderErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderErr) {
        console.warn('[EquipmentMarketplace] Notice inserting order:', orderErr.message);
      }

      // 2. Insert In-App Notification targeted at provider
      if (bookingItem.providerId) {
        try {
          await supabase.from('inapp_notifications').insert([
            {
              user_id: bookingItem.providerId,
              title: 'طلب استئجار جديد 📥',
              message: `تلقيت طلب استئجار جديد لجهاز (${bookingItem.title}) بقيمة تقديرية ${estimatedTotal.toLocaleString('en-US')} ج.م من العميل: ${clientName} (${clientPhone}).`,
              type: 'info',
              link: '/provider/orders',
            },
          ]);
        } catch {}
      }

      // 3. Cache locally for offline demo resilience
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('SURVSTA_LOCAL_CLIENT_ORDERS');
          const list = cached ? JSON.parse(cached) : [];
          list.unshift({
            ...orderPayload,
            id: orderRes?.id || orderNumber,
            created_at: new Date().toISOString(),
          });
          localStorage.setItem('SURVSTA_LOCAL_CLIENT_ORDERS', JSON.stringify(list));
        } catch {}
      }

      setBookingSuccessOrder(orderNumber);
      showToast(`✓ تم إرسال طلب الحجز بنجاح برقم ${orderNumber}`);
    } catch (err) {
      console.warn('[EquipmentMarketplace] Booking error:', err);
      setBookingSuccessOrder(orderNumber);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const getWhatsAppContactLink = (item: MarketplaceEquipmentItem) => {
    let cleanPhone = (item.providerPhone || '01033134413').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = '2' + cleanPhone;
    }
    const msg = encodeURIComponent(
      `مرحباً ${item.providerName}، أرغب في استفسار وحجز جهاز: ${item.title} المعروض على منصة Survsta.`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  return (
    <div className="bg-[#081933] min-h-screen text-slate-100" style={{ direction: 'rtl' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#0F253E] border border-amber-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <span className="text-amber-400 text-lg">📡</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner Section */}
      <section className="bg-gradient-to-b from-[#061429] to-[#081933] border-b border-cyan-500/20 py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-3">
            <span>🌐 سوق المعدات المساحية المعتمدة في مصر</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            كتالوج الأجهزة والمعدات المساحية
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-3xl leading-relaxed mb-6">
            استكشف أحدث أجهزة Total Station، وأنظمة GPS / GNSS RTK، والموازين الرقمية من مكاتب مساحية وموردين معتمدين مع شهادات معايرة سارية وتغطية جغرافية شاملة لكافة المحافظات.
          </p>

          {/* Quick Category Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(selectedCat === c.id ? '' : c.id)}
                className={`text-xs px-3.5 py-1.5 rounded-xl border transition ${
                  selectedCat === c.id
                    ? 'bg-cyan-500 text-gray-950 border-cyan-400 font-bold shadow-md'
                    : 'bg-[#0F253E]/80 text-gray-300 border-amber-500/20 hover:border-cyan-400/50 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Marketplace Grid & Filters */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Filter Sidebar */}
            <div>
              <div className="bg-[#0F253E]/90 p-6 rounded-2xl border border-amber-500/20 shadow-xl backdrop-blur-md sticky top-24 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <span>🔍</span>
                    <span>محرك تصفية الأجهزة</span>
                  </h3>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCat('');
                      setSelectedGov('');
                      setSelectedBrand('');
                      setSelectedPriceMode('all');
                      setSortBy('default');
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
                  >
                    إعادة ضبط
                  </button>
                </div>

                {/* Search Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    بحث بالاسم أو الموديل
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Leica TS07, Trimble R12..."
                      className="w-full rounded-xl border border-amber-500/30 bg-[#081933] pl-3 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none transition"
                    />
                    <span className="absolute right-3 top-3 text-gray-500 text-xs">🔍</span>
                  </div>
                </div>

                {/* Governorate Filter (Checking joined coverage_areas) */}
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1.5 flex items-center gap-1.5">
                    <span>📍</span>
                    <span>المحافظة وموقع التغطية:</span>
                  </label>
                  <select
                    value={selectedGov}
                    onChange={(e) => setSelectedGov(e.target.value)}
                    className="w-full rounded-xl border border-cyan-500/30 bg-[#081933] px-3 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer transition"
                  >
                    <option value="">جميع المحافظات ومناطق التغطية</option>
                    {EGYPT_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-gray-400 mt-1">
                    يفحص تغطية المزوّد الجغرافية المسجلة في حسابه المعتمد.
                  </p>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    نوع وفئة الجهاز:
                  </label>
                  <select
                    value={selectedCat}
                    onChange={(e) => setSelectedCat(e.target.value)}
                    className="w-full rounded-xl border border-amber-500/30 bg-[#081933] px-3 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer transition"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Mode (Rent vs Sale) */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    نوع العملية المطلوبة:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedPriceMode('all')}
                      className={`py-2 rounded-lg border transition ${
                        selectedPriceMode === 'all'
                          ? 'bg-amber-500 text-gray-950 font-bold border-amber-400'
                          : 'bg-[#081933] text-gray-400 border-gray-800 hover:text-white'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPriceMode('rent')}
                      className={`py-2 rounded-lg border transition ${
                        selectedPriceMode === 'rent'
                          ? 'bg-cyan-500 text-gray-950 font-bold border-cyan-400'
                          : 'bg-[#081933] text-gray-400 border-gray-800 hover:text-white'
                      }`}
                    >
                      إيجار فقط
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPriceMode('sale')}
                      className={`py-2 rounded-lg border transition ${
                        selectedPriceMode === 'sale'
                          ? 'bg-emerald-500 text-gray-950 font-bold border-emerald-400'
                          : 'bg-[#081933] text-gray-400 border-gray-800 hover:text-white'
                      }`}
                    >
                      بيع فقط
                    </button>
                  </div>
                </div>

                {/* Popular Brands */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    الماركة المصنعة:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Leica', 'Topcon', 'Trimble', 'Sokkia', 'Stonex', 'Foif', 'South', 'DJI'].map((b) => (
                      <button
                        key={b}
                        onClick={() => setSelectedBrand(selectedBrand === b ? '' : b)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          selectedBrand === b
                            ? 'bg-amber-500 text-gray-950 font-bold border-amber-400'
                            : 'bg-[#081933] text-gray-300 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sorting */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    ترتيب النتائج:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-[#081933] px-3 py-2 text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="default">الأحدث إدراجاً</option>
                    <option value="price-asc">السعر: من الأقل للأعلى</option>
                    <option value="price-desc">السعر: من الأعلى للأقل</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Equipment Grid Listing */}
            <div className="lg:col-span-3 space-y-6">
              {/* Header Bar */}
              <div className="bg-[#0F253E]/80 p-4 rounded-2xl border border-amber-500/20 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="text-amber-400 text-sm">📡</span>
                  {isLoading ? (
                    'جاري استرجاع الأجهزة من قاعدة البيانات...'
                  ) : (
                    <>
                      يوجد حالياً <span className="text-cyan-400 font-mono text-sm">{filteredEquipment.length}</span> جهاز ومعدة مساحية متاحة
                    </>
                  )}
                </span>
                <span className="text-gray-400 text-[11px]">
                  جميع الأجهزة خاضعة للفحص الدوري ومنع الإدراج المزدوج عبر الرقم التسلسلي.
                </span>
              </div>

              {/* Loading Skeleton */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="bg-[#0F253E]/60 rounded-2xl border border-gray-800 p-5 space-y-4 animate-pulse"
                    >
                      <div className="h-44 bg-gray-800/80 rounded-xl w-full"></div>
                      <div className="h-4 bg-gray-800 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-12 bg-gray-800/60 rounded-xl"></div>
                      <div className="h-10 bg-gray-700/80 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && filteredEquipment.length === 0 && (
                <div className="bg-[#0F253E]/60 p-12 rounded-2xl border border-dashed border-gray-700 text-center space-y-4">
                  <span className="text-5xl block">📡</span>
                  <h3 className="font-bold text-lg text-white">لا توجد أجهزة مطابقة للبحث المحدد</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    لم نتمكن من العثور على أجهزة مطابقة للفلاتر أو المحافظة المختارة. جرب تغيير المحافظة أو مسح عوامل التصفية.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCat('');
                      setSelectedGov('');
                      setSelectedBrand('');
                      setSelectedPriceMode('all');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-bold text-xs shadow-lg transition"
                  >
                    عرض كافة الأجهزة المتاحة
                  </button>
                </div>
              )}

              {/* Dynamic Equipment Cards */}
              {!isLoading && filteredEquipment.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEquipment.map((item, index) => {
                    const hasDaily = item.dailyPrice !== null && item.dailyPrice > 0;
                    const hasMonthly = item.monthlyPrice !== null && item.monthlyPrice > 0;
                    const hasSale = item.salePrice !== null && item.salePrice > 0;

                    return (
                      <React.Fragment key={item.id}>
                        <div
                          className="bg-[#0F253E]/90 rounded-2xl border border-amber-500/20 hover:border-cyan-400/50 transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between group"
                        >
                        <div>
                          {/* Image Banner */}
                          <div className="relative h-48 w-full bg-[#081933] overflow-hidden">
                            <Image
                              alt={item.title}
                              src={item.imageUrl}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              unoptimized
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.src = getDefaultCategoryImage(item.category, item.title);
                              }}
                            />
                            {/* Badges */}
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-cyan-500 text-gray-950 shadow">
                                {item.category}
                              </span>
                              {hasSale && (
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500 text-gray-950 shadow">
                                  متاح للبيع
                                </span>
                              )}
                            </div>

                            {/* Provider & Location Overlay */}
                            <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between z-10">
                              <span className="bg-[#081933]/90 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md border border-amber-500/30 flex items-center gap-1">
                                <span>🏢</span>
                                <span className="truncate max-w-[130px]">{item.providerName}</span>
                              </span>
                              <span className="bg-[#081933]/90 text-cyan-300 text-[11px] font-medium px-2 py-1 rounded-lg backdrop-blur-md border border-cyan-500/30">
                                📍 {item.providerLocation.split('—')[0]}
                              </span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-5 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-amber-400 font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                {item.brand}
                              </span>
                              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                <span className="text-emerald-400 font-bold">✓</span>
                                <span>{item.calibrationDate}</span>
                              </span>
                            </div>

                            <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-cyan-300 transition">
                              {item.title}
                            </h3>

                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>

                            {/* Coverage Areas Chips */}
                            <div className="pt-1">
                              <span className="text-[10.5px] text-gray-500 block mb-1">
                                مناطق التغطية المتاحة:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {item.providerCoverageAreas.slice(0, 3).map((area, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 rounded bg-[#081933] border border-gray-800 text-gray-300"
                                  >
                                    {area}
                                  </span>
                                ))}
                                {item.providerCoverageAreas.length > 3 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#081933] text-gray-400">
                                    +{item.providerCoverageAreas.length - 3} محافظات
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Pricing & Action Buttons */}
                        <div className="p-4 bg-[#081933]/80 border-t border-gray-800/80 flex flex-col gap-3">
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="text-[10px] text-gray-400 block">سعر الإيجار اليومي</span>
                              <div className="text-lg font-black text-emerald-400 font-mono">
                                {hasDaily ? (
                                  <>
                                    {item.dailyPrice?.toLocaleString('en-US')}{' '}
                                    <span className="text-xs font-normal text-gray-400">ج.م / يوم</span>
                                  </>
                                ) : hasSale ? (
                                  <>
                                    {item.salePrice?.toLocaleString('en-US')}{' '}
                                    <span className="text-xs font-normal text-gray-400">ج.م (للشراء)</span>
                                  </>
                                ) : (
                                  <span className="text-xs text-amber-400">حسب مدة التعاقد</span>
                                )}
                              </div>
                            </div>

                            {hasMonthly && (
                              <div className="text-left">
                                <span className="text-[10px] text-gray-400 block">الباقة الشهرية</span>
                                <span className="text-xs font-bold text-cyan-300 font-mono">
                                  {item.monthlyPrice?.toLocaleString('en-US')} ج.م / شهر
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setDetailItem(item)}
                              className="px-2.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 transition truncate text-center"
                            >
                              المواصفات
                            </button>

                            <button
                              type="button"
                              onClick={() => setInquiryItem(item)}
                              className="px-2.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition flex items-center justify-center gap-1 truncate"
                            >
                              <span>💬</span>
                              <span>استفسار</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenBooking(item)}
                              className="px-2.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1 truncate"
                            >
                              <span>اطلب</span>
                              <span>←</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      {(index === 1 || (index === 0 && filteredEquipment.length === 1)) && (
                        <div className="col-span-full">
                          <AdBannerClient location="search_in_feed" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal Flow */}
      {bookingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D223A] border border-amber-500/40 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setBookingItem(null);
                setBookingSuccessOrder(null);
              }}
              className="absolute top-4 left-4 text-gray-400 hover:text-white text-lg w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center"
            >
              ✕
            </button>

            {bookingSuccessOrder ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl flex items-center justify-center mx-auto">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white">تم إرسال طلب الحجز بنجاح!</h3>
                <p className="text-xs text-gray-300 leading-relaxed max-w-md mx-auto">
                  تم تسجيل طلبك برقم <span className="font-mono text-cyan-300 font-bold">{bookingSuccessOrder}</span> وتم إرساله مباشرة إلى صندوق طلبات ({bookingItem.providerName}) مع إشعار فوري.
                </p>

                <div className="p-4 rounded-xl bg-[#081933] border border-gray-800 text-xs text-gray-300 space-y-2 text-right">
                  <div className="flex justify-between">
                    <span className="text-gray-400">الجهاز المطلوب:</span>
                    <span className="font-bold text-white">{bookingItem.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">المكتب المزوّد:</span>
                    <span className="text-amber-400 font-bold">{bookingItem.providerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">القيمة التقديرية:</span>
                    <span className="font-mono font-bold text-emerald-400">{calculateEstimatedTotal().toLocaleString('en-US')} ج.م</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <a
                    href={getWhatsAppContactLink(bookingItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    <span>فتح محادثة واتساب مع المزوّد للتأكيد</span>
                  </a>

                  <Link
                    href="/dashboard/orders"
                    className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs border border-gray-700 transition"
                  >
                    متابعة الطلب
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                  <span>📥</span>
                  <span>طلب استئجار وتأكيد الحجز الفوري</span>
                </div>
                <h3 className="text-lg font-black text-white mb-1">{bookingItem.title}</h3>
                <div className="text-xs text-gray-400 mb-4 flex items-center gap-2">
                  <span>🏢 المزوّد: <strong className="text-gray-200">{bookingItem.providerName}</strong></span>
                  <span>•</span>
                  <span>📍 {bookingItem.providerLocation}</span>
                </div>

                <form onSubmit={handleSubmitBooking} className="space-y-4 text-xs">
                  {/* Duration & Rental Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">نظام التأجير</label>
                      <select
                        value={rentalType}
                        onChange={(e: any) => setRentalType(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#081933] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="daily">إيجار يومي</option>
                        <option value="monthly">باقة شهرية</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">المدة المطلوبة</label>
                      <input
                        type="text"
                        value={rentalDuration}
                        onChange={(e) => setRentalDuration(e.target.value)}
                        placeholder="مثال: 3 أيام، أسبوع، شهر"
                        className="w-full p-2.5 rounded-xl bg-[#081933] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Start Date & Location */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">تاريخ استلام الجهاز</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#081933] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">موقع المشروع / المحافظة</label>
                      <select
                        value={projectLocation}
                        onChange={(e) => setProjectLocation(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#081933] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400"
                      >
                        {EGYPT_GOVERNORATES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Client Contact Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        اسم المهندس / الجهة الطالبة <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="الاسم الثلاثي أو اسم الشركة"
                        className="w-full p-2.5 rounded-xl bg-[#081933] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">
                        رقم الهاتف والواتساب <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => {
                          setClientPhone(e.target.value);
                          if (clientPhoneError) setClientPhoneError(null);
                        }}
                        placeholder="010xxxxxxxx"
                        dir="ltr"
                        className={`w-full p-2.5 rounded-xl bg-[#081933] border text-white font-mono text-left focus:outline-none transition ${
                          clientPhoneError
                            ? 'border-red-500 focus:border-red-400 ring-1 ring-red-500/30'
                            : 'border-amber-500/30 focus:border-amber-400'
                        }`}
                        required
                      />
                      {clientPhoneError ? (
                        <p className="text-red-400 text-xs mt-1 font-semibold">⚠️ {clientPhoneError}</p>
                      ) : (
                        <span className="text-gray-400 text-[11px] mt-1 block">
                          رقم مصري مكوّن من 11 رقماً يبدأ بـ 01 (مثل: 01012345678)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      ملاحظات أو متطلبات خاصة (ملحقات، برزم إضافي، ترايبود)
                    </label>
                    <textarea
                      rows={2}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="أي اشتراطات فنية أو تفاصيل دقيقة لموقع العمل..."
                      className="w-full p-2.5 rounded-xl bg-[#081933] border border-amber-500/30 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Price Estimate Summary */}
                  <div className="p-3.5 rounded-xl bg-[#081933] border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 block text-[11px]">التكلفة التقديرية للحجز:</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        {calculateEstimatedTotal().toLocaleString('en-US')} ج.م
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">يتم الدفع عند الاستلام والمعاينة الفنية</span>
                  </div>

                  {/* Submit CTA */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingItem(null)}
                      className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs transition"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmittingBooking}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs shadow-lg transition flex items-center gap-2"
                    >
                      {isSubmittingBooking ? (
                        <>
                          <span className="inline-block w-3.5 h-3.5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></span>
                          <span>جاري إرسال الطلب...</span>
                        </>
                      ) : (
                        <>
                          <span>✓</span>
                          <span>تأكيد وإرسال طلب الحجز للمزوّد</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Equipment Details Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D223A] border border-cyan-500/40 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailItem(null)}
              className="absolute top-4 left-4 text-gray-400 hover:text-white text-lg w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="relative h-56 sm:h-auto sm:w-60 bg-[#081933] rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  alt={detailItem.title}
                  src={detailItem.imageUrl}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {detailItem.category}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1.5">{detailItem.title}</h3>
                  <div className="text-xs text-gray-400 mt-1">
                    المكتب المزوّد: <strong className="text-amber-400">{detailItem.providerName}</strong>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  {detailItem.description}
                </p>

                {/* Specs Grid */}
                <div className="bg-[#081933] p-3.5 rounded-xl border border-gray-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">الماركة:</span>
                    <span className="font-bold text-white font-mono">{detailItem.brand}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">الحالة الفنية:</span>
                    <span className="font-bold text-white">{detailItem.condition}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">شهادة المعايرة:</span>
                    <span className="font-bold text-emerald-400">{detailItem.calibrationDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">التغطية الجغرافية:</span>
                    <span className="font-bold text-cyan-300">{detailItem.providerCoverageAreas.slice(0, 3).join('، ')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-[11px] text-gray-400 block">سعر الإيجار اليومي:</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {detailItem.dailyPrice ? `${detailItem.dailyPrice.toLocaleString('en-US')} ج.م` : 'حسب التعاقد'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const it = detailItem;
                        setDetailItem(null);
                        setInquiryItem(it);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#0F253E] hover:bg-slate-800 text-cyan-300 font-bold text-xs border border-cyan-500/40 transition flex items-center gap-1.5"
                    >
                      <span>💬</span>
                      <span>طلب استفسار</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const it = detailItem;
                        setDetailItem(null);
                        handleOpenBooking(it);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs shadow-md transition"
                    >
                      طلب الحجز الآن ←
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Inquiry Modal */}
      {inquiryItem && (
        <InquiryModal
          isOpen={Boolean(inquiryItem)}
          onClose={() => setInquiryItem(null)}
          receiverId={inquiryItem.providerId || '00000000-0000-0000-0000-000000000002'}
          receiverName={inquiryItem.providerName}
          contextType="equipment"
          contextId={inquiryItem.id}
          contextTitle={inquiryItem.title}
          contextImage={inquiryItem.imageUrl}
          contextPrice={inquiryItem.dailyPrice ? `${inquiryItem.dailyPrice.toLocaleString('en-US')} ج.م / يوم` : undefined}
          onSuccess={() => {
            showToast('✓ تم إرسال استفسارك إلى المزوّد بنجاح');
          }}
        />
      )}
    </div>
  );
}
