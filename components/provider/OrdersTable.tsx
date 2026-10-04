'use client';

import React from 'react';
import ClientTrustBadge, { ClientTrustLevel } from '@/components/provider/ClientTrustBadge';
import { ModalOrderData } from '@/components/provider/OrderDetailsModal';

export interface OrdersTableProps {
  orders: ModalOrderData[];
  isLoading: boolean;
  onViewOrder: (order: ModalOrderData) => void;
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
  updatingOrderId?: string | null;
}

const STATUS_BADGES: Record<string, { label: string; className: string; icon: string }> = {
  'pending': { label: 'قيد الانتظار', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: '⏳' },
  'confirmed': { label: 'تم التأكيد', className: 'bg-blue-500/15 text-blue-300 border-blue-500/30', icon: '✓' },
  'in_progress': { label: 'جاري التنفيذ', className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', icon: '⚙️' },
  'completed': { label: 'مكتمل بنجاح', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: '🎉' },
  'cancelled': { label: 'ملغي / مرفوض', className: 'bg-rose-500/15 text-rose-300 border-rose-500/30', icon: '✕' },
};

export default function OrdersTable({
  orders,
  isLoading,
  onViewOrder,
  onUpdateStatus,
  updatingOrderId,
}: OrdersTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-cyan-500/20 bg-[#0F253E]/60 p-8 space-y-4 text-center">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-gray-400">جاري تحميل وتحديث طلبات التأجير والمعدات...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-700 bg-[#0F253E]/40 p-12 text-center space-y-3">
        <div className="text-3xl">📥</div>
        <h3 className="text-sm font-bold text-white">لا توجد طلبات واردة مطابقة</h3>
        <p className="text-xs text-gray-400">ستظهر هنا طلبات التأجير والشراء فور قيام العملاء بإرسالها.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-cyan-500/20 bg-[#0F253E]/80 shadow-xl backdrop-blur-md">
      <table className="w-full text-right text-xs" dir="rtl">
        <thead className="border-b border-gray-800 bg-[#081933]/90 text-gray-300">
          <tr>
            <th className="px-4 py-3.5 font-semibold">رقم الطلب</th>
            <th className="px-4 py-3.5 font-semibold">العميل ومؤشر الثقة</th>
            <th className="px-4 py-3.5 font-semibold">الجهاز / الخدمة</th>
            <th className="px-4 py-3.5 font-semibold">المدة</th>
            <th className="px-4 py-3.5 font-semibold">التكلفة</th>
            <th className="px-4 py-3.5 font-semibold">الحالة</th>
            <th className="px-4 py-3.5 font-semibold text-center">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60 text-gray-200">
          {orders.map((order) => {
            const statusConfig = STATUS_BADGES[order.status] || {
              label: order.status,
              className: 'bg-gray-800 text-gray-300 border-gray-700',
              icon: '●',
            };

            const clientName = order.client?.full_name || order.client_email?.split('@')[0] || 'عميل مساحي';
            const trustLevel = order.client?.trust_level || 'new';
            const completedRentals = order.client?.completed_rentals ?? 0;

            return (
              <tr key={order.id} className="hover:bg-[#163659]/30 transition">
                {/* Order Number & Date */}
                <td className="px-4 py-3.5 font-mono">
                  <span className="font-bold text-amber-400 block">{order.order_number}</span>
                  <span className="text-[10px] text-gray-500">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' }) : '—'}
                  </span>
                </td>

                {/* Client Name + Trust & Risk Indicator */}
                <td className="px-4 py-3.5">
                  <div className="space-y-1">
                    <span className="font-bold text-white block">{clientName}</span>
                    <ClientTrustBadge
                      trustLevel={trustLevel}
                      completedRentals={completedRentals}
                      compact={true}
                    />
                  </div>
                </td>

                {/* Equipment Info */}
                <td className="px-4 py-3.5">
                  <div className="font-medium text-white">{order.equipment_name}</div>
                  <div className="text-[10px] text-cyan-300">{order.category || 'أجهزة ومعدات'}</div>
                </td>

                {/* Duration */}
                <td className="px-4 py-3.5 font-semibold text-gray-300">
                  {order.duration || 'غير محدد'}
                </td>

                {/* Price */}
                <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">
                  {order.total_price ? `${Number(order.total_price).toLocaleString('en-US')} ج.م` : '—'}
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.className}`}>
                    <span>{statusConfig.icon}</span>
                    <span>{statusConfig.label}</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => onViewOrder(order)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold transition shadow-sm"
                  >
                    <span>👁️</span>
                    <span>التفاصيل ومؤشر الأمان</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
