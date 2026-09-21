'use client';

import React, { useEffect, useState } from 'react';
import UnifiedSidebar from '@/components/dashboard/UnifiedSidebar';
import NotificationBell from '@/components/dashboard/NotificationBell';
import { supabase } from '@/utils/supabaseClient';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeModules, setActiveModules] = useState<string[]>(['client']);
  const [modulesMap, setModulesMap] = useState<Record<string, string>>({ client: 'active' });
  const [userName, setUserName] = useState<string>('مستخدم سيرفستا');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const parseModulesData = (raw: any) => {
    if (Array.isArray(raw) && raw.length > 0) {
      setActiveModules(raw);
      const map: Record<string, string> = {};
      raw.forEach((m) => (map[m] = 'active'));
      setModulesMap(map);
    } else if (raw && typeof raw === 'object') {
      const keys = Object.keys(raw).filter(
        (k) => raw[k] === 'active' || raw[k] === 'pending'
      );
      if (keys.length > 0) {
        setActiveModules(keys);
        setModulesMap(raw);
      }
    }
  };

  useEffect(() => {
    async function syncUserData() {
      try {
        // 1. Check current Supabase Auth User
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          setUserEmail(user.email || '');
          if (user.user_metadata?.full_name || user.user_metadata?.name) {
            setUserName(user.user_metadata.full_name || user.user_metadata.name);
          }

          if (user.user_metadata?.active_modules) {
            parseModulesData(user.user_metadata.active_modules);
          }

          // Query live clients table to get latest active_modules
          const { data: clientRow } = await supabase
            .from('clients')
            .select('full_name, active_modules')
            .eq('user_id', user.id)
            .maybeSingle();

          if (clientRow) {
            if (clientRow.full_name) setUserName(clientRow.full_name);
            if (clientRow.active_modules) {
              parseModulesData(clientRow.active_modules);
            }
          }
        } else {
          // Fallback to localStorage for guest or simulated session
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('SURVSTA_AUTH_USER');
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed.id) setUserId(parsed.id);
                if (parsed.name) setUserName(parsed.name);
                if (parsed.email) setUserEmail(parsed.email);
                if (parsed.active_modules) {
                  parseModulesData(parsed.active_modules);
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        console.error('Error fetching unified user session:', err);
      }
    }

    syncUserData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased" dir="rtl">
      {/* Top Mobile Bar */}
      <header className="lg:hidden h-16 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-sm text-white">لوحة التحكم الموحدة</span>
        </div>

        <div className="flex items-center gap-2">
          {activeModules.map((m) => (
            <span
              key={m}
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                modulesMap[m] === 'pending'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              }`}
            >
              {m === 'client' ? 'عميل' : m === 'freelancer' ? 'مستقل' : 'مزود'}
              {modulesMap[m] === 'pending' && ' (مراجعة)'}
            </span>
          ))}
          <NotificationBell userId={userId} />
        </div>
      </header>

      {/* Dynamic Conditional Sidebar */}
      <UnifiedSidebar
        activeModules={activeModules}
        modulesStatus={modulesMap}
        userName={userName}
        userEmail={userEmail}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="lg:mr-72 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Desktop Bar with User Status and Notification Bell */}
          <div className="hidden lg:flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400">مرحباً بك في لوحتك الهندسية،</span>
              <span className="text-sm font-bold text-white">{userName}</span>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell userId={userId} />
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
