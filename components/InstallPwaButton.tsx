'use client';

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPwaButtonProps {
  className?: string;
  variant?: 'navbar' | 'topbar' | 'mobile' | 'floating';
  showIconOnly?: boolean;
}

export default function InstallPwaButton({
  className = '',
  variant = 'navbar',
  showIconOnly = false,
}: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect if running as standalone PWA
    const checkIsStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      if (isStandaloneMode) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };

    checkIsStandalone();

    // 2. Detect iOS / iPadOS Safari (which does not support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // If iOS and not installed yet, allow showing button to guide user
    if (isIosDevice) {
      const isStandaloneMode =
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!isStandaloneMode) {
        setIsInstallable(true);
      }
    }

    // 3. Listen for Chromium/Android PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // 4. Listen for completed installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowIosGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn('[PWA Install Error]:', err);
    }
  };

  // If already installed or browser doesn't report installable state
  if (isInstalled || !isInstallable) {
    return null;
  }

  // Navbar Topbar variant
  if (variant === 'topbar') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition shadow-sm cursor-pointer ${className}`}
          title="تثبيت منصة Survsta كتطبيق مستقل على جهازك"
        >
          <span className="text-[12px]">📲</span>
          <span>تثبيت التطبيق</span>
        </button>

        {showIosGuide && (
          <IosInstallModal onClose={() => setShowIosGuide(false)} />
        )}
      </>
    );
  }

  // Mobile drawer variant
  if (variant === 'mobile') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded-xl hover:bg-cyan-900/50 transition cursor-pointer ${className}`}
        >
          <span className="text-base">📲</span>
          <span>تثبيت تطبيق Survsta على هاتفك</span>
        </button>

        {showIosGuide && (
          <IosInstallModal onClose={() => setShowIosGuide(false)} />
        )}
      </>
    );
  }

  // Floating variant
  if (variant === 'floating') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`fixed bottom-6 left-6 z-50 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-cyan-900/40 border border-cyan-400/30 hover:brightness-110 transition animate-bounce ${className}`}
        >
          <span>📲</span>
          <span>تثبيت التطبيق</span>
        </button>

        {showIosGuide && (
          <IosInstallModal onClose={() => setShowIosGuide(false)} />
        )}
      </>
    );
  }

  // Default Navbar variant
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/50 border border-cyan-500/40 hover:bg-cyan-900/60 hover:text-white transition shadow-sm shadow-cyan-950/30 cursor-pointer ${className}`}
        title="تثبيت Survsta كتطبيق سريع ومستقل على شاشتك الرئيسية"
      >
        <span className="text-sm">📲</span>
        {!showIconOnly && <span>تثبيت التطبيق</span>}
      </button>

      {showIosGuide && (
        <IosInstallModal onClose={() => setShowIosGuide(false)} />
      )}
    </>
  );
}

function IosInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-right">
      <div className="relative w-full max-w-sm rounded-2xl border border-cyan-500/40 bg-[#0F253E] p-6 shadow-2xl text-white space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <span>📲</span>
            <span>تثبيت تطبيق Survsta على iPhone/iPad</span>
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          لتثبيت التطبيق على شاشتك الرئيسية عبر متصفح Safari، اتبع الخطوات البسيطة التالية:
        </p>

        <ol className="space-y-3 text-xs text-gray-300 list-decimal list-inside pr-1">
          <li className="leading-relaxed">
            اضغط على زر <strong>المشاركة</strong> (Share Icon <span className="inline-block">⬆️</span>) في شريط المتصفح أسفل الشاشة.
          </li>
          <li className="leading-relaxed">
            مرر لأسفل واختر <strong>«إضافة إلى الصفحة الرئيسية»</strong> (Add to Home Screen ➕).
          </li>
          <li className="leading-relaxed">
            اضغط على <strong>«إضافة»</strong> (Add) في أعلى الزاوية ليظهر التطبيق فوراً على شاشتك.
          </li>
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 transition shadow-lg shadow-cyan-500/20"
        >
          فهمت ذلك ✓
        </button>
      </div>
    </div>
  );
}
