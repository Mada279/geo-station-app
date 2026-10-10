'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'هل استخدام Survsta مجاني للعملاء؟',
    answer: 'نعم. البحث والتصفح وطلب التواصل وإرسال الاحتياج مجاني بالكامل للعملاء، ولا نتقاضى أي عمولة منك.',
  },
  {
    question: 'هل المنصة تنفّذ الأعمال المساحية بنفسها؟',
    answer: 'لا. Survsta منصة ربط واكتشاف وتوثيق؛ التنفيذ والتعاقد والسداد المالي يتم مباشرة بينك وبين الجهة الهندسية التي تختارها.',
  },
  {
    question: 'ماذا تعني شارة «موثّق»؟',
    answer: 'تعني أن فريق الإدارة راجع بيانات محددة ومستندية (الملف، السجل التجاري، أو أرقام سيريالات معدات بعينها). لا تعني اعتمادًا فنيًا لحالة الأجهزة في الموقع أو ضمانًا لنتائج الأعمال.',
  },
  {
    question: 'كم يستغرق رد المزوّد؟',
    answer: 'يختلف من جهة لأخرى وفق طاقتها الاستيعابية، ومتوسط زمن الرد معروض بشفافية على كل ملف ومكتب قبل أن ترسل طلبك.',
  },
  {
    question: 'هل تُشارك بياناتي مع كل المزوّدين؟',
    answer: 'لا. تُشارك بيانات التواصل فقط مع الجهة التي اخترت التواصل معها يدويًا، أو مع الجهات المطابقة لاحتياجك بعد موافقتك الصريحة.',
  },
  {
    question: 'كيف أسجّل مكتبي أو شركتي؟',
    answer: 'من صفحة «انضم كشريك». التسجيل مجاني، وتراجع الإدارة البيانات والمستندات قبل النشر وقد نتواصل معك للتأكيد خلال 48 ساعة.',
  },
  {
    question: 'لماذا لم يُنشر إدراج جهازي أو خدمتي بعد؟',
    answer: 'كل إدراج جديد يمر بمراجعة جودة للتأكد من وضوح المواصفات والصور ومطابقتها للملكية؛ ستصلك رسالة عبر لوحة التحكم بالحالة والإجراء المطلوب.',
  },
  {
    question: 'هل الظهور المميّز يؤثر على ترتيب النتائج؟',
    answer: 'الظهور المدفوع والإعلاني يُوسم دائمًا بشارة واضحة، ولا يلغي معايير الصلة الجغرافية والتقييم الحقيقي والتوثيق في ترتيب النتائج.',
  },
  {
    question: 'كيف أبلغ عن بيانات خاطئة أو مزوّد غير ملتزم؟',
    answer: 'من زر «الإبلاغ» داخل أي ملف أو إدراج، أو عبر مراسلة الدعم الفني. تُراجع البلاغات فورًا وتُسجَّل في سجل التدقيق الإداري.',
  },
  {
    question: 'هل تغطون كل المحافظات؟',
    answer: 'نبدأ بالتركيز على الإسكندرية والقاهرة والجيزة ومطروح، مع تغطية متنامية لباقي المحافظات؛ يمكنك إرسال احتياجك وسنساعدك في إيجاد أقرب مزود مؤهل.',
  },
];

export default function HelpPage() {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleIndex = (index: number) => {
    if (openIndices.includes(index)) {
      setOpenIndices(openIndices.filter((i) => i !== index));
    } else {
      setOpenIndices([...openIndices, index]);
    }
  };

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-[#081933] text-white py-16 lg:py-20 border-b border-cyan-500/15">
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity">
          <Image
            alt="مركز المساعدة"
            className="object-cover"
            fill
            priority
            src="/assets/img/gis-blueprints-desk.jpg"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / المساعدة</div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">مركز المساعدة</h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            إجابات سريعة لأكثر الاستفسارات شيوعًا — ولو محتاج مساعدة إضافية، فريق الدعم موجود.
          </p>
        </div>
      </section>

      {/* 2. Target Audiences 3 Cards */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl mb-2">🙋</div>
              <h3 className="font-bold text-slate-900 text-base mb-1">للعملاء والمقاولين</h3>
              <p className="text-xs text-slate-600">كيف تبحث وتقارن وترسل طلب تواصل أو احتياج هندسي في منطقتك.</p>
            </div>
            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl mb-2">🏢</div>
              <h3 className="font-bold text-slate-900 text-base mb-1">للمكاتب والشركات والموردين</h3>
              <p className="text-xs text-slate-600">إجراءات التسجيل، إضافة الأجهزة، مراجعة الإدارة، وإدارة طلبات العملاء.</p>
            </div>
            <div className="bg-[#f4f7fa] p-6 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl mb-2">📐</div>
              <h3 className="font-bold text-slate-900 text-base mb-1">للمهندسين والمسّاحين</h3>
              <p className="text-xs text-slate-600">بناء الملف المهني، التحقق من السيرة الذاتية، التقديم على الوظائف ودورات الأكاديمية.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FAQ Accordion & Support Sidebar */}
      <section className="py-16 bg-[#f4f7fa] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* FAQ List (2 Cols) */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">الأسئلة الأكثر شيوعاً</h2>
              {faqs.map((faq, idx) => {
                const isOpen = openIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition"
                  >
                    <button
                      onClick={() => toggleIndex(idx)}
                      className="w-full flex items-center justify-between p-5 text-right font-bold text-slate-900 text-base hover:bg-slate-50 transition"
                    >
                      <span>{faq.question}</span>
                      <span className={`text-cyan-600 text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Support Sidebar (1 Col) */}
            <div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-28 space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">لم تجد إجابتك؟</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    فريق الدعم الفني متاح لمساعدتك من السبت للخميس، 9 صباحًا — 5 مساءً.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 block text-center rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-[#041527] font-extrabold py-2.5 text-xs shadow-md transition"
                  >
                    تواصل مع الدعم الفني
                  </Link>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <span className="block text-xs font-bold text-slate-700 mb-2">روابط سريعة مفيدة:</span>
                  <Link href="/how-it-works" className="block text-xs text-cyan-700 hover:underline py-1">
                    ← كيف تعمل المنصة للعملاء والشركاء
                  </Link>
                  <Link href="/terms" className="block text-xs text-cyan-700 hover:underline py-1">
                    ← الشروط والأحكام
                  </Link>
                  <Link href="/privacy" className="block text-xs text-cyan-700 hover:underline py-1">
                    ← سياسة الخصوصية واستخدام البيانات
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
