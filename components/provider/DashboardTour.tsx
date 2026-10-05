'use client';

import React, { useEffect, useRef } from 'react';
import { driver, Driver, DriveStep } from 'driver.js';

export const SURVSTA_TOUR_KEY = 'survsta_tour_completed';

export const DASHBOARD_TOUR_STEPS: DriveStep[] = [
  {
    element: '#tour-add-equipment',
    popover: {
      title: 'إضافة معداتك',
      description: 'من هنا يمكنك إضافة أجهزتك المساحية بكل تفاصيلها لعرضها للإيجار أو البيع في السوق.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-wallet-button',
    popover: {
      title: 'شحن المحفظة والمعاملات',
      description: 'اشحن رصيد محفظتك بسهولة عبر فودافون كاش أو إنستاباي لاستقبال وتأكيد طلبات التأجير.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-revenue-card',
    popover: {
      title: 'إجمالي الإيرادات والإحصائيات',
      description: 'تابع أرباحك وإيراداتك وتقارير الصفقات الناجحة بشكل لحظي ودقيق.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-inbox-card',
    popover: {
      title: 'الطلبات الواردة',
      description: 'هنا تستقبل طلبات التأجير والشراء المباشرة من المهندسين وشركات المقاولات وتدير حالاتها.',
      side: 'bottom',
      align: 'center',
    },
  },
];

export function createDashboardDriver(): Driver {
  return driver({
    animate: true,
    smoothScroll: true,
    allowClose: true,
    allowKeyboardControl: true,
    skipMissingElement: true,
    waitForElement: 1500,
    overlayColor: 'rgba(8, 25, 51, 0.82)',
    overlayOpacity: 0.85,
    stagePadding: 8,
    stageRadius: 16,
    popoverClass: 'survsta-driver-popover',
    showProgress: true,
    nextBtnText: 'التالي ←',
    prevBtnText: '→ السابق',
    doneBtnText: 'إنهاء الجولة ✓',
    progressText: 'خطوة {{current}} من {{total}}',
    steps: DASHBOARD_TOUR_STEPS,
    onDestroyed: () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SURVSTA_TOUR_KEY, 'true');
      }
    },
  });
}

export function resetTourState() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SURVSTA_TOUR_KEY);
  }
}

export function startDashboardTour(stepIndex: number = 0) {
  if (typeof window === 'undefined') return;

  // 1. Clean up any lingering driver overlays or classes
  try {
    const existingOverlay = document.querySelector('.driver-overlay');
    if (existingOverlay) existingOverlay.remove();
    const existingPopover = document.querySelector('.driver-popover');
    if (existingPopover) existingPopover.remove();
    document.body.classList.remove('driver-active', 'driver-fade', 'driver-simple', 'driver-no-scroll');
  } catch {}

  // 2. Drive with slight delay to ensure UI modals or transitions are fully cleared
  setTimeout(() => {
    try {
      const driverInstance = createDashboardDriver();
      driverInstance.drive(stepIndex);
    } catch (err) {
      console.warn('[DashboardTour] Failed to start tour:', err);
    }
  }, 120);
}

interface DashboardTourProps {
  autoStart?: boolean;
}

export default function DashboardTour({ autoStart = true }: DashboardTourProps) {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || hasTriggeredRef.current) return;

    if (autoStart) {
      const hasCompletedTour = localStorage.getItem(SURVSTA_TOUR_KEY);
      if (!hasCompletedTour) {
        hasTriggeredRef.current = true;
        const timer = setTimeout(() => {
          startDashboardTour(0);
        }, 1200);

        return () => clearTimeout(timer);
      }
    }
  }, [autoStart]);

  return null;
}
