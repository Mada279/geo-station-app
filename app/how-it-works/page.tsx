import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'كيف تعمل المنصة | Survsta',
  description: 'شرح آلية عمل Survsta للعملاء والمزوّدين والمسّاحين خطوة بخطوة.',
};

export default function HowItWorksPage() {
  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#081933] text-white py-16 lg:py-20 border-b border-cyan-500/15">
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity">
          <Image
            alt="كيف تعمل المنصة"
            className="object-cover"
            fill
            priority
            src="/assets/img/totalstation-construction-crane.jpg"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / كيف تعمل المنصة</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">كيف تعمل Survsta</h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            منصة ربط وتوليد طلبات — الاكتشاف والتوثيق عندنا، والاتفاق والتنفيذ بينك وبين الجهة مباشرة.
          </p>
        </div>
      </section>

      {/* 2. For Clients (6 Steps) */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">للعملاء</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">من البحث إلى التنفيذ</h2>
            <p className="text-sm text-slate-600 mt-1">خطوات واضحة وسريعة للوصول إلى أفضل المكاتب والأجهزة المعتمدة في منطقتك.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">1️⃣</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">ابحث وحدّد موقعك</h3>
              <p className="text-sm text-slate-600">اكتب ما تحتاجه واختر المحافظة، أو استخدم التحديد الجغرافي للحصول على الأقرب إليك.</p>
            </div>

            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">2️⃣</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">قارن بثقة</h3>
              <p className="text-sm text-slate-600">راجع الخدمات والمعدات والتقييمات ومستوى التوثيق وزمن الرد لكل جهة قبل ما تتواصل.</p>
            </div>

            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">3️⃣</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">اطلب تواصل</h3>
              <p className="text-sm text-slate-600">تُنشئ المنصة طلبًا موثّقًا يصل لصندوق المزوّد فورًا عبر لوحته، مع تسجيل كل خطوة.</p>
            </div>

            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">4️⃣</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">استقبل الرد</h3>
              <p className="text-sm text-slate-600">يتواصل معك المزوّد بالوسيلة التي اخترتها (هاتف، واتساب، بريد) خلال متوسط زمن الرد المعلن.</p>
            </div>

            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">5️⃣</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">اتفق ونفّذ</h3>
              <p className="text-sm text-slate-600">التسعير والتعاقد والتنفيذ الميداني تتم مباشرة بينك وبين الجهة وفق ما تتفقان عليه.</p>
            </div>

            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-3xl mb-3">6️⃣</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">قيّم التجربة</h3>
              <p className="text-sm text-slate-600">تقييمك مرتبط بتفاعل حقيقي ويساعد باقي العملاء ويحسّن جودة ومعايير سوق المساحة.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. For Providers Pipeline */}
      <section className="py-16 bg-[#f4f7fa] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">للمكاتب والشركات والموردين</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">من التسجيل إلى استقبال الطلبات</h2>
          </div>

          <div className="space-y-4 max-w-4xl">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#081933] text-cyan-400 font-bold flex items-center justify-center text-sm">1</span>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">سجّل جهتك</h3>
                <p className="text-sm text-slate-600">اختر نوع الجهة وأدخل بيانات النشاط الأساسية والموقع الجغرافي ووسائل التواصل المعتمدة.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#081933] text-cyan-400 font-bold flex items-center justify-center text-sm">2</span>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">أضف خدماتك ومعداتك</h3>
                <p className="text-sm text-slate-600">أدرج ما تقدّمه فعليًا مع الصور والتفاصيل والمواصفات — الإدراج الكامل يحصل على ظهور وطلبات أكثر بـ 4 أضعاف.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#081933] text-cyan-400 font-bold flex items-center justify-center text-sm">3</span>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">مراجعة الإدارة والتوثيق</h3>
                <p className="text-sm text-slate-600">يراجع فريق Survsta البيانات ويطلب توضيحًا أو مستندات عند الحاجة قبل تفعيل النشر الرسمي.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#081933] text-cyan-400 font-bold flex items-center justify-center text-sm">4</span>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">النشر والظهور على الخريطة</h3>
                <p className="text-sm text-slate-600">يظهر ملفك في البحث وفلاتر الدليل والخريطة التفاعلية والفئات المناسبة داخل نطاقك الجغرافي.</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#081933] text-cyan-400 font-bold flex items-center justify-center text-sm">5</span>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">استقبل الطلبات وتابعها</h3>
                <p className="text-sm text-slate-600">صندوق طلبات بحالات واضحة، وإشعارات فورية، مع لوحة تحليلات توضح معدلات الظهور والتحويل.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trust Badges Breakdown */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">الثقة والتوثيق</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">ماذا تعني شارات التوثيق بالضبط؟</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-[#f4f7fa] shadow-sm">
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 text-xs font-bold px-3 py-1 rounded-full mb-3">
                ✔ ملف موثّق
              </span>
              <p className="text-sm text-slate-600">تمت مراجعة بيانات الملف الأساسية وصحة وسائل التواصل والموقع الجغرافي الفعلي.</p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-[#f4f7fa] shadow-sm">
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 text-xs font-bold px-3 py-1 rounded-full mb-3">
                ✔ نشاط موثّق
              </span>
              <p className="text-sm text-slate-600">تمت مراجعة أدلة إضافية على مزاولة النشاط (سجل تجاري، بطاقة ضريبية، عضوية نقابة).</p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-[#f4f7fa] shadow-sm">
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 text-xs font-bold px-3 py-1 rounded-full mb-3">
                ✔ معدات موثّقة
              </span>
              <p className="text-sm text-slate-600">تمت مراجعة أرقام السيريال أو مستندات الملكية والوكالة لأجهزة محددة بالملف.</p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-[#f4f7fa] shadow-sm">
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 text-xs font-bold px-3 py-1 rounded-full mb-3">
                ✔ سجل معايرة
              </span>
              <p className="text-sm text-slate-600">يُعرض فقط عند توريد شهادة معايرة حديثة وسارية من مركز معتمد — ولا يُستنتج أبدًا من سجل قديم.</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <strong>تنويه:</strong> الشارات تعكس ما تمّت مراجعته فعليًا ومستنديًا فقط، ولا تُعدّ اعتمادًا فنيًا لحالة الأجهزة في الموقع أو ضمانًا لنتائج الأعمال. الظهور المدفوع يُوسم دائمًا بوضوح ولا يُلغي معايير الصلة والتقييم.
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="py-14 bg-gradient-to-r from-[#0a2033] to-[#12455f] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">ابدأ الآن بتصفح الدليل أو سجل جهتك</h2>
            <p className="text-slate-300 text-sm">انضم مجانًا أو استكشف المكاتب والأجهزة المساحية في مدينتك.</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/join"
              className="rounded-lg bg-[#F4B400] text-black font-bold px-6 py-3 text-sm hover:brightness-105 transition shadow-lg whitespace-nowrap"
            >
              تسجيل جهة جديدة
            </Link>
            <Link
              href="/directory"
              className="rounded-lg border border-white/40 text-white hover:bg-white/10 px-5 py-3 text-sm font-semibold transition whitespace-nowrap"
            >
              تصفح الدليل
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
