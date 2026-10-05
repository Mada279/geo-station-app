'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = 'survsta_pwa_prompt_dismissed_at';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === 'undefined') return;

    // 1. Check if already installed as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('survsta_pwa_installed') === 'true';

    if (isStandalone) {
      return;
    }

    // 2. Check 7-day dismissal memory
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const timestamp = parseInt(dismissedAt, 10);
        if (!isNaN(timestamp) && Date.now() - timestamp < SEVEN_DAYS_MS) {
          return; // Dismissed within 7 days, do not prompt
        }
      }
    } catch {}

    // 3. Detect mobile device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobileDevice =
      isIosDevice ||
      /android|blackberry|iemobile|opera mini/i.test(userAgent) ||
      window.innerWidth <= 768;

    setIsIOS(isIosDevice);

    if (!isMobileDevice) {
      // Prompt is tailored for mobile experience
      return;
    }

    // 4. Timer to trigger after 3 seconds for non-blocking initial rendering
    let timer: NodeJS.Timeout | null = null;

    if (isIosDevice) {
      // iOS Safari does not support beforeinstallprompt event
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
    }

    // 5. Chromium / Android event listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!timer) {
        timer = setTimeout(() => {
          setIsOpen(true);
        }, 3000);
      }
    };

    // 6. Installation completed event
    const handleAppInstalled = () => {
      setIsOpen(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('survsta_pwa_installed', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide((prev) => !prev);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsOpen(false);
          setDeferredPrompt(null);
          try {
            localStorage.setItem('survsta_pwa_installed', 'true');
          } catch {}
        }
      } catch (err) {
        console.warn('[PWA Prompt Error]:', err);
      }
    } else {
      // Generic fallback for browsers that don't pass beforeinstallprompt
      setShowIosGuide((prev) => !prev);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Dimmed backdrop when bottom sheet is active */}
      {isOpen && (
        <div
          onClick={handleDismiss}
          className="fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Smart Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[999] w-full transition-transform duration-500 ease-out md:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
        dir="rtl"
      >
        <div className="mx-auto max-w-lg rounded-t-3xl border-t border-cyan-500/30 bg-gradient-to-b from-[#0d2034] via-[#081933] to-[#040c16] p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] text-white">
          {/* Top Grab Handle */}
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-600/70" />

          {/* Header Row with App Icon & Close Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-cyan-400/40 bg-[#081933] p-1.5 shadow-lg shadow-cyan-950/50">
                <Image
                  src="/icons/icon-192x192.png"
                  alt="Survsta App Icon"
                  width={56}
                  height={56}
                  className="h-full w-full object-contain rounded-xl"
                  priority
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">ثبّت تطبيق Survsta</h3>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    مجاناً
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  لتجربة أسرع وإشعارات فورية لطلباتك وأجهزتك المساحية
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full p-1 text-slate-400 hover:text-white transition"
              aria-label="إغلاق التنبيه"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Value Highlights */}
          <div className="my-3.5 grid grid-cols-3 gap-2 border-y border-white/5 py-2.5 text-center text-[11px] text-slate-300">
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm">⚡</span>
              <span>وصول فوري بدون متصفح</span>
            </div>
            <div className="flex flex-col items-center gap-1 border-x border-white/10 px-1">
              <span className="text-sm">🔔</span>
              <span>تنبيهات فورية بالطلبات</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm">🛡️</span>
              <span>حفظ بيانات تسجيل الدخول</span>
            </div>
          </div>

          {/* iOS Step-by-Step Interactive Guide */}
          {showIosGuide && (
            <div className="mb-3.5 space-y-2 rounded-2xl border border-cyan-500/30 bg-[#0B1528] p-3 text-xs text-slate-200">
              <p className="font-bold text-cyan-400 flex items-center gap-1.5">
                <span>🍎</span>
                <span>خطوات التثبيت السريعة على iPhone/iPad:</span>
              </p>
              <ol className="space-y-1.5 pr-4 list-decimal list-outside text-[11px] text-slate-300 leading-relaxed">
                <li>
                  اضغط على زر <strong className="text-white">المشاركة</strong> (<span className="text-sm">⬆️</span> Share) في شريط Safari بالأسفل.
                </li>
                <li>
                  مرر لأسفل واختر <strong className="text-white">«إضافة إلى الشاشة الرئيسية»</strong> (<span className="text-sm">➕</span> Add to Home Screen).
                </li>
                <li>
                  اضغط على <strong className="text-cyan-300">«إضافة»</strong> (Add) في أعلى الزاوية.
                </li>
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] py-3 px-4 text-xs font-black text-[#081933] shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <span>📲</span>
              <span>{isIOS && !showIosGuide ? 'عرض طريقة التثبيت' : 'تثبيت الآن'}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              ليس الآن
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
