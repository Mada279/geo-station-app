'use client';

import React, { useState, useRef } from 'react';
import { StolenItem } from './types';
import { supabase } from '@/utils/supabaseClient';

interface ProviderStolenRegistrySectionProps {
  stolenItems: StolenItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onSubmitStolenReport: (report: {
    equipment_model: string;
    serial_number: string;
    proof_document_url?: string;
    notes?: string;
  }) => Promise<boolean>;
}

export default function ProviderStolenRegistrySection({
  stolenItems,
  isLoading,
  onRefresh,
  onSubmitStolenReport,
}: ProviderStolenRegistrySectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stolenModel, setStolenModel] = useState('');
  const [stolenSerial, setStolenSerial] = useState('');
  const [stolenProofUrl, setStolenProofUrl] = useState('');
  const [stolenNotes, setStolenNotes] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const proofFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProofUpload = async (file: File) => {
    setIsUploadingProof(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `stolen_proof_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `stolen_proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment-photos')
        .upload(filePath, file);

      if (uploadError) {
        // Fallback to base64 if storage bucket has policy restrictions
        const reader = new FileReader();
        reader.onload = (e) => {
          setStolenProofUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('equipment-photos')
          .getPublicUrl(filePath);
        setStolenProofUrl(publicUrlData.publicUrl);
      }
    } catch {
      // Fallback to local data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setStolenProofUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stolenModel.trim() || !stolenSerial.trim()) return;

    setIsSubmitting(true);
    try {
      const ok = await onSubmitStolenReport({
        equipment_model: stolenModel.trim(),
        serial_number: stolenSerial.trim(),
        proof_document_url: stolenProofUrl.trim() || undefined,
        notes: stolenNotes.trim() || undefined,
      });

      if (ok) {
        setIsModalOpen(false);
        setStolenModel('');
        setStolenSerial('');
        setStolenProofUrl('');
        setStolenNotes('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 scroll-mt-6 pt-8 border-t border-rose-500/20" id="stolen-registry">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold mb-1">
            <span>🚨 سجل مكافحة سرقة الأجهزة المساحية</span>
          </div>
          <h2 className="text-xl font-bold text-white">سجل الأجهزة المسروقة والمبلغ عنها</h2>
          <p className="text-xs text-gray-400">
            حماية مجتمع المساحين — فحص تلقائي للأرقام التسلسليّة وحظر فوري لأي جهاز مسروق لمنع تداوله.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs text-gray-400 hover:text-rose-400 transition"
            title="تحديث البيانات"
          >
            🔄 تحديث
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition cursor-pointer"
          >
            <span>🚨</span>
            <span>تسجيل بلاغ سرقة</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="rounded-2xl border border-white/5 bg-[#0A192F] p-6 space-y-3">
          <div className="h-5 w-48 bg-white/10 rounded animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse flex items-center justify-between px-4">
                <div className="h-4 w-32 bg-white/10 rounded"></div>
                <div className="h-4 w-40 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && stolenItems.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-[#0A192F] p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center text-xl">
            🛡️
          </div>
          <h4 className="text-sm font-bold text-white">لا توجد بلاغات سرقة مسجلة لحسابك</h4>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            جميع أجهزتك مؤمّنة في المنظومة. في حال فقدان أو سرقة أي جهاز مساحي، سجّل رقمه التسلسلي هنا لحظياً لحمايته وحظر إدراجه لدى أي طرف آخر.
          </p>
        </div>
      )}

      {/* Populated Table */}
      {!isLoading && stolenItems.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-rose-500/20 bg-[#0A192F] shadow-xl backdrop-blur-md">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-rose-500/20 bg-[#061429] text-gray-300">
              <tr>
                <th className="px-4 py-3 font-semibold">الموديل والجهاز</th>
                <th className="px-4 py-3 font-semibold">الرقم التسلسلي</th>
                <th className="px-4 py-3 font-semibold">حالة البلاغ</th>
                <th className="px-4 py-3 font-semibold">تاريخ التسجيل</th>
                <th className="px-4 py-3 font-semibold text-center">إثبات الملكية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-500/10 text-gray-200">
              {stolenItems.map((item) => (
                <tr key={item.id} className="hover:bg-rose-950/20 transition">
                  <td className="px-4 py-3 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400">🚨</span>
                      <span>{item.equipment_model}</span>
                    </div>
                    {item.notes && (
                      <div className="text-[11px] text-gray-400 font-normal mt-0.5 line-clamp-1">
                        {item.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-rose-300 dir-ltr text-right">
                    {item.serial_number}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      محظور من التداول ✓
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap dir-ltr text-right font-mono text-[11px]">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : 'حديثاً'}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {item.proof_document_url ? (
                      <a
                        href={item.proof_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-lg transition"
                      >
                        <span>📄</span>
                        <span>معاينة الوثيقة</span>
                      </a>
                    ) : (
                      <span className="text-gray-500 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Stolen Device Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-[#071324] p-6 shadow-2xl space-y-5 text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">تسجيل بلاغ سرقة جهاز مساحي</h3>
                  <p className="text-[11px] text-rose-300">إدراج الرقم التسلسلي في سجل الحظر لمنع التداول</p>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  نوع وموديل الجهاز المفقود/المسروق <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={stolenModel}
                  onChange={(e) => setStolenModel(e.target.value)}
                  placeholder="مثال: Leica FlexLine TS06 Plus أو Trimble R10 GNSS"
                  className="w-full rounded-xl border border-rose-500/30 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  الرقم التسلسلي للجهاز (Serial Number) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={stolenSerial}
                  onChange={(e) => setStolenSerial(e.target.value)}
                  placeholder="مثال: 1845920 أو SN-40291"
                  className="w-full rounded-xl border border-rose-500/40 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-rose-400 focus:outline-none font-mono text-right"
                />
                <p className="text-[10px] text-rose-300/80 mt-1">
                  * سيتم فحص أي جهاز يُدرج في المنصة ومطابقته مع هذا الرقم فورياً وإيقاف نشره تلقائياً.
                </p>
              </div>

              {/* Upload Proof Document */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  وثيقة إثبات الملكية أو محضر الشرطة <span className="text-gray-500">(صورة فاتورة، شهادة معايرة، محضر)</span>
                </label>
                <input
                  ref={proofFileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProofUpload(e.target.files[0]);
                    }
                  }}
                />
                <div
                  className="rounded-xl border-2 border-dashed border-rose-500/30 bg-[#0C1B2E]/60 p-4 text-center hover:border-rose-400 transition cursor-pointer"
                  onClick={() => proofFileInputRef.current?.click()}
                >
                  <div className="text-2xl mb-1">📄</div>
                  <div className="text-xs font-semibold text-rose-300">
                    {isUploadingProof ? 'جارٍ رفع الوثيقة...' : stolenProofUrl ? '✓ تم إرفاق وثيقة الملكية بنجاح' : 'اضغط لاختيار صورة الفاتورة أو وثيقة الملكية'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">يدعم الصور وملفات PDF</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  تفاصيل إضافية عن واقعة السرقة <span className="text-gray-500">(اختياري)</span>
                </label>
                <textarea
                  rows={3}
                  value={stolenNotes}
                  onChange={(e) => setStolenNotes(e.target.value)}
                  placeholder="مكان وتاريخ السرقة، رقم المحضر إن وجد، أي علامات مميزة على الجهاز..."
                  className="w-full rounded-xl border border-rose-500/30 bg-[#0C1B2E] px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-rose-400 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-l from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-950/40 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'جارٍ تسجيل البلاغ...' : 'تسجيل البلاغ في سجل الحماية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
