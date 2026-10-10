'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';
import { validateEgyptianPhone } from '@/lib/validations/phone';

export interface TeamMember {
  id: string;
  provider_id?: string;
  full_name: string;
  job_title: string;
  phone_number: string;
  email?: string;
  notes?: string;
  created_at: string;
}

const COMMON_ROLES = [
  'مدير المكتب / المسؤول التنفيذي',
  'مهندس مساحة ورصد ميداني',
  'فني أجهزة ومحطات رصد Total Station',
  'مسؤول تسليم ومعايرة المعدات',
  'أخصائي مبيعات وتأجير أجهزة',
  'محاسب ومسؤول تعاقدات وفواتير',
  'أخصائي دعم فني وخدمة عملاء',
  'محلل نظم معلومات جغرافية GIS',
];

export default function ProviderTeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>(COMMON_ROLES[0]);
  const [customRole, setCustomRole] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [providerOrg, setProviderOrg] = useState<string>('مكتب مساحي معتمد');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getWhatsAppLink = (phone: string, name: string) => {
    let clean = (phone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0') && clean.length === 11) {
      clean = '2' + clean;
    }
    const message = encodeURIComponent(`مرحباً أستاذ/مهندس ${name}، نتواصل معك بخصوص عمليات ومعدات منصة Survsta.`);
    return `https://wa.me/${clean}?text=${message}`;
  };

  // Fetch Team Members
  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      let userId: string | null = null;

      // 1. Supabase Auth
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        userId = authData.user.id;
      }

      // 2. Local storage session fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (!userId && parsed.id) userId = parsed.id;
            if (parsed.org || parsed.organization || parsed.name) {
              setProviderOrg(parsed.org || parsed.organization || parsed.name);
            }
          } catch {}
        }
      }

      setActiveUserId(userId);

      // 3. Query provider_team from Supabase
      let query = supabase.from('provider_team').select('*').order('created_at', { ascending: true });

      if (userId) {
        query = query.eq('provider_id', userId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setTeam(data as TeamMember[]);
      } else {
        console.warn('[fetchTeam notice]:', error?.message);
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('SURVSTA_LOCAL_PROVIDER_TEAM');
          if (cached) setTeam(JSON.parse(cached));
        }
      }
    } catch (err) {
      console.warn('[fetchTeam exception]:', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('SURVSTA_LOCAL_PROVIDER_TEAM');
        if (cached) setTeam(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // Handle Add Team Member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('⚠️ يرجى إدخال اسم المسؤول أو العضو.');
      return;
    }
    if (!phoneNumber.trim()) {
      showToast('⚠️ يرجى إدخال رقم الهاتف للتواصل.');
      return;
    }

    const phoneValidation = validateEgyptianPhone(phoneNumber);
    if (!phoneValidation.isValid) {
      showToast(`⚠️ ${phoneValidation.error}`);
      return;
    }
    const validPhone = phoneValidation.normalized;

    const finalTitle = jobTitle === 'أخرى' ? customRole.trim() || 'عضو فريق العمل' : jobTitle;

    setIsSaving(true);
    try {
      const payload: any = {
        full_name: fullName.trim(),
        job_title: finalTitle,
        phone_number: validPhone,
        email: email.trim() || null,
        notes: notes.trim() || null,
      };

      if (activeUserId) {
        payload.provider_id = activeUserId;
      }

      let { data, error } = await supabase.from('provider_team').insert([payload]).select();

      // If provider_id foreign key constraint fails, retry without provider_id
      if (error && (error.message?.includes('provider_id') || error.code === '23503')) {
        delete payload.provider_id;
        const retry = await supabase.from('provider_team').insert([payload]).select();
        data = retry.data;
        error = retry.error;
      }

      const newMember: TeamMember = {
        id: data?.[0]?.id || `TM-${Date.now()}`,
        provider_id: activeUserId || undefined,
        full_name: fullName.trim(),
        job_title: finalTitle,
        phone_number: phoneNumber.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        created_at: new Date().toISOString(),
      };

      setTeam((prev) => [...prev, newMember]);

      // Cache locally
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('SURVSTA_LOCAL_PROVIDER_TEAM') || '[]');
        localStorage.setItem('SURVSTA_LOCAL_PROVIDER_TEAM', JSON.stringify([...existing, newMember]));
      }

      showToast(`🎉 تم إضافة "${fullName.trim()}" إلى فريق عمل مكتبك بنجاح!`);

      // Reset form
      setFullName('');
      setPhoneNumber('');
      setEmail('');
      setNotes('');
      setCustomRole('');
      setIsModalOpen(false);
    } catch (err) {
      console.warn('[handleSaveMember Exception]:', err);
      showToast('❌ تعذر حفظ بيانات العضو حالياً.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Member
  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في إزالة "${name}" من فريق العمل ومسؤولي الاتصال؟`)) return;

    try {
      await supabase.from('provider_team').delete().eq('id', id);
      setTeam((prev) => prev.filter((m) => m.id !== id));

      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('SURVSTA_LOCAL_PROVIDER_TEAM') || '[]');
        localStorage.setItem(
          'SURVSTA_LOCAL_PROVIDER_TEAM',
          JSON.stringify(existing.filter((m: any) => m.id !== id))
        );
      }
      showToast('🗑️ تم إزالة العضو من القائمة.');
    } catch {
      showToast('تعذر الحذف حالياً.');
    }
  };

  const filteredTeam = team.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.job_title.toLowerCase().includes(q) ||
      m.phone_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#081933] text-right text-gray-100 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Topbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-500/20 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                الملف والهيكل الإداري
              </span>
              <span className="text-xs text-gray-400">بوابة المزوّد المعتمد</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>👥</span>
              <span>الفريق ومسؤولو الاتصال (Team & Key Contacts)</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              أضف فريق عمل مكتبك (مهندسي المساحة، مسؤولي تسليم الأجهزة، مدراء المبيعات) لتعزيز موثوقية حسابك وتسهيل تواصل العملاء بالموقع.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition cursor-pointer"
            >
              <span>+</span>
              <span>إضافة عضو جديد</span>
            </button>

            <Link
              href="/provider/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition"
            >
              <span>📊</span>
              <span>لوحة التحكم</span>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>إجمالي أعضاء الفريق</span>
              <span className="text-cyan-400 text-lg">👥</span>
            </div>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {isLoading ? '...' : team.length}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">مسؤولين معتمدين في حساب المكتب</div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>الطاقم الفني والميداني</span>
              <span className="text-emerald-400 text-lg">📡</span>
            </div>
            <div className="text-2xl font-black text-emerald-300 font-mono">
              {isLoading ? '...' : team.filter((m) => m.job_title.includes('مساحة') || m.job_title.includes('أجهزة') || m.job_title.includes('تسليم') || m.job_title.includes('رصد')).length}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">مهندسين وفنيي تسليم ومعايرة</div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-[#0F253E]/80 p-4 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>الجهة أو المكتب</span>
              <span className="text-amber-400 text-lg">🏢</span>
            </div>
            <div className="text-lg font-bold text-amber-300 truncate">
              {providerOrg}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">المكتب الهندسي المعتمد</div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/60 p-4 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم، المسمى الوظيفي، أو رقم الهاتف..."
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

            <div className="text-xs text-gray-400">
              عدد الأعضاء المسجلين: <strong className="text-amber-300 font-mono">{filteredTeam.length}</strong>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/40 p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-cyan-300">جارٍ استرداد بيانات فريق العمل...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTeam.length === 0 && (
          <div className="rounded-2xl border border-dashed border-cyan-500/30 bg-[#0F253E]/40 p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mx-auto flex items-center justify-center text-3xl shadow-inner">
              👥
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">لم يتم إضافة أي أعضاء في الفريق حتى الآن</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                أضف مسؤولي الاتصال والتسليم الميداني لمساعدة العملاء وشركات المقاولات على التواصل المباشر مع الشخص المناسب (مهندس التسليم، مسؤول الحسابات، مدير المبيعات).
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:brightness-110 transition cursor-pointer"
            >
              <span>+</span>
              <span>أضف أول عضو في الفريق الآن</span>
            </button>
          </div>
        )}

        {/* Team Members Grid */}
        {!isLoading && filteredTeam.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeam.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 p-5 shadow-xl backdrop-blur-md hover:border-cyan-500/40 transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Avatar & Name */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-base font-black text-white shadow-md shadow-cyan-500/20">
                        {member.full_name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{member.full_name}</h4>
                        <span className="text-[11px] font-semibold text-cyan-300">
                          {member.job_title}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMember(member.id, member.full_name)}
                      className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition cursor-pointer"
                      title="إزالة العضو"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Contact Meta */}
                  <div className="space-y-1.5 rounded-xl border border-gray-800 bg-[#081933]/60 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-[11px]">رقم الهاتف:</span>
                      <span className="font-mono font-bold text-amber-300">{member.phone_number}</span>
                    </div>
                    {member.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">البريد الإلكتروني:</span>
                        <span className="text-gray-300 text-[11px] truncate max-w-[150px]">{member.email}</span>
                      </div>
                    )}
                    {member.notes && (
                      <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-800/80 line-clamp-2">
                        {member.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Contact Buttons */}
                <div className="pt-2 border-t border-gray-800/80 flex items-center gap-2">
                  <a
                    href={getWhatsAppLink(member.phone_number, member.full_name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <span>💬</span>
                    <span>واتساب</span>
                  </a>

                  <a
                    href={`tel:${member.phone_number}`}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-semibold transition cursor-pointer"
                    title="اتصال هاتفي"
                  >
                    <span>📞</span>
                    <span>اتصال</span>
                  </a>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Add New Team Member Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-[#081933] p-6 shadow-2xl space-y-5 text-right">
            
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
                <span className="text-2xl">👤</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">إضافة عضو جديد للفريق</h3>
                  <p className="text-[11px] text-gray-400">إدراج مسؤول اتصال أو مهندس معتمد</p>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  الاسم الكامل <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: م. مصطفى حسام الدين"
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  المسمى والدور الوظيفي <span className="text-cyan-400">*</span>
                </label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
                >
                  {COMMON_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                  <option value="أخرى">أخرى (مسمى مخصص)...</option>
                </select>
              </div>

              {jobTitle === 'أخرى' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                    اكتب المسمى الوظيفي المخصص <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="مثال: مستشار مشروعات الساحل الشمالي"
                    className="w-full rounded-xl border border-amber-500/40 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  رقم الهاتف للتواصل <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="مثال: 01012345678"
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  البريد الإلكتروني <span className="text-gray-500">(اختياري)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@company.com"
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  ملاحظات أو نطاق المسؤولية <span className="text-gray-500">(اختياري)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: مسؤول تسليم محطات RTK بمحافظة الجيزة والقاهرة..."
                  className="w-full rounded-xl border border-cyan-500/30 bg-[#0F253E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none resize-none"
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
                  {isSaving ? 'جارٍ الحفظ في السحابة…' : 'حفظ وإضافة العضو'}
                </button>
              </div>
            </form>
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
