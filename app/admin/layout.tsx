import React from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-950 text-slate-200 min-h-screen flex flex-col" style={{ direction: 'rtl' }}>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
