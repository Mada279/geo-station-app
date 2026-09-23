'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { validateEgyptianPhone } from '@/lib/validations/phone';

export type ModuleType = 'client' | 'freelancer' | 'provider';

interface ModuleOption {
  id: ModuleType;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  features: string[];
  iconSvg: React.ReactNode;
}

const AVAILABLE_MODULES: ModuleOption[] = [
  {
    id: 'client',
    title: 'طالب خدمة (عميل)',
    badge: 'حجوزات وطلبات',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    description: 'طلب وتأجير الأجهزة المساحية، طلب خدمات الرفع المساحي للمقاولات والمشاريع الهندسية.',
    features: ['طلب وتأجير المحطات المساحية وGPS', 'سجل الحجوزات ومتابعة المشروعات', 'إدارة فواتير ومعاملات الشركة'],
    iconSvg: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'freelancer',
    title: 'مستقل / توظيف (مهندس مساحة)',
    badge: 'فرص عمل واستشارات',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'عرض السيرة الذاتية المهنية، استقبال طلبات العمل المستقل، والتقديم المباشر على الوظائف المساحية.',
    features: ['بناء ملف مهني متكامل ومعتمد', 'التقديم المباشر على الشواغر الوظيفية', 'تلقي عقود العمل الميدانية'],
    iconSvg: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'provider',
    title: 'مزود خدمة / شركة تأجير',
    badge: 'كتالوج واستثمار أصول',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'تأجير وبيع الأجهزة والمعدات المساحية، توثيق الكتالوج المؤسسي واستقبال طلبات الإيجار.',
    features: ['إدراج وإدارة كتالوج الأجهزة المساحية', 'إدارة عروض الأسعار وحالة التوفر', 'لوحة تحكم للمبيعات ومتابعة العملاء'],
    iconSvg: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>(['client']);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [syncWhatsApp, setSyncWhatsApp] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email verification (OTP) states
  const [authStep, setAuthStep] = useState<'form' | 'verify_otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingWa, setPendingWa] = useState('');
  const [pendingModules, setPendingModules] = useState<Record<string, string>>({});

  useEffect(() => {
    async function initUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          setEmail(user.email || '');
          setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
          const existingPhone = user.user_metadata?.phone || '';
          setPhoneNumber(existingPhone);
          const existingWa = user.user_metadata?.whatsapp || existingPhone;
          setWhatsappNumber(existingWa);
          if (existingWa && existingPhone && existingWa !== existingPhone) {
            setSyncWhatsApp(false);
          }

          // Check if user already has an entry in clients table
          const { data: clientRow } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (clientRow) {
            if (clientRow.full_name) setFullName(clientRow.full_name);
            if (clientRow.email) setEmail(clientRow.email);
            if (clientRow.phone_number) setPhoneNumber(clientRow.phone_number);
            if (clientRow.whatsapp_number) {
              setWhatsappNumber(clientRow.whatsapp_number);
              if (clientRow.phone_number && clientRow.whatsapp_number !== clientRow.phone_number) {
                setSyncWhatsApp(false);
              }
            } else if (clientRow.phone_number) {
              setWhatsappNumber(clientRow.phone_number);
            }
            if (clientRow.company_name) setCompanyName(clientRow.company_name);
            if (Array.isArray(clientRow.active_modules) && clientRow.active_modules.length > 0) {
              setSelectedModules(clientRow.active_modules);
            } else if (clientRow.active_modules && typeof clientRow.active_modules === 'object') {
              const keys = Object.keys(clientRow.active_modules) as ModuleType[];
              if (keys.length > 0) setSelectedModules(keys);
            }
          }
        } else {
          // Check local storage for mock/offline session
          if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('SURVSTA_AUTH_USER');
            if (storedUser) {
              try {
                const parsed = JSON.parse(storedUser);
                if (parsed.name) setFullName(parsed.name);
                if (parsed.email) setEmail(parsed.email);
                if (parsed.phone) {
                  setPhoneNumber(parsed.phone);
                  setWhatsappNumber(parsed.whatsapp || parsed.phone);
                }
                if (Array.isArray(parsed.active_modules)) {
                  setSelectedModules(parsed.active_modules);
                } else if (parsed.active_modules && typeof parsed.active_modules === 'object') {
                  setSelectedModules(Object.keys(parsed.active_modules) as ModuleType[]);
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        console.error('Error in onboarding init:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initUser();
  }, []);

  // Resend OTP Cooldown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    if (syncWhatsApp) {
      setWhatsappNumber(val);
    }
  };

  const toggleModule = (moduleId: ModuleType) => {
    setSelectedModules((prev) => {
      if (prev.includes(moduleId)) {
        // Prevent deselecting all
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  // Finalize setup after email OTP verification or for authenticated users
  const finalizeAccountSetup = async (
    targetUserId?: string | null,
    overrideEmail?: string,
    overridePhone?: string,
    overrideWa?: string,
    overrideModules?: Record<string, string>
  ) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setOtpError(null);

    const activeEmail = overrideEmail || pendingEmail || (email || currentUser?.email || '').trim().toLowerCase();
    const activePhone = overridePhone || pendingPhone || phoneNumber.trim();
    const activeWa = overrideWa || pendingWa || (syncWhatsApp ? activePhone : whatsappNumber).trim();
    const activeMods = overrideModules || pendingModules || (() => {
      const ms: Record<string, string> = {};
      selectedModules.forEach((m) => {
        ms[m] = m === 'provider' ? 'pending' : 'active';
      });
      return ms;
    })();

    let userId = targetUserId || currentUser?.id;
    const isUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);

    try {
      // 1. Upsert into clients table
      const clientPayload: any = {
        email: activeEmail,
        full_name: fullName.trim() || 'عضو منصة سيرفستا',
        phone_number: activePhone,
        whatsapp_number: activeWa,
        company_name: companyName.trim() || null,
        active_modules: activeMods,
        updated_at: new Date().toISOString(),
      };

      if (isUUID) {
        clientPayload.user_id = userId;
      }

      let { error: upsertErr } = await supabase
        .from('clients')
        .upsert(clientPayload, { onConflict: 'email' });

      if (upsertErr && (upsertErr.message?.includes('user_id') || upsertErr.message?.includes('foreign key') || upsertErr.code === '23503' || upsertErr.code === '22P02')) {
        delete clientPayload.user_id;
        const retry = await supabase.from('clients').upsert(clientPayload, { onConflict: 'email' });
        upsertErr = retry.error;
      }

      // 2. If provider module was requested, ensure provider record exists with pending status
      if (selectedModules.includes('provider') || activeMods['provider']) {
        try {
          const provPayload: any = {
            name: fullName.trim() || 'مزوّد جديد',
            email: activeEmail,
            phone: activePhone,
            company_name: companyName.trim() || fullName.trim(),
            status: 'pending',
          };
          if (isUUID) {
            provPayload.id = userId;
          }
          let { error: provErr } = await supabase.from('providers').upsert(provPayload, { onConflict: 'email' });
          if (provErr && (provErr.message?.includes('id') || provErr.code === '23503' || provErr.code === '22P02')) {
            delete provPayload.id;
            await supabase.from('providers').upsert(provPayload, { onConflict: 'email' });
          }

          if (isUUID) {
            await supabase.from('inapp_notifications').insert({
              user_id: userId,
              title: 'حساب المزود قيد المراجعة',
              message: 'تم استلام طلب تفعيل دور مزود الخدمة. الحساب قيد التدقيق حالياً من قبل الإدارة وسيتم إشعارك فور الاعتماد.',
              type: 'warning',
              link: '/provider/dashboard',
            });
          }
        } catch (provErr) {
          console.warn('[Onboarding Provider Record Notice]:', provErr);
        }
      }

      // 3. Welcome notification
      if (isUUID) {
        try {
          await supabase.from('inapp_notifications').insert({
            user_id: userId,
            title: 'تم إعداد وتفعيل حسابك بنجاح',
            message: 'مرحباً بك في منصة Survsta! تم تأكيد بريدك الإلكتروني بنجاح وجاهز لاستكشاف وطلب الأجهزة وإدارة أعمالك المساحية.',
            type: 'success',
            link: '/dashboard',
          });
        } catch {}
      }

      // 4. Update session storage and cookies
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('SURVSTA_AUTH_USER');
        const parsed = storedUser ? JSON.parse(storedUser) : {};
        const updated = {
          ...parsed,
          id: userId || parsed.id || `usr-${Date.now()}`,
          name: fullName.trim() || parsed.name || 'مستخدم سيرفستا',
          email: activeEmail,
          phone: activePhone,
          whatsapp: activeWa,
          active_modules: activeMods,
        };
        localStorage.setItem('SURVSTA_AUTH_USER', JSON.stringify(updated));
        document.cookie = `survsta_modules=${encodeURIComponent(JSON.stringify(activeMods))}; path=/; max-age=2592000`;
        document.cookie = `survsta_session=${encodeURIComponent(JSON.stringify({
          role: selectedModules.includes('provider') ? 'provider' : 'client',
          email: activeEmail,
          name: fullName.trim(),
          modules: activeMods,
        }))}; path=/; max-age=2592000`;
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error('[Onboarding finalize error]:', err);
      if (typeof window !== 'undefined') {
        document.cookie = `survsta_modules=${encodeURIComponent(JSON.stringify(activeMods))}; path=/; max-age=2592000`;
      }
      router.push('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify Supabase Email OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 6) {
      setOtpError('يرجى إدخال رمز التحقق المكون من 6 أرقام.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      // 1. Attempt signup OTP verification
      let verifyRes = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpCode.trim(),
        type: 'signup',
      });

      // 2. Fallback to email OTP type
      if (verifyRes.error) {
        verifyRes = await supabase.auth.verifyOtp({
          email: pendingEmail,
          token: otpCode.trim(),
          type: 'email',
        });
      }

      if (verifyRes.error) {
        throw new Error(verifyRes.error.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
      }

      const verifiedUser = verifyRes.data?.user;
      await finalizeAccountSetup(verifiedUser?.id || pendingUserId);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('expired') || msg.includes('Token has expired')) {
        setOtpError('انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد بالضغط على إعادة إرسال الرمز.');
      } else if (msg.includes('invalid') || msg.includes('Invalid')) {
        setOtpError('رمز التحقق غير صحيح. يرجى مراجعة بريدك الإلكتروني وإعادة المحاولة.');
      } else {
        setOtpError(msg || 'تعذر التحقق من الرمز حالياً. يرجى إعادة المحاولة.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Check link verification if user clicked email link
  const handleCheckLinkVerification = async () => {
    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        await finalizeAccountSetup(sessionData.session.user.id);
        return;
      }

      if (password) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: pendingEmail,
          password: password.trim(),
        });
        if (signInData?.user?.id && !signInErr) {
          await finalizeAccountSetup(signInData.user.id);
          return;
        }
      }

      setOtpError('لم يتم رصد تأكيد البريد بعد. يرجى الضغط على الرابط في الرسالة أو إدخال رمز الـ 6 أرقام.');
    } catch (err: any) {
      setOtpError(err?.message || 'لم يتم تأكيد الرابط بعد.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend Email OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError(null);
    setOtpMessage(null);

    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });

      if (resendErr) {
        throw new Error(resendErr.message);
      }

      setResendCooldown(60);
      setOtpMessage('تمت إعادة إرسال رمز التحقق ورابط التفعيل إلى بريدك الإلكتروني.');
    } catch (err: any) {
      setOtpError(err?.message || 'تعذر إعادة إرسال الرمز حالياً. يرجى الانتظار قليلاً ثم المحاولة.');
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedModules.length === 0) {
      setErrorMessage('يرجى اختيار ميزة أو دور واحد على الأقل لتفعيل حسابك.');
      return;
    }

    const cleanEmail = (email || currentUser?.email || '').trim().toLowerCase();

    // 1. Egyptian Phone Number Validations
    const phoneVal = validateEgyptianPhone(phoneNumber);
    if (!phoneVal.isValid) {
      setErrorMessage(phoneVal.error || 'رقم الهاتف غير صالح. يجب أن يتكون من 11 رقماً ويبدأ بـ 01.');
      return;
    }
    const cleanPhone = phoneVal.normalized;

    const rawWa = syncWhatsApp ? cleanPhone : whatsappNumber;
    const waVal = validateEgyptianPhone(rawWa);
    if (!waVal.isValid) {
      setErrorMessage(waVal.error || 'رقم الواتساب غير صالح. يجب أن يتكون من 11 رقماً ويبدأ بـ 01.');
      return;
    }
    const finalWa = waVal.normalized;

    // 2. Email Validation
    if (!currentUser && (!cleanEmail || !cleanEmail.includes('@'))) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صالح لإنشاء الحساب.');
      return;
    }

    // 3. Password Validations
    if (!currentUser) {
      if (!password || password.length < 6) {
        setErrorMessage('كلمة المرور إلزامية ويجب أن لا تقل عن 6 أحرف.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('كلمتا المرور غير متطابقتين. يرجى التأكد من تطابق كلمة المرور وتأكيدها.');
        return;
      }
    }

    // Modular approval status dictionary
    const modulesStatus: Record<string, string> = {};
    selectedModules.forEach((mod) => {
      modulesStatus[mod] = mod === 'provider' ? 'pending' : 'active';
    });

    // If user is already authenticated, finalize directly
    if (currentUser?.id) {
      await finalizeAccountSetup(currentUser.id, cleanEmail, cleanPhone, finalWa, modulesStatus);
      return;
    }

    // Otherwise, initiate Supabase signup with Email Verification
    setIsSubmitting(true);
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password.trim(),
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
            phone: cleanPhone,
            whatsapp: finalWa,
            active_modules: modulesStatus,
          },
        },
      });

      if (signUpErr) {
        const rawErr = (signUpErr.message || '').toLowerCase();
        if (signUpErr.message.includes('already registered')) {
          setErrorMessage('هذا البريد الإلكتروني مسجل مسبقاً في المنصة. يمكنك تسجيل الدخول مباشرة.');
          return;
        } else if ((signUpErr as any).status === 429 || rawErr.includes('rate limit')) {
          console.warn('[Onboarding] Auth rate limit detected. Transitioning to verification screen.');
        } else {
          throw new Error(signUpErr.message);
        }
      }

      // Store pending registration data and transition to OTP verification screen
      setPendingEmail(cleanEmail);
      setPendingUserId(signUpData?.user?.id || null);
      setPendingPhone(cleanPhone);
      setPendingWa(finalWa);
      setPendingModules(modulesStatus);
      setResendCooldown(60);
      setAuthStep('verify_otp');
      setOtpMessage('تم إرسال رمز التحقق ورابط التفعيل إلى بريدك الإلكتروني بنجاح.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white" dir="rtl">
      {authStep === 'verify_otp' ? (
        <main className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-fade-in">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <span>✉️</span>
                <span>الخطوة الأخيرة: تفعيل البريد الإلكتروني</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">تأكيد البريد الإلكتروني (رمز التحقق OTP)</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                أرسلنا رمز تحقق ورابط تفعيل إلى بريدك:
                <span className="block mt-1 font-mono font-bold text-cyan-400 text-sm" dir="ltr">{pendingEmail}</span>
              </p>
            </div>

            {otpError && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>{otpError}</span>
              </div>
            )}

            {otpMessage && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-center gap-2">
                <span>✓</span>
                <span>{otpMessage}</span>
              </div>
            )}

            {/* OTP Input */}
            <div className="max-w-xs mx-auto space-y-2">
              <label className="block text-xs font-semibold text-slate-300">أدخل رمز الـ 6 أرقام المرسل إلى بريدك</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ''));
                  if (otpError) setOtpError(null);
                }}
                placeholder="123456"
                dir="ltr"
                autoFocus
                className="w-full text-center tracking-[0.4em] font-mono text-2xl font-black py-3 px-4 rounded-xl bg-slate-950 border border-cyan-500/40 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 max-w-md mx-auto">
              <button
                type="button"
                disabled={isVerifyingOtp || otpCode.length < 6}
                onClick={handleVerifyOtp}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-l from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-cyan-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحقق والتفعيل...</span>
                  </>
                ) : (
                  <span>تأكيد الرمز وتفعيل الحساب ←</span>
                )}
              </button>

              <button
                type="button"
                disabled={isVerifyingOtp}
                onClick={handleCheckLinkVerification}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-950/60 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <span>نقرت على رابط التفعيل في الرسالة (متابعة)</span>
              </button>
            </div>

            {/* Resend and Edit */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-400">
              {resendCooldown > 0 ? (
                <span className="text-slate-500 font-mono">إعادة إرسال الرمز بعد ({resendCooldown} ثانية)</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold"
                >
                  لم يصلك الرمز؟ إعادة إرسال رمز التحقق
                </button>
              )}

              <span className="hidden sm:inline text-slate-700">|</span>

              <button
                type="button"
                onClick={() => {
                  setAuthStep('form');
                  setOtpError(null);
                }}
                className="text-slate-400 hover:text-slate-200 hover:underline"
              >
                تعديل البريد الإلكتروني أو البيانات
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Intro */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <span>✨</span>
            <span>حساب واحد مرن لكافة الاحتياجات الهندسية</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            كيف ترغب في استخدام المنصة؟
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            (يمكنك اختيار أكثر من خيار) — لن نلزمك بنوع حساب واحد، يمكنك طلب المعدات والتقديم على الوظائف في آن واحد.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Multi-select Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {AVAILABLE_MODULES.map((mod) => {
              const isSelected = selectedModules.includes(mod.id);
              return (
                <div
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`cursor-pointer rounded-2xl border p-6 transition-all duration-200 flex flex-col justify-between relative select-none ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  {/* Top Checkbox & Badge */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                            : 'border-slate-700 bg-slate-950'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${mod.badgeColor}`}>
                        {mod.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${isSelected ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {mod.iconSvg}
                      </div>
                      <h3 className="font-bold text-base text-white">{mod.title}</h3>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  {/* Feature list */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
                    {mod.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="text-cyan-400 text-sm leading-none">•</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Details Details Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-cyan-400 font-bold text-lg">📝</span>
                <div>
                  <h3 className="text-base font-bold text-white">بيانات الحساب والاتصال الرسمي</h3>
                  <p className="text-xs text-slate-400">ستُستخدم للمصادقة وتأكيد الحجوزات وإشعارات الاعتماد والعمليات الميدانية</p>
                </div>
              </div>
              {currentUser && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  جلسة مسجلة: {currentUser.email}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">الاسم الكامل *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: م. كريم عبد الله"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>البريد الإلكتروني *</span>
                  <span className="text-[10px] text-cyan-400">للمصادقة والإشعارات</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  dir="ltr"
                  required
                  disabled={!!currentUser}
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 text-left focus:outline-none focus:border-cyan-500 transition font-mono"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>رقم الهاتف *</span>
                  <span className="text-[10px] text-cyan-400 font-normal">11 رقماً يبدأ بـ 01</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="010xxxxxxxx"
                  dir="ltr"
                  required
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 text-left focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-mono"
                />
                <span className="text-[11px] text-slate-400 block">
                  رقم مصري مكوّن من 11 رقماً يبدأ بـ 01 (مثل: 01012345678)
                </span>
              </div>

              {/* WhatsApp Number with Sync Checkbox */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">رقم الواتساب *</label>
                  <label className="flex items-center gap-1.5 text-[11px] text-emerald-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncWhatsApp}
                      onChange={(e) => {
                        setSyncWhatsApp(e.target.checked);
                        if (e.target.checked) setWhatsappNumber(phoneNumber);
                      }}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                    />
                    <span>نفس رقم الهاتف</span>
                  </label>
                </div>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => {
                    setWhatsappNumber(e.target.value);
                    if (syncWhatsApp) setSyncWhatsApp(false);
                  }}
                  disabled={syncWhatsApp}
                  placeholder="010xxxxxxxx"
                  dir="ltr"
                  required
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 text-left focus:outline-none focus:border-cyan-500 transition font-mono"
                />
                <span className="text-[11px] text-slate-400 block">
                  رقم الواتساب للتواصل وتأكيد الحجز (11 رقماً يبدأ بـ 01)
                </span>
              </div>

              {/* Password & Confirm Password for unauthenticated users */}
              {!currentUser && (
                <>
                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>كلمة المرور *</span>
                      <span className="text-[10px] text-slate-400">6 أحرف على الأقل</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required={!currentUser}
                        minLength={6}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 pl-11 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                        title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>تأكيد كلمة المرور *</span>
                      {confirmPassword && password !== confirmPassword && (
                        <span className="text-[10px] text-red-400 font-semibold">غير متطابقة ⚠️</span>
                      )}
                      {confirmPassword && password === confirmPassword && (
                        <span className="text-[10px] text-emerald-400 font-semibold">متطابقة ✓</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required={!currentUser}
                        minLength={6}
                        className={`w-full bg-slate-950 border rounded-xl px-3.5 pl-11 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition ${
                          confirmPassword && password !== confirmPassword
                            ? 'border-red-500/80 focus:border-red-400'
                            : confirmPassword && password === confirmPassword
                            ? 'border-emerald-500/80 focus:border-emerald-400'
                            : 'border-slate-700 focus:border-cyan-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                        title={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Company / Office Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">اسم الشركة / المكتب (اختياري)</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: مكتب النخبة للمساحة"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>تم اختيار {selectedModules.length} أدوار نشطة في حسابك. يمكنك تعديلها في أي وقت من الإعدادات.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedModules.length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-l from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-xl shadow-cyan-600/20 transition cursor-pointer"
            >
              <span>{isSubmitting ? 'جاري تهيئة الحساب...' : 'حفظ والدخول إلى لوحة التحكم الموحدة'}</span>
              <span className="text-base">←</span>
            </button>
          </div>
        </form>
      </main>
      )}
    </div>
  );
}
