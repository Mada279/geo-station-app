'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { formatWhatsAppNumber, getWhatsAppLink } from '@/utils/phoneUtils';

interface ContactButtonProps {
  providerId: string | number;
  equipmentTitle?: string;
  phoneNumber?: string;
  className?: string;
  label?: string;
}

function getLocalUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('SURVSTA_AUTH_USER');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.id || parsed.email)) return parsed;
    }
  } catch {}

  try {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const trimmed = c.trim();
      if (trimmed.startsWith('survsta_session=')) {
        const val = trimmed.substring('survsta_session='.length);
        const decoded = decodeURIComponent(val);
        const parsed = JSON.parse(decoded);
        if (parsed && (parsed.email || parsed.role)) return parsed;
      }
    }
  } catch {}
  return null;
}

export default function ContactButton({
  providerId,
  equipmentTitle,
  phoneNumber = '01033134413',
  className,
  label,
}: ContactButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoggingLead, setIsLoggingLead] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setCurrentUser(session.user);
          setIsAuthResolved(true);
          return;
        }

        const local = getLocalUser();
        if (local && isMounted) {
          setCurrentUser(local);
          setIsAuthResolved(true);
          return;
        }

        if (isMounted) {
          setCurrentUser(null);
          setIsAuthResolved(true);
        }
      } catch {
        if (isMounted) {
          const local = getLocalUser();
          setCurrentUser(local);
          setIsAuthResolved(true);
        }
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        const local = getLocalUser();
        setCurrentUser(local);
      }
      setIsAuthResolved(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // State 1: Logged Out -> Track Anonymous Intent & Redirect
    if (isAuthResolved && !currentUser) {
      // A. Fire-and-forget tracking for Top-of-Funnel intent
      const intentPayload = {
        viewer_id: 'anonymous', 
        provider_id: String(providerId),
        equipment_title: equipmentTitle || null,
        created_at: new Date().toISOString(),
      };
      
      // Do not await this so the redirect is instant
      supabase.from('contact_requests').insert([intentPayload]).then(
        ({ error }) => {
          if (error) {
            supabase.from('lead_tracking').insert([intentPayload]).then(() => {}, () => {});
          }
        },
        () => {}
      );

      // B. Redirect to login with proper callback
      const currentPath = pathname || '/directory'; 
      const redirectUrl = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
      return;
    }

    // State 2: Logged In & Not Revealed yet -> Reveal & Log Lead
    if (!isRevealed) {
      setIsRevealed(true);
      setIsLoggingLead(true);

      try {
        const viewerId = currentUser?.id || currentUser?.email || 'authenticated-user';
        const leadPayload = {
          viewer_id: String(viewerId),
          provider_id: String(providerId),
          equipment_title: equipmentTitle || null,
          created_at: new Date().toISOString(),
        };

        // 1. Attempt insert into contact_requests
        const { error: err1 } = await supabase.from('contact_requests').insert([leadPayload]);
        
        // 2. If table doesn't exist, try lead_tracking
        if (err1) {
          await supabase.from('lead_tracking').insert([leadPayload]);
        }

        // 3. Fallback client-side cache for offline tracking resilience
        if (typeof window !== 'undefined' && window.localStorage) {
          const stored = JSON.parse(localStorage.getItem('survsta_leads_cache') || '[]');
          stored.push(leadPayload);
          localStorage.setItem('survsta_leads_cache', JSON.stringify(stored));
        }
      } catch (err) {
        console.warn('[Lead Tracking Warning]:', err);
      } finally {
        setIsLoggingLead(false);
      }
    }
  };

  const defaultClasses =
    className ||
    'rounded-lg bg-[#081933] hover:bg-[#0F253E] text-white px-4 py-2 font-bold text-xs transition';

  // State 3: Logged In & Revealed -> Display Phone & Clickable Links
  if (isRevealed) {
    const rawDigits = formatWhatsAppNumber(phoneNumber);
    const waLink = getWhatsAppLink(phoneNumber, `مرحباً، أود الاستفسار بخصوص ${equipmentTitle || 'المعدة/الخدمة المعروضة على Survsta'}`);

    return (
      <div
        className="inline-flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={`tel:+${rawDigits}`}
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          title="اتصال هاتفي مباشر"
        >
          <span>📞</span>
          <span dir="ltr">{phoneNumber}</span>
        </a>
        <a
          href={waLink}
          onClick={(e) => e.stopPropagation()}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white px-2.5 py-1.5 text-xs font-bold transition flex items-center gap-1 shadow-md shadow-emerald-500/20"
          title="محادثة واتساب سريعة"
        >
          <span>💬</span>
        </a>
      </div>
    );
  }

  // State 1 & 2: Before Reveal
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${defaultClasses} flex items-center justify-center gap-1.5 group cursor-pointer`}
      title={currentUser ? 'اضغط لإظهار رقم الهاتف والتواصل' : 'سجل الدخول لإظهار رقم التواصل'}
    >
      <span className="group-hover:scale-110 transition-transform">
        {currentUser ? '📞' : '🔒'}
      </span>
      <span>{label || 'إظهار رقم التواصل'}</span>
    </button>
  );
}
