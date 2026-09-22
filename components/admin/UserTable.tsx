'use client';

import React from 'react';
import { User, UserRole, UserStatus } from '@/types/user';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onToggleSuspend?: (user: User) => void;
}

const roleBadges: Record<UserRole, { label: string; class: string }> = {
  admin: { label: 'مدير نظام', class: 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 whitespace-nowrap' },
  provider: { label: 'مزوّد خدمة', class: 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 whitespace-nowrap' },
  customer: { label: 'عميل', class: 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 whitespace-nowrap' },
};

const statusBadges: Record<UserStatus, { label: string; class: string }> = {
  active: { label: 'نشط', class: 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 whitespace-nowrap' },
  pending: { label: 'معلّق', class: 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 whitespace-nowrap' },
  suspended: { label: 'موقوف', class: 'bg-gray-500/20 text-gray-400 font-bold border border-gray-500/30 whitespace-nowrap' },
};

export default function UserTable({ users, onEdit, onDelete, onToggleSuspend }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0a192f] p-12 text-center text-gray-400">
        لا يوجد مستخدمون مطابقون لمعايير البحث.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0a192f] shadow-xl">
      <table className="min-w-full divide-y divide-gray-800 text-right">
        <thead className="bg-gray-950/60 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-4">المستخدم</th>
            <th scope="col" className="px-6 py-4">الجهة / الشركة</th>
            <th scope="col" className="px-6 py-4">الدور (Role)</th>
            <th scope="col" className="px-6 py-4">الحالة</th>
            <th scope="col" className="px-6 py-4">تاريخ التسجيل</th>
            <th scope="col" className="px-6 py-4 text-left">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 text-sm">
          {users.map((user) => (
            <tr key={user.id} className="transition-colors hover:bg-gray-850/50">
              {/* User Name & Email */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                    {user.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                </div>
              </td>

              {/* Organization & Phone */}
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                <div>{user.organization || '—'}</div>
                <div className="text-xs text-gray-500">{user.phone || ''}</div>
              </td>

              {/* Role Badge */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${roleBadges[user.role].class}`}>
                  {roleBadges[user.role].label}
                </span>
              </td>

              {/* Status Badge */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadges[user.status].class}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusBadges[user.status].label}
                </span>
              </td>

              {/* Date */}
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                {new Date(user.createdAt).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>

              {/* Actions */}
              <td className="px-6 py-4 whitespace-nowrap text-left">
                <div className="flex items-center justify-end gap-2">
                  {onToggleSuspend && user.role !== 'admin' && (
                    <button
                      onClick={() => onToggleSuspend(user)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition ${
                        user.status === 'suspended' || user.is_suspended
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                      }`}
                      title={
                        user.status === 'suspended' || user.is_suspended
                          ? 'اضغط لتفعيل وإلغاء إيقاف الحساب'
                          : 'اضغط لإيقاف الحساب ومنع تسجيل الدخول'
                      }
                    >
                      {user.status === 'suspended' || user.is_suspended ? '✓ تفعيل' : '⛔ إيقاف'}
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(user)}
                    className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition"
                  >
                    تعديل
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => onDelete(user)}
                      className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
