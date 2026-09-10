'use client';

import React, { useState } from 'react';
import { User } from '@/types/user';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
}

export default function DeleteConfirmModal({
  isOpen,
  user,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !user) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(user.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-gray-900 p-6 text-right shadow-2xl">
        
        {/* Warning Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h3 className="mt-4 text-center text-lg font-bold text-white">
          تأكيد الحذف النهائي للمستخدم
        </h3>

        <p className="mt-2 text-center text-sm text-gray-400 leading-relaxed">
          هل أنت متأكد من رغبتك في حذف حساب <strong className="text-white">{user.name}</strong> ({user.email})؟ 
          هذا الإجراء سيؤدي إلى إلغاء صلاحيات الدخول فوراً وحذف السجلات التابعة.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-1/2 rounded-lg bg-gray-800 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700 transition"
          >
            تراجع
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-1/2 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-500 disabled:opacity-50 transition"
          >
            {isDeleting ? 'جاري الحذف...' : 'نعم، احذف الحساب'}
          </button>
        </div>
      </div>
    </div>
  );
}
