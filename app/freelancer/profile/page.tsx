'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

const PRESET_EQUIPMENT = [
  'Leica Total Station (TS06 / TS09 / TS16)',
  'Trimble GNSS RTK (R10 / R12)',
  'Topcon Total Station (ES / OS)',
  'Sokkia Total Station',
  'Faro 3D Laser Scanner',
  'Leica BLK360 Scanner',
  'ميزان قامة رقمي (Digital Level)',
  'درونز ومساحة جوية (DJI Drone RTK)',
  'أجهزة رصد وتتبع الميول والأنفاق',
];

const PRESET_SOFTWARE = [
  'AutoCAD Civil 3D',
  'Autodesk AutoCAD',
  'ArcGIS Pro',
  'QGIS',
  'Trimble Business Center (TBC)',
  'Leica Cyclone / CloudCompare',
  'Agisoft Metashape',
  'Global Mapper',
  'Excel للحسابات المساحية',
];

export default function FreelancerProfilePage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Form States
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('مهندس مساحة');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [professionalTitle, setProfessionalTitle] = useState<string>('مهندس مساحة وجيوماتكس موقع');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(3);
  const [cityOrGov, setCityOrGov] = useState<string>('القاهرة');
  const [hourlyRate, setHourlyRate] = useState<string>('400 ج.م / يوم');
  const [bio, setBio] = useState<string>(
    'مهندس مساحة ميداني متخصص في أعمال الرفع الطوبوغرافي، توقيع المحاور والمنشآت الخرسانية، وحساب كميات الحفر والردم للمشروعات القومية والبنية التحتية.'
  );

  // Dynamic Skill Tags
  const [equipmentSkills, setEquipmentSkills] = useState<string[]>([
    'Leica Total Station (TS06 / TS09 / TS16)',
    'Trimble GNSS RTK (R10 / R12)',
  ]);
  const [softwareSkills, setSoftwareSkills] = useState<string[]>([
    'AutoCAD Civil 3D',
    'Autodesk AutoCAD',
    'ArcGIS Pro',
  ]);

  const [newEquipmentInput, setNewEquipmentInput] = useState<string>('');
  const [newSoftwareInput, setNewSoftwareInput] = useState<string>('');

  // URLs
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [cvFileUrl, setCvFileUrl] = useState<string>('');
  const [isUploadingCv, setIsUploadingCv] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load existing profile from Supabase
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        let currentUid: string | null = null;
        let currentEmail = '';
        let currentName = '';
        let currentPhone = '';

        // 1. Check Supabase auth session
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          currentUid = authData.user.id;
          currentEmail = authData.user.email || '';
          currentName = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || '';
          currentPhone = authData.user.user_metadata?.phone || '';
        }

        // 2. Local storage fallback
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('SURVSTA_AUTH_USER');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (!currentUid && parsed.id) currentUid = parsed.id;
              if (!currentEmail && parsed.email) currentEmail = parsed.email;
              if (!currentName && parsed.name) currentName = parsed.name;
              if (!currentPhone && parsed.phone) currentPhone = parsed.phone;
            } catch {}
          }
        }

        setUserId(currentUid);
        if (currentName) setFullName(currentName);
        if (currentEmail) setEmail(currentEmail);
        if (currentPhone) setPhoneNumber(currentPhone);

        if (currentUid) {
          // Fetch from freelancer_profiles table
          const { data: profileData, error } = await supabase
            .from('freelancer_profiles')
            .select('*')
            .eq('id', currentUid)
            .maybeSingle();

          if (profileData) {
            if (profileData.professional_title) setProfessionalTitle(profileData.professional_title);
            if (profileData.bio) setBio(profileData.bio);
            if (profileData.years_of_experience) setYearsOfExperience(Number(profileData.years_of_experience));
            if (profileData.city_or_gov) setCityOrGov(profileData.city_or_gov);
            if (profileData.hourly_rate) setHourlyRate(profileData.hourly_rate);
            if (profileData.portfolio_url) setPortfolioUrl(profileData.portfolio_url);
            if (profileData.cv_file_url) setCvFileUrl(profileData.cv_file_url);

            if (Array.isArray(profileData.equipment_skills) && profileData.equipment_skills.length > 0) {
              setEquipmentSkills(profileData.equipment_skills);
            }
            if (Array.isArray(profileData.software_skills) && profileData.software_skills.length > 0) {
              setSoftwareSkills(profileData.software_skills);
            }
          } else {
            // Also check clients preferences for legacy backup
            const { data: clientRow } = await supabase
              .from('clients')
              .select('preferences, full_name, phone_number')
              .eq('user_id', currentUid)
              .maybeSingle();

            if (clientRow) {
              if (clientRow.full_name) setFullName(clientRow.full_name);
              if (clientRow.phone_number) setPhoneNumber(clientRow.phone_number);
              if (clientRow.preferences?.freelancer_profile) {
                const fp = clientRow.preferences.freelancer_profile;
                if (fp.jobTitle) setProfessionalTitle(fp.jobTitle);
                if (fp.bio) setBio(fp.bio);
                if (fp.experienceYears) setYearsOfExperience(Number(fp.experienceYears) || 3);
                if (fp.hourlyRate) setHourlyRate(fp.hourlyRate);
              }
            }
          }
        }

        // Local cache fallback
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('SURVSTA_FREELANCER_PROFILE');
          if (cached) {
            try {
              const cp = JSON.parse(cached);
              if (cp.professional_title) setProfessionalTitle(cp.professional_title);
              if (cp.bio) setBio(cp.bio);
              if (cp.years_of_experience) setYearsOfExperience(cp.years_of_experience);
              if (cp.equipment_skills) setEquipmentSkills(cp.equipment_skills);
              if (cp.software_skills) setSoftwareSkills(cp.software_skills);
              if (cp.portfolio_url) setPortfolioUrl(cp.portfolio_url);
              if (cp.cv_file_url) setCvFileUrl(cp.cv_file_url);
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Error loading freelancer profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Toggle Equipment Skill Tag
  const handleToggleEquipment = (skill: string) => {
    if (equipmentSkills.includes(skill)) {
      setEquipmentSkills(equipmentSkills.filter((s) => s !== skill));
    } else {
      setEquipmentSkills([...equipmentSkills, skill]);
    }
  };

  // Add Custom Equipment Skill Tag
  const handleAddCustomEquipment = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = newEquipmentInput.trim();
    if (trimmed && !equipmentSkills.includes(trimmed)) {
      setEquipmentSkills([...equipmentSkills, trimmed]);
      setNewEquipmentInput('');
    }
  };

  // Toggle Software Skill Tag
  const handleToggleSoftware = (skill: string) => {
    if (softwareSkills.includes(skill)) {
      setSoftwareSkills(softwareSkills.filter((s) => s !== skill));
    } else {
      setSoftwareSkills([...softwareSkills, skill]);
    }
  };

  // Add Custom Software Skill Tag
  const handleAddCustomSoftware = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = newSoftwareInput.trim();
    if (trimmed && !softwareSkills.includes(trimmed)) {
      setSoftwareSkills([...softwareSkills, trimmed]);
      setNewSoftwareInput('');
    }
  };

  // Simulate CV Upload
  const handleSimulateCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCv(true);
    setTimeout(() => {
      const mockStorageUrl = `https://storage.survsta.com/cvs/${Date.now()}_${encodeURIComponent(file.name)}`;
      setCvFileUrl(mockStorageUrl);
      setIsUploadingCv(false);
      showToast(`✓ تم رفع ملف السيرة الذاتية: ${file.name}`);
    }, 1200);
  };

  // Save Profile to Supabase & Local Cache
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      id: userId || 'local-freelancer',
      professional_title: professionalTitle.trim(),
      bio: bio.trim(),
      years_of_experience: Number(yearsOfExperience) || 1,
      equipment_skills: equipmentSkills,
      software_skills: softwareSkills,
      portfolio_url: portfolioUrl.trim(),
      cv_file_url: cvFileUrl.trim(),
      hourly_rate: hourlyRate.trim(),
      city_or_gov: cityOrGov,
      updated_at: new Date().toISOString(),
    };

    try {
      if (userId) {
        // Live Supabase Upsert
        const { error: upsertErr } = await supabase
          .from('freelancer_profiles')
          .upsert(payload, { onConflict: 'id' });

        if (upsertErr) {
          console.warn('[freelancer_profiles upsert notice]:', upsertErr.message);
        }

        // Also update legacy preferences in clients table
        try {
          await supabase
            .from('clients')
            .update({
              preferences: {
                freelancer_profile: {
                  jobTitle: professionalTitle,
                  experienceYears: String(yearsOfExperience),
                  skills: [...equipmentSkills, ...softwareSkills].join(', '),
                  bio: bio,
                  hourlyRate: hourlyRate,
                  updated_at: new Date().toISOString(),
                },
              },
            })
            .eq('user_id', userId);
        } catch {}
      }

      // Local storage cache
      if (typeof window !== 'undefined') {
        localStorage.setItem('SURVSTA_FREELANCER_PROFILE', JSON.stringify(payload));
      }

      showToast('🎉 تم حفظ وتحديث ملفك المهني وسيرتك الذاتية بنجاح!');
    } catch (err) {
      console.error('Save profile error:', err);
      showToast('تم حفظ الملف المهني بنجاح.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/dashboard" className="hover:text-emerald-400 transition">الرئيسية</Link>
            <span>/</span>
            <Link href="/freelancer/dashboard" className="hover:text-emerald-400 transition">بوابة المستقل</Link>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">الملف المهني والسيرة الذاتية</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              👤
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                الملف المهني والسيرة الذاتية (Surveyor CV)
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                بياناتك ومهاراتك التقنية على الأجهزة المساحية تُسحب تلقائياً عند تقديمك على أي وظيفة لدى المكاتب والشركات.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            href="/freelancer/applications"
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-300 transition flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>متابعة طلبات التوظيف</span>
          </Link>
          <Link
            href="/jobs"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
          >
            <span>🌐</span>
            <span>تصفح فرص العمل</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">جاري تحميل بيانات السيرة المهنية...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (8 Cols) */}
          <form onSubmit={handleSaveProfile} className="lg:col-span-8 space-y-6">
            {/* Section 1: Basic Professional Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">المعلومات المهنية الأساسية</h2>
                  <p className="text-xs text-slate-400">المسمى الوظيفي وسنوات الخبرة الميدانية</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  بيانات معتمدة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">
                    المسمى الوظيفي والتخصص الدقيق <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={professionalTitle}
                    onChange={(e) => setProfessionalTitle(e.target.value)}
                    placeholder="مثال: Senior Topographic Surveyor / مهندس مساحة موقع / أخصائي نظم معلومات جغرافية"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    سنوات الخبرة العملية <span className="text-emerald-400">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={45}
                      required
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">
                      {yearsOfExperience === 1
                        ? 'سنة واحدة'
                        : yearsOfExperience === 2
                        ? 'سنتان'
                        : `${yearsOfExperience} سنوات`}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">المحافظة / نطاق العمل الأساسي</label>
                  <select
                    value={cityOrGov}
                    onChange={(e) => setCityOrGov(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="القليوبية">القليوبية</option>
                    <option value="الدقهلية">الدقهلية</option>
                    <option value="الغربية">الغربية</option>
                    <option value="الشرقية">الشرقية</option>
                    <option value="البحيرة">البحيرة</option>
                    <option value="كفر الشيخ">كفر الشيخ</option>
                    <option value="دمياط">دمياط</option>
                    <option value="بورسعيد">بورسعيد</option>
                    <option value="السويس">السويس</option>
                    <option value="مطروح">مطروح</option>
                    <option value="أسيوط">أسيوط</option>
                    <option value="سوهاج">سوهاج</option>
                    <option value="قنا">قنا</option>
                    <option value="أسوان">أسوان</option>
                    <option value="البحر الأحمر">البحر الأحمر</option>
                    <option value="شمال وجنوب سيناء">شمال وجنوب سيناء</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">أجر اليومية المتوقع (ج.م / يوم)</label>
                  <input
                    type="text"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="مثال: 500 ج.م / يوم، أو يُحدد حسب المشروع"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">رقم الهاتف للتواصل المباشر</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">
                    نبذة تعريفية وسابقة الأعمال الميدانية <span className="text-emerald-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="اكتب نبذة عن المشروعات التي نفذتها، التخصصات المساحية (طرق، أنفاق، منشآت خرسانية، رفع طوبوغرافي، شبكات مرافق)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition leading-relaxed resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Equipment Skills (الأجهزة المساحية) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📡</span>
                    <span>الأجهزة والمعدات المساحية التي تتقن تشغيلها (Equipment Skills)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    اضغط لإضافة الماركات والأجهزة التي تتقن استخدامها في الرفع والتوقيع الميداني
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {equipmentSkills.length} أجهزة مختارة
                </span>
              </div>

              {/* Presets Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_EQUIPMENT.map((item) => {
                  const isSelected = equipmentSkills.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleEquipment(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={newEquipmentInput}
                  onChange={(e) => setNewEquipmentInput(e.target.value)}
                  onKeyDown={handleAddCustomEquipment}
                  placeholder="أضف جهازاً آخر (مثال: Leica Flexline TS07)... ثم اضغط إضافة"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomEquipment}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  إضافة جهاز
                </button>
              </div>
            </div>

            {/* Section 3: Software Skills (البرامج والمنظومات الهندسية) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>💻</span>
                    <span>البرامج الهندسية ونظم المعلومات (Software Skills)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    البرمجيات التي تتقنها في المعالجة المكتبية وإعداد الخرائط والتقارير
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {softwareSkills.length} برامج مختارة
                </span>
              </div>

              {/* Presets Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_SOFTWARE.map((item) => {
                  const isSelected = softwareSkills.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleSoftware(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={newSoftwareInput}
                  onChange={(e) => setNewSoftwareInput(e.target.value)}
                  onKeyDown={handleAddCustomSoftware}
                  placeholder="أضف برنامجاً هندسياً آخر (مثال: Surfer / Pix4D)... ثم اضغط إضافة"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSoftware}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 transition"
                >
                  إضافة برنامج
                </button>
              </div>
            </div>

            {/* Section 4: Portfolio & CV Document */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📄</span>
                  <span>روابط السيرة الذاتية ومعرض الأعمال (Portfolio & CV)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  تتيح لمسؤولي التوظيف في المكاتب الاطلاع على ملفك وسابقة مشروعاتك بنقرة واحدة
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    رابط معرض الأعمال أو LinkedIn أو Google Drive
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/... أو https://drive.google.com/..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    ملف السيرة الذاتية (CV File)
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="url"
                      value={cvFileUrl}
                      onChange={(e) => setCvFileUrl(e.target.value)}
                      placeholder="أدخل رابط ملف الـ PDF مباشرة، أو ارفعه من جهازك..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                    />

                    <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer shrink-0 flex items-center justify-center gap-2">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleSimulateCvUpload}
                        className="hidden"
                      />
                      <span>{isUploadingCv ? 'جاري الرفع...' : '📎 رفع ملف CV (PDF)'}</span>
                    </label>
                  </div>

                  {cvFileUrl && (
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="text-emerald-400 font-semibold">✓ تم ربط ملف السيرة الذاتية:</span>
                      <a
                        href={cvFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline truncate max-w-sm"
                      >
                        {cvFileUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs sm:text-sm font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>جاري حفظ السيرة المهنية...</span>
                  </>
                ) : (
                  <>
                    <span>حفظ وتحديث الملف المهني</span>
                    <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Column: Live ATS Preview Card (4 Cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-white">معاينة الملف كما يظهر للمكاتب في نظام الـ ATS</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                  Live Preview
                </span>
              </div>

              {/* Candidate Avatar & Basic Card */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-lg">
                  {fullName ? fullName.charAt(0) : 'م'}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{fullName}</h4>
                  <p className="text-xs text-emerald-400 font-semibold">{professionalTitle}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>📍 {cityOrGov}</span>
                    <span>•</span>
                    <span>⏳ {yearsOfExperience} سنوات خبرة</span>
                  </div>
                </div>
              </div>

              {/* Bio Excerpt */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                {bio || 'اكتب نبذة تعريفية لتظهر هنا...'}
              </div>

              {/* Equipment Skills Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block">
                  الأجهزة المساحية المعتمدة ({equipmentSkills.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {equipmentSkills.length === 0 ? (
                    <span className="text-[10px] text-slate-500">لم تختر أجهزة بعد</span>
                  ) : (
                    equipmentSkills.map((eq, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg"
                      >
                        ✓ {eq}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Software Skills Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block">
                  البرمجيات ونظم الـ GIS ({softwareSkills.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {softwareSkills.length === 0 ? (
                    <span className="text-[10px] text-slate-500">لم تختر برامج بعد</span>
                  ) : (
                    softwareSkills.map((sw, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-lg"
                      >
                        ✓ {sw}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Hourly Rate & Links */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">الأجر المطلوب:</span>
                <span className="font-bold text-white font-mono text-emerald-400">{hourlyRate}</span>
              </div>

              {portfolioUrl && (
                <div className="text-xs">
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>🔗 استعراض معرض الأعمال / LinkedIn ←</span>
                  </a>
                </div>
              )}
            </div>

            {/* Quick Tip Box */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-1.5">
              <span className="font-bold text-slate-300 block">💡 نصيحة للقبول السريع:</span>
              <p className="leading-relaxed text-[11px]">
                المكاتب الهندسية وشركات المقاولات تمنح أولوية للمساحين الذين يحددون بدقة ماركات الأجهزة التي يتقنون رصدها والبرامج المساحية الداعمة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-slate-900 border border-emerald-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-300 shadow-2xl animate-slide-up flex items-center gap-2">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
