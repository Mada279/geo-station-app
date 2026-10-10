import React from 'react';
import { requireAdmin } from '@/lib/serverAuth';
import AdminClientShell from '@/components/admin/AdminClientShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <AdminClientShell>
      {children}
    </AdminClientShell>
  );
}
