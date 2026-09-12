// Trigger clean build for Next.js root directory deployment
import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProviderClientShell from '@/components/provider/ProviderClientShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const sessionVal = cookieStore.get('survsta_session')?.value;
  const userRole = cookieStore.get('user_role')?.value;

  let role: string | null = userRole || null;
  if (!role && sessionVal) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionVal));
      role = parsed.role || null;
    } catch {
      // ignore parse error
    }
  }

  // Role-Based Access Control (RBAC): Allow provider, admin, or super_admin
  const isAuthorized = role === 'provider' || role === 'admin' || role === 'super_admin';

  if (!isAuthorized) {
    redirect('/login?callbackUrl=/provider/dashboard');
  }

  return (
    <ProviderClientShell>
      {children}
    </ProviderClientShell>
  );
}
