/**
 * Shared utility helpers for Survsta platform.
 */

export function getDefaultCategoryImage(category?: string, title?: string): string {
  const t = (title || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (c.includes('gnss') || c.includes('gps') || t.includes('gps') || t.includes('rtk')) {
    return '/assets/img/stonex-s900-product.jpg';
  }
  if (c.includes('ميزان') || t.includes('ميزان') || t.includes('level')) {
    return '/assets/img/auto-level-site.jpg';
  }
  if (c.includes('درون') || t.includes('drone') || c.includes('aerial')) {
    return '/assets/img/drone-orthophoto-site.jpg';
  }
  if (c.includes('scan') || t.includes('scanner') || t.includes('scan') || c.includes('reality')) {
    return '/assets/img/trimble-sx-kit.jpg';
  }
  return '/assets/img/leica-ts16-product.jpg';
}

export function getEquipmentImageUrl(rawUrl?: string | null, category?: string, title?: string): string {
  const fallback = getDefaultCategoryImage(category, title);
  if (!rawUrl || rawUrl.trim() === '') {
    return fallback;
  }
  if (
    rawUrl.startsWith('http://') ||
    rawUrl.startsWith('https://') ||
    rawUrl.startsWith('data:image') ||
    rawUrl.startsWith('/')
  ) {
    return rawUrl;
  }
  const lower = rawUrl.toLowerCase();
  if (lower.includes('gps') || lower.includes('rtk') || lower.includes('gnss')) {
    return '/assets/img/stonex-s900-product.jpg';
  }
  if (lower.includes('level') || lower.includes('ميزان')) {
    return '/assets/img/auto-level-site.jpg';
  }
  if (lower.includes('drone') || lower.includes('درون')) {
    return '/assets/img/drone-orthophoto-site.jpg';
  }
  return fallback;
}

export const DEFAULT_EQUIPMENT_IMAGE = '/assets/img/leica-ts16-product.jpg';

export interface MockEquipmentItem {
  id: string;
  title: string;
  category: string;
  daily_price?: number | null;
  monthly_price?: number | null;
  sale_price?: number | null;
  image_url?: string;
  condition: string;
  year: number;
  description: string;
}

export interface MockServiceItem {
  id: string;
  title: string;
  category: string;
  description: string;
}

export interface MockProviderProfile {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  created_at: string;
  about: string;
  services: string[];
  equipment: MockEquipmentItem[];
  servicesList: MockServiceItem[];
}

export const MOCK_PROFILES: MockProviderProfile[] = [
  {
    id: '1',
    slug: 'elite-survey',
    name: 'مكتب النخبة للمساحة والجيوماتكس',
    email: 'info@elitesurvey-eg.com',
    phone: '01099887766',
    location: 'الإسكندرية — سموحة',
    status: 'approved',
    created_at: '2023-01-15T10:00:00Z',
    about: 'مكتب استشاري مساحي معتمد يقدم خدمات الرفع الطبوغرافي، فرز الأراضي، أعمال الـ GIS، وتأجير أحدث محطات الرصد المتكاملة وأجهزة الـ GNSS في الإسكندرية والبحيرة ومطروح.',
    services: ['رفع مساحي طبوغرافي', 'تقسيم وفرز أراضي', 'حصر كميات وحفريات', 'إعداد خرائط GIS', 'توقيع محاور المنشآت'],
    equipment: [
      {
        id: 'EQ-M101',
        title: 'محطة رصد متكاملة Leica TS07 (1 ثانية)',
        category: 'Total Station',
        daily_price: 1500,
        monthly_price: 32000,
        image_url: '/assets/img/leica-ts16-product.jpg',
        condition: 'ممتاز',
        year: 2024,
        description: 'محطة رصد متكاملة فائقة الدقة 1 ثانية مع كامل الإكسسوارات وشهادة معايرة معتمدة صالحة لمدة عام.',
      },
      {
        id: 'EQ-M102',
        title: 'جهاز تحديد المواقع Trimble R12i GNSS',
        category: 'GNSS / GPS',
        daily_price: 2200,
        monthly_price: 45000,
        image_url: '/assets/img/stonex-s900-product.jpg',
        condition: 'جديد',
        year: 2025,
        description: 'مستقبل GNSS متطور بتقنية IMU لتعويض الميلان ودقة ميليمترية في الرصد اللحظي RTK.',
      },
      {
        id: 'EQ-M103',
        title: 'ميزان قامة بصري دقيق Sokkia B20',
        category: 'Optical Level',
        daily_price: 350,
        monthly_price: 7500,
        image_url: '/assets/img/auto-level-site.jpg',
        condition: 'ممتاز',
        year: 2023,
        description: 'ميزان قامة بصري تلقائي دقيق بقوة تكبير 32x مناسب لأعمال التسويات والتحكم في المناسيب الإنشائية.',
      },
      {
        id: 'EQ-M104',
        title: 'ميزان دقيق Leica NA730 Plus مع كامل الملحقات',
        category: 'Optical Level',
        daily_price: null,
        monthly_price: null,
        image_url: '',
        condition: 'ممتاز',
        year: 2024,
        description: 'ميزان مائي دقيق مقاوم للصدمات والظروف المناخية القاسية، متاح للتأجير طويل المدى بعقود مرنة.',
      },
    ],
    servicesList: [
      {
        id: 'SRV-M101',
        title: 'أعمال الرفع الطبوغرافي وحساب الكميات',
        category: 'مساحة أرضية',
        description: 'رفع طوبوغرافي شامل للمواقع والمنحدرات وحساب كميات الحفر والردم بدقة عالية باستخدام برامج Civil 3D.',
      },
      {
        id: 'SRV-M102',
        title: 'تقسيم وفرز الأراضي وتوقيع المحاور',
        category: 'مساحة قانونية',
        description: 'تحديد حدود الملكيات والرفع العقاري وتوقيع المحاور الهندسية للمباني والمصانع.',
      },
      {
        id: 'SRV-M103',
        title: 'إعداد الخرائط الرقمية وقواعد بيانات GIS',
        category: 'خدمات فنية',
        description: 'بناء قواعد بيانات مكانية وربط المعالم الجغرافية وإصدار خرائط رقمية معتمدة.',
      },
    ],
  },
  {
    id: '2',
    slug: 'delta-geomatics',
    name: 'دلتا جيوماتكس للحلول المتكاملة',
    email: 'contact@deltageomatics.com',
    phone: '01123456789',
    location: 'القاهرة — مدينة نصر',
    status: 'approved',
    created_at: '2023-02-20T10:00:00Z',
    about: 'شركة رائدة في تكنولوجيا المسح الليزري ثلاثي الأبعاد 3D Laser Scanning والمسح الجوي بالدرون وتوثيق المنشآت الكبرى وتوليد نماذج الـ BIM لمشاريع البنية التحتية والمباني التراثية.',
    services: ['مسح ليزري ثلاثي الأبعاد', 'As-Built Documentation', 'مسح بالطائرات بدون طيار Drone', 'نمذجة BIM'],
    equipment: [
      {
        id: 'EQ-M201',
        title: 'ماسح ليزري Faro Focus Premium 3D',
        category: 'Laser Scanner',
        daily_price: 4500,
        monthly_price: 95000,
        image_url: '/assets/img/trimble-sx-kit.jpg',
        condition: 'ممتاز',
        year: 2024,
        description: 'ماسح ليزري عالي السرعة لالتقاط السحب النقطية Point Clouds بدقة ميليمترية للمشاريع الكبرى والواجهات المعمارية.',
      },
      {
        id: 'EQ-M202',
        title: 'طائرة مسح جوي DJI Matrice 300 RTK + كاميرا P1',
        category: 'Drone',
        daily_price: 3800,
        monthly_price: 78000,
        image_url: '/assets/img/drone-orthophoto-site.jpg',
        condition: 'جديد',
        year: 2025,
        description: 'طائرة مسح جوي متخصصة مزودة بكاميرا فول فريم 45 ميجابكسل ومستقبل RTK للرفع الجوي عالي الدقة وإنتاج صور الأورثوفوتو.',
      },
      {
        id: 'EQ-M203',
        title: 'ماسح ليزري Trimble X7 المتطور',
        category: 'Laser Scanner',
        daily_price: null,
        monthly_price: null,
        image_url: '',
        condition: 'ممتاز',
        year: 2024,
        description: 'نظام مسح ليزري ثلاثي الأبعاد مع معايرة ذاتية وتسجيل فوري للسحب النقطية بالموقع، متاح حسب حجم المشروع.',
      },
    ],
    servicesList: [
      {
        id: 'SRV-M201',
        title: 'المسح الليزري وإنتاج نماذج BIM و As-Built',
        category: 'جيوفيزياء وهندسة',
        description: 'تحويل الواقع الفيزيائي إلى نماذج رقمية ثلاثية الأبعاد بدقة هندسية عالية لتوثيق المنشآت وتصميمات التعديل.',
      },
      {
        id: 'SRV-M202',
        title: 'المسح الجوي بالدرون ونماذج الارتفاع الرقمية DEM',
        category: 'خدمات فنية',
        description: 'تصوير جوي فوتوغرامتري عالي الدقة للمساحات الشاسعة وتوليد خطوط الكنتور وحسابات الحفر والردم.',
      },
    ],
  },
  {
    id: '3',
    slug: 'nile-instruments',
    name: 'النيل لأجهزة ومعدات المساحة',
    email: 'sales@nile-instruments.com',
    phone: '01012345678',
    location: 'القاهرة — وسط البلد',
    status: 'approved',
    created_at: '2023-03-10T10:00:00Z',
    about: 'مورد وموزع معتمد لأجهزة Total Station وGNSS RTK والملحقات المساحية الأصلية من كبرى الشركات العالمية (Topcon, Sokkia, CHCNAV, Nikon)، مع توفير قطع الغيار وخدمات التأجير السريع.',
    services: ['بيع أجهزة جديدة', 'تأجير أجهزة مساحة', 'قطع غيار وملحقات أصلية', 'دعم فني وضمان'],
    equipment: [
      {
        id: 'EQ-M301',
        title: 'توتال ستيشن Topcon ES-105 الدقيق',
        category: 'Total Station',
        daily_price: 1200,
        monthly_price: 26000,
        image_url: '/assets/img/leica-ts16-product.jpg',
        condition: 'ممتاز',
        year: 2023,
        description: 'توتال ستيشن توبكون 5 ثواني مع قياس بدون عاكس حتى 500 متر وحماية IP66 ضد الأتربة والمياه.',
      },
      {
        id: 'EQ-M302',
        title: 'طقم أجهزة CHCNAV i73+ Pocket GNSS Base & Rover',
        category: 'GNSS / GPS',
        daily_price: 1800,
        monthly_price: 38000,
        image_url: '/assets/img/stonex-s900-product.jpg',
        condition: 'جديد',
        year: 2024,
        description: 'طقم مستقبلات جيب متطور 624 قناة مع IMU وبطاريات تدوم طويلاً لأعمال الرفع السريع والتوقيع.',
      },
      {
        id: 'EQ-M303',
        title: 'طقم ميزان قامة بصري Nikon AX-2S الياباني',
        category: 'Optical Level',
        daily_price: null,
        monthly_price: null,
        image_url: '',
        condition: 'جديد',
        year: 2024,
        description: 'طقم ميزان مائي نيكون ياباني شامل الحامل الثلاثي الأصلي والقامة، متوفر لطلبات التوريد والمشاريع الكبرى.',
      },
    ],
    servicesList: [
      {
        id: 'SRV-M301',
        title: 'تأجير أجهزة التوتال ستيشن والـ GPS اليومي والشهري',
        category: 'خدمات فنية',
        description: 'تأجير مرن مع توفير أجهزة بديلة وصيانة فورية طوال مدة عقد الإيجار بالموقع.',
      },
    ],
  },
  {
    id: '4',
    slug: 'precision-cal',
    name: 'مركز الدقة لمعايرة وصيانة الأجهزة',
    email: 'service@precisioncal-eg.com',
    phone: '01234567890',
    location: 'الجيزة — الهرم',
    status: 'approved',
    created_at: '2023-04-05T10:00:00Z',
    about: 'مركز فني معتمد لمعايرة وصيانة وضبط أجهزة التوتال ستيشن والـ GPS والموازين البصرية وفق مواصفات ISO 17123 مع إصدار شهادات معايرة رسمية معتمدة.',
    services: ['معايرة Total Station', 'معايرة أجهزة الميزان الرقمي', 'صيانة وإصلاح بوردات', 'إصدار شهادات معايرة سنوية'],
    equipment: [
      {
        id: 'EQ-M401',
        title: 'منظومة معايرة وفحص أجهزة التوتال ستيشن الليزرية',
        category: 'Calibration',
        daily_price: null,
        monthly_price: null,
        image_url: '/assets/img/calibration-lab-collimators.jpg',
        condition: 'معملي',
        year: 2024,
        description: 'نظام فحص متطور بكوليماتورات متعددة لضبط التوازي والبؤرة وقياس الدقة الزاوية، الخدمة متاحة للشركات والمكاتب.',
      },
      {
        id: 'EQ-M402',
        title: 'جهاز اختبار وضبط مسافات EDM بدقة ميكرونية',
        category: 'Calibration',
        daily_price: null,
        monthly_price: null,
        image_url: '',
        condition: 'معملي',
        year: 2024,
        description: 'فحص الحساسات الضوئية ودوائر قياس المسافات مع إصدار تقرير فني شامل لكل جهاز.',
      },
    ],
    servicesList: [
      {
        id: 'SRV-M401',
        title: 'معايرة دورية معتمدة وإصدار شهادات الصلاحية',
        category: 'خدمات فنية',
        description: 'معايرة شاملة لجميع ماركات الأجهزة (Leica, Topcon, Trimble, Sokkia) وتوثيق النتائج بشهادة رسمية.',
      },
    ],
  },
  {
    id: '5',
    slug: 'geo-academy-eg',
    name: 'جيو أكاديمي للتدريب الهندسي',
    email: 'academy@geotraining-eg.com',
    phone: '01033134413',
    location: 'الإسكندرية — العصافرة',
    status: 'approved',
    created_at: '2023-05-12T10:00:00Z',
    about: 'أكاديمية تدريب تطبيقي متخصصة في تدريب وتأهيل المهندسين والفنيين على أجهزة المساحة الميدانية وبرامج الهندسة المدنية (Civil 3D, AutoCAD, ArcGIS, Pix4D).',
    services: ['دبلومة Civil 3D', 'AutoCAD للمساحين', 'GNSS RTK الميداني', 'QGIS وأساسيات التحليل المكاني'],
    equipment: [
      {
        id: 'EQ-M501',
        title: 'حقيبة أجهزة توتال ستيشن تدريبية متكاملة',
        category: 'Total Station',
        daily_price: 800,
        monthly_price: 16000,
        image_url: '/assets/img/calibration-training-lab.jpg',
        condition: 'ممتاز',
        year: 2023,
        description: 'مجموعة أجهزة مساحية مخصصة للكورسات والتدريب الميداني والفرق الهندسية وحديثي التخرج.',
      },
      {
        id: 'EQ-M502',
        title: 'طقم أجهزة GNSS تدريبي للمواقع والمشاريع',
        category: 'GNSS / GPS',
        daily_price: 1400,
        monthly_price: 28000,
        image_url: '/assets/img/stonex-s900-product.jpg',
        condition: 'ممتاز',
        year: 2024,
        description: 'مستقبلات RTK مجهزة للمحاكاة والتدريب الميداني وحساب الإحداثيات والربط على شبكات المحطات الثابتة.',
      },
    ],
    servicesList: [
      {
        id: 'SRV-M501',
        title: 'الدورات التدريبية التطبيقية على الأجهزة المساحية',
        category: 'خدمات فنية',
        description: 'برامج تدريب عملية بالمواقع مع مدربين معتمدين وشهادات اجتياز تدريبية.',
      },
    ],
  },
  {
    id: '6',
    slug: 'alex-survey-office',
    name: 'مكتب الإسكندرية للاستشارات المساحية',
    email: 'alexsurvey@surveyconsult-eg.com',
    phone: '01022334455',
    location: 'الإسكندرية — سيدي جابر',
    status: 'approved',
    created_at: '2023-06-01T10:00:00Z',
    about: 'مكتب استشاري مساحي متخصص في الأعمال المساحية البحرية والبرية وتوقيع محاور الجسور والمباني الساحلية ورفع الشواطئ والموانئ بالساحل الشمالي.',
    services: ['توقيع محاور المنشآت', 'رفع شبكات الصرف والمياه', 'رفع شواطئ وبحيرات', 'تثبيت نقاط روبير'],
    equipment: [
      {
        id: 'EQ-M601',
        title: 'محطة رصد متكاملة Leica TS16 الروبوتية',
        category: 'Total Station',
        daily_price: 2400,
        monthly_price: 48000,
        image_url: '/assets/img/leica-ts16-product.jpg',
        condition: 'ممتاز',
        year: 2024,
        description: 'محطة رصد روبوتية ذاتية التتبع مزودة بـ ATRplus ودقة 1 ثانية مناسبة للمشاريع الساحلية والإنشائية الدقيقة.',
      },
      {
        id: 'EQ-M602',
        title: 'جهاز مسبار أعماق Echo Sounder هيدروغرافي',
        category: 'Bathymetry',
        daily_price: null,
        monthly_price: null,
        image_url: '',
        condition: 'ممتاز',
        year: 2023,
        description: 'مسبار قياس الأعماق الطبوغرافي للأعمال البحرية والبحيرات والشواطئ، لطلب عروض الأسعار يرجى التواصل مع الإدارة.',
      },
    ],
    servicesList: [
      {
        id: 'SRV-M601',
        title: 'المسح الهيدروغرافي وقياس أعماق الشواطئ والبحيرات',
        category: 'جيوفيزياء وهندسة',
        description: 'تحديد تضاريس القاع ورسم الخرائط الملاحية وحسابات الإطماء والتكريك للموانئ والبحيرات.',
      },
    ],
  },
];

/**
 * Finds a mock provider profile by id, slug, or numeric index.
 * If not found, falls back gracefully to the first mock provider (id: '1')
 * so that demo navigation NEVER 404s.
 */
export function findMockProvider(idOrSlug?: string | null): MockProviderProfile {
  if (!idOrSlug) return MOCK_PROFILES[0];

  const clean = String(idOrSlug).toLowerCase().trim();

  // 1. Direct ID match (e.g. '1', 'provider-1', 'prov-1')
  const byId = MOCK_PROFILES.find((p) => p.id === clean || `provider-${p.id}` === clean || `prov-${p.id}` === clean);
  if (byId) return byId;

  // 2. Slug match (e.g. 'elite-survey', 'delta-geomatics')
  const bySlug = MOCK_PROFILES.find((p) => p.slug.toLowerCase() === clean);
  if (bySlug) return bySlug;

  // 3. Numeric index match (e.g. /directory/1, /directory/2)
  const num = parseInt(clean, 10);
  if (!isNaN(num) && num >= 1 && num <= MOCK_PROFILES.length) {
    return MOCK_PROFILES[num - 1];
  }

  // 4. Default fallback to first mock provider to guarantee zero-404 demo
  return MOCK_PROFILES[0];
}

