import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'من نحن | Survsta',
  description: 'تعرّف على Survsta: الرؤية والرسالة ونموذج العمل وخطة التوسع في السوق المصري.',
};

export default function AboutPage() {
  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#081933] text-white py-16 lg:py-20 border-b border-cyan-500/15">
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity">
          <Image
            alt="مكتب استشارات هندسية ومساحية"
            className="object-cover"
            fill
            priority
            src="/assets/img/hero-engineering-office.jpg"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / من نحن</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">عن Survsta</h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            بنبني البنية التحتية الرقمية لقطاع المساحة والجيوماتكس في مصر — دليل موثّق، سوق منظّم، وطبقة مهنية حقيقية.
          </p>
        </div>
      </section>

      {/* 2. Problem & Solution Split */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">المشكلة</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">سوق كبير ومبعثر</h2>
              <p className="text-slate-600 leading-relaxed text-base mb-8">
                قطاع المساحة في مصر يضم آلاف المكاتب والشركات والموردين والفنيين، لكن الوصول لهم يعتمد على المعارف الشخصية ومجموعات التواصل غير المنظمة. النتيجة: وقت ضائع، أسعار غير واضحة، وصعوبة في التحقق من الجدية والكفاءة.
              </p>
              <div className="h-px bg-slate-200 my-6"></div>
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">الحل</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">منصة واحدة منظّمة وموثّقة</h2>
              <p className="text-slate-600 leading-relaxed text-base">
                Survsta تجمع الجهات والأجهزة والخدمات والتدريب والوظائف في مكان واحد، مع بحث قائم على الموقع، توثيق متدرّج، ومسار واضح لتحويل الاكتشاف إلى تواصل حقيقي وموثوق.
              </p>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 h-[360px] sm:h-[420px]">
              <Image
                alt="أعمال مساحة في مشروع بنية تحتية"
                className="object-cover"
                fill
                src="/assets/img/totalstation-bridge-project.jpg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Principles */}
      <section className="py-16 bg-[#f4f7fa] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">مبادئنا</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">القواعد التي نبني عليها المنتج</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">البحث أولًا</h3>
              <p className="text-sm text-slate-600">المستخدم يجب أن يصل للجهة المناسبة في أقل عدد من الخطوات والضغطة المباشرة.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">الموقع بُعد أساسي</h3>
              <p className="text-sm text-slate-600">المحافظة والمدينة ونطاق الخدمة والأقرب إليك — ليست تفاصيل ثانوية بل أساس الاختيار.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">منصة ربط لا وسيط تنفيذ</h3>
              <p className="text-sm text-slate-600">نولّد الطلب ونوثّق الاتصال والجدية، والتنفيذ والاتفاق التجاري يبقى بين الأطراف مباشرة.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">ثقة بلا مبالغة</h3>
              <p className="text-sm text-slate-600">لا نمنح شارة إلا بما راجعناه فعليًا من سجلات، ولا ندّعي اعتمادًا لا نملكه.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-3">🛡️</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">إشراف قابل للتدقيق</h3>
              <p className="text-sm text-slate-600">كل قرار إداري يُسجَّل في سجل التدقيق، وكل محتوى منشور مرّ بمراجعة دقيقة.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">بيانات تخدم السوق</h3>
              <p className="text-sm text-slate-600">سلوك الطلب والبحث يكشف فجوات العرض ويوجّه نمو الشركات والمهندسين بدقة.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Roadmap Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1">خارطة الطريق</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">خطة التوسع على ثلاث مراحل</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-[#f4f7fa] shadow-sm">
              <span className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 text-xs font-bold rounded-full mb-3">
                المرحلة الأولى
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">تأسيس السوق</h3>
              <ul className="space-y-2 text-sm text-slate-600 mb-4 list-disc list-inside">
                <li>الدليل وملفات المزوّدين المعتمدة</li>
                <li>سوق الأجهزة والمعدات المساحية</li>
                <li>الخريطة التفاعلية والبحث الذكي</li>
                <li>طلبات التواصل والمراجعة الإدارية</li>
              </ul>
              <div className="text-xs font-semibold text-slate-500 pt-3 border-t border-slate-200">
                التركيز: الإسكندرية والقاهرة
              </div>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-[#f4f7fa] shadow-sm">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mb-3">
                المرحلة الثانية
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">نمو المنصة</h3>
              <ul className="space-y-2 text-sm text-slate-600 mb-4 list-disc list-inside">
                <li>طلبات الاحتياج والمطابقة الذكية</li>
                <li>لوحات تحليلات متقدمة للمزوّدين</li>
                <li>الإدراج المميّز وحملات الإعلانات</li>
                <li>أدوات التحقق من جودة البيانات</li>
              </ul>
              <div className="text-xs font-semibold text-slate-500 pt-3 border-t border-slate-200">
                التركيز: الدلتا والجيزة والقناة
              </div>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-[#f4f7fa] shadow-sm">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-3">
                المرحلة الثالثة
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">الشبكة المهنية</h3>
              <ul className="space-y-2 text-sm text-slate-600 mb-4 list-disc list-inside">
                <li>ملفات المسّاحين والـ CV الرقمي المعتمد</li>
                <li>بوابة التوظيف الميداني والمكتبي</li>
                <li>توسّع أكاديمية Survsta</li>
                <li>تطبيقات الموبايل وذكاء مؤشرات السوق</li>
              </ul>
              <div className="text-xs font-semibold text-slate-500 pt-3 border-t border-slate-200">
                التركيز: تغطية وطنية شاملة لكافة المحافظات
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-14 bg-gradient-to-r from-[#0a2033] to-[#12455f] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">هل تدير مكتب مساحة أو شركة أجهزة؟</h2>
            <p className="text-slate-300 text-sm">انضم إلى أكبر تجمع مهني لمجتمع المساحة والجيوماتكس في مصر اليوم.</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-amber-400 transition whitespace-nowrap"
            >
              انضم كشريك الآن
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-white/40 text-white hover:bg-white/10 px-5 py-3 text-sm font-semibold transition whitespace-nowrap"
            >
              تواصل معنا
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
