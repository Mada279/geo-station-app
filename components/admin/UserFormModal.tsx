'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus, CreateUserInput, UpdateUserInput } from '@/types/user';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
  initialUser?: User | null;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialUser,
}: UserFormModalProps) {
  const isEditMode = Boolean(initialUser);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer' as UserRole,
    status: 'active' as UserStatus,
    organization: '',
    phone: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUser) {
      setFormData({
        name: initialUser.name,
        email: initialUser.email,
        role: initialUser.role,
        status: initialUser.status,
        organization: initialUser.organization || '',
        phone: initialUser.phone || '',
        password: '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'customer',
        status: 'active',
        organization: '',
        phone: '',
        password: '',
      });
    }
    setError(null);
  }, [initialUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-6 text-right shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            ✕
          </button>
          <h2 className="text-lg font-bold text-white">
            {isEditMode ? `مراجعة وتعديل بيانات: ${initialUser?.name}` : 'إضافة مستخدم جديد'}
          </h2>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300">الاسم الكامل *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="م. محمد فرج"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300">البريد الإلكتروني *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="user@survsta.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300">الدور (Role) *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="customer">عميل (Customer)</option>
                <option value="provider">مزوّد خدمة (Provider)</option>
                <option value="admin">مدير نظام (Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300">الحالة *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="active">نشط (Active)</option>
                <option value="pending">معلّق (Pending)</option>
                <option value="suspended">موقوف (Suspended)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300">اسم المكتب / الجهة</label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="مكتب النخبة للمساحة"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="01001234567"
              />
            </div>
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-gray-300">كلمة المرور المؤقتة *</label>
              <input
                type="password"
                required={!isEditMode}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-bold text-gray-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-400 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'جاري الحفظ...' : isEditMode ? 'تحديث البيانات' : 'إنشاء المستخدم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
