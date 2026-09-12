'use client';

import React, { useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminEquipmentPage() {
  const [filterBrand, setFilterBrand] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const equipmentList = [
    {
      id: 'EQ-1001',
      name: 'محطة رصد متكاملة Leica TS07 (1 ثانية)',
      category: 'Total Station',
      provider: 'مكتب الأهرام للمساحة',
      serial: 'SN-948271',
      calibrationDate: '2026-01-15',
      calibrationStatus: 'سارية (صلاحية 10 أشهر)',
      status: 'معتمد ونشط',
      price: '1,500 ج.م / يوم',
    },
    {
      id: 'EQ-1002',
      name: 'جهاز تحديد المواقع Trimble R12i GNSS',
      category: 'GNSS / GPS',
      provider: 'جيو تكنولوجي مصر',
      serial: 'TR-772910',
      calibrationDate: '2025-11-20',
      calibrationStatus: 'سارية (صلاحية 8 أشهر)',
      status: 'معتمد ونشط',
      price: '2,200 ج.م / يوم',
    },
    {
      id: 'EQ-1003',
      name: 'ميزان قامة بصري دقيق Sokkia B20',
      category: 'Optical Level',
      provider: 'الإسكندرية للمسح',
      serial: 'SK-330192',
      calibrationDate: '2026-02-01',
      calibrationStatus: 'سارية (صلاحية 11 شهر)',
      status: 'معتمد ونشط',
      price: '350 ج.م / يوم',
    },
    {
      id: 'EQ-1004',
      name: 'جهاز مستقبل CHCNAV i73+ Pocket GNSS',
      category: 'GNSS / GPS',
      provider: 'سرفاي تك للمقاولات',
      serial: 'CHC-551029',
      calibrationDate: '2026-03-01',
      calibrationStatus: 'سارية حديثاً',
      status: 'معتمد ونشط',
      price: '1,800 ج.م / يوم',
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#081933] text-gray-100" style={{ direction: 'rtl' }}>
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-5 left-5 z-50 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-[#081933] shadow-2xl animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-bold mb-2">
              <span>📡 المعدات والأجهزة الجيوديسية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">مراجعة الأجهزة والمعدات</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              فحص مواصفات وسجلات معايرة أجهزة التوتال ستيشن، والـ GNSS، والموازين البصرية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('تم تنشيط التحقق من شهادات المعايرة السارية')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-cyan-500 to-[#1CA7FF] text-xs font-black text-[#081933] shadow-md hover:brightness-110 transition"
            >
              + إضافة فحص دوري
            </button>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>إجمالي الأجهزة المعتمدة</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-base">📡</span>
            </div>
            <div className="text-2xl font-black text-white">312 <span className="text-xs text-gray-400 font-normal">جهاز</span></div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">جاهزة للحجز الميداني</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>أجهزة Total Station</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-base">📐</span>
            </div>
            <div className="text-2xl font-black text-white">142</div>
            <div className="text-[11px] text-purple-300 mt-2 font-semibold">Leica, Trimble, Topcon</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>أجهزة GNSS / RTK</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-base">🛰️</span>
            </div>
            <div className="text-2xl font-black text-white">118</div>
            <div className="text-[11px] text-emerald-400 mt-2 font-semibold">دقة ميليمترية عالية</div>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/90 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
              <span>نسبة صلاحية المعايرة</span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">✅</span>
            </div>
            <div className="text-2xl font-black text-white">100%</div>
            <div className="text-[11px] text-amber-300 mt-2 font-semibold">لا يوجد أي جهاز منتهي المعايرة</div>
          </div>
        </div>

        {/* Equipment Table */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E] p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-500/20 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">سجل الأجهزة الهندسية والمساحية</h3>
              <p className="text-xs text-gray-400 mt-0.5">تفاصيل السيريال، تاريخ المعايرة، وحالة التوافر للتأجير</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="ابحث برقم الجهاز أو السيريال..."
                className="rounded-xl border border-cyan-500/30 bg-[#081933] px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-gray-300">
              <thead className="bg-[#081933] text-gray-400 border-b border-cyan-500/20 font-bold">
                <tr>
                  <th className="p-3.5">اسم الجهاز والموديل</th>
                  <th className="p-3.5">النوع والتصنيف</th>
                  <th className="p-3.5">المزوّد المالك</th>
                  <th className="p-3.5">الرقم التسلسلي</th>
                  <th className="p-3.5">شهادة المعايرة</th>
                  <th className="p-3.5">سعر التأجير اليومي</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {equipmentList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#081933]/50 transition">
                    <td className="p-3.5 font-bold text-white">{item.name}</td>
                    <td className="p-3.5 text-cyan-300 font-semibold">{item.category}</td>
                    <td className="p-3.5 text-gray-300">{item.provider}</td>
                    <td className="p-3.5 font-mono text-gray-400">{item.serial}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {item.calibrationStatus}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-white">{item.price}</td>
                    <td className="p-3.5 text-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => showToast(`تم استعراض ملف الجهاز (${item.name})`)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold transition"
                      >
                        تفاصيل الجهاز
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
