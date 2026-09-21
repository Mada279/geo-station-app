'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

interface OrderItem {
  id: string;
  order_number: string;
  equipment_name: string;
  category?: string;
  duration?: string;
  total_price?: number;
  status: string;
  created_at: string;
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch client id first
          const { data: clientRow } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (clientRow?.id) {
            const { data } = await supabase
              .from('orders')
              .select('*')
              .eq('client_id', clientRow.id)
              .order('created_at', { ascending: false });

            if (data) setOrders(data);
          }
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
              وحدة العميل
            </span>
            <span className="text-xs text-slate-400">سجل المشروعات والحجوزات</span>
          </div>
          <h1 className="text-2xl font-bold text-white">طلباتي وحجوزاتي الهندسية</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/client/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            <span>مركز التتبع والتقييم المتقدم</span>
            <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            href="/equipment"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition self-start sm:self-auto"
          >
            <span>+ طلب أو حجز جهاز جديد</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">جاري تحميل سجل الطلبات...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto text-xl">
            📦
          </div>
          <h3 className="text-base font-bold text-white">لا توجد طلبات مسجلة حتى الآن</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            لم تقم بطلب أو استئجار أي جهاز مساحي بعد. يمكنك استكشاف كتالوج الأجهزة المعتمدة الآن.
          </p>
          <div className="pt-2">
            <Link
              href="/equipment"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              استعراض كتالوج الأجهزة المساحية ←
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold">رقم الطلب</th>
                  <th className="py-3 px-4 font-bold">الجهاز / الخدمة</th>
                  <th className="py-3 px-4 font-bold">المدة</th>
                  <th className="py-3 px-4 font-bold">التكلفة</th>
                  <th className="py-3 px-4 font-bold">الحالة</th>
                  <th className="py-3 px-4 font-bold">تاريخ الطلب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 text-xs">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{o.order_number}</td>
                    <td className="py-3.5 px-4 font-medium text-white">{o.equipment_name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{o.duration || 'غير محدد'}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {o.total_price ? `${o.total_price.toLocaleString()} ج.م` : 'قيد التسعير'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {new Date(o.created_at).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
