'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

interface GovernorateGroup {
  region: string;
  icon: string;
  governorates: string[];
}

const EGYPT_GOVERNORATES_GROUPS: GovernorateGroup[] = [
  {
    region: 'إقليم القاهرة الكبرى',
    icon: '🏛️',
    governorates: ['القاهرة', 'الجيزة', 'القليوبية'],
  },
  {
    region: 'الإسكندرية والساحل الشمالي',
    icon: '🌊',
    governorates: ['الإسكندرية', 'مطروح', 'البحيرة'],
  },
  {
    region: 'إقليم الدلتا',
    icon: '🌾',
    governorates: ['الدقهلية', 'الغربية', 'الشرقية', 'المنوفية', 'كفر الشيخ', 'دمياط'],
  },
  {
    region: 'إقليم القناة وسيناء',
    icon: '🚢',
    governorates: ['بورسعيد', 'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء'],
  },
  {
    region: 'شمال ووسط الصعيد',
    icon: '🏜️',
    governorates: ['الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'الوادي الجديد'],
  },
  {
    region: 'جنوب الصعيد والبحر الأحمر',
    icon: '⛰️',
    governorates: ['سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر'],
  },
];

const ALL_GOVERNORATES = EGYPT_GOVERNORATES_GROUPS.flatMap((g) => g.governorates);

export default function ProviderLocationsPage() {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [primaryLocation, setPrimaryLocation] = useState<string>('القاهرة');
  const [headquartersAddress, setHeadquartersAddress] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load existing coverage from Supabase
  useEffect(() => {
    async function loadCoverage() {
      setIsLoading(true);
      try {
        let userId: string | null = null;
        let email: string | null = null;

        // 1. Supabase Auth
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          userId = authData.user.id;
          email = authData.user.email || null;
        }

        // 2. Local session fallback
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('SURVSTA_AUTH_USER');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (!userId && parsed.id) userId = parsed.id;
              if (!email && parsed.email) email = parsed.email;
              if (parsed.location) setPrimaryLocation(parsed.location);
              if (Array.isArray(parsed.coverage_areas) && parsed.coverage_areas.length > 0) {
                setSelectedAreas(parsed.coverage_areas);
              }
            } catch {}
          }
        }

        setActiveUserId(userId);
        setUserEmail(email);

        // 3. Query clients table (Unified Profile)
        let loaded = false;
        if (email || userId) {
          let clientQuery = supabase.from('clients').select('coverage_areas, company_name');
          if (userId) clientQuery = clientQuery.eq('user_id', userId);
          else if (email) clientQuery = clientQuery.eq('email', email);

          const { data: clientData, error: clientErr } = await clientQuery.maybeSingle();
          if (!clientErr && clientData?.coverage_areas) {
            const areas = Array.isArray(clientData.coverage_areas)
              ? clientData.coverage_areas
              : typeof clientData.coverage_areas === 'string'
              ? JSON.parse(clientData.coverage_areas)
              : [];
            if (areas.length > 0) {
              setSelectedAreas(areas);
              loaded = true;
            }
          }

          // 4. Query providers table as well
          let provQuery = supabase.from('providers').select('coverage_areas, location');
          if (email) provQuery = provQuery.eq('email', email);
          else if (userId) provQuery = provQuery.eq('id', userId);

          const { data: provData, error: provErr } = await provQuery.maybeSingle();
          if (!provErr && provData) {
            if (provData.location) setPrimaryLocation(provData.location);
            if (!loaded && provData.coverage_areas) {
              const provAreas = Array.isArray(provData.coverage_areas)
                ? provData.coverage_areas
                : typeof provData.coverage_areas === 'string'
                ? JSON.parse(provData.coverage_areas)
                : [];
              if (provAreas.length > 0) {
                setSelectedAreas(provAreas);
                loaded = true;
              }
            }
          }
        }

        // If newly onboarding or empty, default to Cairo & Giza as starter
        if (!loaded && selectedAreas.length === 0) {
          setSelectedAreas(['القاهرة', 'الجيزة']);
        }
      } catch (err) {
        console.warn('[loadCoverage error]:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCoverage();
  }, []);

  const toggleGovernorate = (gov: string) => {
    setSelectedAreas((prev) =>
      prev.includes(gov) ? prev.filter((g) => g !== gov) : [...prev, gov]
    );
  };

  const handleSelectAll = () => {
    setSelectedAreas(ALL_GOVERNORATES);
    showToast('🇪🇬 تم تحديد كافة محافظات جمهورية مصر العربية (تغطية شاملة)');
  };

  const handleDeselectAll = () => {
    setSelectedAreas([]);
  };

  const toggleGroup = (group: GovernorateGroup) => {
    const allGroupSelected = group.governorates.every((g) => selectedAreas.includes(g));
    if (allGroupSelected) {
      setSelectedAreas((prev) => prev.filter((g) => !group.governorates.includes(g)));
    } else {
      setSelectedAreas((prev) => Array.from(new Set([...prev, ...group.governorates])));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAreas.length === 0) {
      showToast('⚠️ يرجى تحديد محافظة واحدة على الأقل لتغطية خدماتك.');
      return;
    }

    setIsSaving(true);
    try {
      const summaryText =
        selectedAreas.length === ALL_GOVERNORATES.length
          ? 'تغطية شاملة لجمهورية مصر العربية'
          : `${primaryLocation} (${selectedAreas.length} ${selectedAreas.length === 1 ? 'محافظة' : selectedAreas.length === 2 ? 'محافظتان' : 'محافظات'})`;

      // 1. Update clients table
      if (activeUserId || userEmail) {
        const clientUpdatePayload: any = {
          coverage_areas: selectedAreas,
          updated_at: new Date().toISOString(),
        };
        let clientQuery = supabase.from('clients').update(clientUpdatePayload);
        if (activeUserId) clientQuery = clientQuery.eq('user_id', activeUserId);
        else if (userEmail) clientQuery = clientQuery.eq('email', userEmail);
        
        await clientQuery;
      }

      // 2. Update providers table
      if (userEmail || activeUserId) {
        const provUpdatePayload: any = {
          coverage_areas: selectedAreas,
          location: summaryText,
        };
        let provQuery = supabase.from('providers').update(provUpdatePayload);
        if (userEmail) provQuery = provQuery.eq('email', userEmail);
        else if (activeUserId) provQuery = provQuery.eq('id', activeUserId);

        await provQuery;
      }

      // 3. Update localStorage session
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        const parsed = stored ? JSON.parse(stored) : {};
        const updated = {
          ...parsed,
          location: summaryText,
          coverage_areas: selectedAreas,
          headquarters: headquartersAddress.trim() || primaryLocation,
        };
        localStorage.setItem('SURVSTA_AUTH_USER', JSON.stringify(updated));
      }

      showToast(`✅ تم حفظ وتحديث نطاق التغطية (${selectedAreas.length} محافظة) بنجاح في السحابة!`);
    } catch (err) {
      console.error('[handleSave locations error]:', err);
      showToast('⚠️ تم حفظ التفضيلات محلياً بنجاح.');
    } finally {
      setIsSaving(false);
    }
  };

  const isAllSelected = selectedAreas.length === ALL_GOVERNORATES.length;

  return (
    <div className="min-h-screen bg-[#081933] text-right text-gray-100 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header / Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-500/20 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                الملف والاعتماد الجغرافي
              </span>
              <span className="text-xs text-gray-400">محرك بحث وسوق Survsta</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>📍</span>
              <span>المواقع والتغطية الجغرافية للمزوّد (Service Coverage Areas)</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              حدد المحافظات والمناطق التي يمكنك توصيل الأجهزة لها أو تقديم الخدمات المساحية فيها، لتظهر معداتك للمهندسين والمقاولين عند تصفية البحث حسب المحافظة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/provider/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition"
            >
              <span>📊</span>
              <span>لوحة التحكم</span>
            </Link>
          </div>
        </div>

        {/* Status & Coverage KPI Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>المحافظات المغطاة</span>
              <span className="text-cyan-400 text-lg">🗺️</span>
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {isLoading ? '...' : `${selectedAreas.length} / ${ALL_GOVERNORATES.length}`}
            </div>
            <div className="text-[11px] text-cyan-400 mt-1">
              {isAllSelected ? '🇪🇬 تغطية شاملة لكافة أنحاء مصر' : `تغطي ${(selectedAreas.length / ALL_GOVERNORATES.length * 100).toFixed(0)}% من محافظات مصر`}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>المقر والمركز الرئيسي</span>
              <span className="text-amber-400 text-lg">🏢</span>
            </div>
            <div className="text-lg font-bold text-amber-300 truncate">
              {primaryLocation || 'لم يحدد بعد'}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">يظهر كعنوان رئيسي في بطاقة المزوّد</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>جاهزية الظهور بالبحث</span>
              <span className="text-emerald-400 text-lg">⚡</span>
            </div>
            <div className="text-lg font-bold text-emerald-300">
              {selectedAreas.length > 0 ? 'مفعل في محرك البحث ✓' : 'غير مكتمل ⚠️'}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">يضمن ظهور أجهزتك في تصفية الموقع الجغرافي</div>
          </div>
        </div>

        {/* Main Coverage Form */}
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Headquarters Settings Card */}
          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/70 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
              <span className="text-lg">🏛️</span>
              <h2 className="text-sm font-bold text-white">المقر الرئيسي وعنوان التسليم</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  المحافظة الرئيسية للمكتب / المستودع <span className="text-amber-400">*</span>
                </label>
                <select
                  value={primaryLocation}
                  onChange={(e) => setPrimaryLocation(e.target.value)}
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#081933] px-4 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  {ALL_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  العنوان التفصيلي أو الحي <span className="text-gray-500">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={headquartersAddress}
                  onChange={(e) => setHeadquartersAddress(e.target.value)}
                  placeholder="مثال: المعادي - شارع اللاسلكي، أو المهندسين - ميدان لبنان"
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#081933] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Governorates Interactive Selector Card */}
          <div className="rounded-2xl border border-cyan-500/30 bg-[#0F253E]/70 p-5 sm:p-6 space-y-6">
            
            {/* Toolbar: Quick Buttons & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🗺️</span>
                  <span>محافظات ونطاقات التغطية المعتمدة</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  اضغط على أي محافظة لتفعيلها أو تعطيلها من نطاق عملك.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  تحديد كل مصر (27 محافظة)
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition cursor-pointer"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>

            {/* Region Groups */}
            <div className="space-y-6">
              {EGYPT_GOVERNORATES_GROUPS.map((group) => {
                const groupSelectedCount = group.governorates.filter((g) => selectedAreas.includes(g)).length;
                const isAllGroupSelected = groupSelectedCount === group.governorates.length;

                return (
                  <div key={group.region} className="space-y-3 rounded-xl border border-gray-800 bg-[#081933]/60 p-4">
                    {/* Region Group Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{group.icon}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{group.region}</h4>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {groupSelectedCount} / {group.governorates.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer underline"
                      >
                        {isAllGroupSelected ? 'إلغاء المجموعة' : 'تحديد المجموعة بالكامل'}
                      </button>
                    </div>

                    {/* Governorates Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
                      {group.governorates.map((gov) => {
                        const isSelected = selectedAreas.includes(gov);
                        const isPrimary = gov === primaryLocation;

                        return (
                          <div
                            key={gov}
                            onClick={() => toggleGovernorate(gov)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between space-y-2 ${
                              isSelected
                                ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md'
                                : 'bg-[#0F253E]/50 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{gov}</span>
                              <div
                                className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                  isSelected
                                    ? 'bg-cyan-500 text-[#081933]'
                                    : 'border border-gray-700 bg-gray-900 text-transparent'
                                }`}
                              >
                                ✓
                              </div>
                            </div>

                            {isPrimary && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-center">
                                ★ المقر الرئيسي
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Submit Toolbar */}
            <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-xs text-gray-400">
                سيتم تحديث بطاقة مكتبك في دليل المزوّدين فوراً بعد الحفظ.
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/provider/dashboard"
                  className="px-5 py-2.5 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition"
                >
                  إلغاء
                </Link>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] text-[#081933] text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'جارٍ حفظ التغطية في السحابة…' : 'حفظ وتأكيد نطاق التغطية الجغرافية'}
                </button>
              </div>
            </div>

          </div>
        </form>

      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-gray-900 border border-amber-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-amber-300 shadow-2xl animate-slide-up flex items-center gap-2">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
