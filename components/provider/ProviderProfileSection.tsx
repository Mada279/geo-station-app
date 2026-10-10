'use client';

import React, { useState } from 'react';
import { ProviderProfileData } from './types';
import SecureEmailUpdateModal from '@/components/auth/SecureEmailUpdateModal';

interface ProviderProfileSectionProps {
  profileData: ProviderProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProviderProfileData>>;
  isSavingProfile: boolean;
  profileError: string | null;
  profileSaveSuccess: boolean;
  onSaveProfile: (e: React.FormEvent) => Promise<void>;
  onEmailUpdated: (newEmail: string) => void;
}

export default function ProviderProfileSection({
  profileData,
  setProfileData,
  isSavingProfile,
  profileError,
  profileSaveSuccess,
  onSaveProfile,
  onEmailUpdated,
}: ProviderProfileSectionProps) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  return (
    <div className="space-y-4 scroll-mt-6 pt-8 border-t border-amber-500/20" id="profile">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-1">
            <span>🏢 الملف الشخصي للجهة والشريك</span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>إدارة وتحديث بيانات الشريك المعتمد</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            تعديل البيانات الأساسية، أرقام التواصل، والمقر الجغرافي المعروض في دليل المنصة ومحركات البحث.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
              profileData.status === 'approved'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {profileData.status === 'approved' ? '✓ حساب معتمد ونشط' : '⏳ الحساب قيد المراجعة'}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#0A192F] p-5 sm:p-6 shadow-xl space-y-6">
        {profileError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-center gap-2">
            <span>❌</span>
            <span>{profileError}</span>
          </div>
        )}

        {profileSaveSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2">
            <span>✅</span>
            <span>تم تحديث بياناتك بنجاح ومزامنتها مع قاعدة بيانات منصة Survsta!</span>
          </div>
        )}

        <form onSubmit={onSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Provider Contact Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                اسم المسؤول / ممثل الجهة <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: م. أحمد النجار"
                className="w-full rounded-xl border border-white/10 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                يظهر كجهة الاتصال للمهندسين وطالبي الخدمات والمعدات.
              </p>
            </div>

            {/* Organization / Company Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                اسم المكتب أو الشركة المساحية <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={profileData.organization}
                onChange={(e) => setProfileData((prev) => ({ ...prev, organization: e.target.value }))}
                placeholder="مثال: مكتب النخبة للهندسة والمساحة"
                className="w-full rounded-xl border border-white/10 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                اسم الكيان التجاري أو المكتب المسجل في المنصة.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                رقم هاتف التواصل والواتساب <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={profileData.phone}
                onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="010XXXXXXXX"
                className="w-full rounded-xl border border-white/10 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none font-mono text-right"
              />
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                الرقم الذي يستقبل اتصالات المهندسين واستفسارات الإيجار.
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                المحافظة والمقر الرئيسي والتغطية <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={profileData.location}
                onChange={(e) => setProfileData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="مثال: القاهرة — مدينة نصر والتجمع الخامس"
                className="w-full rounded-xl border border-white/10 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                يحدد نطاق ظهور أجهزتك في الفلاتر الجغرافية للدليل العام.
              </p>
            </div>

            {/* Email (Readonly Auth Field with Secure OTP Change Action) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  البريد الإلكتروني المسجل للحساب
                </label>
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition cursor-pointer"
                >
                  <span>🔐</span>
                  <span>تحديث البريد الآمن (OTP)</span>
                </button>
              </div>
              <input
                type="email"
                readOnly
                dir="ltr"
                value={profileData.email}
                className="w-full rounded-xl border border-white/10 bg-[#071324] px-4 py-2.5 text-xs text-slate-200 font-mono text-left opacity-90 cursor-default"
              />
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                البريد المستخدم لتسجيل الدخول. لتغييره، يتم إرسال رمز تحقق سري (OTP) إلى بريدك الجديد لحماية الحساب.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="rounded-xl bg-gradient-to-l from-amber-500 to-amber-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-gray-950 shadow-lg shadow-amber-500/20 hover:brightness-110 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSavingProfile ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>جارٍ حفظ التحديثات في السحابة...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>حفظ وتحديث بيانات الملف (Save Profile)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Secure OTP Email Update Modal */}
      <SecureEmailUpdateModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={profileData.email}
        providerId={profileData.id || undefined}
        userId={profileData.id || undefined}
        role="provider"
        onSuccess={(updatedEmail) => {
          onEmailUpdated(updatedEmail);
        }}
      />
    </div>
  );
}
