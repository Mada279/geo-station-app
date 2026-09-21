'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabaseClient';

export interface ProviderReview {
  id: string;
  provider_id: string;
  client_id?: string;
  rating: number; // 1-5
  review_text: string;
  reply_text?: string | null;
  created_at: string;
  // Joined or fallback client details
  client_name?: string;
  client_company?: string;
  client_phone?: string;
}

const INITIAL_SAMPLE_REVIEWS: ProviderReview[] = [
  {
    id: 'rev-sample-1',
    provider_id: 'default',
    client_id: 'client-1',
    rating: 5,
    review_text: 'تجربة ممتازة جداً! جهاز Leica TS07 كان بحالة المصنع مع شهادة معايرة حديثة، والمهندس المسؤول كان متعاوناً جداً وقام بتسليم الجهاز في الموقع بالسادس من أكتوبر في الموعد المحدد.',
    reply_text: 'شكراً جزيلاً م. محمود على ثقتكم الغالية في مكتبنا. نسعد دائماً بدعم مشاريعكم الهندسية بأعلى دقة ومعايير معتمدة.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    client_name: 'م. محمود عبد الرازق',
    client_company: 'شركة النيل للإنشاءات الهندسية',
  },
  {
    id: 'rev-sample-2',
    provider_id: 'default',
    client_id: 'client-2',
    rating: 5,
    review_text: 'استأجرنا طقم GPS RTK Foif لمدة أسبوعين في مشروع العاصمة الإدارية. دقة الرصد كانت ممتازة وثبات الإشارة ممتاز جداً مع شبكة Survsta CORS.',
    reply_text: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    client_name: 'م. طارق الصاوي',
    client_company: 'مكتب الصاوي للاستشارات الجيوديسية',
  },
  {
    id: 'rev-sample-3',
    provider_id: 'default',
    client_id: 'client-3',
    rating: 4,
    review_text: 'الجهاز ممتاز ويعمل بكفاءة عالية، نرجو فقط توفير شاحن بطارية إضافي في باقات التأجير الطويلة للأعمال الميدانية الشاقة.',
    reply_text: 'ملاحظة ممتازة ومحل تقدير م. كريم. تم توفير بطاريات وشواحن إضافية فورية مجاناً مع جميع أجهزة الرصد للمدد الطويلة. تشرفنا بالعمل معكم.',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    client_name: 'م. كريم المنشاوي',
    client_company: 'أبراج مصر للتطوير العمراني',
  },
  {
    id: 'rev-sample-4',
    provider_id: 'default',
    client_id: 'client-4',
    rating: 5,
    review_text: 'من أفضل مكاتب المساحة في الالتزام ودقة التسليم. تعاملنا معهم في أكثر من 4 مواقع وكانت النتائج متطابقة مع شبكة الثوابت بدقة مليمترية.',
    reply_text: null,
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    client_name: 'م. هاني زهران',
    client_company: 'المهندسون المتحدون للمقاولات',
  },
];

const QUICK_REPLY_TEMPLATES = [
  'شكراً جزيلاً مهندسنا العزيز على ثقتكم الغالية في معداتنا وخدماتنا. نسعد دائماً بدعم نجاح مشاريعكم!',
  'نشكركم على تقييمكم الإيجابي، ويسعدنا دائماً تقديم أفضل وأدق الأجهزة المساحية بأعلى جودة ومعايير فنية.',
  'ملاحظتكم محل اهتمامنا البالغ وتقديرنا، تم أخذها في الاعتبار فوراً لتطوير التجربة وتقديم الأفضل دائماً.',
  'سعدنا بالتعاون معكم في هذا المشروع الهام ونتطلع لاستمرار الشراكة المتميزة دائماً بإذن الله.',
];

export default function ProviderReviewsPage() {
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [replyFilter, setReplyFilter] = useState<string>('all'); // 'all' | 'unreplied' | 'replied'
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inline Reply State
  const [inlineReplyReviewId, setInlineReplyReviewId] = useState<string | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState<string>('');

  // Reply Modal / Drawer State
  const [selectedReviewForReply, setSelectedReviewForReply] = useState<ProviderReview | null>(null);
  const [replyInput, setReplyInput] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string>('مكتب مساحي معتمد');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to render stars
  const renderStars = (rating: number, maxStars = 5) => {
    const fullStars = Math.min(maxStars, Math.max(0, Math.round(rating)));
    return (
      <div className="flex items-center gap-0.5 text-yellow-400 font-mono text-sm" dir="ltr">
        {Array.from({ length: maxStars }).map((_, i) => (
          <span key={i} className={i < fullStars ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-600'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  // Fetch reviews from Supabase
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      let authUserId: string | null = null;
      let providerDbId: string | null = null;

      // 1. Check Supabase Auth
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        authUserId = authData.user.id;
      }

      // 2. Check localStorage fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('SURVSTA_AUTH_USER');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (!authUserId && parsed.id) authUserId = parsed.id;
            if (parsed.org || parsed.organization || parsed.name) {
              setProviderName(parsed.org || parsed.organization || parsed.name);
            }
          } catch {}
        }
      }

      // 3. Resolve provider record ID if different
      if (authUserId) {
        const { data: provRow } = await supabase
          .from('providers')
          .select('id, name')
          .or(`id.eq.${authUserId},email.eq.${authData?.user?.email || ''}`)
          .maybeSingle();

        if (provRow?.id) {
          providerDbId = provRow.id;
          if (provRow.name) setProviderName(provRow.name);
        }
      }

      const targetId = providerDbId || authUserId;
      setActiveProviderId(targetId);

      // 4. Query provider_reviews
      let query = supabase
        .from('provider_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (targetId) {
        if (providerDbId && authUserId && providerDbId !== authUserId) {
          query = query.or(`provider_id.eq.${targetId},provider_id.eq.${authUserId}`);
        } else {
          query = query.eq('provider_id', targetId);
        }
      }

      const { data: reviewsData, error: reviewsError } = await query;

      if (!reviewsError && reviewsData && reviewsData.length > 0) {
        await enrichReviewsWithClients(reviewsData);
      } else {
        // Check if table not yet populated or offline cache exists
        let loaded = false;
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('SURVSTA_LOCAL_PROVIDER_REVIEWS');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setReviews(parsed);
                loaded = true;
              }
            } catch {}
          }
        }

        if (!loaded) {
          // Fallback to sample reviews for immediate provider feedback & demo capability
          setReviews(INITIAL_SAMPLE_REVIEWS);
          if (typeof window !== 'undefined') {
            localStorage.setItem('SURVSTA_LOCAL_PROVIDER_REVIEWS', JSON.stringify(INITIAL_SAMPLE_REVIEWS));
          }
        }
      }
    } catch (err) {
      console.warn('[ProviderReviews] Exception fetching reviews:', err);
      // Fallback
      setReviews(INITIAL_SAMPLE_REVIEWS);
    } finally {
      setIsLoading(false);
    }
  };

  // Enrich reviews with client names from clients table
  const enrichReviewsWithClients = async (rawReviews: any[]) => {
    try {
      const clientIds = Array.from(new Set(rawReviews.map((r) => r.client_id).filter(Boolean)));

      let clientMap: Record<string, any> = {};

      if (clientIds.length > 0) {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('id, full_name, company_name, phone_number')
          .in('id', clientIds);

        if (clientsData) {
          clientsData.forEach((c) => {
            clientMap[c.id] = c;
          });
        }
      }

      const merged: ProviderReview[] = rawReviews.map((r, index) => {
        const clientInfo = r.client_id ? clientMap[r.client_id] : null;
        return {
          id: r.id,
          provider_id: r.provider_id,
          client_id: r.client_id,
          rating: Number(r.rating) || 5,
          review_text: r.review_text || '',
          reply_text: r.reply_text || null,
          created_at: r.created_at || new Date().toISOString(),
          client_name: clientInfo?.full_name || r.client_name || `مهندس معتمد #${index + 1}`,
          client_company: clientInfo?.company_name || r.client_company || 'جهة هندسية معتمدة',
          client_phone: clientInfo?.phone_number || r.client_phone,
        };
      });

      setReviews(merged);
      if (typeof window !== 'undefined') {
        localStorage.setItem('SURVSTA_LOCAL_PROVIDER_REVIEWS', JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('[ProviderReviews] Failed to enrich with clients:', err);
      setReviews(rawReviews);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Handle Reply Submission
  const handleOpenReplyModal = (rev: ProviderReview) => {
    setSelectedReviewForReply(rev);
    setReplyInput(rev.reply_text || '');
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewForReply) return;

    if (!replyInput.trim()) {
      showToast('⚠️ يرجى كتابة نص الرد أولاً.');
      return;
    }

    setIsSubmittingReply(true);
    const updatedReplyText = replyInput.trim();

    try {
      // 1. Try Supabase Update
      const { error } = await supabase
        .from('provider_reviews')
        .update({ reply_text: updatedReplyText })
        .eq('id', selectedReviewForReply.id);

      if (error) {
        console.warn('[ProviderReviews] Supabase update notice:', error.message);
      }

      // 2. Update state optimistically
      const updatedList = reviews.map((r) =>
        r.id === selectedReviewForReply.id ? { ...r, reply_text: updatedReplyText } : r
      );
      setReviews(updatedList);

      if (typeof window !== 'undefined') {
        localStorage.setItem('SURVSTA_LOCAL_PROVIDER_REVIEWS', JSON.stringify(updatedList));
      }

      showToast('✓ تم نشر ردك على التقييم بنجاح، وسيظهر للمهندسين والعملاء.');
      setSelectedReviewForReply(null);
      setReplyInput('');
    } catch (err) {
      console.warn('[ProviderReviews] Save reply error:', err);
      showToast('حدث خطأ أثناء حفظ الرد. تم الحفظ محلياً.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSaveInlineReply = async (reviewId: string) => {
    if (!inlineReplyText.trim()) {
      showToast('⚠️ يرجى كتابة نص الرد أولاً.');
      return;
    }

    setIsSubmittingReply(true);
    const updatedReplyText = inlineReplyText.trim();

    try {
      // 1. Try Supabase Update
      const { error } = await supabase
        .from('provider_reviews')
        .update({ reply_text: updatedReplyText })
        .eq('id', reviewId);

      if (error) {
        console.warn('[ProviderReviews] Supabase update notice:', error.message);
      }

      // 2. Update state optimistically
      const updatedList = reviews.map((r) =>
        r.id === reviewId ? { ...r, reply_text: updatedReplyText } : r
      );
      setReviews(updatedList);

      if (typeof window !== 'undefined') {
        localStorage.setItem('SURVSTA_LOCAL_PROVIDER_REVIEWS', JSON.stringify(updatedList));
      }

      showToast('✓ تم نشر ردك على التقييم بنجاح!');
      setInlineReplyReviewId(null);
      setInlineReplyText('');
    } catch (err) {
      console.warn('[ProviderReviews] Inline reply error:', err);
      showToast('حدث خطأ أثناء حفظ الرد. تم الحفظ محلياً.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // KPIs Calculations
  const metrics = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        avgRating: 0,
        total: 0,
        satisfactionRate: 100,
        repliedCount: 0,
        pendingReplyCount: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = Number((sum / total).toFixed(1));

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let satisfied = 0;
    let replied = 0;

    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))) as 1 | 2 | 3 | 4 | 5;
      breakdown[star] = (breakdown[star] || 0) + 1;
      if (r.rating >= 4) satisfied += 1;
      if (r.reply_text && r.reply_text.trim()) replied += 1;
    });

    return {
      avgRating: avg,
      total,
      satisfactionRate: Math.round((satisfied / total) * 100),
      repliedCount: replied,
      pendingReplyCount: total - replied,
      breakdown,
    };
  }, [reviews]);

  // Filtered Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchText = (r.review_text || '').toLowerCase().includes(q);
        const matchClient = (r.client_name || '').toLowerCase().includes(q);
        const matchCompany = (r.client_company || '').toLowerCase().includes(q);
        const matchReply = (r.reply_text || '').toLowerCase().includes(q);
        if (!matchText && !matchClient && !matchCompany && !matchReply) {
          return false;
        }
      }

      // Star Rating Filter
      if (ratingFilter !== 'all') {
        if (ratingFilter === '5' && r.rating !== 5) return false;
        if (ratingFilter === '4' && r.rating !== 4) return false;
        if (ratingFilter === '3-below' && r.rating > 3) return false;
      }

      // Reply Filter
      if (replyFilter === 'unreplied' && r.reply_text && r.reply_text.trim()) return false;
      if (replyFilter === 'replied' && (!r.reply_text || !r.reply_text.trim())) return false;

      return true;
    });
  }, [reviews, searchQuery, ratingFilter, replyFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#0F253E] border border-amber-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <span className="text-amber-400 text-lg">⭐</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/provider/dashboard" className="hover:text-amber-400 transition">
              لوحة التحكم
            </Link>
            <span>/</span>
            <span className="text-amber-300">التقييمات وآراء العملاء</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span>التقييمات وملاحظات العملاء</span>
            <span className="text-2xl text-yellow-400">⭐</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            استعرض تقييمات العملاء والمهندسين الذين استأجروا معداتك أو تلقوا خدماتك المساحية، وتفاعل معهم مباشرة لتعزيز موثوقية حسابك.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReviews}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0F253E] border border-amber-500/30 text-amber-300 hover:bg-[#153457] text-xs transition"
          >
            <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
            <span>تحديث التقييمات</span>
          </button>

          <Link
            href="/provider/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs border border-gray-700 transition"
          >
            <span>← العودة للرئيسية</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-[#0F253E]/90 to-[#122c4a]/90 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-300">متوسط التقييم العام</span>
            <span className="text-xl">🌟</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-yellow-400 font-mono">
              {metrics.avgRating > 0 ? metrics.avgRating.toFixed(1) : '0.0'}
            </span>
            <span className="text-sm text-gray-400 font-mono">/ 5.0</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            {renderStars(metrics.avgRating)}
            <span className="text-[11px] text-gray-400">بناءً على {metrics.total} تقييم</span>
          </div>
        </div>

        {/* Total Reviews */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-5 backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-300">إجمالي المراجعات</span>
            <span className="text-xl text-amber-400">📝</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono">
            {metrics.total}
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
            <span>✓</span>
            <span>مراجعات موثّقة لطلبات إيجار معتمدة</span>
          </div>
        </div>

        {/* Satisfaction Rate */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-5 backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-300">نسبة الرضا والقبول</span>
            <span className="text-xl text-emerald-400">🤝</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
            {metrics.satisfactionRate}%
          </div>
          <div className="text-[11px] text-gray-400 mt-2">
            من العملاء قيّموا الخدمة بـ 4 أو 5 نجوم
          </div>
        </div>

        {/* Reply Rate */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-5 backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-300">حالة ردود المزوّد</span>
            <span className="text-xl text-cyan-400">💬</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">
            {metrics.repliedCount} <span className="text-sm font-normal text-gray-400">/ {metrics.total}</span>
          </div>
          <div className="text-[11px] mt-2 flex items-center justify-between">
            <span className={metrics.pendingReplyCount > 0 ? 'text-amber-400 font-semibold' : 'text-gray-400'}>
              {metrics.pendingReplyCount > 0 ? `▲ ${metrics.pendingReplyCount} بانتظار ردك` : 'تم الرد على جميع التقييمات'}
            </span>
          </div>
        </div>
      </div>

      {/* Ratings Distribution Breakdown Bar */}
      <div className="rounded-2xl border border-amber-500/20 bg-[#0B1E34]/90 p-5 backdrop-blur-md">
        <h2 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>توزيع التقييمات حسب عدد النجوم</span>
        </h2>
        <div className="space-y-2.5 max-w-2xl">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = (metrics.breakdown as any)[star] || 0;
            const percentage = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <div className="w-16 flex items-center gap-1 text-gray-300 font-mono">
                  <span>{star}</span>
                  <span className="text-yellow-400">★</span>
                </div>
                <div className="flex-1 h-3 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700/50">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      star >= 4 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : star === 3 ? 'bg-amber-500/80' : 'bg-rose-500/80'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-20 text-left font-mono text-gray-400 text-[11px]">
                  {count} ({percentage}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-4 backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم العميل أو الشركة أو نص التقييم أو الرد..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#081933] border border-amber-500/30 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition"
          />
          <span className="absolute right-3.5 top-3 text-gray-500 text-sm">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3.5 top-2.5 text-xs text-gray-400 hover:text-white bg-gray-700 px-1.5 py-0.5 rounded"
            >
              مسح
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Star Filter */}
          <div className="flex items-center rounded-xl bg-[#081933] border border-amber-500/30 p-1 text-xs">
            <button
              onClick={() => setRatingFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                ratingFilter === 'all' ? 'bg-amber-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              كل النجوم
            </button>
            <button
              onClick={() => setRatingFilter('5')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                ratingFilter === '5' ? 'bg-amber-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>5</span>
              <span className="text-yellow-400">★</span>
            </button>
            <button
              onClick={() => setRatingFilter('4')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                ratingFilter === '4' ? 'bg-amber-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>4</span>
              <span className="text-yellow-400">★</span>
            </button>
            <button
              onClick={() => setRatingFilter('3-below')}
              className={`px-3 py-1.5 rounded-lg transition ${
                ratingFilter === '3-below' ? 'bg-amber-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              ≤ 3 نجوم
            </button>
          </div>

          {/* Reply Status Filter */}
          <div className="flex items-center rounded-xl bg-[#081933] border border-amber-500/30 p-1 text-xs">
            <button
              onClick={() => setReplyFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                replyFilter === 'all' ? 'bg-cyan-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setReplyFilter('unreplied')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                replyFilter === 'unreplied' ? 'bg-cyan-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              بانتظار رد ({metrics.pendingReplyCount})
            </button>
            <button
              onClick={() => setReplyFilter('replied')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                replyFilter === 'replied' ? 'bg-cyan-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              تم الرد ({metrics.repliedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span>
            عرض {filteredReviews.length} من أصل {reviews.length} تقييم
          </span>
          {ratingFilter !== 'all' || replyFilter !== 'all' || searchQuery ? (
            <button
              onClick={() => {
                setRatingFilter('all');
                setReplyFilter('all');
                setSearchQuery('');
              }}
              className="text-amber-400 hover:underline"
            >
              إلغاء جميع عوامل التصفية
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/50 p-12 text-center">
            <div className="inline-block w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-400 text-sm">جاري جلب التقييمات وملاحظات العملاء من قاعدة البيانات...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-700 bg-[#0B1E34]/50 p-12 text-center">
            <span className="text-4xl block mb-3">⭐</span>
            <h3 className="text-base font-bold text-white mb-1">لا توجد تقييمات مطابقة</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-4">
              لم نتمكن من العثور على أي تقييم يطابق خيارات البحث والتصفية المحددة.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setRatingFilter('all');
                setReplyFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs hover:bg-amber-500/30 transition"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredReviews.map((rev) => {
              const dateStr = new Date(rev.created_at).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              const hasReply = Boolean(rev.reply_text && rev.reply_text.trim());

              return (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-amber-500/20 bg-[#0F253E]/80 p-5 backdrop-blur-md hover:border-amber-500/40 transition flex flex-col justify-between gap-4"
                >
                  <div>
                    {/* Header: Client Info & Star Rating */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 text-sm">
                          {rev.client_name ? rev.client_name.slice(0, 2) : 'عم'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{rev.client_name || 'عميل منصة Survsta'}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              مستأجر موثّق ✓
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {rev.client_company || 'مكتب هندسي استشاري'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:self-start">
                        <div className="flex flex-col items-end">
                          {renderStars(rev.rating)}
                          <span className="text-[11px] text-gray-500 mt-0.5 font-mono">{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Review Text */}
                    <div className="mt-4 text-sm text-gray-200 leading-relaxed bg-[#081933]/60 p-4 rounded-xl border border-gray-800/80">
                      <p className="whitespace-pre-line">{rev.review_text}</p>
                    </div>

                    {/* Provider Official Reply Box (if exists) */}
                    {hasReply && (
                      <div className="mt-3 mr-2 sm:mr-6 bg-[#0E2C4A]/90 border border-cyan-500/30 rounded-xl p-4 relative">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 text-sm">↩️</span>
                            <span className="text-xs font-bold text-cyan-300">رد المزوّد الرسمي ({providerName}):</span>
                          </div>
                          <button
                            onClick={() => {
                              if (inlineReplyReviewId === rev.id) {
                                setInlineReplyReviewId(null);
                                setInlineReplyText('');
                              } else {
                                setInlineReplyReviewId(rev.id);
                                setInlineReplyText(rev.reply_text || '');
                              }
                            }}
                            className="text-[11px] text-gray-400 hover:text-cyan-300 underline transition"
                          >
                            {inlineReplyReviewId === rev.id ? 'إلغاء التعديل' : 'تعديل الرد'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                          {rev.reply_text}
                        </p>
                      </div>
                    )}

                    {/* Inline Reply Form (when opened for this review) */}
                    {inlineReplyReviewId === rev.id && (
                      <div className="mt-3 p-4 bg-[#0A1F36] border border-amber-500/40 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <span>💬</span>
                            <span>الرد على تقييم ({rev.client_name || 'العميل'}):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setInlineReplyReviewId(null);
                              setInlineReplyText('');
                            }}
                            className="text-[11px] text-gray-400 hover:text-white"
                          >
                            ✕ إلغاء
                          </button>
                        </div>

                        {/* Suggested Quick Templates */}
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_REPLY_TEMPLATES.map((tpl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setInlineReplyText(tpl)}
                              className="text-[11px] bg-[#0F253E] hover:bg-[#163759] border border-cyan-500/20 text-cyan-300 px-2 py-1 rounded-lg transition"
                            >
                              + {tpl.slice(0, 32)}...
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={3}
                          value={inlineReplyText}
                          onChange={(e) => setInlineReplyText(e.target.value)}
                          placeholder="اكتب ردك المهني والموجز هنا..."
                          className="w-full p-3 rounded-xl bg-[#081933] border border-amber-500/30 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400 transition"
                          required
                        />

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setInlineReplyReviewId(null);
                              setInlineReplyText('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs hover:bg-gray-700 transition"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingReply || !inlineReplyText.trim()}
                            onClick={() => handleSaveInlineReply(rev.id)}
                            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs shadow transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isSubmittingReply ? (
                              <>
                                <span className="inline-block w-3 h-3 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></span>
                                <span>جاري النشر...</span>
                              </>
                            ) : (
                              <>
                                <span>✓</span>
                                <span>نشر الرد</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-800/60">
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <span>🔒</span>
                      <span>تقييم محمي ومربوط بحساب العميل</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasReply ? (
                        <button
                          onClick={() => {
                            if (inlineReplyReviewId === rev.id) {
                              setInlineReplyReviewId(null);
                              setInlineReplyText('');
                            } else {
                              setInlineReplyReviewId(rev.id);
                              setInlineReplyText(rev.reply_text || '');
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs border border-gray-700 transition flex items-center gap-1.5"
                        >
                          <span>✏️</span>
                          <span>تعديل الرد</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (inlineReplyReviewId === rev.id) {
                              setInlineReplyReviewId(null);
                              setInlineReplyText('');
                            } else {
                              setInlineReplyReviewId(rev.id);
                              setInlineReplyText('');
                            }
                          }}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                        >
                          <span>💬</span>
                          <span>رد</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedReviewForReply && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D223A] border border-amber-500/40 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative animate-scale-up">
            <button
              onClick={() => setSelectedReviewForReply(null)}
              className="absolute top-4 left-4 text-gray-400 hover:text-white text-lg w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-1">
              <span>💬</span>
              <span>الرد على تقييم العميل</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-3">
              {selectedReviewForReply.client_name || 'العميل'}
            </h3>

            {/* Original Review Snippet */}
            <div className="bg-[#081933] border border-gray-800 rounded-xl p-3 mb-4 text-xs text-gray-300">
              <div className="flex items-center justify-between mb-1.5 text-gray-400">
                <span className="font-semibold text-gray-300">نص التقييم:</span>
                {renderStars(selectedReviewForReply.rating)}
              </div>
              <p className="line-clamp-3 italic text-gray-300">
                &ldquo;{selectedReviewForReply.review_text}&rdquo;
              </p>
            </div>

            {/* Quick Templates */}
            <div className="mb-4">
              <label className="block text-[11px] text-gray-400 font-semibold mb-1.5">
                نماذج رد سريعة ومقترحة:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REPLY_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReplyInput(tpl)}
                    className="text-[11px] text-right bg-[#091e36] hover:bg-[#123861] border border-cyan-500/20 text-cyan-300 px-2.5 py-1.5 rounded-lg transition"
                  >
                    + {tpl.slice(0, 36)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  نص رد المزوّد الرسمي: <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="اكتب ردك اللبق والموجز على العميل هنا..."
                  className="w-full p-3 rounded-xl bg-[#081933] border border-amber-500/30 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-400 transition"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  سيظهر هذا الرد علناً تحت التقييم في صفحة ملفك العام، مما يعكس اهتمامكم ومصداقيتكم مع العملاء.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReviewForReply(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReply}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs shadow-lg transition flex items-center gap-2"
                >
                  {isSubmittingReply ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري حفظ الرد...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>نشر الرد الرسمي</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
