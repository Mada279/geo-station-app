/* ============================================================
   GEO STATION — Bilingual engine (AR / EN)
   Live DOM translation with RTL⇄LTR flip, no reload, no build step.
   Concept, UX/UI & Platform Architecture by Eng. Mohamed Farag — CoreviaZone
   ============================================================ */
(function(global){
"use strict";

const LSKEY = "GS_LANG";

/* ============================================================
   DICTIONARY — Arabic source → English
   Longest-match-first phrase replacement over text nodes.
   ============================================================ */
const D = {

/* ---------- navigation & chrome ---------- */
"الرئيسية":"Home", "الدليل":"Directory", "الأجهزة":"Equipment", "الخدمات":"Services",
"الخريطة":"Map", "الوظائف":"Jobs", "عن المنصة":"About", "المنصة":"Platform",
"المساعدة":"Help", "تواصل معنا":"Contact us", "انضم كشريك":"Join as partner",
"أضف احتياجك":"Post your need", "استكشف":"Explore", "للشركاء":"For partners",
"سوق الأجهزة":"Equipment marketplace", "الخدمات المساحية":"Survey services",
"الخريطة التفاعلية":"Interactive map", "دليل المكاتب والشركات":"Offices & companies directory",
"كيف تعمل المنصة":"How the platform works", "من نحن":"About us",
"المساعدة والأسئلة":"Help & FAQ", "تطبيق الموبايل":"Mobile app",
"الشروط والأحكام":"Terms & conditions", "سياسة الخصوصية":"Privacy policy",
"سجّل مكتبك أو شركتك":"Register your office or company",
"أضف أجهزتك للبيع أو الإيجار":"List your equipment for sale or rent",
"انشر وظيفة":"Post a job", "خدمة الشركاء":"Partner support",
"🔐 دخول الشركاء":"🔐 Partner login", "🔐 بوابة المزوّد":"🔐 Provider portal",
"🛡️ لوحة الإدارة":"🛡️ Admin panel", "📱 حمّل التطبيق":"📱 Get the app",
"متاح على":"Available on", "حمّل من":"Download on", "بحث سريع…":"Quick search…",
"عرض الموقع العام":"View public site", "بوابة المزوّد":"Provider portal",
"لوحة الإدارة":"Admin panel", "تسجيل الخروج":"Sign out",
"© 2026 Geo Station — جميع الحقوق محفوظة.":"© 2026 Geo Station — All rights reserved.",
"المنصة الرقمية المتخصصة لقطاع المساحة والجيوماتكس في مصر — دليل، سوق أجهزة، خدمات، تدريب ووظائف في مكان واحد.":
 "The dedicated digital platform for Egypt's surveying and geomatics sector — directory, equipment marketplace, services, training and jobs in one place.",
"📍 نخدم حاليًا: الإسكندرية والقاهرة والجيزة — التوسع تباعًا لباقي المحافظات":
 "📍 Currently serving: Alexandria, Cairo and Giza — expanding to other governorates",

/* ---------- provider types ---------- */
"مكاتب المساحة":"Survey offices", "شركات المساحة":"Survey companies",
"موردو الأجهزة":"Equipment suppliers", "مراكز المعايرة":"Calibration centres",
"مراكز التدريب":"Training centres", "المسّاحون":"Surveyors",
"مكتب مساحة":"Survey office", "شركة مساحة":"Survey company", "مورد أجهزة":"Equipment supplier",
"مركز معايرة":"Calibration centre", "مركز تدريب":"Training centre", "مسّاح مستقل":"Independent surveyor",
"مكاتب متخصصة في الرفع المساحي والتقسيم وحصر الكميات.":"Offices specialised in topographic survey, subdivision and quantity take-off.",
"شركات بقدرات تنفيذية وفرق ومعدات متعددة.":"Companies with execution capacity, multiple crews and equipment.",
"بيع وتأجير أجهزة المساحة وقطع الغيار والملحقات.":"Sale and rental of survey instruments, spare parts and accessories.",
"معايرة وصيانة الأجهزة وإصدار الشهادات الفنية.":"Instrument calibration, maintenance and technical certificates.",
"دورات تطبيقية على الأجهزة وبرامج المساحة.":"Hands-on courses on instruments and survey software.",
"محترفون أفراد بملفات مهنية وسير ذاتية موثّقة.":"Individual professionals with verified profiles and CVs.",

/* ---------- governorates ---------- */
"الإسكندرية":"Alexandria", "القاهرة":"Cairo", "الجيزة":"Giza", "البحيرة":"Beheira",
"مطروح":"Matrouh", "الدقهلية":"Dakahlia", "المنوفية":"Menoufia", "القليوبية":"Qalyubia",
"كل المحافظات":"All governorates", "المحافظة":"Governorate", "المدينة":"City",
"سموحة":"Smouha", "مدينة نصر":"Nasr City", "وسط البلد":"Downtown", "الشيخ زايد":"Sheikh Zayed",
"الهرم":"Haram", "المعادي":"Maadi", "حلوان":"Helwan", "أكتوبر":"6th of October", "العباسية":"Abbasiya",

/* ---------- common actions ---------- */
"عرض":"View", "تعديل":"Edit", "حذف":"Delete", "إضافة":"Add", "حفظ":"Save", "إلغاء":"Cancel",
"بحث":"Search", "فلترة":"Filter", "تصدير":"Export", "استيراد":"Import", "مراجعة":"Review",
"فحص":"Inspect", "تنبيه":"Alert", "إغلاق":"Close", "تراجع":"Undo", "أرشفة":"Archive",
"استعادة":"Restore", "تأكيد":"Confirm", "إرسال":"Submit", "رفع":"Upload", "تحميل":"Download",
"اعتماد":"Approve", "رفض":"Reject", "الإجراء":"Action", "الإجراءات":"Actions",
"طلب تواصل":"Request contact", "التفاصيل ←":"Details →", "تصفّح الكل ←":"Browse all →",
"⬇ تصدير":"⬇ Export", "⬇ تصدير CSV":"⬇ Export CSV", "👁️ عرض في الموقع":"👁️ View on site",
"➕ إضافة مزوّد":"➕ Add provider", "➕ إضافة عميل":"➕ Add client",
"➕ إضافة جهاز":"➕ Add equipment", "➕ إضافة مستخدم":"➕ Add user",
"📤 رفع صورة":"📤 Upload image", "🖼️ من المكتبة":"🖼️ From library",
"📦 أرشفة (قابل للاستعادة)":"📦 Archive (restorable)", "⛔ حذف نهائي":"⛔ Delete permanently",
"💾 حفظ التعديلات":"💾 Save changes", "➕ إضافة وحفظ":"➕ Add and save",
"🗑️ حذف":"🗑️ Delete", "♻️ استعادة":"♻️ Restore", "📤 رفع صور":"📤 Upload images",

/* ---------- table headers & fields ---------- */
"الاسم":"Name", "النوع":"Type", "الحالة":"Status", "التاريخ":"Date", "الموقع":"Location",
"الرقم":"ID", "التقييم":"Rating", "السعر":"Price", "العميل":"Client", "المزوّد":"Provider",
"الخدمة":"Service", "الوظيفة":"Job", "الدورة":"Course", "الجهاز":"Device",
"الهاتف":"Phone", "البريد الإلكتروني":"Email", "العنوان":"Address", "الوصف":"Description",
"الموضوع":"Subject", "المصدر":"Source", "الدور":"Role", "الفريق":"Team",
"آخر دخول":"Last login", "التوثيق":"Verification", "مميّز":"Featured",
"العلامة":"Brand", "الفئة":"Category", "المدة":"Duration", "المستوى":"Level",
"جهة العمل":"Employer", "التعاقد":"Contract", "الخبرة":"Experience", "الراتب":"Salary",
"المركز":"Centre", "ساعات":"Hours", "الرسوم":"Fee", "بلاغات":"Reports", "النص":"Text",
"مسؤول التواصل":"Contact person", "القيمة":"Value", "مغلقة":"Closed", "طلبات":"Requests",
"مزوّدون":"Providers", "المعايرة":"Calibration", "المالك":"Owner", "العرض":"Listing type",
"الصلاحية":"Permission", "الفاعل":"Actor", "الكيان":"Entity", "قبل":"Before", "بعد":"After",
"الوقت":"Time", "الاسم التجاري":"Trade name", "نوع الجهة":"Entity type",
"المسمى الوظيفي":"Job title", "اسم الدورة":"Course name", "اسم الخدمة":"Service name",

/* ---------- statuses ---------- */
"نشط":"Active", "خامل":"Idle", "موقوف":"Suspended", "منشور":"Published",
"مسودة":"Draft", "قيد المراجعة":"Under review", "مرفوض":"Rejected", "مؤرشف":"Archived",
"مخفي":"Hidden", "جديد":"New", "مُسلَّم":"Delivered", "مُطّلع عليه":"Viewed",
"تم التواصل":"Contacted", "مؤهل":"Qualified", "تفاوض":"Negotiating",
"مغلق ناجح":"Closed won", "مغلق غير ناجح":"Closed lost", "مكرر":"Duplicate",
"غير صالح":"Invalid", "بانتظار التفعيل":"Pending activation", "مطلوب تعديل":"Changes requested",
"سارية":"Valid", "منتهية":"Expired", "غير مُدرجة":"Not listed", "متاح الآن":"Available now",
"حرجة":"Critical", "عالية":"High", "متوسطة":"Medium", "منخفضة":"Low",
"صحي":"Healthy", "يحتاج دعم":"Needs support", "حرج":"Critical", "مكتمل":"Completed",
"مكتمل بأخطاء":"Completed with errors", "بلا شارات":"No badges",

/* ---------- verification ---------- */
"ملف موثّق":"Verified profile", "نشاط موثّق":"Verified activity",
"معدات موثّقة":"Verified equipment", "سجل معايرة":"Calibration record",
"✔ ملف موثّق":"✔ Verified profile", "✔ نشاط موثّق":"✔ Verified activity",
"✔ معدات موثّقة":"✔ Verified equipment", "✔ مسموح":"✔ Allowed", "✕ ممنوع":"✕ Denied",
"⭐ مميّز":"⭐ Featured", "الظهور المميّز":"Featured placement",

/* ---------- roles ---------- */
"مدير النظام":"System administrator", "مسؤول تشغيل":"Operations manager",
"مُدخل بيانات":"Data entry", "دعم العملاء":"Customer support", "مراجع محتوى":"Content reviewer",
"مشرف محتوى":"Content moderator", "مدير الحساب":"Account manager", "مزوّد":"Provider",
"التشغيل":"Operations", "الإدارة":"Administration", "البيانات":"Data", "الدعم":"Support",

/* ---------- portal sections ---------- */
"نظرة عامة":"Overview", "المراجعة والاعتماد":"Review & approval", "إدارة البيانات":"Data management",
"المتابعة":"Monitoring", "لوحة التحكم":"Dashboard", "صندوق الطلبات":"Inbox",
"الملف والحساب":"Profile & account", "النمو":"Growth", "النظام":"System",
"مركز الاعتمادات":"Approvals centre", "مراجعة الأجهزة":"Equipment review",
"مركز التوثيق":"Verification centre", "مراجعة التقييمات":"Review moderation",
"البلاغات":"Reports", "المزوّدون":"Providers", "العملاء":"Clients", "المستخدمون":"Users",
"المحتوى":"Content", "مكتبة الوسائط":"Media library", "تجميع البيانات":"Data collection",
"الاستيراد والتصدير":"Import & export", "إدارة الطلبات":"Lead management",
"سجل التدقيق":"Audit log", "إعدادات النظام":"System settings", "تحليلات المنصة":"Platform analytics",
"الفريق والصلاحيات":"Team & permissions", "التقييمات":"Reviews", "الإشعارات":"Notifications",
"المواقع والتغطية":"Locations & coverage", "التحليلات":"Analytics", "الإعدادات":"Settings",
"الوظائف المنشورة":"Published jobs", "ملف الجهة":"Entity profile", "الإدراجات":"Listings",
"إدارة المزوّدين":"Provider management", "إدارة العملاء":"Client management",
"إدارة الأجهزة":"Equipment management", "إدارة المحتوى":"Content management",
"المستخدمون والصلاحيات":"Users & permissions", "قاعدة البيانات":"Database",
"بيئة التشغيل — الإصدار 1.0":"Operating environment — version 1.0",

/* ---------- categories & services ---------- */
"رفع مساحي طبوغرافي":"Topographic survey", "تقسيم وفرز أراضي":"Land subdivision",
"حصر كميات":"Quantity take-off", "إعداد خرائط GIS":"GIS mapping",
"مسح ليزري ثلاثي الأبعاد":"3D laser scanning", "مسح بالطائرات بدون طيار":"Drone survey",
"مساحة أرضية":"Land surveying", "مسح جوي":"Aerial survey", "معايرة":"Calibration",
"استشارات":"Consulting", "نمذجة BIM":"BIM modelling", "بيع":"Sale", "إيجار":"Rent",
"بيع وإيجار":"Sale & rent", "دوام كامل":"Full-time", "دوام جزئي":"Part-time",
"عقد مشروع":"Project contract", "تدريب":"Training", "مبتدئ":"Beginner",
"متوسط":"Intermediate", "متقدم":"Advanced", "حضوري":"On-site", "أونلاين":"Online",
"هجين":"Hybrid", "جديد ومستعمل من موردين معتمدين":"New and used from approved suppliers",
"مستعمل — ممتاز":"Used — excellent", "مستعمل — جيد":"Used — good", "مجدّد":"Refurbished",
"كل الأجهزة":"All equipment", "أجهزة للإيجار":"Equipment for rent",
"أجهزة للبيع":"Equipment for sale", "ملحقات":"Accessories",
"تصفح كل المعروض للبيع والإيجار":"Browse everything for sale and rent",
"تأجير يومي وأسبوعي وشهري":"Daily, weekly and monthly rental",
"أجهزة محطات رصد شاملة":"Total station instruments",
"أطقم استقبال أقمار صناعية":"Satellite receiver kits",
"جنيه / يوم":"EGP / day", "ج.م":"EGP", "ج.م / يوم":"EGP / day",
"ج.م / أسبوع":"EGP / week", "ج.م / شهر":"EGP / month",

/* ---------- nav descriptions ---------- */
"رحلة العميل والمزوّد خطوة بخطوة":"The client and provider journey step by step",
"الرؤية والفريق ونموذج العمل":"Vision, team and business model",
"تحميل التطبيق لأندرويد وiOS":"Download the app for Android and iOS",
"إجابات لأكثر الاستفسارات شيوعًا":"Answers to the most common questions",
"فريق الدعم وخدمة الشركاء":"Support team and partner service",

/* ---------- CTA & marketing ---------- */
"عندك احتياج محدد؟ خلّي المزوّدين يوصلوك":"Have a specific need? Let providers reach you",
"اكتب احتياجك مرة واحدة، وتوجّهه Geo Station للمكاتب والشركات المؤهلة في نطاقك الجغرافي — مجانًا وبدون التزام.":
 "Describe your need once and Geo Station routes it to qualified offices and companies in your area — free and with no obligation.",
"الأعلى تقييمًا":"Top rated", "جهات موصى بها هذا الشهر":"Recommended providers this month",
"دليل قطاع المساحة في مصر":"Egypt's surveying sector directory",
"تصفّح الجهات حسب النوع والتخصص والمحافظة — كل ملف يمر بمراجعة الإدارة قبل النشر.":
 "Browse entities by type, speciality and governorate — every profile is reviewed by the admin team before publication.",
"⏱ يرد خلال يوم":"⏱ Replies within a day", "خلال ساعة":"Within an hour",
"خلال 3 ساعات":"Within 3 hours", "خلال 6 ساعات":"Within 6 hours", "خلال يوم عمل":"Within a business day",

/* ---------- legal notices ---------- */
"شارات التوثيق تُمنح بأدلة مراجَعة فعليًا ولا تعني اعتمادًا فنيًا. الظهور المميّز موسوم دائمًا ولا يؤثر على التقييم أو مستوى التوثيق.":
 "Verification badges are granted against genuinely reviewed evidence and do not imply technical accreditation. Featured placement is always labelled and never affects rating or verification level.",
"سياسة المعايرة: لا يُعرض سجل معايرة منتهٍ على أنه سارٍ. الأجهزة بلا سجل تظهر بوسم «غير مُدرجة» صراحةً للعميل.":
 "Calibration policy: an expired calibration record is never shown as valid. Instruments without a record are explicitly labelled \"Not listed\" to the client.",
"بيانات العملاء تخضع لسياسة الخصوصية — لا تُشارك مع أي مزوّد إلا في سياق طلب تواصل أنشأه العميل بنفسه.":
 "Client data is governed by the privacy policy — it is shared with a provider only in the context of a contact request the client created themselves.",
"المزوّد لا يستطيع حذف أو تعديل تقييم. تدخّل الإدارة في التقييمات يتم بقرار موثّق فقط ويظهر في سجل التدقيق.":
 "Providers cannot delete or edit a review. Admin intervention happens only by documented decision and appears in the audit log.",
"الحذف النهائي وتصدير البيانات الشخصية وتعديل إعدادات النظام حكر على «مدير النظام»، وكل استخدام لها يُسجَّل في سجل التدقيق.":
 "Permanent deletion, personal-data export and system settings changes are restricted to the System administrator, and every use is recorded in the audit log.",

/* ---------- CRUD engine UI ---------- */
"الحقول المعلّمة بـ":"Fields marked with", "إلزامية. لا يُحفظ السجل ناقصًا.":"are required. Incomplete records are not saved.",
"هذا الحقل إلزامي":"This field is required", "صيغة البريد غير صحيحة":"Invalid email format",
"لا توجد صورة":"No image", "لا توجد سجلات مطابقة.":"No matching records.",
"مسح الفلاتر":"Clear filters", "سجل":"records", "النشطون":"Active", "المؤرشفون":"Archived",
"النشطة":"Active", "المؤرشفة":"Archived", "المنشورون":"Published", "المنشورة":"Published",
"اختر":"Select", "— اختر —":"— Select —", "نعم":"Yes", "لا":"No",
"مساحة التخزين":"Storage used", "التخزين":"Storage",
"اسحب الصور هنا أو اضغط للاختيار":"Drag images here or click to choose",
"🖼️ اختر من مكتبة الوسائط":"🖼️ Choose from media library",
"البيانات محفوظة في متصفحك — صدّرها للنقل لجهاز آخر":"Data is stored in your browser — export it to move to another device",
"⬇ تصدير قاعدة البيانات":"⬇ Export database",
"📤 استيراد ملف قاعدة بيانات":"📤 Import database file",
"♻️ إعادة التعيين للبيانات الأصلية":"♻️ Reset to original data",
"الصور تُضغط تلقائيًا حتى 400 ك.ب":"Images are auto-compressed to 400 KB",
"غير مستخدمة":"Unused", "غير مستخدمة بعد":"Not yet used",

/* ---------- misc ---------- */
"بحث…":"Search…", "كل الأنواع":"All types", "كل الحالات":"All statuses",
"كل الفئات":"All categories", "كل العلامات":"All brands", "كل الأدوار":"All roles",
"صورة":"Image", "صورة مرفوعة":"Uploaded image", "شعار":"Logo", "مستند":"Document",
"ملف مزوّد":"Provider profile", "صفحة جهاز":"Equipment page", "طلب احتياج":"Need request",
"نتائج البحث":"Search results", "تفاصيل الدورة":"Course details", "تقديم سريع":"Quick apply",
"حسب العرض":"On request", "غير محدد":"Not specified", "فتح":"Open",
"شركة مقاولات":"Contracting company", "شركة تطوير عقاري":"Real-estate developer",
"جهة حكومية":"Government entity", "مكتب استشاري":"Consulting office",
"عميل فردي":"Individual client", "أخرى":"Other", "موظف":"employees",

/* ---------- extended dictionary (names, data, analytics) ---------- */
"مكتب النخبة للمساحة":"Elite Survey Office",
"مكتب النخبة":"Elite Office",
"دلتا جيوماتكس":"Delta Geomatics",
"النيل لأجهزة المساحة":"Nile Survey Instruments",
"جيو تك للتوريدات":"GeoTech Supplies",
"مركز الدقة للمعايرة":"Precision Calibration Centre",
"مركز الدقة":"Precision Centre",
"هورايزون جيو للمساحة":"Horizon Geo Survey",
"هورايزون جيو":"Horizon Geo",
"الغرب للخدمات المساحية":"Al Gharb Survey Services",
"مركز الميزان للمعايرة والصيانة":"Al Mizan Calibration & Maintenance",
"مركز الميزان للمعايرة":"Al Mizan Calibration",
"جيو أكاديمي مصر":"Geo Academy Egypt",
"الإسكندرية للأجهزة الهندسية":"Alexandria Engineering Instruments",
"شركة أبعاد للمساحة":"Ab'ad Survey Co.",
"مكتب الأمانة للمساحة":"Al Amana Survey Office",
"مكتب البحر للمساحة":"Al Bahr Survey Office",
"شركة أوركيد للتطوير العقاري":"Orchid Real Estate Development",
"شركة أوركيد للتطوير":"Orchid Development",
"شركة أوركيد":"Orchid Co.",
"مقاولات النصر":"Al Nasr Contracting",
"مقاولات الدلتا":"Delta Contracting",
"شركة المستقبل للإنشاءات":"Future Construction Co.",
"شركة المستقبل":"Future Co.",
"شركة هرم للمقاولات":"Haram Contracting",
"مجموعة النيل العقارية":"Nile Real Estate Group",
"الهيئة العامة للتخطيط العمراني":"General Organisation for Physical Planning",
"م. محمد فرج":"Eng. Mohamed Farag",
"م. أحمد النجار":"Eng. Ahmed El-Naggar",
"م. أحمد سليم":"Eng. Ahmed Selim",
"م. سيد كامل":"Eng. Sayed Kamel",
"م. منى فؤاد":"Eng. Mona Fouad",
"م. منى رشاد":"Eng. Mona Rashad",
"م. طارق عبد الحميد":"Eng. Tarek Abdel Hamid",
"م. طارق زكي":"Eng. Tarek Zaki",
"م. هاني عبد الله":"Eng. Hany Abdallah",
"م. وليد عصام":"Eng. Walid Essam",
"م. سامح رفعت":"Eng. Sameh Refaat",
"م. رمضان علي":"Eng. Ramadan Ali",
"م. إبراهيم زكي":"Eng. Ibrahim Zaki",
"أ. سحر فؤاد":"Ms. Sahar Fouad",
"أ. سارة منير":"Ms. Sara Mounir",
"أ. كريم عادل":"Mr. Karim Adel",
"أ. نهى صابر":"Ms. Noha Saber",
"أ. ياسر لطفي":"Mr. Yasser Lotfy",
"العصافرة":"Asafra",
"فرع العجمي":"Agami branch",
"المقر الرئيسي":"Head office",
"اليوم":"Today",
"أمس":"Yesterday",
"غدًا":"Tomorrow",
"منذ":"since",
"ساعة":"hour",
"ساعات":"hours",
"يوم":"day",
"أيام":"days",
"أسبوع":"week",
"شهر":"month",
"سنة":"year",
"دقيقة":"minute",
"منذ يومين":"2 days ago",
"منذ 3 أيام":"3 days ago",
"منذ 5 أيام":"5 days ago",
"آخر 7 أيام":"Last 7 days",
"آخر 30 يومًا":"Last 30 days",
"آخر 90 يومًا":"Last 90 days",
"هذا العام":"This year",
"هذا الشهر":"This month",
"هذا الأسبوع":"This week",
"يونيو":"June",
"يوليو":"July",
"أغسطس":"August",
"سبتمبر":"September",
"24 ساعة":"24 hours",
"48 ساعة":"48 hours",
"72 ساعة":"72 hours",
"12 ساعة":"12 hours",
"25 كم":"25 km",
"50 كم":"50 km",
"100 كم":"100 km",
"جنيه":"EGP",
"ك.ب":"KB",
"م.ب":"MB",
"الكل":"All",
"إزالة":"Remove",
"معالجة":"Process",
"تصفّح ←":"Browse →",
"عرض الكل ←":"View all →",
"كل السوق ←":"Full marketplace →",
"السجل الكامل ←":"Full log →",
"فتح الطابور ←":"Open queue →",
"مسح كل الفلاتر":"Clear all filters",
"الأكثر صلة":"Most relevant",
"حسب المدة":"By duration",
"متاح":"Available",
"متاح قريبًا على":"Coming soon on",
"ابدأ":"Start",
"إيقاف":"Pause",
"تعمل":"Operational",
"جاهز":"Ready",
"اختياري":"Optional",
"لا ينطبق":"N/A",
"تم التحقق":"Verified",
"قيد المعالجة":"Processing",
"متأخر":"Overdue",
"حفظ التغييرات":"Save changes",
"حفظ التغطية":"Save coverage",
"حفظ السجل":"Save record",
"دعوة":"Invite",
"الصلاحيات":"Permissions",
"مصفوفة الصلاحيات":"Permissions matrix",
"إدارة":"Manage",
"السيرة":"CV",
"واتساب":"WhatsApp",
"فيسبوك":"Facebook",
"لينكدإن":"LinkedIn",
"الموقع الإلكتروني":"Website",
"الصفة":"Title",
"اسم المسؤول":"Contact name",
"خط الطول":"Longitude",
"خط العرض":"Latitude",
"الإحداثيات:":"Coordinates:",
"التصنيف":"Classification",
"الجهة":"Entity",
"المستخدم":"User",
"العنصر":"Item",
"المنطقة":"Region",
"المهلة":"Deadline",
"مقدّم الطلب":"Applicant",
"الفجوة":"Gap",
"العبارة":"Query",
"تحويل":"Conversion",
"نسبة الرد":"Response rate",
"مواعيد العمل":"Working hours",
"نطاق التغطية":"Coverage area",
"نبذة عن الجهة":"About the entity",
"تاريخ الانضمام":"Joined",
"اكتمال الملف":"Profile completeness",
"حالة الملف":"Profile status",
"محتويات الصفحة":"Page contents",
"سنة بدء النشاط":"Year established",
"المعدات المعروفة":"Known equipment",
"صفحة التواصل":"Contact page",
"انضم للقائمة":"Join the list",
"💬 رد":"💬 Reply",
"🚩 إبلاغ":"🚩 Report",
"تقييم":"review",
"تقييم موثّق":"verified reviews",
"جهة":"entities",
"جهة مقدّمة":"providers offering",
"جهة مسجّلة ←":"registered entities →",
"سجل":"records",
"حدث":"events",
"عنصر":"items",
"مسّاح":"Surveyor",
"مسّاح أول":"Senior surveyor",
"مساعد مسّاح":"Assistant surveyor",
"مسّاح موقع — مشروع سكني":"Site surveyor — residential project",
"مسّاح أول — طرق":"Senior surveyor — roads",
"رسّام أوتوكاد":"AutoCAD draftsman",
"فني معايرة":"Calibration technician",
"محلل GIS":"GIS analyst",
"مسؤول ميداني":"Field supervisor",
"محاسب":"Accountant",
"مسؤول بيانات":"Data officer",
"دعم":"Support",
"وظيفة":"job",
"وظائف":"jobs",
"وظيفة: مسّاح أول":"Job: Senior surveyor",
"رفع مساحي":"Topographic survey",
"مسح ليزري":"Laser scanning",
"توقيع محاور":"Axis setting-out",
"مراقبة هبوط المنشآت":"Structural settlement monitoring",
"مساحة قانونية":"Legal survey",
"دعم التنفيذ":"Execution support",
"مراقبة دورية":"Periodic monitoring",
"خدمات فنية":"Technical services",
"صيانة":"Maintenance",
"بيع وتأجير":"Sale and rental",
"أجهزة":"Equipment",
"جهاز":"device",
"أجهزة ميزان":"Levelling instruments",
"إدراجات أجهزة":"Equipment listings",
"إدراج جهاز":"Equipment listing",
"مواقع وإحداثيات":"Locations and coordinates",
"خدمات":"Services",
"جيوماتكس":"Geomatics",
"مكاتب وشركات":"Offices and companies",
"مكاتب مساحة":"Survey offices",
"شركات مساحة":"Survey companies",
"موردو أجهزة":"Equipment suppliers",
"مراكز معايرة":"Calibration centres",
"تشغيل GNSS RTK ميدانيًا":"Operating GNSS RTK in the field",
"GNSS الميداني":"Field GNSS",
"AutoCAD للمساحين":"AutoCAD for surveyors",
"Civil 3D للمساحين":"Civil 3D for surveyors",
"عمليات بحث":"searches",
"بحث شهري":"monthly searches",
"نتائج متاحة":"results available",
"مسار التحويل":"Conversion funnel",
"إجراء بحث":"Perform a search",
"فتح ملف/إدراج":"Open profile/listing",
"إتمام الطلب":"Complete request",
"مصادر الزيارات":"Traffic sources",
"مباشر":"Direct",
"موبايل":"Mobile",
"كمبيوتر":"Desktop",
"تابلت":"Tablet",
"تغطية المحافظات":"Governorate coverage",
"أعلى الفئات طلبًا":"Top requested categories",
"أكثر عبارات البحث":"Top search queries",
"تأجير توتال ستيشن":"total station rental",
"مساح شغل حر":"freelance surveyor",
"جي بي اس مساحة":"survey gps",
"في الطابور":"In queue",
"تحتاج أولوية":"Need priority",
"تمت مراجعتها اليوم":"Reviewed today",
"أحداث اليوم":"Events today",
"تغييرات صلاحيات":"Permission changes",
"تحتاج انتباه":"Needs attention",
"كلها مُصرّح بها":"All authorised",
"كل المستخدمين":"All users",
"منح شارة":"Grant badge",
"عملاء نشطون":"Active clients",
"مستخدمون نشطون":"Active users",
"خدمة نشطة":"active services",
"إجمالي التقديمات":"Total applications",
"كل المصادر":"All sources",
"كل مستويات الخطورة":"All severity levels",
"النشاط الجغرافي":"Geographic activity",
"أحدث أحداث التدقيق":"Latest audit events",
"يبدأ من":"From",
"بيانات غير صحيحة":"Incorrect data",
"بيانات ناقصة":"Incomplete data",
"صور غير كافية":"Insufficient images",
"هاتف غير مؤكد":"Unconfirmed phone",
"أرقام هواتف غير مؤكدة":"Unconfirmed phone numbers",
"إدراجات بدون صور":"Listings without images",
"ملفات بدون نشاط 90 يومًا":"Profiles inactive for 90 days",
"تكرار محتمل":"Possible duplicate",
"تكرارات مرصودة":"Duplicates detected",
"تحتاج دمج":"Need merging",
"نمط مشبوه":"Suspicious pattern",
"مُبلَّغ عنه":"Reported",
"مُبلَّغ عنها":"Reported",
"بدون طلب مرتبط":"No linked request",
"مستخدم غير معروف":"Unknown user",
"فحص الجودة":"Quality check",
"فحص الأدلة":"Evidence check",
"معايير الجودة":"Quality criteria",
"اسم تجاري واضح":"Clear trade name",
"وسيلة تواصل مؤكدة":"Confirmed contact method",
"بانتظار التحقق":"Awaiting verification",
"سجلات مُدخلة هذا الشهر":"Records entered this month",
"زيارة ميدانية":"Field visit",
"مكالمة هاتفية":"Phone call",
"لم يُؤكد بعد":"Not yet confirmed",
"ملاحظات المُدخِل":"Entry notes",
"الهوية":"Identity",
"التواصل":"Contact",
"النشاط":"Activity",
"التحقق":"Verification",
"إخفاء تقييم مشبوه":"Hide suspicious review",
"رفض إدراج":"Reject listing",
"منح شارة توثيق":"Grant verification badge",
"استيراد سجلات":"Import records",
"طلب تعديلات":"Request changes",
"مغلق":"Closed",
"مغلق — ناجح":"Closed — won",
"للعملاء":"For clients",
"للمكاتب والشركات والموردين":"For offices, companies and suppliers",
"ابحث وحدّد موقعك":"Search and set your location",
"قارن بثقة":"Compare with confidence",
"اتفق ونفّذ":"Agree and execute",
"النشر والظهور":"Publish and appear",
"محافظة مستهدفة للتغطية":"target governorates",
"مكتب وشركة مسجّلة":"registered offices and companies",
"أكثر من 40":"Over 40",
"تحسّن":"improved",
"نقطة":"pts",

/* ---------- batch 4: admin surfaces ---------- */
"تحليلات المنصة وذكاء السوق":"Platform analytics & market intelligence",
"سلوك الطلب والعرض عبر المحافظات والفئات — أساس قرارات النمو والاستقطاب.":"Demand and supply behaviour across governorates and categories — the basis for growth and recruitment decisions.",
"مزوّدون نشطون":"Active providers",
"معدل الاحتفاظ بالمزوّد":"Provider retention rate",
"مزوّدون جدد":"New providers",
"نمو المنصة — 12 أسبوعًا":"Platform growth — 12 weeks",
"نمو الطلبات — 12 أسبوعًا":"Request growth — 12 weeks",
"هدف 2027: 15":"2027 target: 15",
"تأجير GNSS / RTK":"GNSS / RTK rental",
"Total Station للبيع":"Total Station for sale",
"معايرة أجهزة مساحة":"survey instrument calibration",
"فجوات العرض — فرص استقطاب":"Supply gaps — recruitment opportunities",
"طلب مرتفع مقابل عرض ضعيف أو معدوم.":"High demand against weak or absent supply.",
"صحة السوق حسب المحافظة":"Market health by governorate",
"زيارة المنصة":"Visit the platform",
"بدء طلب تواصل":"Start a contact request",
"بحث Google":"Google search",
"إحالة من مزوّد":"Provider referral",
"الأجهزة المستخدمة":"Devices used",
"71% من الاستخدام على الموبايل — أولوية استمرار تحسين تجربة الهاتف وإطلاق التطبيق.":"71% of usage is on mobile — continuing to improve the phone experience and launching the app remain a priority.",
"لا يُنشر أي عنصر قبل المراجعة. كل قرار (اعتماد / تعديل / رفض) يُسجَّل في سجل التدقيق بالفاعل والزمن.":"Nothing is published before review. Every decision (approve / amend / reject) is recorded in the audit log with actor and timestamp.",
"👥 توزيع الطابور":"👥 Queue distribution",
"▶ بدء المراجعة المتسلسلة":"▶ Start sequential review",
"متوسط زمن المراجعة":"Avg. review time",
"ملفات مزوّدين":"Provider profiles",
"تعديل ملف":"Profile edit",
"FARO Focus 3D — للإيجار":"FARO Focus 3D — for rent",
"الغرب للخدمات المساحية — تحديث":"Al Gharb Survey Services — update",
"لا تُمنح شارة توثيق إلا بما تمّت مراجعته فعليًا. الاعتماد يعني اكتمال البيانات ووضوحها، ولا يعني اعتمادًا فنيًا لجودة الأعمال أو حالة الأجهزة.":"A verification badge is granted only for what has actually been reviewed. Approval means the data is complete and clear; it does not imply technical accreditation of work quality or instrument condition.",
"بحث بالعنصر أو مقدّم الطلب…":"Search by item or applicant…",
"بحث بالكيان أو المستخدم…":"Search by entity or user…",
"بحث بالاسم أو الهاتف أو البريد…":"Search by name, phone or email…",
"بحث بالاسم أو المدينة…":"Search by name or city…",
"بحث بالاسم أو البريد…":"Search by name or email…",
"بحث بالجهاز أو المالك…":"Search by device or owner…",
"بحث بالوظيفة أو الجهة…":"Search by job or employer…",
"بحث بالعميل أو المزوّد…":"Search by client or provider…",
"بحث باسم الملف…":"Search by file name…",
"بحث في خدمة…":"Search services…",
"كل إجراء إداري مسجَّل بالفاعل والكيان والقيمة قبل وبعد والزمن — غير قابل للتعديل أو الحذف.":"Every admin action is recorded with actor, entity, before/after value and timestamp — immutable and undeletable.",
"⬇ تصدير السجل":"⬇ Export log",
"قرارات اعتماد/رفض":"Approve/reject decisions",
"عمليات تصدير بيانات":"Data export operations",
"كل الإجراءات":"All actions",
"تعديل إعدادات":"Settings change",
"كل الكيانات":"All entities",
"سجل التدقيق غير قابل للتعديل أو الحذف من داخل المنصة. يُحتفظ بالسجلات وفق سياسة الاحتفاظ المعتمدة، وتُخزَّن عناوين IP بصيغة مُجزّأة (hash) حفاظًا على الخصوصية.":"The audit log cannot be edited or deleted from within the platform. Records are retained per the approved retention policy, and IP addresses are stored hashed to protect privacy.",
"كل الجهات والأفراد الطالبين للخدمة — إضافة وتعديل ودمج التكرار وأرشفة، مع تسجيل كامل في سجل التدقيق.":"All entities and individuals requesting service — add, edit, merge duplicates and archive, with full audit logging.",
"إجمالي الطلبات":"Total requests",
"الخدمات والدورات والوظائف والتقييمات والطلبات — إضافة وتعديل وحذف من مكان واحد.":"Services, courses, jobs, reviews and requests — add, edit and delete from one place.",
"➕ إضافة خدمة":"➕ Add service",
"🎓 الدورات":"🎓 Courses",
"📥 الطلبات":"📥 Requests",
"إجمالي المحتوى المنشور":"Total published content",
"عبر كل الأنواع":"Across all types",
"نظرة عامة على المنصة":"Platform overview",
"حالة التشغيل اليومي — طابور المراجعة، نمو السوق، وجودة البيانات.":"Daily operating status — review queue, market growth and data quality.",
"⬇ تقرير الحالة":"⬇ Status report",
"بانتظار الاعتماد":"Awaiting approval",
"3 متأخرة عن الـSLA":"3 past SLA",
"تنبيهات جودة بيانات":"Data quality alerts",
"تنبيهات جودة البيانات":"Data quality alerts",
"تحتاج مراجعة":"Need review",
"طلبات بلا رد >24س":"Requests unanswered >24h",
"طلبات بلا رد":"Unanswered requests",
"طابور الاعتماد — الأقدم أولًا":"Approval queue — oldest first",
"توزيع المزوّدين حسب النوع":"Provider distribution by type",
"مراكز تدريب":"Training centres",
"ملفات مكررة محتملة":"Possible duplicate profiles",
"سجلات معايرة منتهية":"Expired calibration records",
"فجوات السوق — طلب بلا عرض كافٍ":"Market gaps — demand without sufficient supply",
"مناطق وفئات عليها بحث مرتفع وعدد مزوّدين منخفض — فرص استقطاب.":"Areas and categories with high search volume and few providers — recruitment opportunities.",
"تجميع البيانات الميدانية":"Field data collection",
"إدخال منظّم لبناء قاعدة السوق قبل انتشار التسجيل الذاتي — مع فحص تكرار تلقائي.":"Structured entry to build the market base before self-registration spreads — with automatic duplicate checking.",
"معدل اكتمال البيانات":"Data completeness rate",
"سجل جهة جديدة":"New entity record",
"العنوان التفصيلي":"Detailed address",
"الخدمات المقدّمة":"Services offered",
"مصدر البيانات":"Data source",
"مصدر عام منشور":"Published public source",
"ترشيح من مزوّد":"Provider referral",
"حالة التحقق من الهاتف":"Phone verification status",
"تم التأكيد بمكالمة":"Confirmed by call",
"الرقم غير عامل":"Number not working",
"حفظ كمسودة":"Save as draft",
"محافظة ومدينة":"Governorate and city",
"إحداثيات":"Coordinates",
"ناقص":"Missing",
"خدمة واحدة على الأقل":"At least one service",
"مصدر بيانات موثّق":"Documented data source",
"اكتمال السجل الحالي":"Current record completeness",
"آخر السجلات المُدخلة":"Latest entered records",
"جيو لاين للتوريدات":"GeoLine Supplies",
"لا تُدخل بيانات جهة دون تفويض أو مصدر عام مشروع. البيانات المُجمّعة ميدانيًا تخضع لنفس سياسة الخصوصية.":"Do not enter an entity's data without authorisation or a legitimate public source. Field-collected data is subject to the same privacy policy.",
"رفع مساحي، تقسيم، تأجير أجهزة، معايرة…":"Topographic survey, subdivision, equipment rental, calibration…",
"اذكر ما تم التحقق منه فعليًا فقط — لا تُدرج انطباعات أو ادعاءات غير مؤكدة":"State only what was actually verified — do not include impressions or unconfirmed claims",
"إدارة إدراجات الأجهزة":"Equipment listing management",
"إضافة وتعديل وحذف الأجهزة المعروضة للبيع والإيجار، مع ضبط حالة المعايرة لكل جهاز.":"Add, edit and delete equipment listed for sale and rent, and set the calibration status of each device.",
"👁️ عرض في السوق":"👁️ View in marketplace",
"إدراجات منشورة":"Published listings",
"لا تُعرض كسارية":"Not shown as valid",
"كل حالات المعايرة":"All calibration statuses",
"نقل البيانات بالجملة مع تحقق من الصيغة وفحص تكرار قبل الإدراج الفعلي.":"Bulk data transfer with format validation and duplicate checking before actual insertion.",
"استيراد بيانات":"Import data",
"تصدير بيانات":"Export data",
"ارفع ملف CSV أو XLSX وفق القالب المعتمد. لا يُدرج أي سجل قبل اجتياز التحقق.":"Upload a CSV or XLSX file matching the approved template. No record is inserted before passing validation.",
"📁 اسحب الملف هنا أو اضغط للاختيار":"📁 Drag the file here or click to choose",
"CSV / XLSX — حتى 5,000 سجل لكل عملية":"CSV / XLSX — up to 5,000 records per operation",
"تشغيل فحص التكرار قبل الإدراج":"Run duplicate check before insertion",
"إرسال كل السجلات لطابور المراجعة (عدم النشر المباشر)":"Send all records to the review queue (no direct publishing)",
"تحديث السجلات القائمة عند تطابق المعرّف":"Update existing records when the ID matches",
"▶ بدء التحقق":"▶ Start validation",
"⬇ تنزيل القالب":"⬇ Download template",
"تصدير مُقيَّد ومسجَّل — كل عملية تصدير تظهر في سجل التدقيق.":"Restricted and logged export — every export appears in the audit log.",
"الصيغة":"Format",
"من تاريخ":"From date",
"إلى تاريخ":"To date",
"إخفاء بيانات الاتصال الشخصية (تصدير مُجهَّل)":"Mask personal contact data (anonymised export)",
"تصدير بيانات تحتوي على معلومات اتصال شخصية يتطلب صلاحية «مدير النظام» ويُسجَّل باسم المُصدِّر.":"Exporting data containing personal contact information requires System administrator permission and is logged under the exporter's name.",
"تصدير الآن":"Export now",
"سجل عمليات النقل":"Transfer operations log",
"العملية":"Operation",
"السجلات":"Records",
"الوظائف تُنشر بعد التأكد من وضوح المسمى والوصف والمتطلبات وعدم وجود شروط تمييزية.":"Jobs are published after confirming the title, description and requirements are clear and that no discriminatory conditions exist.",
"مرفوضة هذا الشهر":"Rejected this month",
"بيانات غير كافية":"Insufficient data",
"راتب غير محدد":"Salary not specified",
"مطلوب مسّاحين — تفاصيل ناقصة":"Surveyors wanted — details missing",
"وصف غير كافٍ":"Insufficient description",
"مراقبة جودة الطلبات وسرعة استجابة المزوّدين ورصد التكرار والحسابات المشبوهة.":"Monitoring request quality, provider response speed, duplicates and suspicious accounts.",
"بلا رد > 24 ساعة":"Unanswered > 24 hours",
"تحتاج متابعة":"Need follow-up",
"2.1% من الإجمالي":"2.1% of total",
"▲ 3 نقاط":"▲ 3 pts",
"▲ 0.6 نقطة":"▲ 0.6 pts",
"أسرع المزوّدين استجابة":"Fastest responding providers",
"مزوّدون بطيئو الاستجابة — يحتاجون تنبيه":"Slow-responding providers — need alerting",
"متوسط الرد":"Avg. response",
"الغرب للخدمات":"Al Gharb Services",
"كل التنبيهات":"All alerts",
"بلا رد >24س":"Unanswered >24h",
"تكرار":"Duplicate",
"رفع مساحي 6 أفدنة":"Topographic survey of 6 feddans",
"تأجير GNSS أسبوع":"GNSS rental for a week",
"شراء Total Station":"Total Station purchase",
"بلا رد 31 ساعة":"No reply for 31 hours",
"مسح طرق 12 كم":"12 km road survey",
"طلب مكرر":"Duplicate request",
"تكرار مؤكد":"Confirmed duplicate",
"حساب مشبوه":"Suspicious account",
"استفسار غير واضح":"Unclear enquiry",
"كل صور المنصة في مكان واحد — رفع واستبدال وحذف، مع معرفة أماكن الاستخدام قبل أي حذف.":"All platform images in one place — upload, replace and delete, knowing where each is used before deleting.",
"➕ إضافة يدويًا":"➕ Add manually",
"ملفات نشطة":"Active files",
"صيغ مدعومة":"Supported formats",
"ضغط تلقائي":"Auto-compression",
"رفع متعدد — تُضغط وتُخزَّن فورًا وتصبح متاحة لكل نماذج المنصة":"Multi-upload — compressed and stored instantly, then available to every form on the platform",
"مكتب وفريق GIS":"Office and GIS team",
"فريق ميداني — Total Station":"Field crew — Total Station",
"جهاز Total Station":"Total Station device",
"جهاز GNSS":"GNSS device",
"مسح ميداني":"Field survey",
"إضافة وتعديل وأرشفة وحذف أي جهة — التغييرات تظهر فورًا في الدليل والبحث والخريطة على الموقع العام.":"Add, edit, archive and delete any entity — changes appear instantly in the directory, search and map on the public site.",
"موثّقون بالكامل":"Fully verified",
"ظهور مميّز":"Featured placement",
"موسوم دائمًا":"Always labelled",
"البلاغات الواردة":"Incoming reports",
"بلاغات المستخدمين والفحص الآلي — تُعالج وفق الأولوية ويُسجَّل كل قرار.":"User reports and automated checks — handled by priority with every decision logged.",
"بلاغات جديدة":"New reports",
"متوسط زمن المعالجة":"Avg. handling time",
"ضمن SLA 48 ساعة":"Within 48-hour SLA",
"تم حلها هذا الشهر":"Resolved this month",
"كل الأولويات":"All priorities",
"سبب البلاغ":"Report reason",
"نوع الكيان":"Entity type",
"المُبلِّغ":"Reporter",
"الأولوية":"Priority",
"الجهة غير موجودة":"Entity does not exist",
"مكتب النور للمساحة":"Al Nour Survey Office",
"مستخدم مجهول":"Anonymous user",
"محتوى مخالف":"Violating content",
"ملف مكرر":"Duplicate profile",
"نظام آلي":"Automated system",
"سلوك غير مهني":"Unprofessional conduct",
"مستخدم مسجّل":"Registered user",
"مغلق — تم الحل":"Closed — resolved",
"التقييم يجب أن يستند لتفاعل حقيقي. المزوّد لا يستطيع حذف أي تقييم، والإدارة تتدخل فقط بقرار موثّق.":"A review must be based on a genuine interaction. Providers cannot delete any review, and admins intervene only by documented decision.",
"تحتاج قرار":"Need a decision",
"مؤشر خطورة":"Risk indicator",
"مؤشر الخطورة":"Risk indicator",
"تم إخفاؤها هذا الشهر":"Hidden this month",
"بقرار موثّق":"By documented decision",
"1-2 نجوم":"1-2 stars",
"5 نجوم":"5 stars",
"كل المؤشرات":"All indicators",
"المُقيِّم":"Reviewer",
"حساب جديد":"New account",
"ضبط قواعد التشغيل والمراجعة والترتيب — كل تغيير يُسجَّل في سجل التدقيق.":"Configure operating, review and ranking rules — every change is recorded in the audit log.",
"قواعد المراجعة والنشر":"Review and publishing rules",
"مهلة مراجعة ملف المزوّد":"Provider profile review SLA",
"مهلة مراجعة إدراج جهاز":"Equipment listing review SLA",
"منع النشر التلقائي — كل عنصر يمر بمراجعة بشرية":"Block auto-publishing — every item passes human review",
"رفض تلقائي للإدراجات التي تعرض معايرة منتهية كسارية":"Auto-reject listings presenting an expired calibration as valid",
"تشغيل فحص التكرار عند كل تسجيل جديد":"Run duplicate check on every new registration",
"السماح بالنشر التلقائي للمزوّدين ذوي التوثيق المتقدّم":"Allow auto-publishing for providers with advanced verification",
"قواعد الطلبات والمطابقة":"Request and matching rules",
"مهلة رد المزوّد (SLA)":"Provider response SLA",
"عدد المزوّدين لكل طلب احتياج":"Providers per need request",
"نصف قطر المطابقة الافتراضي":"Default matching radius",
"إعادة توجيه الطلب بلا رد بعد":"Reroute unanswered request after",
"لا يُعاد توجيهه":"Never reroute",
"استبعاد المزوّدين الموقوفين من المطابقة تلقائيًا":"Automatically exclude suspended providers from matching",
"خفض ترتيب المزوّدين ذوي نسبة الرد أقل من 60%":"Down-rank providers with a response rate below 60%",
"أوزان ترتيب نتائج البحث":"Search result ranking weights",
"مجموع الأوزان يجب ألا يمنح الظهور المدفوع أفضلية على الصلة والثقة.":"The weight total must never give paid placement an advantage over relevance and trust.",
"مطابقة الفئة والخدمة":"Category and service match",
"القرب الجغرافي":"Geographic proximity",
"مستوى التوثيق":"Verification level",
"سرعة الرد":"Response speed",
"الظهور المميّز (موسوم)":"Featured placement (labelled)",
"وزن الظهور المدفوع مُقيَّد بحد أقصى 10% بموجب سياسة المنصة، ويظل الإعلان موسومًا بشارة «مميّز» دائمًا.":"Paid placement weight is capped at 10% by platform policy, and the ad always keeps its «Featured» badge.",
"سياسة التوثيق والتقييمات":"Verification and review policy",
"ربط التقييم بطلب تواصل حقيقي قبل النشر":"Link a review to a genuine contact request before publishing",
"منع المزوّد من حذف أو تعديل التقييمات":"Prevent providers from deleting or editing reviews",
"إخفاء تلقائي للتقييمات المُبلَّغ عنها لحين المراجعة":"Auto-hide reported reviews pending review",
"مراجعة دورية للشارات كل 12 شهرًا":"Periodic badge review every 12 months",
"إظهار متوسط التقييم فقط بعد 3 تقييمات موثّقة":"Show the average rating only after 3 verified reviews",
"حالة النظام":"System status",
"واجهة الموقع":"Website front end",
"واجهة API":"API",
"فهرس البحث":"Search index",
"خدمة الإشعارات":"Notification service",
"بطء مؤقت":"Temporary slowdown",
"خدمة الخرائط":"Map service",
"آخر فحص: اليوم 09:40":"Last check: today 09:40",
"إصدار المنصة: 1.0.0":"Platform version: 1.0.0",
"التغطية الجغرافية المفعّلة":"Active geographic coverage",
"البيانات محفوظة محليًا في هذا المتصفح. صدّرها لنقلها لجهاز آخر أو للنسخ الاحتياطي.":"Data is stored locally in this browser. Export it to move to another device or to back up.",
"المساحة المستخدمة":"Space used",
"وضع الصيانة":"Maintenance mode",
"يعرض صفحة صيانة للزوار مع إبقاء البوابات متاحة للفريق.":"Shows a maintenance page to visitors while keeping the portals available to the team.",
"تفعيل وضع الصيانة":"Enable maintenance mode",
"إدارة المستخدمين":"User management",
"إدارة فريق التشغيل وحسابات المزوّدين — إضافة وتعديل وإيقاف وحذف، وضبط ما يستطيع كل دور فعله.":"Manage the operations team and provider accounts — add, edit, suspend and delete, and set what each role can do.",
"مديرو نظام":"System administrators",
"صلاحية كاملة":"Full permission",
"محاولات دخول فاشلة":"Failed login attempts",
"آخر 24 ساعة":"Last 24 hours",
"ما يستطيع كل دور فعله داخل لوحة الإدارة.":"What each role can do inside the admin panel.",
"عرض لوحة الإدارة":"View admin panel",
"اعتماد ورفض المحتوى":"Approve and reject content",
"إضافة وتعديل البيانات":"Add and edit data",
"حذف نهائي للسجلات":"Permanently delete records",
"منح وسحب شارات التوثيق":"Grant and revoke verification badges",
"إدارة المستخدمين والصلاحيات":"Manage users and permissions",
"تصدير بيانات شخصية":"Export personal data",
"الرد على البلاغات":"Respond to reports",
"منح الشارات مبني على أدلة مراجَعة فعليًا. لا تُمنح شارة بناءً على ادعاء المزوّد وحده.":"Badges are granted on genuinely reviewed evidence. No badge is granted on a provider's claim alone.",
"📄 سياسة التوثيق":"📄 Verification policy",
"طلبات توثيق معلّقة":"Pending verification requests",
"المستوى الأساسي":"Base level",
"أدلة إضافية مراجَعة":"Additional reviewed evidence",
"أدلة على معدات بعينها":"Evidence for specific equipment",
"مستويات التوثيق ومعاييرها":"Verification levels and criteria",
"التوثيق والشارات":"Verification and badges",
"طلبات التواصل والاحتياجات":"Contact requests and needs",
"التقييمات والمراجعات":"Ratings and reviews",

/* ---------- batch 3 ---------- */
"الهاتف الرئيسي":"Primary phone",
"رقم الهاتف":"Phone number",
"المدينة / الحي":"City / district",
"حفظ وإرسال للمراجعة":"Save and send for review",
"صاحب المكتب / مدير":"Office owner / manager",
"ملحقات وقطع غيار":"Accessories and spare parts",
"ملحقات وحوامل":"Accessories and tripods",
"نوع البيانات":"Data type",
"دورات تدريبية":"Training courses",
"وظائف منشورة":"Published jobs",
"مكرر / غير صالح":"Duplicate / invalid",
"تقييمات هذا الشهر":"Reviews this month",
"كل التقييمات":"All reviews",
"كل الوظائف ←":"All jobs →",
"نوع العرض":"Listing type",
"أساسيات GIS باستخدام QGIS":"GIS fundamentals with QGIS",
"مشغّل طائرات مسح جوي":"Aerial survey drone operator",
"فني معايرة وصيانة أجهزة":"Calibration & maintenance technician",
"موظف مبيعات":"Sales representative",
"ملف مميّز":"Featured profile",
"جهاز مميّز":"Featured equipment",
"طلب احتياج موجّه":"Routed need request",
"＋ إضافة جهاز":"＋ Add equipment",
"التقييم العام":"Overall rating",
"صندوق طلبات التواصل":"Contact request inbox",
"حصر كميات وأعمال ترابية":"Quantity take-off and earthworks",
"طلب تواصل جديد من شركة أوركيد للتطوير":"New contact request from Orchid Development",
"تم اعتماد إدراج Trimble R12i ونشره":"Trimble R12i listing approved and published",
"مكتب متخصص في أعمال المساحة الأرضية والتقسيم وأعمال GIS، يخدم الإسكندرية والمحافظات المجاورة بفريق ميداني وأجهزة Leica وTopcon.":"An office specialised in land surveying, subdivision and GIS work, serving Alexandria and neighbouring governorates with a field crew and Leica and Topcon instruments.",
"دقة ممتازة في الرفع وتسليم في الموعد المتفق عليه، والتعامل مهني جدًا مع الملاحظات.":"Excellent survey accuracy, delivered on the agreed date, and very professional handling of comments.",
"تعاملنا معهم في مشروعين، الالتزام والدقة على مستوى عالٍ.":"We worked with them on two projects — commitment and accuracy were of a high standard.",
"خدمة جيدة، كان في تأخير بسيط بسبب ظروف الموقع لكن النتيجة النهائية ممتازة.":"Good service. There was a slight delay due to site conditions but the final result was excellent.",
"لأي استفسار بخصوص هذه الوثيقة، تواصل معنا عبر":"For any enquiry regarding this document, contact us via",
"البيانات التي نجمعها":"Data we collect",
"بيانات الموقع الجغرافي":"Geolocation data",
"كيف نستخدم بياناتك":"How we use your data",
"مشاركة البيانات":"Data sharing",
"مقدمو الخدمات":"Service providers",
"ملفات تعريف الارتباط":"Cookies",
"مدة الاحتفاظ":"Retention period",
"حقوقك":"Your rights",
"أمن المعلومات":"Information security",
"خصوصية الأطفال":"Children's privacy",
"التحديثات":"Updates",
"طبيعة المنصة":"Nature of the platform",
"الحسابات والتسجيل":"Accounts and registration",
"محتوى المزوّدين":"Provider content",
"الظهور المدفوع والإعلانات":"Paid placement and advertising",
"الاستخدام المحظور":"Prohibited use",
"الملكية الفكرية":"Intellectual property",
"حدود المسؤولية":"Limitation of liability",
"القانون الواجب التطبيق":"Governing law",
"محتويات الصفحة":"Page contents",
"الشروط":"Terms",

/* ---------- sentences & templates ---------- */
"Geo Station — نموذج تشغيلي · Concept, UX/UI & Platform Architecture by":"Geo Station — operating prototype · Concept, UX/UI & Platform Architecture by",
"⏱ يرد خلال ساعة":"⏱ Replies within an hour",
"⏱ يرد خلال ساعتين":"⏱ Replies within 2 hours",
"⏱ يرد خلال 3 ساعات":"⏱ Replies within 3 hours",
"⏱ يرد خلال 4 ساعات":"⏱ Replies within 4 hours",
"⏱ يرد خلال يومين":"⏱ Replies within 2 days",
"⏱ يرد خلال يوم":"⏱ Replies within a day",
"موديل 2025":"Model 2025",
"موديل 2023":"Model 2023",
"موديل 2022":"Model 2022",
"موديل 2021":"Model 2021",
"موديل 2019":"Model 2019",
"جديد • 2025":"New • 2025",
"مستعمل — جيد جدًا":"Used — very good",
"محجوز حتى 12/09":"Reserved until 12/09",
"Topcon GT-1200 روبوتيك":"Topcon GT-1200 Robotic",
"طقم GNSS RTK — Stonex S900":"GNSS RTK kit — Stonex S900",
"Trimble R12i — للإيجار":"Trimble R12i — for rent",
"29 ك.ب / 5 م.ب":"29 KB / 5 MB",
"كل ما تحتاجه في عالم المساحة،":"Everything you need in surveying,",
"في منصة واحدة.":"in one platform.",
"◎ المنصة الرقمية المتخصصة لقطاع المساحة — مصر":"◎ The dedicated digital platform for surveying — Egypt",
"مكاتب وشركات المساحة، أجهزة للبيع والإيجار، مراكز معايرة وصيانة، خدمات ميدانية، دورات تدريبية وفرص عمل — كلها في مكان واحد.":"Survey offices and companies, equipment for sale and rent, calibration and maintenance centres, field services, training courses and job opportunities — all in one place.",
"بحث شائع:":"Popular searches:",
"🔍 بحث":"🔍 Search",
"جهاز معروض للبيع والإيجار":"instruments listed for sale and rent",
"طلب تواصل تم توليده":"contact requests generated",
"ابدأ من الفئة التي تناسب احتياجك":"Start from the category that fits your need",
"ستة مسارات رئيسية تغطي منظومة المساحة كاملة — من الجهة المنفّذة حتى الجهاز والتدريب والوظيفة.":"Six main tracks covering the entire surveying ecosystem — from the executing entity to the instrument, the training and the job.",
"كل الدليل ←":"Full directory →",
"كل السوق ←":"Full marketplace →",
"كل الخدمات ←":"All services →",
"Total Station وGNSS وScanners وDrones للبيع أو الإيجار.":"Total Stations, GNSS, scanners and drones for sale or rent.",
"عرض متاح ←":"listings available →",
"وظيفة متاحة ←":"jobs available →",
"جهة مسجّلة ←":"registered entities →",
"فرص للمسّاحين والمساعدين ومحللي GIS والفنيين.":"Opportunities for surveyors, assistants, GIS analysts and technicians.",
"الأكثر طلبًا":"Most requested",
"مكاتب وشركات مميّزة":"Featured offices and companies",
"الظهور المميّز موضّح دائمًا بشارة، ولا يلغي معايير الصلة والتقييم والتوثيق.":"Featured placement is always marked with a badge and never overrides relevance, rating and verification criteria.",
"عرض كل المزوّدين ←":"View all providers →",
"بيع أجهزة جديدة":"New equipment sales",
"تأجير قصير وطويل المدى":"Short and long term rental",
"قطع غيار وملحقات":"Spare parts and accessories",
"أجهزة معروضة للبيع والإيجار":"Equipment listed for sale and rent",
"مع بيانات الحالة والموديل وحالة المعايرة كما وردت من المزوّد.":"With condition, model and calibration status data as provided by the provider.",
"من البحث إلى التواصل في أربع خطوات":"From search to contact in four steps",
"اكتب ما تحتاجه واختر المحافظة، أو استخدم «بالقرب مني» للحصول على الأقرب.":"Type what you need and pick a governorate, or use «Near me» to get the closest.",
"راجع الخدمات والأجهزة والتقييمات ومستوى التوثيق وزمن الرد لكل جهة.":"Review services, equipment, ratings, verification level and response time for each entity.",
"اطلب تواصل":"Request contact",
"تُنشئ المنصة طلبًا موثّقًا ويصل فورًا لصندوق المزوّد المناسب.":"The platform creates a documented request that reaches the right provider's inbox instantly.",
"الاتفاق والتنفيذ يتمّان مباشرة بينك وبين الجهة، ثم تقيّم التجربة.":"Agreement and execution happen directly between you and the entity, then you rate the experience.",
"تفاصيل أكثر عن آلية العمل":"More detail on how it works",
"خدمات مساحية يقدّمها شركاء المنصة":"Survey services offered by platform partners",
"اختر الخدمة لعرض الجهات القادرة على تنفيذها داخل نطاقك الجغرافي.":"Pick a service to see the entities able to deliver it in your area.",
"تعلّم واتقن أدوات المهنة":"Learn and master the tools of the trade",
"دورات تطبيقية من مراكز تدريب شريكة.":"Hands-on courses from partner training centres.",
"رفع تفصيلي للمناسيب ومعالم الموقع وإخراج خرائط كنتورية ومقاطع طولية وعرضية.":"Detailed levelling and site-feature survey producing contour maps and longitudinal/cross sections.",
"توثيق المنشآت القائمة بسحابة نقاط عالية الكثافة وإنتاج مخططات As-Built ونماذج BIM.":"Documenting existing structures with a high-density point cloud, producing As-Built drawings and BIM models.",
"تغطية جوية سريعة للمساحات الكبيرة مع إنتاج أورثوفوتو ونماذج ارتفاع رقمية.":"Rapid aerial coverage of large areas producing orthophotos and digital elevation models.",
"إعداد مخططات التقسيم والفرز وحساب المساحات وتجهيز المستندات المساحية المطلوبة.":"Preparing subdivision plans, computing areas and assembling the required survey documents.",
"جهة مقدّمة":"providers offering",
"إنشاء السطوح والمحاور والمقاطع وحساب الكميات على مشروع طريق كامل من البداية للتسليم.":"Building surfaces, alignments and sections and computing quantities on a complete road project from start to handover.",
"ضبط Base وRover، الاتصال بشبكات التصحيح، الرفع والتوقيع، ومعالجة الأخطاء الشائعة.":"Setting up base and rover, connecting to correction networks, surveying and setting-out, and handling common errors.",
"من التحميل الخام إلى الرسم النهائي: التصحيحات، الإغلاق، وضبط الشبكات.":"From raw download to final drawing: corrections, closure and network adjustment.",
"بناء طبقات مكانية، الترميز، التحليل المكاني، وإخراج خرائط احترافية.":"Building spatial layers, symbology, spatial analysis and producing professional maps.",
"معالجة بيانات Total Station":"Total Station data processing",
"دورة: المسح الجوي المتقدم":"Course: Advanced aerial survey",
"دورة تدريبية":"Training course",
"محلل نظم معلومات جغرافية GIS":"GIS analyst",
"مسؤول عن الرفع المساحي وتوقيع المحاور ومتابعة أعمال التنفيذ اليومية بالموقع وإعداد التقارير الدورية.":"Responsible for topographic survey, axis setting-out, daily on-site execution follow-up and periodic reporting.",
"إعداد قواعد بيانات مكانية وخرائط تحليلية للمشروعات ودعم فرق التصميم بالبيانات الجغرافية.":"Building spatial databases and analytical maps for projects and supporting design teams with geographic data.",
"دعم فريق الرفع الميداني وتجهيز المعدات ومساعدة المسّاح في القياسات والتوقيع.":"Supporting the field survey crew, preparing equipment and assisting the surveyor with measurements and setting-out.",
"تخطيط وتنفيذ طلعات المسح الجوي ومعالجة الصور وإنتاج المخرجات النهائية.":"Planning and flying aerial survey missions, processing imagery and producing final deliverables.",
"فحص ومعايرة أجهزة المساحة وإصلاح الأعطال وإعداد التقارير الفنية للعملاء.":"Inspecting and calibrating survey instruments, repairing faults and preparing technical reports for clients.",
"🕒 منذ يومين • 💰 يُحدد بعد المقابلة":"🕒 2 days ago • 💰 Set after interview",
"🕒 منذ 3 أيام • 💰 يُحدد بعد المقابلة":"🕒 3 days ago • 💰 Set after interview",
"🕒 منذ 4 أيام • 💰 تنافسي":"🕒 4 days ago • 💰 Competitive",
"🕒 منذ 5 أيام • 💰 بالطلعة":"🕒 5 days ago • 💰 Per flight",
"🕒 منذ أسبوع • 💰 يومية + بدل انتقال":"🕒 1 week ago • 💰 Daily rate + travel allowance",
"خبرة 3-5 سنوات":"3-5 years experience",
"خبرة 2-4 سنوات":"2-4 years experience",
"خبرة سنتان فأكثر":"2+ years experience",
"خبرة سنة فأكثر":"1+ year experience",
"خبرة 3 سنوات":"3 years experience",
"معايرة أجهزة الميزان":"Level instrument calibration",
"صيانة وإصلاح":"Maintenance and repair",
"معايرة شاملة":"Full calibration",
"إصلاح لوحات إلكترونية":"Electronic board repair",
"ضبط دقة الزوايا":"Angular accuracy adjustment",
"مسح طرق ومحاور":"Road and alignment survey",
"معايرة وصيانة":"Calibration and maintenance",
"GNSS للإيجار":"GNSS for rent",
"تأجير GNSS RTK لمدة أسبوع":"GNSS RTK rental for one week",
"رفع مساحي 6 أفدنة — برج العرب":"Topographic survey of 6 feddans — Borg El Arab",
"تقسيم أرض 12 فدان":"Subdivision of 12 feddans",
"مسح ليزري لمنشأة صناعية":"Laser scan of an industrial facility",
"ملف المزوّد":"Provider profile",
"طلبات تواصل":"Contact requests",
"متوسط أول رد":"Avg. first response",
"تعليم طلب كمكرر":"Flag request as duplicate",
"مؤرشفون":"Archived",
"مؤرشفة":"Archived",
"نوع التعاقد":"Contract type",
"نسبة الإغلاق الناجح":"Win rate",
"حجم الفريق":"Team size",
"نقرات":"Clicks",
"ظهور":"Impressions",
"مشاهدات":"Views",
"تنفيذ ←":"Execute →",
"إتمام":"Complete",
"التقديمات":"Applications",
"✔ تم الرد":"✔ Replied",
"ردّك:":"Your reply:",
"إلغاء الوصول":"Revoke access",
"متأخرة عن SLA":"Past SLA",
"مزوّدون منشورون":"Published providers",
"الاسم القانوني":"Legal name",
"تحويل بحث ← طلب":"Search → request conversion",
"صورة • — • 2026-06-01":"Image • — • 2026-06-01",
"شكرًا لثقتكم، سعدنا بالتعاون ونتطلع لخدمتكم في مشروعات قادمة.":"Thank you for your trust — it was a pleasure working together and we look forward to serving you on future projects.",
"مثال: مكتب الأمانة للمساحة":"e.g. Al Amana Survey Office",
"ابحث عن جهاز، مكتب، خدمة، أو تخصص...":"Search for equipment, an office, a service or a speciality...",
};


/* ---------- short connector words: applied only with strict word boundaries ---------- */
const SHORT = {
"يرد":"replies",
"منذ":"since",
"موديل":"Model",
"جهة":"entities",
"سجل":"records",
"تقييم":"reviews",
"حدث":"events",
"عنصر":"items",
"خلال":"within",
"يومين":"two days",
"ساعتين":"two hours",
"صورة":"Image",
"جديد":"New",
"بحث":"Search",
"طلب":"request",
"طلبات":"requests",
"تواصل":"contact",
"أول":"first",
"رد":"response",
"متوسط":"Avg",
"مؤرشفون":"Archived",
"مؤرشفة":"Archived",
"مكرر":"duplicate",
"كمكرر":"as duplicate",
"وظائف":"jobs",
"خدمات":"services",
"أجهزة":"equipment",
"دورات":"courses",
"عملاء":"clients",
"مزوّد":"provider",
"ملف":"Profile",
"نموذج تشغيلي":"operating prototype",
};
const SHORT_KEYS = Object.keys(SHORT).sort((a,b)=>b.length-a.length);


/* ---------- systematic template patterns ---------- */
const PLACES = {
"سموحة":"Smouha","مدينة نصر":"Nasr City","العصافرة":"Asafra","الهرم":"Haram",
"العباسية":"Abbasiya","6 أكتوبر":"6th of October","وسط البلد":"Downtown",
"دمنهور":"Damanhour","المنشية":"Mansheya","الشيخ زايد":"Sheikh Zayed",
"المعادي":"Maadi","حلوان":"Helwan","العجمي":"Agami","برج العرب":"Borg El Arab",
"الإسكندرية":"Alexandria","القاهرة":"Cairo","الجيزة":"Giza","البحيرة":"Beheira",
"مطروح":"Matrouh","الدقهلية":"Dakahlia","المنوفية":"Menoufia","القليوبية":"Qalyubia"
};
const pl = x => PLACES[x.trim()] || x.trim();

const PATTERNS = [
  /* "📍 الإسكندرية — سموحة • منذ 2012" */
  [/^📍\s*(.+?)\s*—\s*(.+?)\s*•\s*منذ\s*(\d{4})$/,
   m=>`📍 ${pl(m[1])} — ${pl(m[2])} • since ${m[3]}`],
  /* "📍 القاهرة • خبرة 2-4 سنوات" inside job meta */
  [/^(.+?)\s*•\s*📍\s*(.+?)\s*•\s*خبرة\s*(.+)$/,
   m=>`${D[m[1].trim()]||m[1]} • 📍 ${pl(m[2])} • ${m[3].replace(/سنوات|سنة/,"years").replace(/فأكثر/,"+")} exp.`],
  /* "جيو أكاديمي مصر • 18 ساعة" */
  [/^(.+?)\s*•\s*(\d+)\s*ساعة$/, m=>`${D[m[1].trim()]||m[1]} • ${m[2]} hours`],
  /* "سارية حتى 04/2026" */
  [/^سارية حتى\s*(.+)$/, m=>`Valid until ${m[1]}`],
  [/^منتهية منذ\s*(.+)$/, m=>`Expired since ${m[1]}`],
  /* numbered legal headings: "3. كيف نستخدم بياناتك" */
  [/^(\d+)\.\s*(.+)$/, m=> D[m[2].trim()] ? `${m[1]}. ${D[m[2].trim()]}` : null],
  /* required field labels "رقم الهاتف *" */
  [/^(.+?)\s*\*$/, m=> D[m[1].trim()] ? `${D[m[1].trim()]} *` : null],
  /* "آخر تحديث: 3 سبتمبر 2026" */
  [/^آخر تحديث:\s*(.+)$/, m=>`Last updated: ${m[1].replace("سبتمبر","September").replace("أغسطس","August")}`],
  /* two-letter Arabic avatar initials → keep as-is (names stay transliterated) */
  [/^[\u0621-\u064A]{1,2}$/, m=>m[0]]
].filter(x=>x);

/* ---------- attribute translation ---------- */
const ATTRS = ["placeholder","title","alt","aria-label"];

/* ---------- build a longest-first matcher ---------- */
const KEYS = Object.keys(D).sort((a,b)=>b.length-a.length);

/* Arabic letter class — used to enforce word boundaries so that
   replacing "\u0645\u0624\u0631\u0634\u0641" never corrupts a longer word containing it. */
const AL = "\u0621-\u064A\u0660-\u0669\u066E-\u06D3";
const BOUND = new RegExp("^[" + AL + "]$");

function boundedReplace(hay, needle, repl){
  let out = "", i = 0;
  for(;;){
    const idx = hay.indexOf(needle, i);
    if(idx < 0){ out += hay.slice(i); break; }
    const before = idx > 0 ? hay[idx-1] : "";
    const after  = hay[idx+needle.length] || "";
    const okB = !before || !BOUND.test(before);
    const okA = !after  || !BOUND.test(after);
    if(okB && okA){ out += hay.slice(i, idx) + repl; }
    else          { out += hay.slice(i, idx + needle.length); }
    i = idx + needle.length;
  }
  return out;
}

function translateText(s){
  const t = s.trim();
  if(!t) return null;

  /* 1) exact match — the reliable path, keeps surrounding whitespace */
  if(D[t] !== undefined) return s.replace(t, D[t]);

  /* 1b) regex patterns for systematic templates */
  for(const [re, fn] of PATTERNS){
    const m = t.match(re);
    if(!m) continue;
    const r = fn(m);
    if(r !== null && r !== undefined && r !== t) return s.replace(t, r);
  }

  /* 2) numeric-prefixed labels: "9 عرض متاح ←" / "6 وظيفة متاحة ←" */
  const numMatch = t.match(/^([\d,\.]+)\s+(.+)$/);
  if(numMatch && D[numMatch[2]] !== undefined) return s.replace(t, numMatch[1]+" "+D[numMatch[2]]);

  /* 3) composite strings made ONLY of dictionary phrases + punctuation/digits.
        Partial translation of free prose is deliberately avoided — a half
        translated sentence reads worse than the original. */
  let out = t, hit = false;
  for(const k of KEYS){
    if(k.length < 5 || out.indexOf(k) < 0) continue;
    const next = boundedReplace(out, k, "\u0000"+D[k]+"\u0000");
    if(next !== out){ out = next; hit = true; }
  }
  if(!hit) return null;
  /* only accept if nothing meaningful in Arabic survived outside the replacements */
  const leftover = out.split("\u0000").filter((_,i)=>i%2===0).join("");
  if(/[\u0621-\u064A]/.test(leftover)) return null;   // prose — leave it in Arabic
  return s.replace(t, out.split("\u0000").join(""));
}

/* ---------- snapshot originals once, so switching back is lossless ---------- */
function snapshot(root){
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n){
      const p = n.parentNode;
      if(!p) return NodeFilter.FILTER_REJECT;
      const tag = p.nodeName;
      if(tag==="SCRIPT"||tag==="STYLE"||tag==="NOSCRIPT") return NodeFilter.FILTER_REJECT;
      return n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = []; let n;
  while(n = w.nextNode()){
    if(n.__gsAr === undefined) n.__gsAr = n.textContent;
    nodes.push(n);
  }
  return nodes;
}

function apply(lang, root){
  root = root || document.body;
  const nodes = snapshot(root);
  nodes.forEach(n=>{
    if(lang === "ar"){ n.textContent = n.__gsAr; return; }
    const tr = translateText(n.__gsAr);
    n.textContent = tr !== null ? tr : n.__gsAr;
  });
  // attributes
  root.querySelectorAll("["+ATTRS.join("],[")+"]").forEach(el=>{
    ATTRS.forEach(a=>{
      if(!el.hasAttribute(a)) return;
      const store = "__gsAr_"+a;
      if(el[store] === undefined) el[store] = el.getAttribute(a);
      if(lang === "ar"){ el.setAttribute(a, el[store]); return; }
      const tr = translateText(el[store]);
      el.setAttribute(a, tr !== null ? tr : el[store]);
    });
  });
}

const I18N = {
  D,
  get lang(){ try{ return localStorage.getItem(LSKEY) || "ar"; }catch(e){ return "ar"; } },

  set(lang){
    lang = (lang === "en") ? "en" : "ar";
    try{ localStorage.setItem(LSKEY, lang); }catch(e){}
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "en" ? "ltr" : "rtl");
    apply(lang);
    updateToggle();
    try{ global.dispatchEvent(new CustomEvent("gs:lang",{detail:{lang}})); }catch(e){}
  },

  toggle(){ I18N.set(I18N.lang === "ar" ? "en" : "ar"); },

  /* re-translate freshly injected DOM (called after every render) */
  refresh(root){ if(I18N.lang === "en") apply("en", root); },

  t(key){ return I18N.lang === "en" ? (D[key] || key) : key; },

  button(){
    const l = I18N.lang;
    return `<button class="langbtn" onclick="I18N.toggle()" title="${l==="ar"?"Switch to English":"التبديل للعربية"}">
      <span class="globe">🌐</span><b>${l === "ar" ? "EN" : "ع"}</b></button>`;
  }
};

function updateToggle(){
  const l = I18N.lang;
  document.querySelectorAll(".langbtn").forEach(b=>{
    b.querySelector("b").textContent = l === "ar" ? "EN" : "ع";
    b.setAttribute("title", l === "ar" ? "Switch to English" : "التبديل للعربية");
  });
}

/* ---------- auto-translate content rendered after load ---------- */
function observe(){
  const target = document.getElementById("content") || document.body;
  const mo = new MutationObserver(muts=>{
    if(I18N.lang !== "en") return;
    let touched = false;
    muts.forEach(m=>{ if(m.addedNodes && m.addedNodes.length) touched = true; });
    if(touched){ mo.disconnect(); apply("en", target); mo.observe(target,{childList:true,subtree:true}); }
  });
  mo.observe(target, {childList:true, subtree:true});
}

global.I18N = I18N;

function boot(){
  if(I18N.lang === "en") I18N.set("en"); else updateToggle();
  observe();
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

})(window);
