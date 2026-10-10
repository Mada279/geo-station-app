import React from 'react';
import { requireProvider } from '@/lib/serverAuth';
import ProviderClientShell from '@/components/provider/ProviderClientShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireProvider();

  return (
    <ProviderClientShell>
      {children}
    </ProviderClientShell>
  );
}
