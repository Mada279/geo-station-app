'use client';

import React, { useState, useEffect, useMemo } from 'react';
import UserTable from '@/components/admin/UserTable';
import UserFormModal from '@/components/admin/UserFormModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { User, CreateUserInput, UpdateUserInput } from '@/types/user';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '@/services/userService';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Read: Load users
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 2. Read/Review before Edit: Fetch fresh user data before opening edit modal
  const handleStartEdit = async (user: User) => {
    const freshUser = await getUserById(user.id);
    setEditingUser(freshUser || user);
    setIsFormOpen(true);
  };

  const handleStartCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  // 3. Create or Update Dispatcher
  const handleFormSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    if (editingUser) {
      // Update
      const updated = await updateUser(editingUser.id, data);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(`تم تحديث بيانات المستخدم "${updated.name}" بنجاح.`);
    } else {
      // Create
      const created = await createUser(data as CreateUserInput);
      setUsers((prev) => [created, ...prev]);
      showToast(`تمت إضافة المستخدم الجديد "${created.name}" بنجاح.`);
    }
  };

  // 4. Delete Dispatcher
  const handleDeleteConfirm = async (userId: string) => {
    await deleteUser(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast('تم حذف المستخدم بنجاح.');
  };

  // Filtered Users (Search query & Role filter)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.organization && user.organization.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  return (
    <div className="min-h-screen bg-gray-950 p-6 sm:p-8 text-right text-gray-100">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-5">
          <button
            onClick={handleStartCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <span>+</span>
            <span>إضافة مستخدم جديد</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">إدارة المستخدمين والصلاحيات</h1>
            <p className="text-xs text-gray-400 mt-1">
              لوحة التحكم المركزية لحسابات المزوّدين والعملاء والمشرفين (RBAC).
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، البريد الإلكتروني، أو اسم الجهة..."
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">كافة الأدوار</option>
              <option value="admin">مديرو النظام (Admins)</option>
              <option value="provider">مزوّدو الخدمة (Providers)</option>
              <option value="customer">العملاء (Customers)</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
              <p className="mt-2 text-xs text-gray-400">جاري تحميل بيانات المستخدمين...</p>
            </div>
          </div>
        ) : (
          <UserTable
            users={filteredUsers}
            onEdit={handleStartEdit}
            onDelete={(user) => setDeletingUser(user)}
          />
        )}

        {/* Create / Edit Modal */}
        <UserFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialUser={editingUser}
        />

        {/* Mandatory Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={Boolean(deletingUser)}
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteConfirm}
        />

        {/* Feedback Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 rounded-xl border border-cyan-500/30 bg-gray-900/95 px-4 py-3 text-sm text-cyan-300 shadow-xl backdrop-blur-md animate-bounce">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
