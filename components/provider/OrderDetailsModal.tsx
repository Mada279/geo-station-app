'use client';

import React from 'react';
import ClientTrustBadge, { ClientTrustBanner, ClientTrustLevel } from '@/components/provider/ClientTrustBadge';

export interface OrderClientData {
  id?: string;
  full_name?: string;
  phone_number?: string;
  email?: string;
  whatsapp_number?: string;
  company_name?: string;
  trust_level?: ClientTrustLevel | string;
  completed_rentals?: number;
}

export interface ModalOrderData {
  id: string;
  order_number: string;
  client_id?: string;
  provider_id?: string;
  client_email?: string;
  equipment_name: string;
  category?: string;
  duration?: string;
  total_price?: number;
  status: string;
  created_at: string;
  client?: OrderClientData;
}

interface OrderDetailsModalProps {
  order: ModalOrderData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, newStatus: string) => Promise<void> | void;
  isUpdatingStatus?: boolean;
}

export default function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdatingStatus = false,
}: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const clientName = order.client?.full_name || order.client_email?.split('@')[0] || 'عميل مساحي';
  const clientPhone = order.client?.phone_number || '—';
  const clientEmail = order.client?.email || order.client_email || '—';
  const companyName = order.client?.company_name;
  const trustLevel = order.client?.trust_level || 'new';
  const completedRentals = order.client?.completed_rentals ?? 0;

  const getWhatsAppLink = () => {
    let clean = (clientPhone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0') && clean.length === 11) {
      clean = '2' + clean;
    }
    const message = encodeURIComponent(
      `مرحباً ${clientName}، نتواصل معك بخصوص طلبك رقم (${order.order_number}) لمعدة (${order.equipment_name}) عبر منصة Survsta.`
    );
    return `https://wa.me/${clean}?text=${message}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-right" dir="rtl">
      <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-[#0F253E] p-6 shadow-2xl text-white space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-black text-amber-400 bg-black/50 px-3 py-1 rounded-lg border border-amber-500/30">
              {order.order_number}
            </span>
            <div>
              <h3 className="text-base font-bold text-white">تفاصيل طلب التأجير</h3>
              <p className="text-xs text-gray-400 font-mono">
                📅 {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Client Trust Assessment Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300">مؤشر أمان وموثوقية العميل (Trust & Risk Indicator):</span>
            <ClientTrustBadge
              trustLevel={trustLevel}
              completedRentals={completedRentals}
              compact={false}
            />
          </div>

          {/* Detailed Advisory Banner */}
          <ClientTrustBanner
            trustLevel={trustLevel}
            completedRentals={completedRentals}
          />
        </div>

        {/* Order Equipment Details */}
        <div className="rounded-xl border border-gray-800 bg-[#081933]/70 p-4 space-y-3">
          <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
            <span>📡</span>
            <span>بيانات الجهاز والمعدة المساحية</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block mb-0.5">اسم الجهاز / الخدمة:</span>
              <strong className="text-white text-sm">{order.equipment_name}</strong>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">الفئة:</span>
              <span className="text-cyan-300 font-semibold">{order.category || 'أجهزة ومعدات'}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">مدة الاستئجار المطلوبة:</span>
              <span className="text-white font-bold">{order.duration || 'غير محدد'}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">التكلفة الإجمالية:</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">
                {order.total_price ? `${Number(order.total_price).toLocaleString('en-US')} ج.م` : 'يحدد بالاتفاق'}
              </span>
            </div>
          </div>
        </div>

        {/* Client Contact Info */}
        <div className="rounded-xl border border-gray-800 bg-[#081933]/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-300 flex items-center gap-2">
              <span>👤</span>
              <span>بيانات الاتصال والتواصل مع العميل</span>
            </h4>
            <span className="text-[11px] text-gray-400">
              {companyName ? `تابع لشركة: ${companyName}` : 'فرد / مهندس حر'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block mb-0.5">اسم العميل:</span>
              <strong className="text-white">{clientName}</strong>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">رقم الهاتف:</span>
              <span className="text-white font-mono" dir="ltr">{clientPhone}</span>
            </div>
            {clientEmail !== '—' && (
              <div className="sm:col-span-2">
                <span className="text-gray-400 block mb-0.5">البريد الإلكتروني:</span>
                <span className="text-cyan-300 font-mono text-[11px]" dir="ltr">{clientEmail}</span>
              </div>
            )}
          </div>

          {/* Quick Communication Actions */}
          <div className="flex items-center gap-3 pt-2">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <span>💬</span>
              <span>مراسلة واتساب</span>
            </a>

            {clientPhone !== '—' && (
              <a
                href={`tel:${clientPhone}`}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold transition"
              >
                <span>📞</span>
                <span>اتصال مباشر</span>
              </a>
            )}
          </div>
        </div>

        {/* Status Transition Control */}
        {onUpdateStatus && (
          <div className="flex items-center justify-between border-t border-gray-800 pt-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">الحالة الحالية:</span>
              <span className="font-bold text-amber-300">{order.status}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">تحديث إلى:</span>
              <select
                value={order.status}
                disabled={isUpdatingStatus}
                onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                className="rounded-xl border border-gray-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="pending">⏳ قيد الانتظار</option>
                <option value="confirmed">✓ تأكيد الطلب</option>
                <option value="in_progress">⚙️ جاري التنفيذ</option>
                <option value="completed">🎉 إكمال الطلب بنجاح</option>
                <option value="cancelled">✕ إلغاء / رفض</option>
              </select>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
