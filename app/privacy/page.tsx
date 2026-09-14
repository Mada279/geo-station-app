import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'سياسة الخصوصية | Survsta',
  description: 'كيف تجمع Survsta بياناتك وتستخدمها وتحميها.',
};

export default function PrivacyPage() {
  const sections = [
    { id: 's1', title: '1. البيانات التي نجمعها', text: 'بيانات الحساب (الاسم، رقم الهاتف، البريد الإلكتروني)، بيانات المنشأة للمزوّدين والسجل التجاري، محتوى الطلبات والاحتياجات الهندسية، وبيانات الاستخدام التقنية كنوع الجهاز والمتصفح وسجلات التصفح.' },
    { id: 's2', title: '2. بيانات الموقع الجغرافي', text: 'تُستخدم لعرض المكاتب والأجهزة الأقرب إليك، ولا تُفعَّل إلا بإذنك الصريح من المتصفح أو تطبيق الموبايل، ويمكنك إيقاف إذن تحديد الموقع في أي وقت.' },
    { id: 's3', title: '3. كيف نستخدم بياناتك', text: 'لتشغيل خدمات البحث والمطابقة، وتوصيل طلبك للجهة المناسبة، وتحسين جودة النتائج، ومنع الاحتيال وإساءة الاستخدام، وإرسال إشعارات وتحديثات تخص نشاطك على المنصة.' },
    { id: 's4', title: '4. مشاركة البيانات', text: 'تُشارك بيانات التواصل فقط مع الجهة التي اخترتها أو الجهات المطابقة لاحتياجك بعد موافقتك الصريحة. نحن لا نبيع ولا نؤجر بياناتك الشخصية لأي أطراف ثالثة تجارية.' },
    { id: 's5', title: '5. مقدمو الخدمات السحابية', text: 'قد نستعين بمزوّدي استضافة وتحليلات ورسائل SMS يعملون بالنيابة عنا وفق اتفاقيات صارمة لسرية البيانات ومعالجة محدودة الغرض فقط.' },
    { id: 's6', title: '6. ملفات تعريف الارتباط (Cookies)', text: 'نستخدم الكوكيز لحفظ تفضيلاتك وحالة تسجيل الدخول وجلسة البحث وقياس أداء المنصة. يمكنك التحكم بها من إعدادات المتصفح.' },
    { id: 's7', title: '7. مدة الاحتفاظ بالبيانات', text: 'نحتفظ بالبيانات للمدة اللازمة لتحقيق أغراض المعالجة وتقديم الخدمة أو للوفاء بالالتزامات القانونية والمحاسبية، ثم تُحذف أو تُجهَّل هويتها بصورة نهائية.' },
    { id: 's8', title: '8. حقوق المستخدم', text: 'لك حق الاطلاع على بياناتك المسجلة لدينا، وتصحيحها، وطلب حذف الحساب أو الاعتراض على معالجتها وسحب موافقتك، عبر التواصل مع فريق الدعم الفني.' },
    { id: 's9', title: '9. أمن المعلومات والتدقيق', text: 'نطبّق إجراءات تقنية وتنظيمية وتشفير لحماية البيانات، مع تسجيل كافة العمليات الإدارية في سجل تدقيق لا يمكن التلاعب به.' },
    { id: 's10', title: '10. خصوصية الأطفال', text: 'المنصة موجهة للاستخدام الهندسي والتجاري المهني ولا تستهدف ولا تجمع بيانات من هم دون 18 عامًا.' },
    { id: 's11', title: '11. التحديثات والإشعارات', text: 'قد نحدّث هذه السياسة لمواكبة التطورات التقنية أو التنظيمية، وسننشر تاريخ آخر تحديث أعلى الصفحة مع إخطارك بالتغييرات الجوهرية.' },
  ];

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      <section className="relative overflow-hidden bg-[#081933] text-white py-16 lg:py-20 border-b border-cyan-500/15">
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity">
          <Image
            alt="سياسة الخصوصية"
            className="object-cover"
            fill
            priority
            src="/assets/img/hero-engineering-office.jpg"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / سياسة الخصوصية</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">سياسة الخصوصية</h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            كيف تجمع Survsta بياناتك وتستخدمها وتحميها بكل شفافية وأمان.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            
            <div className="lg:col-span-3 space-y-8 bg-[#f4f7fa] p-8 rounded-2xl border border-slate-200">
              <div className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 text-xs font-bold rounded-full">
                آخر تحديث: 3 سبتمبر 2026
              </div>
              <p className="text-base text-slate-700 leading-relaxed font-medium">
                توضح هذه السياسة أنواع البيانات التي نجمعها عند استخدامك لمنصة Survsta، وكيفية استخدامها ومشاركتها وحمايتها، والحقوق المتاحة لك بشأنها.
              </p>
              
              <div className="space-y-6 pt-4 border-t border-slate-200">
                {sections.map((s) => (
                  <div key={s.id} id={s.id} className="scroll-mt-24">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-200 text-sm text-slate-600">
                لأي استفسار بخصوص هذه الوثيقة، تواصل معنا عبر{' '}
                <Link href="/contact" className="text-cyan-700 font-bold hover:underline">
                  صفحة التواصل
                </Link>.
              </div>
            </div>

            <div>
              <div className="bg-[#f4f7fa] p-6 rounded-2xl border border-slate-200 sticky top-28 space-y-3">
                <h3 className="font-bold text-slate-900 text-base mb-2">فهرس البنود</h3>
                <nav className="space-y-1.5 text-xs">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block text-slate-600 hover:text-cyan-700 hover:font-bold py-1 transition"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
