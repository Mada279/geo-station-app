'use client';

import React, { useEffect, useRef } from 'react';
import { driver, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export const SURVSTA_TOUR_KEY = 'survsta_tour_completed';

export const DASHBOARD_TOUR_STEPS: DriveStep[] = [
  {
    element: '#tour-add-equipment',
    popover: {
      title: 'إضافة معداتك',
      description: 'من هنا يمكنك إضافة أجهزتك المساحية بكل تفاصيلها لعرضها للإيجار أو البيع.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-wallet-button',
    popover: {
      title: 'المعاملات المالية',
      description: 'اشحن رصيدك بسهولة عبر المحافظ الإلكترونية أو إنستاباي لتتمكن من استقبال الطلبات.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-inbox-card',
    popover: {
      title: 'طلبات العملاء',
      description: 'هنا ستستقبل طلبات التأجير من الشركات والمهندسين وتدير حالاتها.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#tour-revenue-card',
    popover: {
      title: 'لوحة الإحصائيات',
      description: 'تابع أرباحك وإيراداتك وتقييماتك بشكل لحظي من هذا القسم.',
      side: 'top',
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
    overlayColor: 'rgba(8, 25, 51, 0.78)',
    overlayOpacity: 0.85,
    stagePadding: 6,
    stageRadius: 14,
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

export function startDashboardTour(stepIndex: number = 0) {
  if (typeof window === 'undefined') return;

  requestAnimationFrame(() => {
    const driverInstance = createDashboardDriver();
    driverInstance.drive(stepIndex);
  });
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
        }, 850);

        return () => clearTimeout(timer);
      }
    }
  }, [autoStart]);

  return (
    <style jsx global>{`
      /* Survsta Luxury SaaS RTL Styling for Driver.js Popover */
      .survsta-driver-popover.driver-popover {
        direction: rtl !important;
        text-align: right !important;
        background: #0F253E !important;
        color: #F8FAFC !important;
        border: 1px solid rgba(245, 158, 11, 0.45) !important;
        border-radius: 18px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(245, 158, 11, 0.2) !important;
        padding: 18px 20px !important;
        min-width: 280px !important;
        max-width: 350px !important;
        font-family: inherit !important;
        z-index: 1000000000 !important;
      }

      .survsta-driver-popover .driver-popover-title {
        color: #F59E0B !important;
        font-size: 16px !important;
        font-weight: 800 !important;
        margin-bottom: 8px !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
      }

      .survsta-driver-popover .driver-popover-title::before {
        content: '✨';
        font-size: 14px;
      }

      .survsta-driver-popover .driver-popover-description {
        color: #CBD5E1 !important;
        font-size: 13px !important;
        line-height: 1.65 !important;
        margin-bottom: 14px !important;
      }

      .survsta-driver-popover .driver-popover-close-btn {
        color: #94A3B8 !important;
        top: 12px !important;
        left: 12px !important;
        right: auto !important;
        font-size: 18px !important;
        transition: color 0.2s !important;
        cursor: pointer !important;
      }

      .survsta-driver-popover .driver-popover-close-btn:hover {
        color: #F8FAFC !important;
      }

      .survsta-driver-popover .driver-popover-progress-text {
        color: #94A3B8 !important;
        font-size: 11px !important;
        font-weight: 700 !important;
      }

      .survsta-driver-popover .driver-popover-footer {
        margin-top: 14px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
      }

      .survsta-driver-popover .driver-popover-navigation-btns {
        display: flex !important;
        gap: 8px !important;
      }

      .survsta-driver-popover .driver-popover-navigation-btns button + button {
        margin-left: 0 !important;
      }

      .survsta-driver-popover .driver-popover-footer-btn {
        border-radius: 10px !important;
        padding: 6px 14px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }

      .survsta-driver-popover .driver-popover-prev-btn {
        background: #1E293B !important;
        color: #CBD5E1 !important;
        border: 1px solid #334155 !important;
      }

      .survsta-driver-popover .driver-popover-prev-btn:hover {
        background: #334155 !important;
        color: #FFFFFF !important;
      }

      .survsta-driver-popover .driver-popover-next-btn {
        background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%) !important;
        color: #081933 !important;
        border: none !important;
        font-weight: 800 !important;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35) !important;
      }

      .survsta-driver-popover .driver-popover-next-btn:hover {
        filter: brightness(1.12) !important;
        transform: translateY(-1px) !important;
      }

      .survsta-driver-popover .driver-popover-arrow {
        border-color: #0F253E !important;
      }
    `}</style>
  );
}
