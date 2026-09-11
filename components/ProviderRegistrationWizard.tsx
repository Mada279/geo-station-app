'use client';

import React, { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';

interface FormData {
  // Step 1: Basic Info
  name: string;
  email: string;
  phone: string;
  password: string;
  // Step 2: Business Details
  organization: string;
  governorate: string;
  location: string;
  workingHours: string;
  // Step 3: Services & Media
  services: string[];
  equipmentPhotos: string[];
}

const EGYPTIAN_GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الغربية',
  'المنوفية', 'الشرقية', 'الدقهلية', 'البحيرة', 'كفر الشيخ',
  'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'شمال سيناء',
  'جنوب سيناء', 'بني سويف', 'الفيوم', 'المنيا', 'أسيوط',
  'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر',
  'الوادي الجديد', 'مطروح'
];

const AVAILABLE_SERVICES = [
  { id: 'rent', title: 'إيجار أجهزة ومعدات مساحية', desc: 'توتال ستيشن، محطات رصد، أجهزة GPS/RTK، موازين قامة' },
  { id: 'sale', title: 'بيع وتوريد أجهزة ومستلزمات', desc: 'أجهزة مساحية جديدة ومستعملة مع الضمان، إكسسوارات وعواكس' },
  { id: 'maintenance', title: 'معايرة وصيانة معتمدة', desc: 'شهادات معايرة دورية معتمدة وضبط محاور وعدسات وبطاريات' },
  { id: 'surveying', title: 'أعمال مساحية ورفع ميداني', desc: 'رفع طوبوغرافي، توقيع محاور، ميزانية شبكية، حساب كميات' },
  { id: 'training', title: 'تدريب وكورسات هندسية', desc: 'دورات عملية على أحدث الأجهزة والبرامج الهندسية المتخصصة' },
  { id: 'drone', title: 'مسح جوي وطائرات درون', desc: 'تصوير جوي ومعالجة سحب النقط ونماذج الارتفاعات الرقمية DEM' },
];

export default function ProviderRegistrationWizard() {
  const [step, setStep] = useState<number | 'success'>(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    organization: '',
    governorate: 'القاهرة',
    location: '',
    workingHours: '24 ساعة',
    services: ['إيجار أجهزة ومعدات مساحية', 'بيع وتوريد أجهزة ومستلزمات'],
    equipmentPhotos: ['total_station_leica.jpg', 'gps_rtk_receiver.jpg'],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Phone Validation Regex: 11 digits starting with 010, 011, 012, or 015
  const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'يرجى كتابة الاسم الكريم / اسم المسؤول بالكامل';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'يرجى إدخال بريد إلكتروني صالح للتواصل';
    }
    if (!formData.phone.trim() || !EGYPT_PHONE_REGEX.test(formData.phone.trim())) {
      newErrors.phone = 'رقم الهاتف يجب أن يتكون من 11 رقمًا ويبدأ بـ 010 أو 011 أو 012 أو 015';
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const fullLocation = formData.location
          ? `${formData.governorate} — ${formData.location}`
          : formData.governorate;

        const displayName = formData.organization
          ? `${formData.organization} (${formData.name})`
          : formData.name;

        const { data, error } = await supabase.from('providers').insert([
          {
            name: displayName,
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            location: fullLocation,
            status: 'pending',
          },
        ]);

        if (error) {
          console.error('[Supabase Registration Error]', error);
          setSubmitError('تعذر إرسال البيانات إلى السحابة: ' + (error.message || 'يرجى المحاولة لاحقاً'));
          return;
        }

        setStep('success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال البيانات';
        console.error('[Registration Exception]', err);
        setSubmitError(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const toggleService = (srvTitle: string) => {
    setFormData((prev) => {
      const exists = prev.services.includes(srvTitle);
      return {
        ...prev,
        services: exists
          ? prev.services.filter((s) => s !== srvTitle)
          : [...prev.services, srvTitle],
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploading(true);
      setTimeout(() => {
        const names = Array.from(files).map((f) => f.name);
        setFormData((prev) => ({
          ...prev,
          equipmentPhotos: [...prev.equipmentPhotos, ...names],
        }));
        setUploading(false);
      }, 600);
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      equipmentPhotos: prev.equipmentPhotos.filter((_, i) => i !== indexToRemove),
    }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-gray-800 bg-gray-900/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-right text-gray-100">
      
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center justify-center w-auto shrink-0 mx-auto transition-opacity hover:opacity-90" style={{ minWidth: '200px' }}>
          <Image
            alt="Survsta"
            className="object-contain w-[180px] sm:w-[220px] h-auto mx-auto"
            height={65}
            priority
            src="/images/Designer.png"
            style={{ maxHeight: '65px' }}
            width={220}
          />
        </Link>
        <h1 className="mt-4 text-2xl sm:text-3xl font-black text-white">انضم كشريك — تسجيل مزوّد خدمة</h1>
        <p className="mt-1.5 text-xs sm:text-sm text-gray-400">
          انضم لأكبر شبكة رقمية للمكاتب وشركات المساحة والموردين في مصر والشرق الأوسط
        </p>
      </div>

      {step !== 'success' && (
        <div className="mb-8">
          {/* Step Progress Indicators */}
          <div className="flex items-center justify-between relative mb-3">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -z-0" />
            <div
              className="absolute top-1/2 right-0 h-0.5 bg-gradient-to-l from-cyan-500 to-amber-400 -z-0 transition-all duration-300"
              style={{ width: step === 1 ? '15%' : step === 2 ? '50%' : '90%' }}
            />

            {/* Step 1 Pill */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-md ${
                  step >= 1
                    ? 'bg-cyan-500 text-gray-950 ring-4 ring-cyan-500/20'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                1
              </div>
              <span className={`text-[11px] font-semibold mt-1.5 ${step >= 1 ? 'text-cyan-400' : 'text-gray-500'}`}>
                البيانات الأساسية
              </span>
            </div>

            {/* Step 2 Pill */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-md ${
                  step >= 2
                    ? 'bg-cyan-500 text-gray-950 ring-4 ring-cyan-500/20'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                2
              </div>
              <span className={`text-[11px] font-semibold mt-1.5 ${step >= 2 ? 'text-cyan-400' : 'text-gray-500'}`}>
                بيانات النشاط
              </span>
            </div>

            {/* Step 3 Pill */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-md ${
                  step === 3
                    ? 'bg-cyan-500 text-gray-950 ring-4 ring-cyan-500/20'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                3
              </div>
              <span className={`text-[11px] font-semibold mt-1.5 ${step === 3 ? 'text-cyan-400' : 'text-gray-500'}`}>
                الخدمات والمعدات
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="border-b border-gray-800 pb-3 mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">👤</span> الخطوة الأولى: البيانات الأساسية لحساب المزوّد
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">أدخل معلومات الحساب والمسؤول عن إدارة الملف على المنصة.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              الاسم بالكامل / اسم المسؤول *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: المهندس محمد أحمد"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1 font-semibold">⚠️ {errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              البريد الإلكتروني المهني *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@company.com"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1 font-semibold">⚠️ {errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              رقم الهاتف المحمول (مصري — 11 رقماً) *
            </label>
            <input
              type="tel"
              required
              maxLength={11}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="01xxxxxxxxx"
              style={{ direction: 'ltr', textAlign: 'right' }}
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {errors.phone ? (
              <p className="text-red-400 text-xs mt-1 font-semibold">⚠️ {errors.phone}</p>
            ) : (
              <p className="text-[11px] text-gray-500 mt-1">يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 (11 رقماً).</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              كلمة المرور *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1 font-semibold">⚠️ {errors.password}</p>}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-cyan-500 px-7 py-3 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition"
            >
              متابعة الخطوة التالية ←
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Business Details */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="border-b border-gray-800 pb-3 mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-amber-400">🏢</span> الخطوة الثانية: بيانات النشاط التجاري والموقع
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">تفاصيل المكتب أو الشركة وتواجدك الميداني لتوجيه العملاء إليك.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              الاسم التجاري للمكتب أو الشركة
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              placeholder="مثال: مكتب النخبة للحلول المساحية والهندسية"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                المحافظة (نطاق العمل الأساسي)
              </label>
              <select
                value={formData.governorate}
                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {EGYPTIAN_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                مواعيد العمل (Working Hours)
              </label>
              <input
                type="text"
                value={formData.workingHours}
                onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                placeholder="24 ساعة"
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <span className="text-[10.5px] text-gray-500 mt-1 block">القيمة الافتراضية المقترحة: 24 ساعة للطلبات العاجلة</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              المقر / العنوان التفصيلي (اختياري)
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="مثال: مدينة نصر — بجوار محطة الاستاد (اختياري للمكاتب الميدانية)"
              className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-gray-700 bg-gray-800/80 px-6 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition"
            >
              → الخطوة السابقة
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-cyan-500 px-7 py-3 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition"
            >
              متابعة الخطوة التالية ←
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Services & Media */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="border-b border-gray-800 pb-3 mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">📡</span> الخطوة الثالثة: الخدمات المساحية وصور المعدات
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">اختر الخدمات التي تقدمها، وارفع صور أجهزتك لتوثيق الحساب سريعاً.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              اختر الخدمات والأنشطة المتاحة لديك:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_SERVICES.map((srv) => {
                const checked = formData.services.includes(srv.title);
                return (
                  <label
                    key={srv.id}
                    onClick={() => toggleService(srv.title)}
                    className={`cursor-pointer flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      checked
                        ? 'border-cyan-500/60 bg-cyan-950/20 text-white shadow-sm'
                        : 'border-gray-800 bg-gray-950/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 rounded border-gray-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-100">{srv.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{srv.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              صور الأجهزة والمعدات (Equipment Photos):
            </label>
            <div className="rounded-xl border border-dashed border-gray-700 bg-gray-950/60 p-5 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                id="equipmentPhotoInput"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="equipmentPhotoInput"
                className="cursor-pointer inline-flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl text-cyan-400">
                  📸
                </div>
                <div className="text-xs font-bold text-cyan-400 hover:underline">
                  {uploading ? 'جاري معالجة الصور...' : 'اضغط هنا لرفع صور الأجهزة والمختبر (Mock File Upload)'}
                </div>
                <span className="text-[11px] text-gray-500">يدعم صيغ PNG, JPG للمحطات والمستقبلات وأطقم العمل</span>
              </label>

              {/* Uploaded photos list */}
              {formData.equipmentPhotos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-800/80">
                  <div className="text-[11px] font-semibold text-gray-400 mb-2">الصور المرفقة ({formData.equipmentPhotos.length}):</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {formData.equipmentPhotos.map((photoName, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-300"
                      >
                        <span>📷 {photoName}</span>
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="text-red-400 hover:text-red-300 font-bold ml-1 text-xs"
                          title="حذف"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-xl border border-gray-700 bg-gray-800/80 px-6 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition"
            >
              → الخطوة السابقة
            </button>
            {submitError && (
              <div className="w-full p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold mb-3 text-center">
                ⚠️ {submitError}
              </div>
            )}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleNext}
              className="rounded-xl bg-gradient-to-l from-[#F4B400] to-amber-500 px-8 py-3 text-sm font-black text-black shadow-lg shadow-amber-500/20 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'جاري إرسال الطلب وحفظ البيانات...' : 'إرسال طلب الانضمام الآن 🚀'}
            </button>
          </div>
        </div>
      )}

      {/* Success State - EXACT string required by user prompt */}
      {step === 'success' && (
        <div className="text-center py-8 px-4 space-y-5 animate-in zoom-in-95 duration-400">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl text-emerald-400">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              تم استلام طلبك بنجاح. سيتم مراجعة البيانات وإرسال كود التفعيل قريباً.
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
              يقوم فريق إدارة المنصة بمراجعة بيانات النشاط وصور الأجهزة وتوليد كود التفعيل المباشر وتزويدك به عبر الواتساب أو البريد الإلكتروني.
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 max-w-sm mx-auto text-xs text-gray-300 text-right space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">رقم الطلب المرجعي:</span>
              <span className="font-mono text-cyan-400 font-bold">SRV-{Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">المسؤول:</span>
              <span>{formData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">رقم الهاتف:</span>
              <span dir="ltr">{formData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">المحافظة:</span>
              <span>{formData.governorate}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-bold text-gray-950 shadow-md hover:bg-cyan-400 transition text-center"
            >
              العودة للصفحة الرئيسية
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-xl border border-gray-700 bg-gray-800 px-6 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-700 transition text-center"
            >
              الانتقال إلى صفحة تسجيل الدخول
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
