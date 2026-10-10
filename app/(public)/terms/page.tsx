import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'الشروط والأحكام | Survsta',
  description: 'شروط استخدام منصة Survsta للعملاء والمزوّدين.',
};

export default function TermsPage() {
  const sections = [
    { id: 's1', title: '1. طبيعة المنصة', text: 'Survsta منصة رقمية للاكتشاف والربط وتوليد طلبات التواصل في قطاع المساحة. المنصة ليست طرفًا في أي تعاقد بين العميل والمزوّد، ولا تقدّم الخدمات المساحية بنفسها، ولا تضمن نتائج الأعمال المنفّذة ميدانياً.' },
    { id: 's2', title: '2. الحسابات والتسجيل', text: 'يلتزم المستخدم بتقديم بيانات صحيحة ومحدثة، وهو مسؤول عن سرية بيانات دخوله وعن كل نشاط يتم عبر حسابه. يحق للمنصة تعليق أو إنهاء أي حساب يخالف هذه الشروط والمعايير المهنية.' },
    { id: 's3', title: '3. محتوى المزوّدين', text: 'المزوّد مسؤول مسؤولية كاملة عن دقة ما ينشره من بيانات وخدمات ومعدات وأسعار وحالة معايرة. المراجعة الإدارية إجراء تنظيمي ولا تنقل المسؤولية القانونية عن صحة البيانات إلى المنصة.' },
    { id: 's4', title: '4. التوثيق والشارات', text: 'تعكس شارات التوثيق ما تمّت مراجعته فعليًا وفق سياسة المنصة وقت المراجعة فقط، ولا تُعدّ اعتمادًا فنيًا أو ترخيصًا أو ضمانًا لجودة الأداء أو صلاحية الأجهزة.' },
    { id: 's5', title: '5. طلبات التواصل والاحتياجات', text: 'عند إرسال طلب تواصل أو احتياج، يوافق المستخدم على مشاركة بياناته مع الجهة أو الجهات المعنية لغرض الرد على طلبه. تُسجَّل هذه الأحداث لأغراض التدقيق وجودة الخدمة.' },
    { id: 's6', title: '6. التقييمات والمراجعات', text: 'يجب أن تستند التقييمات إلى تفاعل حقيقي وتعاقد فعلي. يُحظر نشر تقييمات مضللة أو مدفوعة أو مسيئة، وللمنصة إخفاء أو إزالة أي تقييم مخالف مع تسجيل الإجراء الإداري.' },
    { id: 's7', title: '7. الظهور المدفوع والإعلانات', text: 'يُوسم الظهور المميّز والإعلانات بوضوح. لا يلغي الدفع معايير الصلة الجغرافية والتوثيق في ترتيب النتائج، ولا يمنح المعلن أي امتياز في التقييمات أو الشارات المعتمدة.' },
    { id: 's8', title: '8. الاستخدام المحظور', text: 'يُحظر استخراج البيانات آليًا (Scraping)، أو انتحال صفة الغير، أو نشر بيانات جهات دون تفويض، أو استخدام المنصة في أي غرض مخالف للقوانين المعمول بها في جمهورية مصر العربية.' },
    { id: 's9', title: '9. الملكية الفكرية', text: 'جميع عناصر المنصة من تصميم وهوية وهيكل معلومات ومحتوى برمجيات مملوكة لمالكي المنصة أو مرخصة لهم، ولا يجوز نسخها أو إعادة استخدامها دون إذن كتابي مسبق.' },
    { id: 's10', title: '10. حدود المسؤولية', text: 'لا تتحمل المنصة أي مسؤولية عن الأضرار المباشرة أو غير المباشرة الناتجة عن التعامل بين الأطراف، أو عن دقة البيانات المقدمة من المزوّدين، أو عن انقطاع الخدمة لأسباب تقنية خارجة عن السيطرة.' },
    { id: 's11', title: '11. تعديل الشروط', text: 'يحق للمنصة تحديث هذه الشروط عند الحاجة، ويُعد استمرار استخدام المنصة بعد النشر بمثابة موافقة صريحة على النسخة المحدّثة.' },
    { id: 's12', title: '12. القانون الواجب التطبيق', text: 'تخضع هذه الشروط لقوانين جمهورية مصر العربية، وتختص المحاكم المصرية بالنظر في أي نزاع قد ينشأ عنها.' },
  ];

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      <section className="relative overflow-hidden bg-[#081933] text-white py-16 lg:py-20 border-b border-cyan-500/15">
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity">
          <Image
            alt="الشروط والأحكام"
            className="object-cover"
            fill
            priority
            src="/assets/img/hero-engineering-office.jpg"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / الشروط والأحكام</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">الشروط والأحكام</h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            شروط استخدام منصة Survsta للعملاء والمزوّدين لضمان بيئة عمل احترافية وموثوقة.
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
                تحكم هذه الشروط استخدامك لمنصة Survsta بجميع واجهاتها (الموقع والتطبيقات). باستخدامك للمنصة فإنك تقر بقراءتها وقبولها بالكامل.
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
