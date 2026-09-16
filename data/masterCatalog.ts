export interface MasterCatalogItem {
  id: string;
  title: string;
  category: string;
  brand: string;
  image: string;
  suggestedDaily?: number;
  suggestedMonthly?: number;
  description?: string;
}

export const MASTER_CATALOG: MasterCatalogItem[] = [
  // Total Stations (توتال ستيشن)
  {
    id: 'ts-leica-ts07',
    title: 'Leica FlexLine TS07',
    category: 'توتال ستيشن',
    brand: 'Leica Geosystems',
    image: 'leica-ts16-product.jpg',
    suggestedDaily: 1500,
    suggestedMonthly: 25000,
    description: 'محطة رصد متكاملة يدوية عالية الدقة للمشاريع الإنشائية والطرق',
  },
  {
    id: 'ts-leica-ts16',
    title: 'Leica TS16 Robotic',
    category: 'توتال ستيشن',
    brand: 'Leica Geosystems',
    image: 'leica-ts16-product.jpg',
    suggestedDaily: 2500,
    suggestedMonthly: 45000,
    description: 'محطة رصد آلية ذاتية التتبع (Robotic Total Station) للرصد الفردي عالي الإنتاجية',
  },
  {
    id: 'ts-trimble-s5',
    title: 'Trimble S5',
    category: 'توتال ستيشن',
    brand: 'Trimble',
    image: 'trimble-sx-kit.jpg',
    suggestedDaily: 2200,
    suggestedMonthly: 38000,
    description: 'جهاز رصد متكامل موثوق مدعوم بتقنيات MagDrive وSurePoint',
  },
  {
    id: 'ts-trimble-s7',
    title: 'Trimble S7',
    category: 'توتال ستيشن',
    brand: 'Trimble',
    image: 'trimble-sx-kit.jpg',
    suggestedDaily: 2800,
    suggestedMonthly: 50000,
    description: 'توتال ستيشن روبوتي متقدم يدمج المسح التصويري والليزر والرصد الميداني',
  },
  {
    id: 'ts-sokkia-cx105',
    title: 'Sokkia CX-105',
    category: 'توتال ستيشن',
    brand: 'Sokkia',
    image: 'totalstation-bridge-project.jpg',
    suggestedDaily: 1200,
    suggestedMonthly: 20000,
    description: 'محطة رصد بصرية دقيقة موثوقة في المشروعات اليومية والشبكات المساحية',
  },
  {
    id: 'ts-topcon-gm100',
    title: 'Topcon GM-100',
    category: 'توتال ستيشن',
    brand: 'Topcon',
    image: 'topcon-gt1200-product.jpg',
    suggestedDaily: 1300,
    suggestedMonthly: 22000,
    description: 'جهاز توتال ستيشن متين لقياس المسافات السريعة ومقاوم للظروف القاسية',
  },

  // GNSS/RTK (أجهزة GNSS/RTK)
  {
    id: 'gnss-leica-gs18t',
    title: 'Leica GS18 T',
    category: 'أجهزة GNSS/RTK',
    brand: 'Leica Geosystems',
    image: 'gnss-rtk-case-kit.jpg',
    suggestedDaily: 2200,
    suggestedMonthly: 38000,
    description: 'مستقبل GNSS ذكي مع تعويض الميل الفوري بدون الحاجة لضبط أفقية الفقاعة',
  },
  {
    id: 'gnss-trimble-r12i',
    title: 'Trimble R12i',
    category: 'أجهزة GNSS/RTK',
    brand: 'Trimble',
    image: 'gnss-construction.jpg',
    suggestedDaily: 2400,
    suggestedMonthly: 42000,
    description: 'مستقبل RTK الرائد بمعالج ProPoint وتقنية TIP للرصد المائل بدقة متناهية',
  },
  {
    id: 'gnss-topcon-hiper-vr',
    title: 'Topcon HiPer VR',
    category: 'أجهزة GNSS/RTK',
    brand: 'Topcon',
    image: 'topcon-gnss-receiver.jpg',
    suggestedDaily: 1800,
    suggestedMonthly: 30000,
    description: 'مستقبل GNSS مدمج وقوي لتطبيقات المسح الثابت والمتحرك والتحكم بالآلات',
  },
  {
    id: 'gnss-south-galaxy-g1',
    title: 'South Galaxy G1',
    category: 'أجهزة GNSS/RTK',
    brand: 'South Surveying',
    image: 'stonex-s900-product.jpg',
    suggestedDaily: 1400,
    suggestedMonthly: 24000,
    description: 'جهاز RTK اقتصادي عالي الكفاءة يدعم جميع الأقمار الصناعية وترددات CORS',
  },

  // Levels (ميزان قامة)
  {
    id: 'lvl-leica-na720',
    title: 'Leica NA720',
    category: 'ميزان قامة',
    brand: 'Leica Geosystems',
    image: 'auto-level-site.jpg',
    suggestedDaily: 350,
    suggestedMonthly: 5500,
    description: 'ميزان قامة أوتوماتيكي بصري مقاوم للصدمات والمياه لأصعب مواقع البناء',
  },
  {
    id: 'lvl-sokkia-b40a',
    title: 'Sokkia B40A',
    category: 'ميزان قامة',
    brand: 'Sokkia',
    image: 'auto-level-site.jpg',
    suggestedDaily: 300,
    suggestedMonthly: 4800,
    description: 'ميزان قامة دقيق وسريع الضبط للأعمال المساحية والتسويات الميدانية',
  },
  {
    id: 'lvl-trimble-dini',
    title: 'Trimble DiNi',
    category: 'ميزان قامة',
    brand: 'Trimble',
    image: 'instruments-product.jpg',
    suggestedDaily: 800,
    suggestedMonthly: 14000,
    description: 'ميزان قامة رقمي إلكتروني عالي الدقة لقراءة القامات الباركودية وتفادي الخطأ البشري',
  },

  // Drones & Scanners (طائرات درون ومسح جوي / ماسحات ليزرية)
  {
    id: 'drone-dji-phantom-4-rtk',
    title: 'DJI Phantom 4 RTK',
    category: 'طائرات درون ومسح جوي',
    brand: 'DJI Enterprise',
    image: 'drone-subdivision-aerial.jpg',
    suggestedDaily: 3500,
    suggestedMonthly: 60000,
    description: 'طائرة تصوير مساحي متكاملة مع وحدة RTK مدمجة للمخططات ونماذج الارتفاع الرقمية',
  },
  {
    id: 'drone-dji-mavic-3e',
    title: 'DJI Mavic 3 Enterprise',
    category: 'طائرات درون ومسح جوي',
    brand: 'DJI Enterprise',
    image: 'drone-orthophoto-site.jpg',
    suggestedDaily: 4000,
    suggestedMonthly: 70000,
    description: 'طائرة درون مساحية خفيفة بشاتر ميكانيكي وعدسة زووم 56x لمسح المساحات الشاسعة',
  },
  {
    id: 'scan-leica-blk360',
    title: 'Leica BLK360',
    category: 'طائرات درون ومسح جوي',
    brand: 'Leica Geosystems',
    image: 'trimble-sx-kit.jpg',
    suggestedDaily: 5000,
    suggestedMonthly: 90000,
    description: 'ماسح ليزري ثلاثي الأبعاد فائق الصغر وسريع الرصد لتطبيقات BIM والرفع المعماري',
  },
];
