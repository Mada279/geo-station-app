'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface FAQItem {
  id: string;
  category: 'rental' | 'maintenance' | 'pricing' | 'support' | 'security';
  categoryLabel: string;
  badgeColor: string;
  question: string;
  answer: React.ReactNode;
}

const faqsData: FAQItem[] = [
  {
    id: 'rental-process',
    category: 'rental',
    categoryLabel: 'آلية التأجير',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    question: 'كيف تتم آلية استئجار الأجهزة والمعدات المساحية عبر Survsta؟',
    answer: (
      <div className="space-y-3 text-slate-300 leading-relaxed text-sm">
        <p>
          تتبع منصة Survsta مساراً تقنياً وتنظيمياً واضحاً ومباشراً يربط المقاول أو مهندس المساحة مع مزود الخدمة المعتمد:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 pr-2 text-slate-300 text-xs sm:text-sm">
          <li>
            <strong className="text-white">البحث والاختيار:</strong> تصفح سوق الأجهزة والمعدات وفلترة النتائج حسب النوع (توتال ستيشن، مستقبلات GNSS/RTK، موازين رقمية)، والنطاق الجغرافي، والسعر اليومي أو الشهري.
          </li>
          <li>
            <strong className="text-white">إرسال طلب الحجز أو التواصل:</strong> الضغط على زر «طلب استئجار / تواصل» من صفحة الجهاز، ليتم إنشاء طلب رسمي موثق يصل فوراً إلى صندوق إشعارات المزوّد ولوحة تحكمه.
          </li>
          <li>
            <strong className="text-white">المعاينة والاتفاق المباشر:</strong> يتواصل المزوّد معك للتأكيد على توفر الجهاز وتاريخ بدء الإيجار ومراجعة الملحقات المطلوبة.
          </li>
          <li>
            <strong className="text-white">توقيع العقد والتسليم:</strong> يتم إبرام عقد الإيجار الرسمي وتوقيع محضر الفحص الفني المشترك واستلام الجهاز سواء من مقر المزوّد أو بالتوصيل لموقع المشروع.
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: 'breakdown-liability',
    category: 'maintenance',
    categoryLabel: 'مسؤولية الأعطال',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
    question: 'مَن يتحمل تكلفة صيانة الجهاز في حال حدوث عطل أو تلف أثناء العمل الميداني؟',
    answer: (
      <div className="space-y-3 text-slate-300 leading-relaxed text-sm">
        <p>
          تطبق المنصة معايير السوق الهندسي B2B الصارمة للفصل العادل والواضح بين نوعين من الأعطال:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl bg-[#081933] p-3.5 border border-red-500/20">
            <h4 className="font-bold text-red-400 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
              <span>⚠️</span> الأعطال الناتجة عن سوء الاستخدام الميداني
            </h4>
            <p className="text-xs text-slate-400 leading-normal">
              تشمل سقوط الجهاز، كسر العدسات أو الشاشات، التعرض للرمال الشديدة أو مياه الأمطار دون حماية، أو استخدام بطاريات وشواحن غير مطابقة. <strong className="text-white">يتحمل المستأجر</strong> كامل تكاليف الإصلاح أو التعويض لدى مركز صيانة وكيل معتمد.
            </p>
          </div>
          <div className="rounded-xl bg-[#081933] p-3.5 border border-emerald-500/20">
            <h4 className="font-bold text-emerald-400 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
              <span>🛡️</span> الأعطال الفنية والعيوب الذاتية
            </h4>
            <p className="text-xs text-slate-400 leading-normal">
              الأعطال الإلكترونية الداخلية، عيوب المعالج أو الحساسات الداخلية، أو تلف البطارية الطبيعي غير المقترن بصدمة. <strong className="text-white">يتحملها المزوّد</strong>، ويلتزم بتوفير جهاز بديل فوري للموقع أو خصم أيام التوقف من قيمة الإيجار.
            </p>
          </div>
        </div>
        <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
          📌 <strong>توصية إلزامية:</strong> يجب توقيع «محضر استلام وفحص تشغيلي» في وجود الطرفين قبل بدء الإيجار وعند إرجاع العهدة، لتوثيق الحالة الفنية وحماية حقوق الطرفين.
        </p>
      </div>
    ),
  },
  {
    id: 'calibration-certs',
    category: 'maintenance',
    categoryLabel: 'شهادات المعايرة',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    question: 'هل تشترط Survsta وجود شهادة معايرة معتمدة وسارية للأجهزة المساحية؟',
    answer: (
      <div className="space-y-3 text-slate-300 leading-relaxed text-sm">
        <p>
          <strong className="text-emerald-400 font-bold">نعم، وبشكل إلزامي.</strong> لضمان سلامة المشروعات الهندسية ودقة الرصد المساحي، تلزم المنصة جميع الشركاء والمكاتب بما يلي:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pr-2 text-slate-300 text-xs sm:text-sm">
          <li>
            إرفاق نسخة واضحة من <strong className="text-white">شهادة المعايرة السارية</strong> الصادرة من معمل أو مركز معايرة معتمد لكل جهاز محطة رصد (Total Station) أو جهاز قياس المسافات والزوايا أو ميزان دقيق.
          </li>
          <li>
            تمنح المنصة شارة <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">معايرة سارية ✓</span> على بطاقة الجهاز في السوق بعد التحقق الإداري من تاريخ انتهائها ورقم السيريال (Serial Number).
          </li>
          <li>
            يحق للمستأجر رفض استلام الجهاز إذا كانت الشهادة منتهية أو إذا اختلف الرقم التسلسلي للجهاز المسلّم عن الرقم الموثق بالشهادة وبطاقة العرض.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'pricing-and-commission',
    category: 'pricing',
    categoryLabel: 'العمولات والدفع',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    question: 'كيف يتم احتساب العمولات ورسوم المنصة؟ وهل الدفع مجاني للمهندسين والمقاولين؟',
    answer: (
      <div className="space-y-3 text-slate-300 leading-relaxed text-sm">
        <p>
          تتبع Survsta نموذج تسعير شفاف وتنافسي مبني على دعم قطاع الأعمال الهندسية:
        </p>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-start gap-2 bg-[#081933] p-3 rounded-xl border border-gray-800">
            <span className="text-lg">👷‍♂️</span>
            <div>
              <strong className="text-white block">للعملاء والمهندسين والشركات المستأجرة:</strong>
              <p className="text-slate-400 text-xs mt-0.5">
                استخدام المنصة والبحث، والتصفية الجغرافية، ومقارنة المواصفات وإرسال طلبات التواصل مجاني 100% دون أي رسوم إدارية أو عمولات مفروضة على المستأجر.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-[#081933] p-3 rounded-xl border border-gray-800">
            <span className="text-lg">🏢</span>
            <div>
              <strong className="text-white block">لمزودي الخدمة والمكاتب الهندسية (B2B):</strong>
              <p className="text-slate-400 text-xs mt-0.5">
                تعتمد المنصة نموذج الدفع عند استلام العميل الجاد (Pay-per-Qualified-Lead) أو اشتراكات شهرية وسنوية مرنة تتيح إدراج عدد غير محدود من المعدات، وأولوية الظهور في نتائج البحث والتوصية في المشاريع الكبرى.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-[#081933] p-3 rounded-xl border border-gray-800">
            <span className="text-lg">💳</span>
            <div>
              <strong className="text-white block">طريقة سداد قيمة الإيجار:</strong>
              <p className="text-slate-400 text-xs mt-0.5">
                تُدفع قيمة إيجار الجهاز والضمانات المالية مباشرة بين المستأجر والمزوّد بموجب الفواتير والعقود المتبادلة بينهما، دون احتجاز للأموال داخل المنصة في المرحلة الحالية.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'technical-support-training',
    category: 'support',
    categoryLabel: 'الدعم الفني والتشغيلي',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    question: 'ما هي حدود الدعم الفني وتدريب طاقم المساحة على الأجهزة المستأجرة؟',
    answer: (
      <div className="space-y-3 text-slate-300 leading-relaxed text-sm">
        <p>
          يتم تنظيم الدعم الفني بوضوح لمنع أي التباس بين التجهيز التشغيلي والتدريب الميداني:
        </p>
        <ul className="list-disc list-inside space-y-2 pr-2 text-slate-300 text-xs sm:text-sm">
          <li>
            <strong className="text-white">التزام المزوّد بالجاهزية التشغيلية:</strong> يلتزم المزوّد بتسليم الجهاز في حالة عمل تامة مع كافة ملحقاته الضرورية (البطاريات المشحونة، الشاحن الأصلي، كابلات نقل البيانات، الحامل الثلاثي الألومنيوم أو الخشب، العاكس وعصا التيليسكوپ، ومحفظة الحماية).
          </li>
          <li>
            <strong className="text-white">الفحص التشغيلي الأولي:</strong> يقدم المزوّد شرحاً أولياً لكيفية تشغيل الجهاز وربطه بوحدة التحكم (Controller) والتأكد من إرسال واستقبال الإشارة (Fix/Float في أجهزة GNSS).
          </li>
          <li>
            <strong className="text-white">التدريب الميداني المتقدم وإعداد المشاريع:</strong> تدريب أفراد الطاقم غير المؤهلين، أو ضبط برمجيات الرفع المتقدمة (Road Design, Volume Calculation, BIM Staking) يخضع لاتفاق تجاري مستقل بين الطرفين كخدمة دعم فني مضافة.
          </li>
          <li>
            <strong className="text-white">دعم منصة Survsta:</strong> يوفر فريق الدعم الفني للمنصة المساعدة في التحقق من توافق المواصفات المطلوبة، وحل أي خلافات إدارية أو توثيقية على مدار الساعة.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'high-value-guarantees',
    category: 'security',
    categoryLabel: 'الأمان والضمانات',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    question: 'ما هي الضمانات المطلوبة عند استئجار أجهزة مساحية عالية القيمة (كالماسحات الليزرية والدرون)؟',
    answer: (
      <div className="space-y-2 text-slate-300 leading-relaxed text-sm">
        <p>
          بالنسبة للأجهزة المتقدمة كطائرات الدرون المساحية (Survey Drones) والماسحات الليزرية ثلاثية الأبعاد (3D Terrestrial Laser Scanners)، يتبع المزوّدون واحداً أو أكثر من الترتيبات التعاقدية التالية:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pr-2 text-slate-300 text-xs sm:text-sm">
          <li>إبرام عقد تأجير رسمي بين الشركتين يتضمن السجل التجاري والبطاقة الضريبية والتفويض البنكي.</li>
          <li>تقديم شيك ضمان بنكي بالقيمة التأمينية للجهاز يُسترد فور تسليم الجهاز بحالته الأصلية.</li>
          <li>خيار توفير «مشغّل / مهندس معتمد» مرافق للجهاز من قبل المزوّد لإجراء الرصد الميداني وتأمين الجهاز طوال فترة العمل.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'cancellation-extension',
    category: 'rental',
    categoryLabel: 'آلية التأجير',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    question: 'كيف يتم التعامل مع إلغاء حجز جهاز أو طلب تمديد فترة الإيجار الميداني؟',
    answer: (
      <div className="space-y-2 text-slate-300 leading-relaxed text-sm">
        <p>
          نظراً لأهمية جداول المشروعات الإنشائية، تسري القواعد التالية:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pr-2 text-slate-300 text-xs sm:text-sm">
          <li>
            <strong className="text-white">التمديد:</strong> في حال رغبة المستأجر في تمديد المدة، يجب إخطار المزوّد قبل 48 ساعة على الأقل من انتهاء المدة المتفق عليها، مع تحديث الطلب لتجنب حجز الجهاز لعميل آخر.
          </li>
          <li>
            <strong className="text-white">الإلغاء قبل الاستلام:</strong> يمكن إلغاء الطلب دون أي التزامات قبل توقيع العقد الرسمي واستلام الجهاز.
          </li>
          <li>
            <strong className="text-white">الإنهاء المبكر:</strong> في حال إنهاء المشروع قبل انتهاء المدة المحجوزة، تطبق الشروط المحددة في عقد المزوّد بشأن الخصم أو تعديل السعر من فئة الشهري إلى الأسبوعي/اليومي.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'provider-verification',
    category: 'security',
    categoryLabel: 'الأمان والضمانات',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    question: 'كيف تضمن Survsta مصداقية وكفاءة مكاتب وشركات المساحة المسجلة؟',
    answer: (
      <div className="space-y-2 text-slate-300 leading-relaxed text-sm">
        <p>
          تخضع كافة الحسابات المسجلة كمزودي خدمات لفحص دقيق يشمل:
        </p>
        <ul className="list-disc list-inside space-y-1.5 pr-2 text-slate-300 text-xs sm:text-sm">
          <li>التحقق من السجل التجاري، والبطاقة الضريبية، ومقر العمل الحقيقي.</li>
          <li>فحص شهادات المعايرة السارية وقوائم المعدات المملوكة فعلياً للجهة.</li>
          <li>نظام تقييم ومراجعات حقيقي مرتبط بطلبات تواصل فعلية من مهندسين ومقاولين موثقين لمنع التقييمات الوهمية.</li>
        </ul>
      </div>
    ),
  },
];

const categories = [
  { key: 'all', label: 'جميع الأسئلة' },
  { key: 'rental', label: 'آلية التأجير' },
  { key: 'maintenance', label: 'الأعطال والمعايرة' },
  { key: 'pricing', label: 'الأسعار والعمولات' },
  { key: 'support', label: 'الدعم والتشغيل' },
  { key: 'security', label: 'الأمان والضمانات' },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIds, setOpenIds] = useState<string[]>(['rental-process', 'breakdown-liability', 'calibration-certs']);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqsData.filter((item) => {
      const matchCategory =
        activeCategory === 'all' ||
        (activeCategory === 'maintenance'
          ? item.category === 'maintenance'
          : item.category === activeCategory);

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);

      return matchCategory && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setOpenIds(filteredFaqs.map((f) => f.id));
  };

  const collapseAll = () => {
    setOpenIds([]);
  };

  return (
    <div className="bg-[#050E1F] text-gray-100 min-h-screen">
      {/* 1. Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#081933] via-[#0B1E3B] to-[#050E1F] border-b border-cyan-500/15 py-16 lg:py-20">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 text-xs font-semibold text-cyan-300 mb-4">
            <span>🧭</span>
            <span>الأسئلة الشائعة وسياسات التعامل B2B</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            كل ما تود معرفته عن خدمات وتأجير الأجهزة في <span className="text-amber-400">Survsta</span>
          </h1>
          
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            سياسات واضحة ومعايير هندسية معتمدة تنظّم مسؤوليات التأجير، شهادات المعايرة، صيانة الأعطال الميدانية، والعمولات في منصة الجيوماتكس الأولى بمصر.
          </p>

          {/* Search Input */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الأسئلة الشائعة (مثال: معايرة، أعطال، عمولة، تأجير)..."
              className="w-full rounded-2xl border border-cyan-500/30 bg-[#0F253E]/90 px-12 py-3.5 text-sm text-white placeholder-gray-400 shadow-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition backdrop-blur-md"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white bg-gray-800 px-2 py-0.5 rounded-full"
              >
                مسح
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Main Content & Accordion Section */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Categories Filters & Expand/Collapse Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/80 pb-6">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-gray-950 font-bold shadow-md shadow-amber-400/20'
                        : 'bg-[#0F253E] text-slate-300 border border-gray-800 hover:border-cyan-500/40 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <button
                onClick={expandAll}
                className="text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded hover:bg-cyan-500/10 transition cursor-pointer"
              >
                توسيع الكل
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={collapseAll}
                className="text-gray-400 hover:text-gray-200 font-medium px-2 py-1 rounded hover:bg-gray-800 transition cursor-pointer"
              >
                طي الكل
              </button>
            </div>
          </div>

          {/* Results Count / Empty state */}
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-700 bg-[#0F253E]/40 p-12 text-center space-y-3">
              <div className="text-4xl">🔍</div>
              <h3 className="text-base font-bold text-white">لم يتم العثور على نتائج مطابقة</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                جرب البحث بكلمات مختلفة أو اختر تصنيفاً آخر، أو تواصل مع الدعم الفني مباشرة.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-gray-950 hover:brightness-110 transition mt-2 cursor-pointer"
              >
                إعادة ضبط البحث
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openIds.includes(faq.id);
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'border-cyan-500/40 bg-[#0B1F38] shadow-lg shadow-cyan-950/40'
                        : 'border-gray-800/80 bg-[#0A1A2F]/70 hover:border-gray-700 hover:bg-[#0E223D]'
                    }`}
                  >
                    {/* Accordion Header Button */}
                    <button
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-right transition focus:outline-none cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <span className="text-amber-400/80 font-mono text-xs font-semibold shrink-0 pt-0.5 sm:pt-0">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${faq.badgeColor}`}
                            >
                              {faq.categoryLabel}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                            {faq.question}
                          </h3>
                        </div>
                      </div>

                      {/* Expand / Collapse Chevron */}
                      <div
                        className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 ${
                          isOpen
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 rotate-180'
                            : 'bg-gray-800/60 border-gray-700 text-gray-400 rotate-0'
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Accordion Body Content */}
                    {isOpen && (
                      <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-cyan-500/10 animate-fade-in text-right">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. Quick B2B Support & Consultation Card */}
          <div className="mt-14 rounded-3xl border border-amber-500/30 bg-gradient-to-l from-[#0F253E] to-[#0A1A2F] p-6 sm:p-8 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 mx-auto flex items-center justify-center text-2xl">
              🤝
            </div>
            
            <div className="space-y-1.5 max-w-xl mx-auto">
              <h3 className="text-lg sm:text-xl font-black text-white">
                هل لديك استفسار تجاري أو فني خاص بمشروعك؟
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                فريق الدعم الهندسي في Survsta جاهز لمساعدتك في صياغة عقود التأجير وتوفير أطقم وأجهزة بديلة في جميع المحافظات.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#081933] shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
              >
                <span>تواصل مع الفريق الهندسي</span>
                <span>←</span>
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-[#081933] px-5 py-2.5 text-xs sm:text-sm font-bold text-cyan-300 hover:bg-[#102B4E] transition"
              >
                <span>سجّل شركتك كمزود معتمد</span>
              </Link>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
