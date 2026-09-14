'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Job {
  id: number;
  slug: string;
  title: string;
  company: string;
  gov: string;
  type: string;
  exp: string;
  posted: string;
  salary: string;
  desc: string;
  requirements: string[];
}

const JOBS_DATA: Job[] = [
  {
    id: 1,
    slug: 'surveyor-alex',
    title: 'مهندس / مسّاح موقع — مشروع سكني واستثماري',
    company: 'مكتب النخبة للمساحة',
    gov: 'الإسكندرية',
    type: 'دوام كامل',
    exp: '3 - 5 سنوات',
    posted: 'منذ يومين',
    salary: 'يُحدد بعد المقابلة (مجزٍ)',
    desc: 'مسؤول عن الرفع المساحي الميداني وتوقيع المحاور الإنشائية ومتابعة أعمال التنفيذ اليومية بالموقع وإعداد الشيتات الحسابية والتقارير الدورية.',
    requirements: [
      'خبرة عملية مثبتة على أجهزة Total Station وGNSS RTK',
      'إجادة تامة لبرامج AutoCAD وCivil 3D',
      'القدرة على العمل الميداني وإدارة فريق المساعدين',
      'بكالوريوس هندسة مساحة أو دبلوم فني مساحة معتمد',
    ],
  },
  {
    id: 2,
    slug: 'gis-analyst',
    title: 'محلل نظم معلومات جغرافية GIS Specialist',
    company: 'دلتا جيوماتكس',
    gov: 'القاهرة',
    type: 'دوام كامل',
    exp: '2 - 4 سنوات',
    posted: 'منذ 4 أيام',
    salary: 'راتب أساسي تنافسي + تأمين',
    desc: 'بناء وإدارة قواعد البيانات المكانية للمشروعات القومية، وإجراء التحليلات المكانية المتقدمة وتجهيز لوحات الخرائط التفاعلية لفرق التصميم والتخطيط.',
    requirements: [
      'إجادة احترافية لبرامج ArcGIS Pro أو QGIS',
      'معرفة جيدة بقواعد البيانات المكانية PostGIS وSQL',
      'خبرة في تحويل وتصحيح نظم الإحداثيات الجغرافية المصرية',
      'مهارات إخراج وتصميم خرائط طباعية عالية الجودة',
    ],
  },
  {
    id: 3,
    slug: 'survey-assistant',
    title: 'مساعد مسّاح موقع (عواكس وشواخص)',
    company: 'الغرب للخدمات المساحية',
    gov: 'البحيرة',
    type: 'عقد مشروع',
    exp: 'سنة فأكثر',
    posted: 'منذ أسبوع',
    salary: 'يومية مجزية + بدل انتقال',
    desc: 'معاونة مهندس المساحة في حمل ونصب الأجهزة والوقوف بالعواكس على نقاط التوقيع والمناسيب، وحفظ دفاتر الموقع وتثبيت الأوتاد الحديدية والخرسانية.',
    requirements: [
      'خبرة سابقة في العمل الميداني كمساعد مساح',
      'معرفة أساسية بمسك القامة وضبط ميزان الماء للعواكس',
      'تحمل طبيعة العمل الميداني في المواقع المفتوحة',
      'الالتزام بمعايير السلامة المهنية بالموقع',
    ],
  },
  {
    id: 4,
    slug: 'laser-scan-tech',
    title: 'فني مسح ليزري ثلاثي الأبعاد 3D Scanner',
    company: 'دلتا جيوماتكس',
    gov: 'القاهرة',
    type: 'دوام كامل',
    exp: 'سنتان فأكثر',
    posted: 'منذ أسبوع',
    salary: 'رواتب مجزية وحوافز مشاريع',
    desc: 'تشغيل أجهزة الماسح الليزري الثابت والمحمول في المباني التراثية ومحطات البتروكيماويات، وضبط الأهداف وتجميع وتصدير السحب النقطية Point Clouds.',
    requirements: [
      'خبرة عملية في تشغيل ماسحات Faro أو Leica أو Trimble',
      'معرفة ببرامج التسجيل والمعالجة مثل Scene أو Cyclone',
      'دقة عالية في توزيع وربط الأهداف المرجعية Targets',
    ],
  },
  {
    id: 5,
    slug: 'calibration-eng',
    title: 'مهندس / فني صيانة ومعايرة أجهزة مساحية',
    company: 'مركز الدقة للمعايرة',
    gov: 'الجيزة',
    type: 'دوام كامل',
    exp: '3 سنوات',
    posted: 'منذ أسبوعين',
    salary: 'يُحدد حسب الخبرة الفنية',
    desc: 'فحص وضبط وتصليح الأعطال الميكانيكية والإلكترونية لأجهزة Total Station والموازين، واختبار الدقة على الكوليماتورات وإصدار شهادات المعايرة.',
    requirements: [
      'خبرة متخصصة في مراكز صيانة أجهزة المساحة المعتمدة',
      'مهارة فك وضبط البصريات والمحاور الرأسية والأفقية',
      'إلمام بمعايير المعايرة ISO الدقيقة',
    ],
  },
];

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [appliedJob, setAppliedJob] = useState<Job | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const filteredJobs = useMemo(() => {
    return JOBS_DATA.filter((job) => {
      const matchQuery =
        !searchQuery ||
        job.title.includes(searchQuery) ||
        job.company.includes(searchQuery) ||
        job.desc.includes(searchQuery);
      const matchGov = !selectedGov || job.gov === selectedGov;
      const matchType = !selectedType || job.type === selectedType;
      return matchQuery && matchGov && matchType;
    });
  }, [searchQuery, selectedGov, selectedType]);

  return (
    <div className="bg-[#f4f7fa] text-slate-800">
      {/* 1. Header Banner */}
      <section className="bg-[#081933] text-white py-12 lg:py-16 border-b border-cyan-500/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-cyan-400 text-xs font-semibold mb-2">الرئيسية / الوظائف</div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">وظائف قطاع المساحة والجيوماتكس</h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            فرص عمل منشورة ومتحقق منها من مكاتب وشركات معتمدة — قدّم ببياناتك وسيرتك المهنية مباشرة وبدون وسيط.
          </p>
        </div>
      </section>

      {/* 2. Main Jobs Layout */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Filters */}
            <div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-28 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">تصفية الوظائف</h3>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGov('');
                      setSelectedType('');
                    }}
                    className="text-xs text-cyan-700 hover:underline font-semibold"
                  >
                    مسح الفلاتر
                  </button>
                </div>

                {/* Query */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">بحث</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="مسمى وظيفي أو شركة..."
                    className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-3.5 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Governorate */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المحافظة</label>
                  <select
                    value={selectedGov}
                    onChange={(e) => setSelectedGov(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">كل المحافظات</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="البحيرة">البحيرة</option>
                  </select>
                </div>

                {/* Contract Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع التعاقد</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-[#f4f7fa] px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">الكل</option>
                    <option value="دوام كامل">دوام كامل</option>
                    <option value="عقد مشروع">عقد مشروع</option>
                    <option value="دوام جزئي">دوام جزئي</option>
                  </select>
                </div>

                {/* Employer CTA */}
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs mb-1">صاحب عمل أو مكتب؟</h4>
                  <p className="text-[11px] text-slate-500 mb-3">انشر إعلان وظيفتك ووصّلها لآلاف المساحين المؤهلين في مصر.</p>
                  <Link
                    href="/join"
                    className="block text-center rounded-lg bg-[#081933] hover:bg-[#0F253E] text-white py-2 text-xs font-bold transition"
                  >
                    انشر وظيفة جديدة
                  </Link>
                </div>

              </div>
            </div>

            {/* Jobs List (3 Cols) */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  متاح حالياً <span className="text-cyan-700">{filteredJobs.length}</span> فرصة عمل
                </span>
                <span className="text-slate-500">تحديث يومي للفرص المعتمدة</span>
              </div>

              {filteredJobs.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                  <span className="text-4xl block mb-2">💼</span>
                  <p className="font-bold text-base text-slate-800">لا توجد وظائف مطابقة للبحث</p>
                  <p className="text-xs mt-1">جرّب تغيير المحافظة أو مسح شروط التصفية.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-cyan-700">{job.company}</span>
                            <span className="text-[11px] bg-[#f4f7fa] text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                              📍 {job.gov}
                            </span>
                            <span className="text-[11px] bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded-full font-bold">
                              {job.type}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                        </div>

                        <div className="text-left shrink-0">
                          <span className="text-xs text-slate-400 block">{job.posted}</span>
                          <span className="text-xs font-bold text-emerald-700">{job.salary}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed my-3">{job.desc}</p>

                      <div className="mb-4">
                        <span className="block text-[11px] font-bold text-slate-700 mb-1.5">المتطلبات الأساسية:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {job.requirements.map((req, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                              <span className="text-cyan-600 font-bold">▪</span>
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">مستوى الخبرة: <b className="text-slate-800">{job.exp}</b></span>
                        <button
                          onClick={() => {
                            setAppliedJob(job);
                            setAppliedSuccess(false);
                          }}
                          className="rounded-lg bg-[#00d2ff] hover:bg-cyan-400 text-[#041527] font-extrabold px-5 py-2 text-xs shadow-sm transition"
                        >
                          قدّم الآن على الوظيفة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        </div>
      </section>

      {/* Application Modal */}
      {appliedJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                التقديم على: {appliedJob.title}
              </h3>
              <button
                onClick={() => setAppliedJob(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {appliedSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-3xl block mb-2">🎉</span>
                <h4 className="text-base font-bold text-emerald-900 mb-1">تم إرسال طلبك بنجاح!</h4>
                <p className="text-xs text-emerald-800">
                  تم إرسال ملفك إلى {appliedJob.company}. سيتواصل معك مسؤولو التوظيف في حال توافق متطلباتك.
                </p>
                <button
                  onClick={() => setAppliedJob(null)}
                  className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAppliedSuccess(true);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم بالكامل *</label>
                  <input
                    required
                    type="text"
                    placeholder="م. محمد علي"
                    className="w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                  <input
                    required
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    className="w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سنوات الخبرة العملية *</label>
                  <input
                    required
                    type="text"
                    placeholder="مثال: 3 سنوات في الرفع والتوقيع"
                    className="w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رابط السيرة الذاتية (CV / LinkedIn / Drive)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#00d2ff] hover:bg-cyan-400 text-[#041527] font-extrabold py-2.5 rounded-lg transition"
                  >
                    تأكيد إرسال الطلب
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppliedJob(null)}
                    className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
