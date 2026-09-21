'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

export interface ApplicationItem {
  id: string;
  job_id: string;
  applicant_id?: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email?: string;
  experience_years?: string;
  cv_link?: string;
  cover_letter?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  created_at: string;
  // Joined job posting details
  job_title?: string;
  job_location?: string;
  job_type?: string;
  // Joined Freelancer Profile details
  professional_title?: string;
  equipment_skills?: string[];
  software_skills?: string[];
  portfolio_url?: string;
  cv_file_url?: string;
  hourly_rate?: string;
}

export interface ProviderJobOption {
  id: string;
  title: string;
  location?: string;
  job_type?: string;
  status?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: string; desc: string }
> = {
  pending: {
    label: 'قيد الانتظار',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: '⏳',
    desc: 'طلب جديد بانتظار مراجعة الإدارة',
  },
  reviewed: {
    label: 'تمت المراجعة',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: '👀',
    desc: 'تم الاطلاع على السيرة الذاتية',
  },
  accepted: {
    label: 'مقبول مبدئياً',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: '✓',
    desc: 'مؤهل للمقابلة الشخصية والاختبار',
  },
  rejected: {
    label: 'مستبعد',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: '✕',
    desc: 'لا يتطابق مع متطلبات الوظيفة',
  },
};

function ApplicationsDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialJobId = searchParams.get('job_id') || 'all';

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [providerJobs, setProviderJobs] = useState<ProviderJobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'accepted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('مكتب مساحي معتمد');

  // Selected candidate detail modal
  const [detailCandidate, setDetailCandidate] = useState<ApplicationItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch provider jobs and applicant applications
  const loadATSData = async () => {
    setIsLoading(true);
    try {
      let currentUserId: string | null = null;

      // Identify provider user
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        currentUserId = authData.user.id;
        const metaName = authData.user.user_metadata?.company_name || authData.user.user_metadata?.full_name;
        if (metaName) setCompanyName(metaName);
      }

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (!currentUserId && parsed.id) currentUserId = parsed.id;
            if (parsed.org || parsed.name) setCompanyName(parsed.org || parsed.name);
          } catch {}
        }
      }

      // 1. Fetch provider's job postings
      let jobsQuery = supabase.from('job_postings').select('id, title, location, job_type, status');
      if (currentUserId) {
        jobsQuery = jobsQuery.eq('provider_id', currentUserId);
      }

      const { data: jobsData, error: jobsErr } = await jobsQuery;
      let myJobs: ProviderJobOption[] = [];

      if (!jobsErr && jobsData) {
        myJobs = jobsData;
      } else if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('SURVSTA_LOCAL_PROVIDER_JOBS');
        if (cached) {
          try {
            myJobs = JSON.parse(cached);
          } catch {}
        }
      }

      setProviderJobs(myJobs);

      // Create a map for quick job lookup
      const jobLookup: Record<string, ProviderJobOption> = {};
      myJobs.forEach((j) => {
        jobLookup[String(j.id)] = j;
      });

      // 2. Fetch applications from job_applications
      const jobIds = myJobs.map((j) => String(j.id));
      let appsList: ApplicationItem[] = [];

      const { data: appsData, error: appsErr } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      let combinedRaw: any[] = [];
      if (!appsErr && appsData) {
        combinedRaw = appsData.filter((app) => {
          if (jobIds.length > 0) {
            return jobIds.includes(String(app.job_id));
          }
          return true;
        });
      }

      // Check local storage for test submissions
      if (typeof window !== 'undefined') {
        const localAppsRaw = localStorage.getItem('SURVSTA_LOCAL_JOB_APPLICATIONS');
        if (localAppsRaw) {
          try {
            const parsedLocal: any[] = JSON.parse(localAppsRaw);
            parsedLocal.forEach((lApp) => {
              if (!combinedRaw.some((a) => a.id === lApp.id)) {
                combinedRaw.unshift(lApp);
              }
            });
          } catch {}
        }
      }

      // 3. Fetch structured profiles from freelancer_profiles
      const applicantIds = Array.from(new Set(combinedRaw.map((a: any) => a.applicant_id).filter(Boolean)));
      let freelancerProfileMap: Record<string, any> = {};

      if (applicantIds.length > 0) {
        const { data: profsData } = await supabase
          .from('freelancer_profiles')
          .select('*')
          .in('id', applicantIds);

        if (profsData) {
          profsData.forEach((p) => {
            freelancerProfileMap[p.id] = p;
          });
        }
      }

      if (typeof window !== 'undefined') {
        const cachedProf = localStorage.getItem('SURVSTA_FREELANCER_PROFILE');
        if (cachedProf) {
          try {
            const parsed = JSON.parse(cachedProf);
            if (parsed.id) freelancerProfileMap[parsed.id] = parsed;
          } catch {}
        }
      }

      appsList = combinedRaw.map((app: any) => {
        const linkedJob = jobLookup[String(app.job_id)];
        const prof = app.applicant_id ? freelancerProfileMap[app.applicant_id] : null;

        return {
          id: String(app.id),
          job_id: String(app.job_id),
          applicant_id: app.applicant_id,
          applicant_name: app.applicant_name,
          applicant_phone: app.applicant_phone,
          applicant_email: app.applicant_email,
          experience_years: prof?.years_of_experience ? `${prof.years_of_experience} سنوات` : app.experience_years,
          cv_link: prof?.cv_file_url || app.cv_link,
          cover_letter: app.cover_letter || prof?.bio,
          status: app.status || 'pending',
          created_at: app.created_at || new Date().toISOString(),
          job_title: app.job_title || linkedJob?.title || 'مهندس / مساح موقع',
          job_location: linkedJob?.location || 'القاهرة',
          job_type: linkedJob?.job_type || 'دوام كامل',
          professional_title: prof?.professional_title,
          equipment_skills: Array.isArray(prof?.equipment_skills) ? prof.equipment_skills : [],
          software_skills: Array.isArray(prof?.software_skills) ? prof.software_skills : [],
          portfolio_url: prof?.portfolio_url,
          cv_file_url: prof?.cv_file_url || app.cv_link,
          hourly_rate: prof?.hourly_rate,
        };
      });

      // If list is empty in brand-new dev environment, provide helpful demo candidates
      if (appsList.length === 0) {
        appsList = [
          {
            id: 'demo-app-1',
            job_id: myJobs[0]?.id || 'job-1',
            applicant_name: 'م. حسام الدين عبد الرحمن',
            applicant_phone: '01012345678',
            applicant_email: 'hossam.survey@gmail.com',
            experience_years: '4 سنوات في الرفع والتوقيع الإنشائي',
            cv_link: 'https://drive.google.com/drive/folders/demo-cv-1',
            cover_letter: 'مهندس مساحة خبرة 4 سنوات في كبرى مشاريع الطرق والكباري والعاصمة الإدارية. إجادة تامة لأجهزة Leica Total Station TS06/TS09 وأجهزة GNSS Trimble R10. متقن لبرامج AutoCAD Civil 3D وإعداد الحسابات الكمية.',
            status: 'pending',
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
            job_title: myJobs[0]?.title || 'مهندس / مسّاح موقع — مشروع استثماري',
            job_location: myJobs[0]?.location || 'الإسكندرية',
            job_type: myJobs[0]?.job_type || 'دوام كامل',
          },
          {
            id: 'demo-app-2',
            job_id: myJobs[0]?.id || 'job-1',
            applicant_name: 'م. ياسمين خالد المنشاوي',
            applicant_phone: '01198765432',
            applicant_email: 'yasmin.gis.eng@outlook.com',
            experience_years: '3 سنوات في نظم المعلومات الجغرافية والتحليل المكاني',
            cv_link: 'https://linkedin.com/in/demo-gis-specialist',
            cover_letter: 'أخصائية GIS حاصلة على دورات Esri المعتمدة. خبرة في بناء قواعد البيانات الجغرافية Geodatabases وإعداد الخرائط الطبوغرافية الرقمية وتحليل شبكات البنية التحتية والمرافق.',
            status: 'reviewed',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            job_title: myJobs[1]?.title || 'محلل نظم معلومات جغرافية GIS Specialist',
            job_location: myJobs[1]?.location || 'القاهرة',
            job_type: myJobs[1]?.job_type || 'دوام كامل',
          },
          {
            id: 'demo-app-3',
            job_id: myJobs[0]?.id || 'job-1',
            applicant_name: 'فني مساحة/ محمود السيد سليم',
            applicant_phone: '01234567890',
            applicant_email: 'mahmoud.surveyor@yahoo.com',
            experience_years: '6 سنوات في المساحة الميدانية والأنفاق',
            cv_link: '',
            cover_letter: 'فني مساحة محترف متخصص في رصد الميول والهبوط والأنفاق والمنشآت الخرسانية. خبرة في استخدام ميزان القامة الرقمي وأجهزة الليزر ثلاثي الأبعاد.',
            status: 'accepted',
            created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
            job_title: myJobs[0]?.title || 'فني مسح ليزري وأجهزة دقيقة',
            job_location: myJobs[0]?.location || 'الجيزة',
            job_type: myJobs[0]?.job_type || 'عقد مشروع',
          },
        ];
      }

      setApplications(appsList);
    } catch (err) {
      console.warn('[Applications] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadATSData();
  }, []);

  // Update status handler
  const handleUpdateStatus = async (appId: string, newStatus: ApplicationItem['status']) => {
    setUpdatingId(appId);
    try {
      // 1. Supabase update
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appId);

      if (error) {
        console.warn('Supabase status update notice:', error.message);
      }

      // 2. Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );

      if (detailCandidate && detailCandidate.id === appId) {
        setDetailCandidate({ ...detailCandidate, status: newStatus });
      }

      // 3. Update localStorage fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_LOCAL_JOB_APPLICATIONS');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const updated = parsed.map((a: any) =>
              a.id === appId ? { ...a, status: newStatus } : a
            );
            localStorage.setItem('SURVSTA_LOCAL_JOB_APPLICATIONS', JSON.stringify(updated));
          } catch {}
        }
      }

      // 4. Send in-app notification to applicant if registered
      const targetApp = applications.find((a) => a.id === appId);
      if (targetApp?.applicant_id) {
        try {
          await supabase.from('inapp_notifications').insert([
            {
              user_id: targetApp.applicant_id,
              title: `تحديث طلب التوظيف: ${targetApp.job_title}`,
              message: `قام مسؤولو التوظيف بتحديث حالة طلبك إلى "${STATUS_CONFIG[newStatus]?.label || newStatus}".`,
              type: newStatus === 'accepted' ? 'success' : 'info',
              link: '/jobs',
              is_read: false,
            },
          ]);
        } catch {}
      }

      showToast(`✓ تم تحديث حالة المتقدم إلى "${STATUS_CONFIG[newStatus]?.label}".`);
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('تعذر تحديث الحالة حالياً.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Generate WhatsApp Direct Chat Link
  const getWhatsAppChatUrl = (app: ApplicationItem) => {
    const raw = (app.applicant_phone || '').replace(/\D/g, '');
    const phoneNum = raw.startsWith('0') ? `2${raw}` : raw.startsWith('2') ? raw : `20${raw}`;
    const msg = `مرحباً أستاذ ${app.applicant_name}، نتواصل معك من جهة التوظيف (${companyName}) بخصوص تقديمك على وظيفة "${app.job_title}" عبر منصة Survsta.`;
    return `https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`;
  };

  // Filtered Applications memo
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Job Filter
      if (selectedJobId !== 'all' && String(app.job_id) !== selectedJobId) {
        return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = app.applicant_name.toLowerCase().includes(q);
        const matchesPhone = app.applicant_phone.includes(q);
        const matchesEmail = (app.applicant_email || '').toLowerCase().includes(q);
        const matchesJob = (app.job_title || '').toLowerCase().includes(q);
        const matchesExp = (app.experience_years || '').toLowerCase().includes(q);
        const matchesLetter = (app.cover_letter || '').toLowerCase().includes(q);

        if (!matchesName && !matchesPhone && !matchesEmail && !matchesJob && !matchesExp && !matchesLetter) {
          return false;
        }
      }

      return true;
    });
  }, [applications, selectedJobId, statusFilter, searchQuery]);

  // KPIs
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === 'pending').length;
    const reviewed = applications.filter((a) => a.status === 'reviewed').length;
    const accepted = applications.filter((a) => a.status === 'accepted').length;
    const rejected = applications.filter((a) => a.status === 'rejected').length;
    return { total, pending, reviewed, accepted, rejected };
  }, [applications]);

  return (
    <div className="min-h-screen bg-[#081933] text-gray-100 p-4 sm:p-6 lg:p-8 space-y-8" dir="rtl">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Link href="/provider/dashboard" className="hover:text-cyan-400 transition">لوحة المزوّد</Link>
            <span>/</span>
            <Link href="/provider/jobs" className="hover:text-cyan-400 transition">الوظائف المنشورة</Link>
            <span>/</span>
            <span className="text-cyan-400 font-semibold">نظام إدارة المتقدمين (ATS)</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl font-bold">
              👥
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                إدارة طلبات التوظيف (Applicant Tracking System)
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                مراجعة طلبات المساحين والمهندسين، فحص رسائل التقديم، والتواصل الفوري عبر الواتساب.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            href="/provider/jobs"
            className="px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-900/80 hover:bg-gray-800 text-xs font-bold text-gray-300 transition flex items-center gap-1.5"
          >
            <span>←</span>
            <span>العودة للوظائف</span>
          </Link>
          <Link
            href="/jobs"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
          >
            <span>🌐</span>
            <span>معاينة سوق الوظائف</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-cyan-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <span>إجمالي المتقدمين</span>
            <span className="text-cyan-400 text-base">📋</span>
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {isLoading ? '...' : stats.total}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">كافة الطلبات المسجلة</div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <span>قيد الانتظار والمراجعة</span>
            <span className="text-amber-400 text-base">⏳</span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {isLoading ? '...' : stats.pending}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">بحاجة لتقييم أو تواصل</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <span>مقبولون مبدئياً</span>
            <span className="text-emerald-400 text-base">✓</span>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {isLoading ? '...' : stats.accepted}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">مرشحون للمقابلة الشخصية</div>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <span>مستبعدون</span>
            <span className="text-rose-400 text-base">✕</span>
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono">
            {isLoading ? '...' : stats.rejected}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">لا تطابق مع الشروط</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-gray-800 bg-[#0F253E]/60 p-5 backdrop-blur-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Query */}
          <div className="md:col-span-5 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الهاتف، سنوات الخبرة، أو محتوى رسالة التقديم..."
              className="w-full rounded-xl border border-gray-700 bg-[#081933] pr-10 pl-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
            />
            <span className="absolute right-3.5 top-3 text-gray-400 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-gray-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Job Filter Dropdown */}
          <div className="md:col-span-4">
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                // Update URL query
                if (e.target.value === 'all') {
                  router.push('/provider/jobs/applications');
                } else {
                  router.push(`/provider/jobs/applications?job_id=${e.target.value}`);
                }
              }}
              className="w-full rounded-xl border border-gray-700 bg-[#081933] px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
            >
              <option value="all">جميع الوظائف المنشورة ({providerJobs.length})</option>
              {providerJobs.map((j) => (
                <option key={j.id} value={String(j.id)}>
                  {j.title} ({j.location || 'عام'})
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="md:col-span-3 flex justify-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedJobId('all');
                setStatusFilter('all');
                router.push('/provider/jobs/applications');
              }}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              مسح وتصفير الفلاتر
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-gray-800/80">
          {[
            { id: 'all', label: 'كافة الحالات', count: stats.total },
            { id: 'pending', label: 'قيد الانتظار', count: stats.pending },
            { id: 'reviewed', label: 'تمت المراجعة', count: stats.reviewed },
            { id: 'accepted', label: 'مقبول مبدئياً', count: stats.accepted },
            { id: 'rejected', label: 'مستبعد', count: stats.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'bg-[#081933] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  statusFilter === tab.id ? 'bg-black/20 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="rounded-2xl border border-gray-800 bg-[#0F253E]/40 p-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">جاري تحميل قائمة المتقدمين والبيانات...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-800 bg-[#0F253E]/20 p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-800/60 text-gray-400 text-3xl flex items-center justify-center mx-auto">
            📭
          </div>
          <h3 className="text-base font-bold text-white">لا توجد طلبات تقديم مطابقة للبحث</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            لم نجد أي متقدمين يطابقون شروط البحث والتصفية المحددة. يمكنك تجربة اختيار &quot;كافة الحالات&quot; أو مسح كلمات البحث.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setSelectedJobId('all');
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            عرض كافة المتقدمين
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const waUrl = getWhatsAppChatUrl(app);

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-gray-800/80 bg-[#0F253E]/70 hover:border-cyan-500/30 p-5 sm:p-6 transition shadow-lg space-y-4"
              >
                {/* Header Row: Candidate Info & Job Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-gray-800/80">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-700/20 border border-cyan-500/30 text-cyan-300 font-black text-lg flex items-center justify-center shrink-0">
                      {app.applicant_name ? app.applicant_name.charAt(0) : 'م'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          {app.applicant_name}
                        </h3>
                        {app.professional_title && (
                          <span className="text-xs text-emerald-400 font-semibold">
                            ({app.professional_title})
                          </span>
                        )}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${statusInfo.badgeClass}`}
                        >
                          <span>{statusInfo.icon}</span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                        <span className="text-cyan-300 font-semibold">
                          الوظيفة: {app.job_title}
                        </span>
                        <span>•</span>
                        <span>📍 {app.job_location}</span>
                        <span>•</span>
                        <span>💼 {app.job_type}</span>
                        {app.hourly_rate && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300 font-mono">💰 {app.hourly_rate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submission date & direct phone */}
                  <div className="text-left sm:text-left shrink-0">
                    <span className="text-[11px] text-gray-400 block font-mono">
                      تاريخ التقديم: {new Date(app.created_at).toLocaleDateString('ar-EG')}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400 mt-0.5 block">
                      {app.applicant_phone}
                    </span>
                  </div>
                </div>

                {/* Body: Experience and Cover Letter */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Experience & Contact Info */}
                  <div className="space-y-2.5 bg-[#081933]/60 p-4 rounded-xl border border-gray-800/60">
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-0.5">سنوات ومجال الخبرة:</span>
                      <p className="text-xs font-bold text-slate-200">
                        {app.experience_years || 'غير محدد في النموذج'}
                      </p>
                    </div>

                    {app.applicant_email && (
                      <div>
                        <span className="text-[11px] text-gray-400 block mb-0.5">البريد الإلكتروني:</span>
                        <p className="text-xs font-mono text-cyan-300 truncate">
                          {app.applicant_email}
                        </p>
                      </div>
                    )}

                    {app.cv_link ? (
                      <div className="pt-1">
                        <a
                          href={app.cv_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                        >
                          <span>📄 استعراض السيرة الذاتية (CV / Portfolio) ←</span>
                        </a>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-500 block pt-1">
                        لم يُرفق رابط سيرة ذاتية خارجي
                      </span>
                    )}
                  </div>

                  {/* Cover Letter Content */}
                  <div className="lg:col-span-2 bg-[#081933]/90 p-4 rounded-xl border border-gray-800/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-gray-400 block mb-1.5 flex items-center gap-1">
                        <span>💬</span>
                        <span>رسالة التقديم وخبرات العمل المساحي الميداني:</span>
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {app.cover_letter || 'لا توجد رسالة تقديم إضافية.'}
                      </p>
                    </div>

                    {app.cover_letter && app.cover_letter.length > 120 && (
                      <div className="pt-2 text-left">
                        <button
                          onClick={() => setDetailCandidate(app)}
                          className="text-[11px] text-cyan-400 hover:underline font-semibold"
                        >
                          قراءة الرسالة كاملة ←
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Skills & Portfolio Tags */}
                {((app.equipment_skills && app.equipment_skills.length > 0) ||
                  (app.software_skills && app.software_skills.length > 0) ||
                  app.portfolio_url) && (
                  <div className="bg-[#081933]/50 p-3 rounded-xl border border-gray-800/60 flex flex-wrap items-center gap-3 text-xs">
                    {app.equipment_skills && app.equipment_skills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-amber-400">الأجهزة:</span>
                        {app.equipment_skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium"
                          >
                            🛠️ {skill}
                          </span>
                        ))}
                        {app.equipment_skills.length > 4 && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            +{app.equipment_skills.length - 4} أجهزة أخرى
                          </span>
                        )}
                      </div>
                    )}

                    {app.software_skills && app.software_skills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-cyan-400">البرامج:</span>
                        {app.software_skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-medium"
                          >
                            💻 {skill}
                          </span>
                        ))}
                        {app.software_skills.length > 4 && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            +{app.software_skills.length - 4} برامج أخرى
                          </span>
                        )}
                      </div>
                    )}

                    {app.portfolio_url && (
                      <a
                        href={app.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mr-auto inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
                      >
                        🌐 معرض الأعمال (Portfolio) ↗
                      </a>
                    )}
                  </div>
                )}

                {/* Footer Actions: Contact & Status Change */}
                <div className="pt-3 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Contact actions */}
                  <div className="flex items-center gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
                    >
                      <span>💬 تواصل عبر واتساب</span>
                    </a>

                    {app.applicant_phone && (
                      <a
                        href={`tel:${app.applicant_phone}`}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                      >
                        <span>📞 اتصال</span>
                      </a>
                    )}

                    <button
                      onClick={() => setDetailCandidate(app)}
                      className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold rounded-xl border border-gray-800 transition"
                    >
                      التفاصيل الكاملة
                    </button>
                  </div>

                  {/* Right: Quick Status Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-gray-400 ml-1">تعديل الحالة:</span>

                    {app.status !== 'reviewed' && (
                      <button
                        disabled={updatingId === app.id}
                        onClick={() => handleUpdateStatus(app.id, 'reviewed')}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition disabled:opacity-50"
                      >
                        تم الاطلاع
                      </button>
                    )}

                    {app.status !== 'accepted' && (
                      <button
                        disabled={updatingId === app.id}
                        onClick={() => handleUpdateStatus(app.id, 'accepted')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition disabled:opacity-50"
                      >
                        قبول مبدئي
                      </button>
                    )}

                    {app.status !== 'rejected' && (
                      <button
                        disabled={updatingId === app.id}
                        onClick={() => handleUpdateStatus(app.id, 'rejected')}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition disabled:opacity-50"
                      >
                        استبعاد
                      </button>
                    )}

                    {app.status !== 'pending' && (
                      <button
                        disabled={updatingId === app.id}
                        onClick={() => handleUpdateStatus(app.id, 'pending')}
                        className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 text-[11px] transition disabled:opacity-50"
                      >
                        إعادة للانتظار
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Full Details Modal */}
      {detailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-cyan-500/40 bg-[#081933] p-6 shadow-2xl space-y-5 text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <button
                type="button"
                onClick={() => setDetailCandidate(null)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    الملف التعريفي للمتقدم: {detailCandidate.applicant_name}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    متقدم لوظيفة: {detailCandidate.job_title}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#0F253E] p-4 rounded-xl border border-gray-800">
                <div>
                  <span className="text-gray-400 block mb-0.5">رقم الهاتف:</span>
                  <span className="text-white font-mono font-bold">{detailCandidate.applicant_phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">البريد الإلكتروني:</span>
                  <span className="text-white font-mono">{detailCandidate.applicant_email || 'غير مسجل'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">سنوات الخبرة:</span>
                  <span className="text-cyan-300 font-bold">{detailCandidate.experience_years}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">الحالة الحالية:</span>
                  <span className="font-bold text-white">
                    {STATUS_CONFIG[detailCandidate.status]?.label}
                  </span>
                </div>
              </div>

              {detailCandidate.cv_link && (
                <div className="bg-[#0F253E] p-3 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block mb-1">رابط السيرة الذاتية (CV):</span>
                  <a
                    href={detailCandidate.cv_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline break-all"
                  >
                    {detailCandidate.cv_link} ↗
                  </a>
                </div>
              )}

              {/* Equipment Skills in Modal */}
              {detailCandidate.equipment_skills && detailCandidate.equipment_skills.length > 0 && (
                <div className="bg-[#0F253E] p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-amber-300 font-bold block flex items-center gap-1.5">
                    <span>🛠️</span>
                    <span>مهارات التعامل مع أجهزة المساحة:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailCandidate.equipment_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-200 border border-amber-500/30 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Software Skills in Modal */}
              {detailCandidate.software_skills && detailCandidate.software_skills.length > 0 && (
                <div className="bg-[#0F253E] p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-cyan-300 font-bold block flex items-center gap-1.5">
                    <span>💻</span>
                    <span>البرمجيات الهندسية ونظم المعلومات:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailCandidate.software_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detailCandidate.portfolio_url && (
                <div className="bg-[#0F253E] p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                  <span className="text-gray-400">معرض الأعمال ومشاريع سابقة:</span>
                  <a
                    href={detailCandidate.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    {detailCandidate.portfolio_url} ↗
                  </a>
                </div>
              )}

              <div className="bg-[#0F253E] p-4 rounded-xl border border-gray-800 space-y-1.5">
                <span className="text-gray-300 font-bold block">رسالة التقديم والخبرات المساحية:</span>
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {detailCandidate.cover_letter}
                </p>
              </div>

              {/* Status change actions inside modal */}
              <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <a
                    href={getWhatsAppChatUrl(detailCandidate)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    محادثة واتساب
                  </a>
                  {detailCandidate.applicant_phone && (
                    <a
                      href={`tel:${detailCandidate.applicant_phone}`}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
                    >
                      اتصال
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(detailCandidate.id, 'accepted')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                  >
                    قبول
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(detailCandidate.id, 'rejected')}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold"
                  >
                    استبعاد
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-gray-900 border border-cyan-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-cyan-300 shadow-2xl animate-slide-up flex items-center gap-2">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#081933] text-gray-100 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400">جاري تحميل نظام إدارة المتقدمين (ATS)...</p>
          </div>
        </div>
      }
    >
      <ApplicationsDashboardContent />
    </Suspense>
  );
}
