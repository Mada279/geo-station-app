'use client';

import React, { useEffect, useState } from 'react';
import { Joyride, Step, EventData, STATUS, ACTIONS, EVENTS } from 'react-joyride';

interface ProviderOnboardingTourProps {
  onStepChange?: (stepIndex: number) => void;
  runTour?: boolean;
  onTourEnd?: () => void;
}

export default function ProviderOnboardingTour({
  onStepChange,
  runTour = true,
  onTourEnd,
}: ProviderOnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Define the tour steps precisely targeting specific UI elements as requested
  const steps: Step[] = [
    {
      target: '#tour-add-button',
      content: 'أهلاً بك في منصتك! ابدأ من هنا لإضافة أول جهاز أو خدمة لك.',
      title: 'إضافة الأجهزة والخدمات',
      placement: 'bottom',
    },
    {
      target: '#tour-upload-area',
      content: 'الصور الواضحة تزيد من ثقة العملاء وفرص التأجير. ارفع صوراً حقيقية للأجهزة.',
      title: 'رفع صور المعدات',
      placement: 'left',
    },
    {
      target: '#tour-price-input',
      content: 'حدد السعر بدقة. يمكنك إضافة سعر يومي أو شهري لزيادة فرصك.',
      title: 'تحديد أسعار التأجير أو البيع',
      placement: 'top',
    },
    {
      target: '#tour-save-button',
      content: 'بمجرد الحفظ، سيظهر عرضك لآلاف المهندسين والشركات على المنصة!',
      title: 'النشر المباشر على Survsta',
      placement: 'top',
    },
  ];

  useEffect(() => {
    // Check localStorage to ensure tour only runs once for new providers
    if (typeof window !== 'undefined') {
      const hasSeenTour = localStorage.getItem('survsta_provider_tour_seen');
      if (!hasSeenTour && runTour) {
        const timer = setTimeout(() => {
          setRun(true);
        }, 800);
        return () => clearTimeout(timer);
      } else if (runTour && hasSeenTour === 'manual_run') {
        setRun(true);
        setStepIndex(0);
      }
    }
  }, [runTour]);

  const handleJoyrideEvent = (data: EventData) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setStepIndex(nextIndex);
      if (onStepChange) onStepChange(nextIndex);
    }

    // When step 0 advances to step 1, notify parent to ensure modal is open
    if (index === 0 && (action === ACTIONS.NEXT || type === EVENTS.STEP_AFTER)) {
      if (onStepChange) onStepChange(1);
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      if (typeof window !== 'undefined') {
        localStorage.setItem('survsta_provider_tour_seen', 'true');
      }
      if (onTourEnd) onTourEnd();
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      onEvent={handleJoyrideEvent}
      continuous
      run={run}
      scrollToFirstStep
      stepIndex={stepIndex}
      steps={steps}
      // Exact options required by user:
      // options: { primaryColor: '#1CA7FF', backgroundColor: '#0F253E', textColor: '#FFFFFF', overlayColor: 'rgba(0, 0, 0, 0.7)' }
      options={{
        primaryColor: '#1CA7FF',
        backgroundColor: '#0F253E',
        textColor: '#FFFFFF',
        overlayColor: 'rgba(0, 0, 0, 0.7)',
        arrowColor: '#0F253E',
        zIndex: 10000,
      }}
      locale={{
        back: 'السابق',
        close: 'إغلاق',
        last: 'إنهاء الجولة ✓',
        next: 'التالي ←',
        open: 'فتح الحوار',
        skip: 'تخطي الجولة',
      }}
      styles={{
        tooltip: {
          direction: 'rtl',
          textAlign: 'right',
          fontFamily: 'inherit',
          borderRadius: '16px',
          border: '1px solid rgba(28, 167, 255, 0.35)',
          padding: '18px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)',
        },
        tooltipTitle: {
          fontSize: '15px',
          fontWeight: 'bold',
          color: '#1CA7FF',
          marginBottom: '8px',
        },
        tooltipContent: {
          padding: '4px 0 8px 0',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#E2E8F0',
        },
        buttonPrimary: {
          backgroundColor: '#1CA7FF',
          color: '#081933',
          fontWeight: 'bold',
          borderRadius: '10px',
          padding: '8px 18px',
          fontSize: '12.5px',
          outline: 'none',
          boxShadow: '0 4px 12px rgba(28, 167, 255, 0.3)',
        },
        buttonBack: {
          color: '#94A3B8',
          marginRight: '8px',
          fontSize: '12px',
          fontWeight: '600',
        },
        buttonSkip: {
          color: '#64748B',
          fontSize: '12px',
        },
        buttonClose: {
          color: '#94A3B8',
          top: '12px',
          right: '12px',
        },
      }}
    />
  );
}
