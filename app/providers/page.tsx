import React from 'react';
import type { Metadata } from 'next';
import DirectoryPage from '@/app/directory/page';

export const metadata: Metadata = {
  title: 'دليل مكاتب وشركات المساحة المعتمدة في مصر | Survsta',
  description: 'تصفح قائمة بأفضل مكاتب وشركات المساحة المعتمدة ومراكز المعايرة في مصر. عروض أسعار مباشرة وخدمات رفع وتوقيع مساحي احترافية.',
};

export default function ProvidersPage() {
  return <DirectoryPage />;
}
