import React from 'react';
import Link from 'next/link';
import ProviderRegistrationWizard from '@/components/ProviderRegistrationWizard';

export const metadata = {
  title: 'لماذا تنضم إلى شبكة Survsta؟ | منصة المساحة والجيوماتكس',
  description: 'انضم إلى شبكة Survsta الهندسية المعتمدة لعرض أجهزتك ومعداتك المساحية والتواصل المباشر مع شركات المقاولات والمهندسين.',
};

const PITCH_CARDS = [
  {
    id: 1,
    icon: '🎯',
    title: 'الاستهداف الدقيق للمحترفين',
    body: 'منصة Survsta مصممة حصرياً لقطاع المساحة والجيوماتكس. عملاؤك هنا هم مهندسون وشركات مقاولات يبحثون عن الجودة، مما يضمن لك وصولاً مباشراً بلا تشتت.',
  },
  {
    id: 2,
    icon: '🤝',
    title: 'شراكات أعمال موثوقة',
    body: 'نحن لا نعرض إعلانات عشوائية، بل نبني مجتمعاً هندسياً يجمع نخبة المكاتب والموردين. وجودك هنا يعني صفقات حقيقية مع أطراف جادة في السوق.',
  },
  {
    id: 3,
    icon: '🏢',
    title: 'واجهة عرض مؤسسية',
    body: 'اعرض معداتك من خلال كتالوج موحد يعكس احترافيتك. نحن نقدم لك بنية رقمية متطورة ولوحة تحكم متكاملة تليق بحجم أعمالك وترفع من ثقة عملائك.',
  },
  {
    id: 4,
    icon: '⚡',
    title: 'إدارة ذكية لأصولك',
    body: 'لست مجرد معلن، أنت تدير أصولك ومعداتك. مع أدوات Survsta المتقدمة، تسبق منافسيك بخطوة عبر عمليات مؤتمتة وإدارة مرنة لحالة أجهزتك.',
  },
];

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-[#081933] text-gray-100 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      {/* Enterprise Pitch Section */}
      <div className="max-w-5xl mx-auto text-center space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300 backdrop-blur-md">
          <span>✨</span>
          <span>منصة رقمية موحدة لقطاع المساحة والجيوماتكس</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          لماذا تنضم إلى شبكة Survsta؟
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          انضم إلى مجتمع هندسي موثوق يربط مكاتب وموردي الأجهزة المساحية بأكبر شركات المقاولات والمهندسين في مصر والشرق الأوسط.
        </p>

        {/* 4 Pitch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-right">
          {PITCH_CARDS.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border border-gray-800 bg-[#0F253E]/60 p-6 sm:p-7 shadow-xl backdrop-blur-md hover:border-amber-500/40 hover:bg-[#0F253E]/90 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
                  {card.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {card.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Button linked directly to /provider/dashboard */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/provider/dashboard"
            className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-l from-amber-500 to-[#F4B400] px-8 py-3.5 text-sm sm:text-base font-black text-[#081933] shadow-xl shadow-amber-500/25 hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <span>سجل الآن وابدأ عرض أجهزتك</span>
            <span className="text-lg font-black">←</span>
          </Link>
          <a
            href="#register-form"
            className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition py-2 px-4"
          >
            أو أنشئ حسابك مباشرة عبر النموذج السريع ↓
          </a>
        </div>
      </div>

      {/* Registration Wizard Anchor Section */}
      <div id="register-form" className="max-w-4xl mx-auto pt-10 border-t border-gray-800/80">
        <ProviderRegistrationWizard />
      </div>
    </div>
  );
}
