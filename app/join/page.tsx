import React from 'react';
import ProviderRegistrationWizard from '@/components/ProviderRegistrationWizard';

export const metadata = {
  title: 'انضم كشريك | Survsta',
  description: 'سجّل مكتبك أو شركتك في منصة المساحة والجيوماتكس الأولى في مصر والشرق الأوسط',
};

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12 sm:py-16">
      <ProviderRegistrationWizard />
    </div>
  );
}
