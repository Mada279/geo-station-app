'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

export interface JobPostingItem {
  id: string;
  provider_id?: string;
  title: string;
  description: string;
  location: string;
  job_type: string;
  salary?: string;
  experience_level?: string;
  requirements?: string[];
  status: 'open' | 'closed';
  created_at: string;
}

const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'القليوبية',
  'الإسكندرية',
  'مطروح',
  'البحيرة',
  'الدقهلية',
  'الغربية',
  'الشرقية',
  'المنوفية',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'شمال سيناء',
  'جنوب سيناء',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الالوادي الجديد',
];

export default function ProviderJobsPage() {
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Applications view state
  const [applicationsMap, setApplicationsMap] = useState<Record<string, any[]>>({});
  const [viewingJob, setViewingJob] = useState<JobPostingItem | null>(null);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newLocation, setNewLocation] = useState<string>('القاهرة');
  const [newJobType, setNewJobType] = useState<string>('دوام كامل');
  const [newExperience, setNewExperience] = useState<string>('1 - 3 سنوات');
  const [newSalary, setNewSalary] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newRequirements, setNewRequirements] = useState<string>('');

  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [providerOrg, setProviderOrg] = useState<string>('مكتب مساحي معتمد');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch jobs for this provider
  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      let userId: string | null = null;
      let email: string | null = null;

      // 1. Supabase Auth session
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        userId = authData.user.id;
        email = authData.user.email || null;
      }

      // 2. Local storage session fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (!userId && parsed.id) userId = parsed.id;
            if (!email && parsed.email) email = parsed.email;
            if (parsed.org || parsed.organization || parsed.name) {
              setProviderOrg(parsed.org || parsed.organization || parsed.name);
            }
          } catch {}
        }
      }

      setActiveUserId(userId);

      // 3. Query job_postings from Supabase
      let query = supabase.from('job_postings').select('*').order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('provider_id', userId);
      }

      const { data, error } = await query;

      let currentJobList: JobPostingItem[] = [];
      if (!error && data) {
        currentJobList = data as JobPostingItem[];
        setJobs(currentJobList);
      } else {
        console.warn('[fetchJobs] Supabase select notice:', error?.message);
        // Fallback to local cache
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('SURVSTA_LOCAL_PROVIDER_JOBS');
          if (cached) {
            currentJobList = JSON.parse(cached);
            setJobs(currentJobList);
          }
        }
      }

      // 3. Fetch applications for these jobs
      try {
        const { data: appsData } = await supabase
          .from('job_applications')
          .select('*')
          .order('created_at', { ascending: false });

        const map: Record<string, any[]> = {};
        if (appsData) {
          appsData.forEach((app) => {
            const jid = String(app.job_id);
            if (!map[jid]) map[jid] = [];
            map[jid].push(app);
          });
        }

        // Also check local cache
        if (typeof window !== 'undefined') {
          const storedApps = localStorage.getItem('SURVSTA_LOCAL_JOB_APPLICATIONS');
          if (storedApps) {
            try {
              const parsed: any[] = JSON.parse(storedApps);
              parsed.forEach((app: any) => {
                const jid = String(app.job_id);
                if (!map[jid]) map[jid] = [];
                if (!map[jid].some((a) => a.id === app.id)) {
                  map[jid].push(app);
                }
              });
            } catch {}
          }
        }
        setApplicationsMap(map);
      } catch (appQueryErr) {
        console.warn('[job_applications fetch notice]:', appQueryErr);
      }
    } catch (err) {
      console.warn('[fetchJobs exception]:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('SURVSTA_LOCAL_PROVIDER_JOBS');
        if (cached) setJobs(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Handle Add New Job
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('⚠️ يرجى إدخال المسمى الوظيفي.');
      return;
    }

    setIsSaving(true);
    try {
      const parsedReqs = newRequirements
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      const payload: any = {
        title: newTitle.trim(),
        description: newDescription.trim() || 'فرصة عمل هندسية ومساحية لدى مكتب معتمد في منصة Survsta.',
        location: newLocation,
        job_type: newJobType,
        salary: newSalary.trim() || 'يُحدد في المقابلة',
        experience_level: newExperience,
        requirements: parsedReqs,
        status: 'open',
      };

      if (activeUserId) {
        payload.provider_id = activeUserId;
      }

      let { data, error } = await supabase.from('job_postings').insert([payload]).select();

      // If provider_id foreign key constraint fails, retry without provider_id
      if (error && (error.message?.includes('provider_id') || error.code === '23503')) {
        delete payload.provider_id;
        const retry = await supabase.from('job_postings').insert([payload]).select();
        data = retry.data;
        error = retry.error;
      }

      const newJob: JobPostingItem = {
        id: data?.[0]?.id || `JOB-${Date.now()}`,
        provider_id: activeUserId || undefined,
        title: newTitle.trim(),
        description: newDescription.trim() || 'فرصة عمل هندسية ومساحية لدى مكتب معتمد في منصة Survsta.',
        location: newLocation,
        job_type: newJobType,
        salary: newSalary.trim() || 'يُحدد في المقابلة',
        experience_level: newExperience,
        requirements: parsedReqs,
        status: 'open',
        created_at: new Date().toISOString(),
      };

      setJobs((prev) => [newJob, ...prev]);

      // Cache locally
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('SURVSTA_LOCAL_PROVIDER_JOBS') || '[]');
        localStorage.setItem('SURVSTA_LOCAL_PROVIDER_JOBS', JSON.stringify([newJob, ...existing]));
      }

      // Add in-app notification
      try {
        await supabase.from('inapp_notifications').insert({
          title: 'تم نشر فرصة عمل جديدة',
          message: `تم نشر الإعلان الوظيفي "${newTitle.trim()}" بنجاح في سوق وظائف المساحة والهندسة.`,
          type: 'success',
          link: '/jobs',
        });
      } catch {}

      showToast(`🎉 تم نشر وظيفة "${newTitle.trim()}" بنجاح في سوق العمل الهندسي!`);

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewRequirements('');
      setNewSalary('');
      setIsModalOpen(false);
    } catch (err) {
      console.warn('[handleSaveJob Exception]:', err);
      showToast('❌ تعذر حفظ الوظيفة حالياً.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Status (open/closed)
  const handleToggleStatus = async (job: JobPostingItem) => {
    const nextStatus: 'open' | 'closed' = job.status === 'open' ? 'closed' : 'open';
    const nextLabel = nextStatus === 'open' ? 'مفتوحة للتقديم' : 'مغلقة ومكتملة';

    try {
      await supabase.from('job_postings').update({ status: nextStatus }).eq('id', job.id);

      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
      );

      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('SURVSTA_LOCAL_PROVIDER_JOBS') || '[]');
        const updated = existing.map((j: JobPostingItem) =>
          j.id === job.id ? { ...j, status: nextStatus } : j
        );
        localStorage.setItem('SURVSTA_LOCAL_PROVIDER_JOBS', JSON.stringify(updated));
      }

      showToast(`✅ تم تعديل حالة الإعلان إلى "${nextLabel}".`);
    } catch {
      showToast('تعذر تغيير الحالة حالياً.');
    }
  };

  // Delete Job
  const handleDeleteJob = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف إعلان وظيفة "${title}"؟`)) return;
    try {
      await supabase.from('job_postings').delete().eq('id', id);
      setJobs((prev) => prev.filter((j) => j.id !== id));

      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('SURVSTA_LOCAL_PROVIDER_JOBS') || '[]');
        localStorage.setItem(
          'SURVSTA_LOCAL_PROVIDER_JOBS',
          JSON.stringify(existing.filter((j: any) => j.id !== id))
        );
      }
      showToast('🗑️ تم حذف الإعلان الوظيفي.');
    } catch {
      showToast('تعذر الحذف حالياً.');
    }
  };

  // Update applicant status (accepted / rejected / reviewed)
  const handleUpdateApplicationStatus = async (appId: string, newStatus: string) => {
    setUpdatingAppId(appId);
    try {
      await supabase
        .from('job_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', appId);

      setApplicationsMap((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          next[k] = next[k].map((a) => (a.id === appId ? { ...a, status: newStatus } : a));
        });
        return next;
      });

      showToast(`✓ تم تحديث حالة المتقدم إلى "${newStatus === 'accepted' ? 'مقبول' : 'مرفوض'}".`);
    } catch (err) {
      console.warn('Update application status error:', err);
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Filtered Jobs
  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchLoc = job.location.toLowerCase().includes(q);
      const matchType = job.job_type.toLowerCase().includes(q);
      return matchTitle || matchLoc || matchType;
    }
    return true;
  });

  const openJobsCount = jobs.filter((j) => j.status === 'open').length;

  return (
    <div className="min-h-screen bg-[#081933] text-right text-gray-100 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Topbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-500/20 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                التوظيف واستقطاب الكفاءات
              </span>
              <span className="text-xs text-gray-400">سوق العمل الهندسي</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>💼</span>
              <span>إدارة الوظائف الهندسية المنشورة (Job Postings)</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              انشر إعلانات التوظيف لمهندسي ومساحي المواقع وفنيي الـ GIS، وتابع طلبات التقديم المباشرة عبر منصة Survsta.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/provider/jobs/applications"
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 px-4 py-2.5 text-xs font-bold transition"
            >
              <span>👥</span>
              <span>مركز المتقدمين (ATS)</span>
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition cursor-pointer"
            >
              <span>+</span>
              <span>نشر وظيفة جديدة</span>
            </button>

            <Link
              href="/jobs"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900/60 px-3.5 py-2.5 text-xs text-gray-300 hover:bg-gray-800 transition"
            >
              <span>🌐</span>
              <span>سوق الوظائف العام</span>
            </Link>
          </div>
        </div>

        {/* Stats KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>إجمالي الوظائف المعلنة</span>
              <span className="text-cyan-400 text-lg">💼</span>
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {isLoading ? '...' : jobs.length}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">إعلانات مسجلة من حساب مكتبك</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>الوظائف النشطة (مفتوحة)</span>
              <span className="text-emerald-400 text-lg">🟢</span>
            </div>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              {isLoading ? '...' : openJobsCount}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">معروضة حالياً وتستقبل طلبات التقديم</div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>جهة التوظيف</span>
              <span className="text-amber-400 text-lg">🏢</span>
            </div>
            <div className="text-lg font-bold text-amber-300 truncate">
              {providerOrg}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">تظهر كصاحب العمل في بطاقة الوظيفة</div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/60 p-4 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالمسمى الوظيفي، المحافظة، أو نوع الدوام..."
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

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'bg-[#081933] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                جميع الوظائف ({jobs.length})
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'open'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'bg-[#081933] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                المفتوحة فقط ({openJobsCount})
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'closed'
                    ? 'bg-gray-700 text-white font-bold shadow'
                    : 'bg-[#081933] text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                المغلقة ({jobs.length - openJobsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/40 p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-cyan-300">جارٍ جلب إعلانات الوظائف المسجلة...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredJobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-cyan-500/30 bg-[#0F253E]/40 p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mx-auto flex items-center justify-center text-3xl shadow-inner">
              💼
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">لا توجد وظائف معلنة حالياً</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                هل تحتاج لمهندسي مساحة موقع، مشغلي محطات رصد Total Station، أو محللي نظم معلومات جغرافية؟ انشر أول إعلان وظيفي الآن لتصل إلى آلاف الكوادر الهندسية.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition cursor-pointer"
            >
              <span>+</span>
              <span>نشر أول وظيفة الآن</span>
            </button>
          </div>
        )}

        {/* Jobs Grid */}
        {!isLoading && filteredJobs.length > 0 && (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const isOpen = job.status === 'open';

              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-5 shadow-xl backdrop-blur-md hover:border-cyan-500/40 transition space-y-4"
                >
                  {/* Job Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-white">{job.title}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isOpen
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-gray-700/40 text-gray-400 border-gray-700'
                          }`}
                        >
                          {isOpen ? '● نشط ومفتوح للتقديم' : '✕ إعلان مغلق'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>📍 {job.location}</span>
                        <span>•</span>
                        <span>⏰ {job.job_type}</span>
                        <span>•</span>
                        <span>🎓 خبرة: {job.experience_level || 'غير محدد'}</span>
                        {job.salary && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300 font-semibold">💰 {job.salary}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/provider/jobs/applications?job_id=${job.id}`}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="عرض وإدارة المتقدمين لهذه الوظيفة في نظام ATS"
                      >
                        <span>عرض المتقدمين</span>
                        <span className="px-1.5 py-0.5 bg-cyan-500/20 text-[10px] rounded-full font-mono font-bold text-cyan-200">
                          {applicationsMap[job.id]?.length || 0}
                        </span>
                        <span className="text-[10px]">←</span>
                      </Link>

                      <button
                        onClick={() => handleToggleStatus(job)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          isOpen
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                      >
                        {isOpen ? 'إغلاق الإعلان' : 'إعادة فتح الإعلان'}
                      </button>

                      <button
                        onClick={() => handleDeleteJob(job.id, job.title)}
                        className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition cursor-pointer"
                        title="حذف الإعلان"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Requirements Tags */}
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-gray-400">المتطلبات والمهارات:</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {job.requirements.map((req, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-[#081933] border border-cyan-500/20 text-cyan-300 px-2.5 py-1 text-[11px]"
                          >
                            ✓ {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Meta */}
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="font-mono">تاريخ النشر: {job.created_at ? job.created_at.slice(0, 10) : '—'}</span>
                    <Link
                      href="/jobs"
                      target="_blank"
                      className="text-cyan-400 hover:underline"
                    >
                      معاينة في السوق العام ←
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Add New Job Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-cyan-500/40 bg-[#081933] p-6 shadow-2xl space-y-5 text-right max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💼</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">نشر إعلان وظيفة هندسية جديدة</h3>
                  <p className="text-[11px] text-gray-400">إتاحة الفرصة للكوادر والمساحين المسجلين في المنصة</p>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  المسمى الوظيفي <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: مهندس مساحة موقع، فني رصد أجهزة، أخصائي نظم معلومات جغرافية GIS..."
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    المحافظة وموقع العمل <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    {EGYPT_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    نوع الدوام والتعاقد <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    value={newJobType}
                    onChange={(e) => setNewJobType(e.target.value)}
                    className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    <option value="دوام كامل">دوام كامل (Full-Time)</option>
                    <option value="دوام جزئي">دوام جزئي (Part-Time)</option>
                    <option value="عمل حر / مشروع">عمل حر / مشروع محدد (Freelance)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    الخبرة المطلوبة
                  </label>
                  <select
                    value={newExperience}
                    onChange={(e) => setNewExperience(e.target.value)}
                    className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                  >
                    <option value="حديث التخرج">حديث التخرج (Entry Level)</option>
                    <option value="1 - 3 سنوات">1 - 3 سنوات</option>
                    <option value="3 - 5 سنوات">3 - 5 سنوات</option>
                    <option value="+5 سنوات (خبير)">+5 سنوات (خبير)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    الراتب المتوقع <span className="text-gray-500">(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    placeholder="مثال: 10,000 - 14,000 ج.م أو يحدد بعد المقابلة"
                    className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  الوصف الوظيفي والمسؤوليات
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="اكتب نبذة عن طبيعة المشروع، المهام الميدانية، البرامج المطلوب استخدامها..."
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  المتطلبات والمهارات الأساسية <span className="text-gray-500">(اكتب كل مهارة في سطر منفصل)</span>
                </label>
                <textarea
                  rows={3}
                  value={newRequirements}
                  onChange={(e) => setNewRequirements(e.target.value)}
                  placeholder="إجادة العمل على أجهزة Total Station&#10;إتقان برامج AutoCAD و Civil 3D&#10;القدرة على العمل في المواقع الإنشائية"
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none resize-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'جارٍ النشر في السحابة…' : 'نشر الوظيفة الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Job Applications Modal */}
      {viewingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-[#081933] p-6 shadow-2xl space-y-5 text-right max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    طلبات التوظيف: {viewingJob.title}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    قائمة الكوادر والمساحين المتقدمين لشغل هذه الوظيفة
                  </p>
                </div>
              </div>
            </div>

            {(!applicationsMap[viewingJob.id] || applicationsMap[viewingJob.id].length === 0) ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <span className="text-3xl block">📭</span>
                <p className="text-sm font-semibold text-white">لم يتم استلام أي طلبات تقديم لهذه الوظيفة بعد</p>
                <p className="text-xs text-gray-400">
                  إعلان الوظيفة متاح في السوق العام للوظائف وسيظهر المتقدمون هنا فور إرسالهم لطلباتهم.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applicationsMap[viewingJob.id].map((app: any) => {
                  const cleanPhone = (app.applicant_phone || '').replace(/\D/g, '');
                  const waNumber = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
                  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`مرحباً أستاذ ${app.applicant_name}، نتواصل معك بخصوص تقديمك على وظيفة "${viewingJob.title}" في منصة Survsta.`)}`;

                  return (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-gray-800 bg-[#0F253E]/60 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-800/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{app.applicant_name}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              app.status === 'accepted'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : app.status === 'rejected'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}>
                              {app.status === 'accepted' ? 'تم القبول' : app.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            الخبرة: <span className="text-cyan-300">{app.experience_years || 'غير محدد'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
                          >
                            <span>واتساب</span>
                          </a>
                          {app.applicant_phone && (
                            <a
                              href={`tel:${app.applicant_phone}`}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
                            >
                              اتصال
                            </a>
                          )}
                        </div>
                      </div>

                      {app.cover_letter && (
                        <div className="bg-[#081933] p-3 rounded-lg text-xs text-gray-300 leading-relaxed">
                          <span className="text-[10px] text-gray-400 block mb-1 font-bold">رسالة التقديم والخبرات:</span>
                          {app.cover_letter}
                        </div>
                      )}

                      {app.cv_link && (
                        <div className="text-xs">
                          <a
                            href={app.cv_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>📄 استعراض السيرة الذاتية / معرض الأعمال ←</span>
                          </a>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-gray-500 font-mono">
                          {app.created_at ? new Date(app.created_at).toLocaleDateString('ar-EG') : ''}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition"
                          >
                            قبول مبدئي
                          </button>
                          <button
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                            className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition"
                          >
                            استبعاد
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t border-gray-800 text-left">
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl bg-gray-900 border border-amber-500/40 px-4 py-3 text-xs sm:text-sm font-semibold text-amber-300 shadow-2xl animate-slide-up flex items-center gap-2">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
