/* Survsta — demo dataset (Egypt market)
   Survsta — All Rights Reserved */

var IMG = {
  heroOffice:     "assets/img/hero-engineering-office.jpg",
  officeCad:      "assets/img/office-cad-workstation.jpg",
  officeTeam:     "assets/img/office-survey-team.jpg",
  gisPlanning:    "assets/img/gis-planning-center.jpg",
  gisDesk:        "assets/img/gis-blueprints-desk.jpg",
  calCollimators: "assets/img/calibration-lab-collimators.jpg",
  calBench:       "assets/img/calibration-bench-setup.jpg",
  calLab:         "assets/img/calibration-training-lab.jpg",
  leicaTS16:      "assets/img/leica-ts16-product.jpg",
  topconGT:       "assets/img/topcon-gt1200-product.jpg",
  stonexS900:     "assets/img/stonex-s900-product.jpg",
  gnssKit:        "assets/img/gnss-rtk-case-kit.jpg",
  trimbleSX:      "assets/img/trimble-sx-kit.jpg",
  accessories:    "assets/img/survey-accessories-kit.jpg",
  productStudio:  "assets/img/survey-instruments-studio.jpg",
  productMontage: "assets/img/survey-equipment-montage.jpg",
  autoLevel:      "assets/img/auto-level-site.jpg",
  droneSite:      "assets/img/drone-orthophoto-site.jpg",
  droneAerial:    "assets/img/drone-subdivision-aerial.jpg",
  tsCrane:        "assets/img/totalstation-construction-crane.jpg",
  tsBridge:       "assets/img/totalstation-bridge-project.jpg",
  tsHighway:      "assets/img/totalstation-road-highway.jpg",
  tsStakes:       "assets/img/totalstation-stakes-layout.jpg",
  gnssMonument:   "assets/img/gnss-monument-hilltop.jpg",
  gnssEarthworks: "assets/img/gnss-earthworks-site.jpg",
  surveyorMale:   "assets/img/surveyor-male-site.jpg",
  // Legacy aliases
  office:         "assets/img/hero-engineering-office.jpg",
  gnssSite:       "assets/img/gnss-earthworks-site.jpg",
  teamTS:         "assets/img/totalstation-bridge-project.jpg",
  gnssTablet:     "assets/img/office-cad-workstation.jpg",
  tsField:        "assets/img/totalstation-construction-crane.jpg",
  product:        "assets/img/survey-instruments-studio.jpg"
};

var GOVS = ["الإسكندرية","القاهرة","الجيزة","البحيرة","مطروح","الدقهلية","المنوفية","القليوبية"];

var PROVIDER_TYPES = [
  {slug:"offices",      name:"مكاتب المساحة",   single:"مكتب مساحة",  icon:"🏢", desc:"مكاتب متخصصة في الرفع المساحي والتقسيم وحصر الكميات."},
  {slug:"companies",    name:"شركات المساحة",   single:"شركة مساحة",  icon:"🏗️", desc:"شركات بقدرات تنفيذية وفرق ومعدات متعددة."},
  {slug:"suppliers",    name:"موردو الأجهزة",   single:"مورد أجهزة",  icon:"📦", desc:"بيع وتأجير أجهزة المساحة وقطع الغيار والملحقات."},
  {slug:"calibration",  name:"مراكز المعايرة",  single:"مركز معايرة", icon:"🛠️", desc:"معايرة وصيانة الأجهزة وإصدار الشهادات الفنية."},
  {slug:"training",     name:"مراكز التدريب",   single:"مركز تدريب",  icon:"🎓", desc:"دورات تطبيقية على الأجهزة وبرامج المساحة."},
  {slug:"surveyors",    name:"المسّاحون",       single:"مسّاح",       icon:"📐", desc:"محترفون أفراد بملفات مهنية وسير ذاتية موثّقة."}
];

var PROVIDERS = [
  {id:1, slug:"elite-survey", name:"مكتب النخبة للمساحة", type:"مكتب مساحة", cat:"offices",
   gov:"الإسكندرية", city:"سموحة", rate:4.8, reviews:64, since:2012, staff:"12 موظف", resp:"خلال ساعة",
   ver:["ملف موثّق","نشاط موثّق"], featured:true, img:IMG.heroOffice, x:64, y:28, lat:31.2156, lng:29.9553,
   svc:["رفع مساحي طبوغرافي","تقسيم وفرز أراضي","حصر كميات","إعداد خرائط GIS"],
   about:"مكتب متخصص في أعمال المساحة الأرضية والتقسيم وأعمال GIS، يخدم الإسكندرية والمحافظات المجاورة بفريق ميداني وأجهزة Leica وTopcon."},
  {id:2, slug:"delta-geomatics", name:"دلتا جيوماتكس", type:"شركة مساحة", cat:"companies",
   gov:"القاهرة", city:"مدينة نصر", rate:4.6, reviews:118, since:2008, staff:"38 موظف", resp:"خلال 3 ساعات",
   ver:["ملف موثّق","نشاط موثّق","معدات موثّقة"], featured:true, img:IMG.officeTeam, x:36, y:50, lat:30.0626, lng:31.3468,
   svc:["مسح ليزري ثلاثي الأبعاد","As-Built Documentation","مسح بالطائرات بدون طيار","نمذجة BIM"],
   about:"شركة جيوماتكس متكاملة تعمل في مشروعات البنية التحتية والمنشآت الصناعية، بقدرات Reality Capture ومسح جوي معتمد."},
  {id:3, slug:"nile-instruments", name:"النيل لأجهزة المساحة", type:"مورد أجهزة", cat:"suppliers",
   gov:"القاهرة", city:"وسط البلد", rate:4.4, reviews:87, since:2015, staff:"9 موظفين", resp:"خلال يوم",
   ver:["ملف موثّق"], featured:false, img:IMG.productStudio, x:43, y:42, lat:30.0444, lng:31.2357,
   svc:["بيع أجهزة جديدة","تأجير قصير وطويل المدى","قطع غيار وملحقات","دعم فني"],
   about:"مورد معتمد لأجهزة Total Station وGNSS والملحقات، مع خدمات تأجير مرنة ودعم فني للعملاء داخل القاهرة والجيزة."},
  {id:4, slug:"precision-cal", name:"مركز الدقة للمعايرة", type:"مركز معايرة", cat:"calibration",
   gov:"الجيزة", city:"الهرم", rate:4.9, reviews:39, since:2017, staff:"6 فنيين", resp:"خلال يوم",
   ver:["ملف موثّق","نشاط موثّق"], featured:false, img:IMG.calCollimators, x:27, y:64, lat:29.9972, lng:31.1518,
   svc:["معايرة Total Station","معايرة أجهزة الميزان","صيانة وإصلاح","شهادات فنية"],
   about:"مركز فني متخصص في معايرة وصيانة أجهزة المساحة وفق إجراءات موثقة، مع إصدار تقرير فني لكل جهاز."},
  {id:5, slug:"geo-academy-eg", name:"جيو أكاديمي مصر", type:"مركز تدريب", cat:"training",
   gov:"الإسكندرية", city:"العصافرة", rate:4.7, reviews:52, since:2019, staff:"7 مدربين", resp:"خلال ساعتين",
   ver:["ملف موثّق"], featured:false, img:IMG.calLab, x:72, y:20, lat:31.2721, lng:30.0074,
   svc:["Civil 3D","AutoCAD للمساحين","GNSS الميداني","QGIS وأساسيات GIS"],
   about:"مركز تدريب تطبيقي يقدم برامج ميدانية ومعملية للمساحين وحديثي التخرج، بتدريب عملي على أجهزة حقيقية."},
  {id:6, slug:"west-survey", name:"الغرب للخدمات المساحية", type:"مكتب مساحة", cat:"offices",
   gov:"البحيرة", city:"دمنهور", rate:4.2, reviews:23, since:2020, staff:"5 موظفين", resp:"خلال يومين",
   ver:["ملف موثّق"], featured:false, img:IMG.gnssEarthworks, x:55, y:38, lat:31.0364, lng:30.4694,
   svc:["رفع مساحي","حصر كميات","توقيع محاور"],
   about:"مكتب مساحة يخدم محافظة البحيرة والمناطق الزراعية المحيطة، بخبرة في أعمال التقسيم والرفع الزراعي."},
  {id:7, slug:"horizon-geo", name:"هورايزون جيو للمساحة", type:"شركة مساحة", cat:"companies",
   gov:"الجيزة", city:"6 أكتوبر", rate:4.5, reviews:71, since:2014, staff:"24 موظف", resp:"خلال 4 ساعات",
   ver:["ملف موثّق","نشاط موثّق"], featured:false, img:IMG.tsHighway, x:22, y:56, lat:29.9723, lng:30.9419,
   svc:["مسح طرق ومحاور","مراقبة هبوط المنشآت","Drone Survey","GIS"],
   about:"شركة تعمل في مشروعات الطرق والمجتمعات العمرانية الجديدة، مع فرق مراقبة دورية للمنشآت."},
  {id:8, slug:"alex-instruments", name:"الإسكندرية للأجهزة الهندسية", type:"مورد أجهزة", cat:"suppliers",
   gov:"الإسكندرية", city:"المنشية", rate:4.3, reviews:44, since:2011, staff:"11 موظف", resp:"خلال يوم",
   ver:["ملف موثّق","معدات موثّقة"], featured:false, img:IMG.productMontage, x:68, y:34, lat:31.2001, lng:29.8972,
   svc:["بيع وتأجير","صيانة","ملحقات وحوامل","استيراد حسب الطلب"],
   about:"مورد أجهزة ومعدات مساحة في الإسكندرية مع مخزون تأجير دائم وخدمة توصيل داخل المحافظة."},
  {id:9, slug:"mizan-cal", name:"مركز الميزان للمعايرة والصيانة", type:"مركز معايرة", cat:"calibration",
   gov:"القاهرة", city:"العباسية", rate:4.6, reviews:31, since:2018, staff:"8 فنيين", resp:"خلال يومين",
   ver:["ملف موثّق"], featured:false, img:IMG.calBench, x:47, y:47, lat:30.0673, lng:31.2828,
   svc:["معايرة شاملة","إصلاح لوحات إلكترونية","ضبط دقة الزوايا","عقود صيانة سنوية"],
   about:"مركز صيانة متقدم يتعامل مع الأعطال الإلكترونية والميكانيكية لأجهزة المساحة مع عقود صيانة دورية."}
];

function providersToGeoJSON(list = PROVIDERS){
  return {
    type: "FeatureCollection",
    features: list.map(p=>({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id, name: p.name, type: p.type, gov: p.gov, city: p.city, rate: p.rate, slug: p.slug, img: p.img }
    }))
  };
}
if(typeof window !== "undefined") window.providersToGeoJSON = providersToGeoJSON;

var EQUIP_CATS = ["Total Station","GNSS / RTK","Laser Scanner","Drone","أجهزة ميزان","ملحقات وقطع غيار"];
var BRANDS = ["Leica","Topcon","Trimble","Stonex","Nikon","Spectra","FARO","DJI","South"];

var EQUIPMENT = [
  {id:1, slug:"leica-ts16", title:"Leica TS16 Total Station", cat:"Total Station", brand:"Leica",
   cond:"مستعمل — ممتاز", modes:["rent"], price:"500", unit:"جنيه / يوم", gov:"الإسكندرية", pid:1,
   cal:"سارية حتى 04/2026", avail:"متاح الآن", img:IMG.leicaTS16, year:2021,
   desc:"جهاز Total Station روبوتيك بدقة زاوية 1\" وتتبع أوتوماتيكي للعاكس، مناسب لأعمال التوقيع والرفع الدقيق. يشمل الحامل والبطاريات وحقيبة النقل.",
   specs:{"دقة الزاوية":"1 ثانية","المدى بدون عاكس":"1000 م","الشاشة":"لمس ملوّن","الحزمة":"جهاز + حامل + عاكس + شاحن"}},
  {id:2, slug:"topcon-gt1200", title:"Topcon GT-1200 روبوتيك", cat:"Total Station", brand:"Topcon",
   cond:"جديد", modes:["sale"], price:"حسب العرض", unit:"", gov:"القاهرة", pid:3,
   cal:"شهادة مصنع", avail:"متاح", img:IMG.topconGT, year:2025,
   desc:"جهاز روبوتيك بحجم مدمج وتقنية UltraTrac لتتبع العاكس في البيئات المزدحمة، مثالي لمواقع التنفيذ الحضرية.",
   specs:{"دقة الزاوية":"1 ثانية","المدى بدون عاكس":"1000 م","الوزن":"5.1 كجم","الضمان":"سنتان من المورد"}},
  {id:3, slug:"gnss-rtk-set", title:"طقم GNSS RTK — Stonex S900", cat:"GNSS / RTK", brand:"Stonex",
   cond:"مستعمل — جيد جدًا", modes:["rent","sale"], price:"حسب المدة", unit:"", gov:"الجيزة", pid:3,
   cal:"غير مُدرجة", avail:"محجوز حتى 12/09", img:IMG.stonexS900, year:2022,
   desc:"طقم GNSS كامل (Base + Rover) مع كنترولر ميداني وشرائح تصحيح، يدعم الشبكات المصرية للتصحيح اللحظي.",
   specs:{"القنوات":"800+ قناة","الدقة الأفقية":"8 مم + 1ppm","الكنترولر":"مضمّن","المدة الدنيا للإيجار":"3 أيام"}},
  {id:4, slug:"faro-focus", title:"FARO Focus 3D ماسح ليزري", cat:"Laser Scanner", brand:"FARO",
   cond:"مستعمل — ممتاز", modes:["rent"], price:"2,800", unit:"جنيه / يوم", gov:"القاهرة", pid:2,
   cal:"سارية حتى 01/2026", avail:"متاح الآن", img:IMG.trimbleSX, year:2020,
   desc:"ماسح ليزري ثابت لتوثيق المنشآت وأعمال As-Built، يُسلّم مع حامل ثقيل وكرات مرجعية وخدمة تدريب سريع.",
   specs:{"المدى":"حتى 150 م","السرعة":"976,000 نقطة/ث","المخرجات":"سحابة نقاط E57","يشمل":"حامل + أهداف مرجعية"}},
  {id:5, slug:"dji-m300", title:"DJI Matrice 300 RTK", cat:"Drone", brand:"DJI",
   cond:"مستعمل — جيد", modes:["rent"], price:"3,500", unit:"جنيه / يوم", gov:"القاهرة", pid:2,
   cal:"غير مُدرجة", avail:"متاح الآن", img:IMG.droneSite, year:2022,
   desc:"طائرة مسح جوي بدقة RTK مع كاميرا مسح، تُؤجَّر مع مشغّل معتمد. تنفيذ الطلعات يخضع للتصاريح المعمول بها.",
   specs:{"زمن الطيران":"حتى 45 دقيقة","الكاميرا":"P1 / 45MP","التصاريح":"مسؤولية المستأجر","يشمل":"مشغّل معتمد"}},
  {id:6, slug:"nikon-auto-level", title:"جهاز ميزان أوتوماتيك Nikon AX-2S", cat:"أجهزة ميزان", brand:"Nikon",
   cond:"جديد", modes:["sale"], price:"حسب العرض", unit:"", gov:"الإسكندرية", pid:8,
   cal:"شهادة مصنع", avail:"متاح", img:IMG.autoLevel, year:2025,
   desc:"جهاز ميزان أوتوماتيك خفيف ودقيق لأعمال المناسيب في مواقع التنفيذ، مقاوم للماء والأتربة.",
   specs:{"التكبير":"24x","دقة الكيلومتر المزدوج":"2.0 مم","المقاومة":"IPX6","يشمل":"شاقول + مفتاح ضبط"}},
  {id:7, slug:"trimble-r12i", title:"Trimble R12i GNSS", cat:"GNSS / RTK", brand:"Trimble",
   cond:"مستعمل — ممتاز", modes:["rent","sale"], price:"1,200", unit:"جنيه / يوم", gov:"الإسكندرية", pid:1,
   cal:"سارية حتى 07/2026", avail:"متاح الآن", img:IMG.gnssKit, year:2023,
   desc:"جهاز GNSS بتقنية IMU للقياس المائل دون تسوية، يقلل زمن الرفع في المواقع الصعبة بشكل ملحوظ.",
   specs:{"IMU":"مدمج — قياس مائل","الدقة":"8 مم + 1ppm","التوافق":"شبكات RTK المحلية","يشمل":"كنترولر + عصا"}},
  {id:8, slug:"survey-tripod-kit", title:"حزمة حوامل وعواكس ومستلزمات", cat:"ملحقات وقطع غيار", brand:"Spectra",
   cond:"جديد", modes:["sale"], price:"حسب العرض", unit:"", gov:"القاهرة", pid:3,
   cal:"لا ينطبق", avail:"متاح", img:IMG.accessories, year:2025,
   desc:"حزمة متكاملة من الحوامل الثقيلة والعواكس والشواخص والشرائط، مناسبة لتجهيز فريق ميداني جديد.",
   specs:{"المحتويات":"3 حوامل + 2 عاكس + شواخص","الخامة":"ألومنيوم مقوّى","الضمان":"سنة","التوصيل":"داخل القاهرة"}},
  {id:9, slug:"south-total-station", title:"South N7 Total Station", cat:"Total Station", brand:"South",
   cond:"مستعمل — جيد", modes:["rent","sale"], price:"320", unit:"جنيه / يوم", gov:"البحيرة", pid:6,
   cal:"منتهية — يلزم معايرة", avail:"متاح الآن", img:IMG.tsStakes, year:2019,
   desc:"خيار اقتصادي لأعمال الرفع العادية وحصر الكميات، مناسب للمكاتب الصغيرة والمشروعات القصيرة.",
   specs:{"دقة الزاوية":"2 ثانية","المدى بعاكس":"5000 م","الحالة":"يعمل بكفاءة","ملاحظة":"يُنصح بالمعايرة قبل الأعمال الدقيقة"}}
];

var SERVICES = [
  {slug:"topographic", t:"رفع مساحي طبوغرافي", cat:"مساحة أرضية", icon:"🗺️", n:24, img:IMG.tsCrane,
   d:"رفع تفصيلي للمناسيب ومعالم الموقع وإخراج خرائط كنتورية ومقاطع طولية وعرضية."},
  {slug:"laser-scan", t:"مسح ليزري ثلاثي الأبعاد", cat:"Reality Capture", icon:"🔦", n:9, img:IMG.trimbleSX,
   d:"توثيق المنشآت القائمة بسحابة نقاط عالية الكثافة وإنتاج مخططات As-Built ونماذج BIM."},
  {slug:"drone-survey", t:"مسح بالطائرات بدون طيار", cat:"Aerial Survey", icon:"🚁", n:12, img:IMG.droneSite,
   d:"تغطية جوية سريعة للمساحات الكبيرة مع إنتاج أورثوفوتو ونماذج ارتفاع رقمية."},
  {slug:"subdivision", t:"تقسيم وفرز أراضي", cat:"مساحة قانونية", icon:"📋", n:18, img:IMG.droneAerial,
   d:"إعداد مخططات التقسيم والفرز وحساب المساحات وتجهيز المستندات المساحية المطلوبة."},
  {slug:"calibration-svc", t:"معايرة وصيانة الأجهزة", cat:"خدمات فنية", icon:"🛠️", n:7, img:IMG.calCollimators,
   d:"فحص ومعايرة أجهزة المساحة وإصدار تقرير فني يوضح نتائج الضبط والدقة."},
  {slug:"gis-mapping", t:"إعداد خرائط وقواعد بيانات GIS", cat:"جيوماتكس", icon:"🧭", n:11, img:IMG.gisPlanning,
   d:"بناء قواعد بيانات مكانية وتحليل شبكات ومرافق وإنتاج خرائط موضوعية."},
  {slug:"quantity", t:"حصر كميات وأعمال ترابية", cat:"دعم التنفيذ", icon:"📊", n:15, img:IMG.gnssEarthworks,
   d:"حساب كميات الحفر والردم والمقارنة الدورية بين الوضع القائم والتصميم."},
  {slug:"monitoring", t:"مراقبة هبوط وحركة المنشآت", cat:"مراقبة دورية", icon:"📉", n:5, img:IMG.tsBridge,
   d:"شبكات نقاط مرجعية وقياسات دورية لرصد الحركة والهبوط في المنشآت الحساسة."}
];

var COURSES = [
  {slug:"civil3d", t:"Civil 3D للمساحين", lvl:"متوسط", hours:"18 ساعة", center:"جيو أكاديمي مصر", img:IMG.gisDesk,
   d:"إنشاء السطوح والمحاور والمقاطع وحساب الكميات على مشروع طريق كامل من البداية للتسليم.", price:"3,500 جنيه"},
  {slug:"gnss-field", t:"تشغيل GNSS RTK ميدانيًا", lvl:"مبتدئ", hours:"12 ساعة", center:"جيو أكاديمي مصر", img:IMG.gnssMonument,
   d:"ضبط Base وRover، الاتصال بشبكات التصحيح، الرفع والتوقيع، ومعالجة الأخطاء الشائعة.", price:"2,200 جنيه"},
  {slug:"ts-processing", t:"معالجة بيانات Total Station", lvl:"متوسط", hours:"10 ساعات", center:"دلتا جيوماتكس", img:IMG.officeCad,
   d:"من التحميل الخام إلى الرسم النهائي: التصحيحات، الإغلاق، وضبط الشبكات.", price:"1,800 جنيه"},
  {slug:"qgis-basics", t:"أساسيات GIS باستخدام QGIS", lvl:"مبتدئ", hours:"15 ساعة", center:"جيو أكاديمي مصر", img:IMG.gisPlanning,
   d:"بناء طبقات مكانية، الترميز، التحليل المكاني، وإخراج خرائط احترافية.", price:"2,000 جنيه"},
  {slug:"drone-mapping", t:"المسح الجوي ومعالجة الصور", lvl:"متقدم", hours:"20 ساعة", center:"دلتا جيوماتكس", img:IMG.droneAerial,
   d:"تخطيط الطلعات، نقاط التحكم الأرضية، ومعالجة سحابة النقاط والأورثوفوتو.", price:"4,800 جنيه"},
  {slug:"survey-law", t:"المساحة القانونية والتقسيم", lvl:"متوسط", hours:"14 ساعة", center:"جيو أكاديمي مصر", img:IMG.heroOffice,
   d:"إجراءات الفرز والتقسيم والمستندات المساحية والتعامل مع الجهات المختصة.", price:"2,600 جنيه"}
];

var JOBS = [
  {id:1, slug:"surveyor-alex", t:"مسّاح موقع — مشروع سكني", company:"مكتب النخبة للمساحة", pid:1,
   gov:"الإسكندرية", type:"دوام كامل", exp:"3-5 سنوات", posted:"منذ يومين", salary:"يُحدد بعد المقابلة",
   d:"مسؤول عن الرفع المساحي وتوقيع المحاور ومتابعة أعمال التنفيذ اليومية بالموقع وإعداد التقارير الدورية.",
   req:["خبرة عملية على Total Station وGNSS","إجادة AutoCAD وCivil 3D","القدرة على العمل الميداني والتنقل","بكالوريوس هندسة أو دبلوم مساحة"]},
  {id:2, slug:"gis-analyst", t:"محلل نظم معلومات جغرافية GIS", company:"دلتا جيوماتكس", pid:2,
   gov:"القاهرة", type:"دوام كامل", exp:"2-4 سنوات", posted:"منذ 4 أيام", salary:"تنافسي",
   d:"إعداد قواعد بيانات مكانية وخرائط تحليلية للمشروعات ودعم فرق التصميم بالبيانات الجغرافية.",
   req:["إجادة ArcGIS أو QGIS","معرفة بقواعد البيانات المكانية PostGIS","مهارات تحليل وإخراج خرائط","إنجليزية جيدة"]},
  {id:3, slug:"survey-assistant", t:"مساعد مسّاح", company:"الغرب للخدمات المساحية", pid:6,
   gov:"البحيرة", type:"عقد مشروع", exp:"سنة فأكثر", posted:"منذ أسبوع", salary:"يومية + بدل انتقال",
   d:"دعم فريق الرفع الميداني وتجهيز المعدات ومساعدة المسّاح في القياسات والتوقيع.",
   req:["دبلوم مساحة أو خبرة ميدانية","لياقة للعمل الميداني","إقامة قريبة من دمنهور مفضلة"]},
  {id:4, slug:"drone-pilot", t:"مشغّل طائرات مسح جوي", company:"دلتا جيوماتكس", pid:2,
   gov:"القاهرة", type:"دوام جزئي", exp:"سنتان فأكثر", posted:"منذ 5 أيام", salary:"بالطلعة",
   d:"تخطيط وتنفيذ طلعات المسح الجوي ومعالجة الصور وإنتاج المخرجات النهائية.",
   req:["خبرة في تشغيل DJI Matrice أو Phantom","إلمام بـ Pix4D أو Agisoft","الالتزام بالتصاريح والاشتراطات"]},
  {id:5, slug:"cal-technician", t:"فني معايرة وصيانة أجهزة", company:"مركز الدقة للمعايرة", pid:4,
   gov:"الجيزة", type:"دوام كامل", exp:"3 سنوات", posted:"منذ 3 أيام", salary:"يُحدد بعد المقابلة",
   d:"فحص ومعايرة أجهزة المساحة وإصلاح الأعطال وإعداد التقارير الفنية للعملاء.",
   req:["خلفية إلكترونيات أو ميكاترونيات","خبرة سابقة في صيانة أجهزة قياس","دقة وتوثيق منظم للأعمال"]},
  {id:6, slug:"survey-manager", t:"مدير قسم مساحة", company:"هورايزون جيو للمساحة", pid:7,
   gov:"الجيزة", type:"دوام كامل", exp:"8 سنوات فأكثر", posted:"منذ أسبوعين", salary:"مجزٍ",
   d:"إدارة فرق المساحة والجداول الزمنية ومراجعة المخرجات والتنسيق مع الاستشاري والمالك.",
   req:["خبرة قيادية في مشروعات طرق أو بنية تحتية","إجادة إدارة الفرق والموارد","قدرة على مراجعة الحسابات المساحية"]}
];

var STATS = [
  {n:"320+", l:"مكتب وشركة مسجّلة"},
  {n:"1,100+", l:"جهاز معروض للبيع والإيجار"},
  {n:"27", l:"محافظة مستهدفة للتغطية"},
  {n:"4,800+", l:"طلب تواصل تم توليده"}
];
