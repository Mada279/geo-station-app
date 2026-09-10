'use client';

import React from 'react';
import { User, UserRole, UserStatus } from '@/types/user';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const roleBadges: Record<UserRole, { label: string; class: string }> = {
  admin: { label: 'مدير نظام', class: 'bg-red-500/10 text-red-400 border-red-500/30' },
  provider: { label: 'مزوّد خدمة', class: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  customer: { label: 'عميل', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
};

const statusBadges: Record<UserStatus, { label: string; class: string }> = {
  active: { label: 'نشط', class: 'bg-green-500/10 text-green-400' },
  pending: { label: 'معلّق', class: 'bg-amber-500/10 text-amber-400' },
  suspended: { label: 'موقوف', class: 'bg-gray-500/10 text-gray-400' },
};

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-12 text-center text-gray-400">
        لا يوجد مستخدمون مطابقون لمعايير البحث.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/80 shadow-xl">
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
                  <button
                    onClick={() => onEdit(user)}
                    className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition"
                  >
                    حذف
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
