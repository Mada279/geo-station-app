'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

export default function DashboardFreelancerPage() {
  const [jobTitle, setJobTitle] = useState('مهندس مساحة وجيوماتكس ممارس');
  const [experienceYears, setExperienceYears] = useState('5');
  const [skills, setSkills] = useState('Total Station Leica, Trimble GPS RTK, Civil 3D, ArcGIS Pro');
  const [bio, setBio] = useState('خبرة ميدانية واسعة في أعمال الرفع والتوقيع المساحي للمشروعات القومية والبنية التحتية والمباني السكنية.');
  const [hourlyRate, setHourlyRate] = useState('250');
  const [availability, setAvailability] = useState('متاح للمشروعات الحرة والعمل الجزئي');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadFreelancerData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: clientRow } = await supabase
            .from('clients')
            .select('preferences')
            .eq('user_id', user.id)
            .maybeSingle();

          if (clientRow?.preferences?.freelancer_profile) {
            const fp = clientRow.preferences.freelancer_profile;
            if (fp.jobTitle) setJobTitle(fp.jobTitle);
            if (fp.experienceYears) setExperienceYears(fp.experienceYears);
            if (fp.skills) setSkills(fp.skills);
            if (fp.bio) setBio(fp.bio);
            if (fp.hourlyRate) setHourlyRate(fp.hourlyRate);
            if (fp.availability) setAvailability(fp.availability);
          }
        }
      } catch (err) {
        console.error('Error loading freelancer profile:', err);
      }
    }

    loadFreelancerData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from('clients')
          .select('preferences')
          .eq('user_id', user.id)
          .maybeSingle();

        const updatedPrefs = {
          ...(existing?.preferences || {}),
          freelancer_profile: {
            jobTitle,
            experienceYears,
            skills,
            bio,
            hourlyRate,
            availability,
            updated_at: new Date().toISOString(),
          },
        };

        await supabase
          .from('clients')
          .update({ preferences: updatedPrefs })
          .eq('user_id', user.id);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Error saving freelancer profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              وحدة المستقل والمهندس
            </span>
            <span className="text-xs text-slate-400">الملف المهني والسيرة الذاتية</span>
          </div>
          <h1 className="text-2xl font-bold text-white">إدارة ملفي المهني (CV) والفرص</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/freelancer/profile"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
          >
            <span>✨</span>
            <span>مُنشئ السيرة الذاتية ومهارات الأجهزة المتقدم</span>
          </Link>
          <Link
            href="/freelancer/applications"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            <span>📋</span>
            <span>طلبات التوظيف</span>
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            <span>تصفح الفرص ←</span>
          </Link>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>تم حفظ وتحديث ملفك المهني بنجاح، أصبح متاحاً الآن للشركات وأصحاب المشروعات.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white">بيانات السيرة المهنية</h2>
            <p className="text-xs text-slate-400">تظهر هذه التفاصيل للشركات عند تقديمك على المشروعات والوظائف</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">المسمى الوظيفي / التخصص</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">سنوات الخبرة العملية</label>
                <input
                  type="text"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300">الأجهزة والبرامج التي تتقنها (المهارات التقنية)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Total Station, GPS, Civil 3D, ArcGIS"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">سعر اليومية / الساعة المتوقع (ج.م)</label>
                <input
                  type="text"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">حالة التفرغ</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="متاح للمشروعات الحرة والعمل الجزئي">متاح للمشروعات الحرة والعمل الجزئي</option>
                  <option value="متاح للدوام الكامل فوراً">متاح للدوام الكامل فوراً</option>
                  <option value="غير متاح حالياً">غير متاح حالياً</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300">نبذة تعريفية وسابقة الأعمال الميدانية</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ السيرة الذاتية المهنية'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xl">
              🎯
            </div>
            <h3 className="text-base font-bold text-white">كيف تستفيد من ميزة المستقل؟</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              عند اكتمال ملفك، ستظهر خبراتك لشركات المقاولات والمكاتب المساحية التي تبحث عن أطقم عمل ميدانية مؤقتة أو دائمة لتنفيذ المشروعات.
            </p>
            <div className="pt-2 border-t border-slate-800">
              <Link
                href="/jobs"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold block"
              >
                عرض {6} وظائف شاغرة حالياً ←
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
