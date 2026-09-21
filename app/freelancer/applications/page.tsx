'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

export interface FreelancerTrackedApplication {
  id: string;
  job_id: string;
  applicant_id?: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email?: string;
  experience_years?: string;
  cv_link?: string;
  cover_letter?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  // Joined Job details
  job?: {
    id: string;
    title: string;
    location: string;
    job_type: string;
    salary?: string;
    description?: string;
    provider_id?: string;
  };
  // Joined Provider details
  company?: {
    id?: string;
    name: string;
    phone?: string;
    location?: string;
    whatsapp_url?: string;
  };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: string; step: number; desc: string }
> = {
  pending: {
    label: 'قيد الانتظار والمراجعة',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: '⏳',
    step: 1,
    desc: 'تم إرسال ملفك بنجاح وبانتظار اطلاع مسؤول التوظيف بالشركة.',
  },
  reviewed: {
    label: 'تم الاطلاع والمراجعة',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: '👀',
    step: 2,
    desc: 'اطلع مسؤول التوظيف على سيرتك الذاتية وخبراتك وجاري تقييم المرشحين.',
  },
  accepted: {
    label: 'تم القبول المبدئي للمقابلة',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: '🎉',
    step: 3,
    desc: 'مبروك! تم قبول ملفك بنجاح. يمكنك الآن التواصل المباشر مع الشركة لتنسيق موعد المقابلة.',
  },
  rejected: {
    label: 'لم يتم التوفيق (مستبعد)',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: '✕',
    step: 3,
    desc: 'تم الاكتفاء في هذه الفرصة أو عدم مطابقة الشروط الميدانية. نتمنى لك التوفيق في فرص أخرى.',
  },
  withdrawn: {
    label: 'تم سحب الطلب',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    icon: '↩️',
    step: 0,
    desc: 'قمت بسحب طلب التقديم على هذه الوظيفة بناءً على رغبتك.',
  },
};

function FreelancerApplicationsContent() {
  const [applications, setApplications] = useState<FreelancerTrackedApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'accepted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [selectedLetterApp, setSelectedLetterApp] = useState<FreelancerTrackedApplication | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentApplicantName, setCurrentApplicantName] = useState<string>('مهندس مساحة');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch applications for the authenticated Freelancer
  const loadApplications = async () => {
    setLoading(true);
    try {
      let authUserId: string | null = null;
      let authUserEmail: string | null = null;
      let authUserPhone: string | null = null;

      // 1. Check Supabase Auth
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        authUserId = authData.user.id;
        authUserEmail = authData.user.email || null;
        authUserPhone = authData.user.user_metadata?.phone || null;
        if (authData.user.user_metadata?.full_name || authData.user.user_metadata?.name) {
          setCurrentApplicantName(authData.user.user_metadata.full_name || authData.user.user_metadata.name);
        }
      }

      // 2. Local storage session
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (!authUserId && parsed.id) authUserId = parsed.id;
            if (!authUserEmail && parsed.email) authUserEmail = parsed.email;
            if (!authUserPhone && parsed.phone) authUserPhone = parsed.phone;
            if (parsed.name) setCurrentApplicantName(parsed.name);
          } catch {}
        }
      }

      // 3. Query job_applications table
      let rawApps: any[] = [];
      const { data: dbApps, error: dbErr } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!dbErr && dbApps) {
        rawApps = dbApps.filter((a) => {
          if (authUserId && a.applicant_id === authUserId) return true;
          if (authUserEmail && a.applicant_email === authUserEmail) return true;
          if (authUserPhone && a.applicant_phone === authUserPhone) return true;
          // If in local testing mode without specific applicant_id filter, show records
          return !authUserId && !authUserEmail;
        });
      }

      // Merge with localStorage fallback
      if (typeof window !== 'undefined') {
        const localAppsRaw = localStorage.getItem('SURVSTA_LOCAL_JOB_APPLICATIONS');
        if (localAppsRaw) {
          try {
            const parsedLocal: any[] = JSON.parse(localAppsRaw);
            parsedLocal.forEach((lApp) => {
              if (!rawApps.some((a) => a.id === lApp.id)) {
                rawApps.unshift(lApp);
              }
            });
          } catch {}
        }
      }

      // Fallback demo data if user has no applications yet
      if (rawApps.length === 0) {
        rawApps = [
          {
            id: 'demo-app-1',
            job_id: 'job-alex-1',
            applicant_name: currentApplicantName,
            applicant_phone: authUserPhone || '01012345678',
            applicant_email: authUserEmail || 'surveyor@example.com',
            experience_years: '4 سنوات في الرفع والتوقيع الإنشائي',
            cover_letter: 'مهندس مساحة خبرة 4 سنوات في مشروعات الإسكان والطرق. إجادة تامة لأجهزة Total Station Leica TS06 وأجهزة GPS RTK وبرامج Civil 3D وحساب الكميات.',
            status: 'accepted',
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            mock_job_title: 'مهندس / مسّاح موقع — مشروع سكني واستثماري',
            mock_company_name: 'مكتب النخبة للمساحة ونظم المعلومات',
            mock_location: 'الإسكندرية',
            mock_job_type: 'دوام كامل',
            mock_phone: '01033134413',
          },
          {
            id: 'demo-app-2',
            job_id: 'job-cairo-2',
            applicant_name: currentApplicantName,
            applicant_phone: authUserPhone || '01012345678',
            applicant_email: authUserEmail || 'surveyor@example.com',
            experience_years: '4 سنوات في نظم المعلومات الجغرافية',
            cover_letter: 'أخصائي نظم معلومات جغرافية معتمد من Esri. خبرة في بناء قواعد البيانات الجغرافية Geodatabases وإنتاج الخرائط الرقمية بدقة عالية.',
            status: 'reviewed',
            created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
            mock_job_title: 'محلل نظم معلومات جغرافية GIS Specialist',
            mock_company_name: 'دلتا جيوماتكس للاستشارات الهندسية',
            mock_location: 'القاهرة',
            mock_job_type: 'دوام كامل',
            mock_phone: '01223344556',
          },
          {
            id: 'demo-app-3',
            job_id: 'job-beheira-3',
            applicant_name: currentApplicantName,
            applicant_phone: authUserPhone || '01012345678',
            applicant_email: authUserEmail || 'surveyor@example.com',
            experience_years: '4 سنوات عمل ميداني',
            cover_letter: 'مستعد للعمل الميداني الفوري على مشروعات الطرق والري، متقن للوقوف بالعواكس والشواخص وضبط ميزان القامة.',
            status: 'pending',
            created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
            mock_job_title: 'مساعد مسّاح موقع (عواكس وشواخص)',
            mock_company_name: 'الغرب للمقاولات والخدمات المساحية',
            mock_location: 'البحيرة',
            mock_job_type: 'عقد مشروع',
            mock_phone: '01122334455',
          },
        ];
      }

      // 4. Relational Joins: Fetch Job Postings and Providers
      const jobIds = Array.from(new Set(rawApps.map((a) => a.job_id).filter(Boolean)));
      let jobMap: Record<string, any> = {};

      if (jobIds.length > 0) {
        const { data: jobsData } = await supabase
          .from('job_postings')
          .select('id, title, location, job_type, salary, description, provider_id')
          .in('id', jobIds);

        if (jobsData) {
          jobsData.forEach((j) => {
            jobMap[String(j.id)] = j;
          });
        }
      }

      // Fetch Provider Companies
      const providerIds = Array.from(
        new Set(
          Object.values(jobMap)
            .map((j) => j.provider_id)
            .filter(Boolean)
        )
      );

      let providerMap: Record<string, any> = {};
      if (providerIds.length > 0) {
        const { data: provsData } = await supabase
          .from('providers')
          .select('id, name, company_name, phone, location')
          .in('id', providerIds);

        if (provsData) {
          provsData.forEach((p) => {
            providerMap[p.id] = {
              name: p.company_name || p.name || 'مكتب مساحي معتمد',
              phone: p.phone,
              location: p.location,
            };
          });
        }

        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, user_id, full_name, company_name, phone_number')
          .in('id', providerIds);

        if (clientsData) {
          clientsData.forEach((c) => {
            const name = c.company_name || c.full_name || 'مكتب مساحي معتمد';
            if (c.id && !providerMap[c.id]) {
              providerMap[c.id] = { name, phone: c.phone_number };
            }
            if (c.user_id && !providerMap[c.user_id]) {
              providerMap[c.user_id] = { name, phone: c.phone_number };
            }
          });
        }
      }

      // Construct final unified list
      const mergedList: FreelancerTrackedApplication[] = rawApps.map((raw) => {
        const linkedJob = jobMap[String(raw.job_id)];
        const linkedCompany = linkedJob?.provider_id ? providerMap[linkedJob.provider_id] : null;

        const companyName =
          linkedCompany?.name ||
          raw.mock_company_name ||
          'مكتب مساحي معتمد';

        const phone =
          linkedCompany?.phone ||
          raw.mock_phone ||
          '01033134413';

        const rawPhoneDigits = phone.replace(/\D/g, '');
        const waNumber = rawPhoneDigits.startsWith('0')
          ? `2${rawPhoneDigits}`
          : rawPhoneDigits.startsWith('2')
          ? rawPhoneDigits
          : `20${rawPhoneDigits}`;

        const jobTitle = linkedJob?.title || raw.mock_job_title || 'وظيفة هندسية ومساحية';
        const waMsg = `مرحباً، أتواصل معكم بخصوص قبول ملفي لوظيفة "${jobTitle}" عبر منصة Survsta لتنسيق الخطوة القادمة.`;
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`;

        return {
          id: String(raw.id),
          job_id: String(raw.job_id),
          applicant_id: raw.applicant_id,
          applicant_name: raw.applicant_name || currentApplicantName,
          applicant_phone: raw.applicant_phone || authUserPhone || '',
          applicant_email: raw.applicant_email || authUserEmail || '',
          experience_years: raw.experience_years || '',
          cv_link: raw.cv_link || '',
          cover_letter: raw.cover_letter || '',
          status: raw.status || 'pending',
          created_at: raw.created_at || new Date().toISOString(),
          job: {
            id: String(raw.job_id),
            title: jobTitle,
            location: linkedJob?.location || raw.mock_location || 'الجمهورية',
            job_type: linkedJob?.job_type || raw.mock_job_type || 'دوام كامل',
            salary: linkedJob?.salary,
            description: linkedJob?.description,
            provider_id: linkedJob?.provider_id,
          },
          company: {
            name: companyName,
            phone: phone,
            location: linkedCompany?.location || linkedJob?.location,
            whatsapp_url: waUrl,
          },
        };
      });

      setApplications(mergedList);
    } catch (err) {
      console.warn('Error loading freelancer applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // Action: Withdraw Application (Only if pending)
  const handleWithdrawApplication = async (app: FreelancerTrackedApplication) => {
    if (!confirm(`هل أنت متأكد من رغبتك في إلغاء التقديم على وظيفة "${app.job?.title}"؟`)) {
      return;
    }

    setWithdrawingId(app.id);
    try {
      // 1. Supabase update to 'withdrawn'
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
        .eq('id', app.id);

      if (error) {
        console.warn('Supabase withdraw notice:', error.message);
      }

      // 2. Update local state
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'withdrawn' } : a))
      );

      // 3. Update localStorage fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_LOCAL_JOB_APPLICATIONS');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const updated = parsed.map((a: any) =>
              a.id === app.id ? { ...a, status: 'withdrawn' } : a
            );
            localStorage.setItem('SURVSTA_LOCAL_JOB_APPLICATIONS', JSON.stringify(updated));
          } catch {}
        }
      }

      // 4. Alert Provider via inapp_notifications
      if (app.job?.provider_id) {
        try {
          await supabase.from('inapp_notifications').insert([
            {
              user_id: app.job.provider_id,
              title: `سحب طلب توظيف: ${app.job.title}`,
              message: `قام المتقدم ${app.applicant_name} بسحب طلب التقديم على وظيفة "${app.job.title}".`,
              type: 'info',
              link: '/provider/jobs/applications',
              is_read: false,
            },
          ]);
        } catch {}
      }

      showToast('✓ تم إلغاء وسحب طلب التقديم بنجاح.');
    } catch (err) {
      console.error('Withdraw failed:', err);
      showToast('تعذر سحب الطلب حالياً.');
    } finally {
      setWithdrawingId(null);
    }
  };

  // Filtered Applications memo
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Status Filter
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesJob = (app.job?.title || '').toLowerCase().includes(q);
        const matchesCompany = (app.company?.name || '').toLowerCase().includes(q);
        const matchesLocation = (app.job?.location || '').toLowerCase().includes(q);
        const matchesLetter = (app.cover_letter || '').toLowerCase().includes(q);

        if (!matchesJob && !matchesCompany && !matchesLocation && !matchesLetter) {
          return false;
        }
      }

      return true;
    });
  }, [applications, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = applications.filter((a) => a.status !== 'withdrawn').length;
    const pending = applications.filter((a) => a.status === 'pending').length;
    const reviewed = applications.filter((a) => a.status === 'reviewed').length;
    const accepted = applications.filter((a) => a.status === 'accepted').length;
    return { total, pending, reviewed, accepted };
  }, [applications]);

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8" dir="rtl">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/dashboard" className="hover:text-emerald-400 transition">اللوحة الرئيسية</Link>
            <span>/</span>
            <Link href="/dashboard/freelancer" className="hover:text-emerald-400 transition">وحدة المستقل</Link>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">تتبع طلبات التوظيف</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
              💼
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                طلبات التوظيف ومتابعة القبول
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                تتبع حالة مراجعة سيرتك الذاتية من قبل الشركات، والتواصل المباشر مع أصحاب العمل عند القبول.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            href="/dashboard/freelancer"
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-300 transition flex items-center gap-1.5"
          >
            <span>👤</span>
            <span>ملفي المهني (CV)</span>
          </Link>
          <Link
            href="/jobs"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
          >
            <span>+</span>
            <span>تصفح فرص عمل جديدة</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>إجمالي الوظائف المقدم عليها</span>
            <span className="text-emerald-400 text-base">📑</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {loading ? '...' : stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">فرص عمل قيد التتبع</div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-4">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>قيد المراجعة والانتظار</span>
            <span className="text-amber-400 text-base">⏳</span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {loading ? '...' : stats.pending}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">بانتظار رد جهة التوظيف</div>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-slate-900/80 p-4">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>تم الاطلاع على الملف</span>
            <span className="text-blue-400 text-base">👀</span>
          </div>
          <div className="text-2xl font-black text-blue-300 font-mono">
            {loading ? '...' : stats.reviewed}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">تمت مراجعة السيرة الذاتية</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-4">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>تم القبول المبدئي 🎉</span>
            <span className="text-emerald-400 text-base">✓</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {loading ? '...' : stats.accepted}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">متاح للتواصل المباشر</div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search Query */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالمسمى الوظيفي، اسم الشركة، أو المحافظة..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <span className="absolute right-3.5 top-3 text-slate-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadApplications}
              disabled={loading}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              تحديث الحالة
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-800/80">
          {[
            { id: 'all', label: 'كافة الطلبات' },
            { id: 'pending', label: 'قيد الانتظار' },
            { id: 'reviewed', label: 'تمت المراجعة' },
            { id: 'accepted', label: 'تم القبول' },
            { id: 'rejected', label: 'مستبعد' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">جاري تحميل سجل طلبات التوظيف والبيانات الحية...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 text-3xl flex items-center justify-center mx-auto">
            💼
          </div>
          <h3 className="text-base font-bold text-white">لا توجد طلبات تقديم مسجلة في هذا التبويب</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            يمكنك استكشاف الوظائف المتاحة حالياً في سوق الوظائف المساحية والتقديم على الفرص التي تناسب تخصصك وخبراتك الميدانية.
          </p>
          <div className="pt-2">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition"
            >
              استعراض وظائف المساحة المتاحة ←
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const isAccepted = app.status === 'accepted';
            const isPending = app.status === 'pending';

            return (
              <div
                key={app.id}
                className={`rounded-2xl border p-5 sm:p-6 transition shadow-xl space-y-5 ${
                  isAccepted
                    ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 to-slate-900'
                    : 'border-slate-800 bg-slate-900/90'
                }`}
              >
                {/* Top Row: Job Title & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                        <span>🏢</span>
                        <span>{app.company?.name}</span>
                      </span>
                      <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                        📍 {app.job?.location}
                      </span>
                      <span className="text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                        {app.job?.job_type}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {app.job?.title}
                    </h2>
                  </div>

                  <div className="flex flex-col items-start sm:items-end shrink-0">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold border flex items-center gap-1.5 ${statusInfo.badgeClass}`}
                    >
                      <span>{statusInfo.icon}</span>
                      <span>{statusInfo.label}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono mt-1">
                      تاريخ التقديم: {new Date(app.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>

                {/* Status Stepper Timeline */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300">مراحل مراجعة الطلب:</span>
                    <span className="text-cyan-400 font-medium">{statusInfo.desc}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {/* Step 1: Submission */}
                    <div
                      className={`p-2 rounded-lg border transition ${
                        statusInfo.step >= 1
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="text-[11px]">1. إرسال الطلب</div>
                      <span className="text-[10px] text-slate-400 block font-normal">مكتمل</span>
                    </div>

                    {/* Step 2: Under Review */}
                    <div
                      className={`p-2 rounded-lg border transition ${
                        statusInfo.step >= 2
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="text-[11px]">2. مراجعة السيرة الذاتية</div>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {statusInfo.step >= 2 ? 'تم الاطلاع' : 'قيد الانتظار'}
                      </span>
                    </div>

                    {/* Step 3: Decision */}
                    <div
                      className={`p-2 rounded-lg border transition ${
                        isAccepted
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold animate-pulse'
                          : app.status === 'rejected'
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="text-[11px]">3. قرار التوظيف</div>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {isAccepted ? 'قبول مبدئي' : app.status === 'rejected' ? 'مستبعد' : 'في مرحلة التقييم'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submitted Cover Letter Snippet */}
                {app.cover_letter && (
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <span>💬</span>
                        <span>رسالة التقديم التي أرسلتها للشركة:</span>
                      </span>
                      <button
                        onClick={() => setSelectedLetterApp(app)}
                        className="text-[11px] text-cyan-400 hover:underline font-semibold"
                      >
                        عرض كامل الرسالة ←
                      </button>
                    </div>
                    <p className="text-slate-400 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                      {app.cover_letter}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* If Accepted: Reveal Contact Company buttons */}
                    {isAccepted ? (
                      <>
                        {app.company?.whatsapp_url && (
                          <a
                            href={app.company.whatsapp_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                          >
                            <span>💬 تواصل مع الشركة عبر واتساب</span>
                          </a>
                        )}

                        {app.company?.phone && (
                          <a
                            href={`tel:${app.company.phone}`}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                          >
                            <span>📞 اتصال هاتفي</span>
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {isPending
                          ? 'سيتم تفعيل وسائل التواصل المباشر فور قبول ملفك من جهة التوظيف.'
                          : 'الملف قيد المراجعة لدى فريق التوظيف بالشركة.'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* If Pending: Reveal Withdraw button */}
                    {isPending && (
                      <button
                        disabled={withdrawingId === app.id}
                        onClick={() => handleWithdrawApplication(app)}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition disabled:opacity-50"
                      >
                        {withdrawingId === app.id ? 'جاري السحب...' : 'إلغاء التقديم'}
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedLetterApp(app)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                    >
                      تفاصيل الطلب
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cover Letter Full Modal */}
      {selectedLetterApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setSelectedLetterApp(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
              <div>
                <h3 className="text-base font-bold text-white">
                  تفاصيل طلب التقديم: {selectedLetterApp.job?.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  جهة التوظيف: {selectedLetterApp.company?.name}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">الاسم المسجل بالطلب:</span>
                  <span className="text-white font-bold">{selectedLetterApp.applicant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">رقم الهاتف:</span>
                  <span className="text-cyan-400 font-mono">{selectedLetterApp.applicant_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">سنوات ومجال الخبرة:</span>
                  <span className="text-emerald-400">{selectedLetterApp.experience_years}</span>
                </div>
              </div>

              {selectedLetterApp.cv_link && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">رابط السيرة الذاتية المرفق:</span>
                  <a
                    href={selectedLetterApp.cv_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline break-all"
                  >
                    {selectedLetterApp.cv_link}
                  </a>
                </div>
              )}

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-300 block">رسالة التقديم وخبرات العمل بالأجهزة:</span>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedLetterApp.cover_letter || 'لا توجد رسالة تقديم إضافية.'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLetterApp(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-slate-900 border border-emerald-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-300 shadow-2xl animate-slide-up flex items-center gap-2">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function FreelancerApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#040d1a] text-slate-100 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">جاري تحميل سجل طلبات التوظيف...</p>
          </div>
        </div>
      }
    >
      <FreelancerApplicationsContent />
    </Suspense>
  );
}
