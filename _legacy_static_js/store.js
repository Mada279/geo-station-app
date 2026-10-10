/* ============================================================
   Survsta — Live Data Store (SWR & Cloud-Sync Enabled)
   Hybrid Store: In-memory/LocalStorage cache for instant UI rendering,
   seamlessly synchronized in the background with Supabase PostgreSQL.
   Survsta — All Rights Reserved
   ============================================================ */
(function(global){
"use strict";

const KEY = "SURVSTA_DB_v2";
const LEGACY_KEY = "GS_DB_v1";
const SCHEMA_VERSION = 2;

/* ---------- Dynamic Loader for Supabase Service Layer ---------- */
if (typeof global.SupabaseService === "undefined" && typeof document !== "undefined") {
  const s = document.createElement("script");
  s.src = "/assets/js/supabaseService.js";
  s.async = true;
  s.onload = () => {
    if (global.GS && global.GS.syncCloud) {
      global.GS.syncCloud();
    }
  };
  document.head.appendChild(s);
}

/* ---------- Dynamic Loader for AuthGuard ---------- */
if (typeof global.AuthGuard === "undefined" && typeof document !== "undefined") {
  const ag = document.createElement("script");
  ag.src = "/assets/js/authGuard.js?v=3.8";
  ag.async = true;
  document.head.appendChild(ag);
}

/* ---------- collections managed by the store ---------- */
const COLLECTIONS = {
  providers : { label:"المزوّدون",  labelEn:"Providers",  table:"providers", seed:()=>PROVIDERS, key:"id" },
  equipment : { label:"الأجهزة",    labelEn:"Equipment",  table:"equipment", seed:()=>EQUIPMENT, key:"id" },
  services  : { label:"الخدمات",    labelEn:"Services",   table:"services",  seed:()=>SERVICES,  key:"id" },
  courses   : { label:"الدورات",    labelEn:"Courses",    table:"courses",   seed:()=>COURSES,   key:"id" },
  jobs      : { label:"الوظائف",    labelEn:"Jobs",       table:"jobs",      seed:()=>JOBS,      key:"id" },
  clients   : { label:"العملاء",    labelEn:"Clients",    table:"clients",   seed:()=>SEED_CLIENTS, key:"id" },
  leads     : { label:"الطلبات",    labelEn:"Leads",      table:"leads",     seed:()=>SEED_LEADS,   key:"id" },
  reviews   : { label:"التقييمات",  labelEn:"Reviews",    table:"reviews",   seed:()=>SEED_REVIEWS, key:"id" },
  users     : { label:"المستخدمون",labelEn:"Users",      table:"users",     seed:()=>SEED_USERS,   key:"id" },
  media     : { label:"الوسائط",    labelEn:"Media",      table:"media",     seed:()=>SEED_MEDIA,   key:"id" },
  audit     : { label:"سجل التدقيق",labelEn:"Audit log",  table:"audit_logs",seed:()=>[],           key:"id" }
};

/* ---------- seed data for collections not in data.js ---------- */
const SEED_CLIENTS = [
  {id:1, name:"شركة أوركيد للتطوير العقاري", nameEn:"Orchid Development", type:"شركة تطوير عقاري",
   contact:"م. هاني عبد الله", phone:"01001234567", email:"projects@orchid-dev.example", gov:"الإسكندرية",
   city:"سموحة", since:"2025-11-02", leads:7, closed:4, value:"420,000 ج.م", status:"نشط", notes:"عميل متكرر — مشروعات سكنية."},
  {id:2, name:"مقاولات النصر", nameEn:"Al Nasr Contracting", type:"شركة مقاولات",
   contact:"م. سيد كامل", phone:"01112345678", email:"info@alnasr.example", gov:"القاهرة",
   city:"مدينة نصر", since:"2025-08-14", leads:12, closed:6, value:"810,000 ج.م", status:"نشط", notes:"بنية تحتية وطرق."},
  {id:3, name:"شركة المستقبل للإنشاءات", nameEn:"Future Construction", type:"شركة مقاولات",
   contact:"م. منى رشاد", phone:"01223456789", email:"m.rashad@future.example", gov:"الجيزة",
   city:"الشيخ زايد", since:"2026-01-20", leads:5, closed:2, value:"260,000 ج.م", status:"نشط", notes:""},
  {id:4, name:"م. أحمد سليم", nameEn:"Eng. Ahmed Selim", type:"عميل فردي",
   contact:"م. أحمد سليم", phone:"01034567890", email:"a.selim@example.com", gov:"الجيزة",
   city:"أكتوبر", since:"2026-03-05", leads:3, closed:1, value:"48,000 ج.م", status:"نشط", notes:"يستأجر أجهزة GNSS دوريًا."},
  {id:5, name:"الهيئة العامة للتخطيط العمراني", nameEn:"General Org. for Physical Planning", type:"جهة حكومية",
   contact:"أ. سحر فؤاد", phone:"0225551234", email:"contact@gopp.example", gov:"القاهرة",
   city:"العباسية", since:"2025-06-11", leads:9, closed:5, value:"1,240,000 ج.م", status:"نشط", notes:"إجراءات تعاقد رسمية."},
  {id:6, name:"شركة هرم للمقاولات", nameEn:"Haram Contracting", type:"شركة مقاولات",
   contact:"م. طارق زكي", phone:"01145556677", email:"t.zaki@haram.example", gov:"الجيزة",
   city:"الهرم", since:"2026-05-02", leads:2, closed:0, value:"—", status:"موقوف", notes:"طلبات مكررة — تحت المراجعة."}
];

const SEED_LEADS = [
  {id:1042, client:"شركة أوركيد", provider:"مكتب النخبة للمساحة", subject:"رفع مساحي 6 أفدنة", gov:"الإسكندرية",
   source:"ملف المزوّد", status:"جديد", date:"2026-09-03", flag:"", phone:"01001234567", fee_amount:50, is_charged:false},
  {id:1041, client:"م. أحمد سليم", provider:"مكتب النخبة للمساحة", subject:"تأجير GNSS أسبوع", gov:"الجيزة",
   source:"صفحة جهاز", status:"جديد", date:"2026-09-03", flag:"", phone:"01034567890", fee_amount:30, is_charged:false},
  {id:1040, client:"مقاولات النصر", provider:"دلتا جيوماتكس", subject:"مسح ليزري ثلاثي الأبعاد", gov:"القاهرة",
   source:"طلب احتياج", status:"تم التواصل", date:"2026-09-02", flag:"", phone:"01112345678", fee_amount:100, is_charged:true},
  {id:1039, client:"م. سيد كامل", provider:"جيو تك للتوريدات", subject:"شراء Total Station", gov:"الجيزة",
   source:"نتائج البحث", status:"جديد", date:"2026-09-02", flag:"بلا رد 31 ساعة", phone:"01112345678", fee_amount:75, is_charged:false},
  {id:1037, client:"شركة المستقبل", provider:"هورايزون جيو", subject:"مسح طرق 12 كم", gov:"الجيزة",
   source:"الخريطة", status:"تفاوض", date:"2026-08-31", flag:"", phone:"01223456789", fee_amount:120, is_charged:true},
  {id:1019, client:"شركة هرم للمقاولات", provider:"مكتب النخبة للمساحة", subject:"طلب مكرر", gov:"الجيزة",
   source:"طلب احتياج", status:"مكرر", date:"2026-08-22", flag:"تكرار مؤكد", phone:"01145556677", fee_amount:0, is_charged:false}
];

const SEED_REVIEWS = [
  {id:1, provider:"مكتب النخبة للمساحة", client:"شركة أوركيد", rate:5, date:"2026-08-28", status:"منشور",
   text:"التزام كامل بالمواعيد ودقة عالية في الرفع. تسليم الملفات بصيغ CAD وGIS بدون أخطاء.", flags:0},
  {id:2, provider:"دلتا جيوماتكس", client:"مقاولات النصر", rate:5, date:"2026-08-24", status:"منشور",
   text:"فريق محترف في المسح الليزري. النتائج طابقت المطلوب في تقرير As-Built.", flags:0},
  {id:3, provider:"مركز الدقة للمعايرة", client:"م. أحمد سليم", rate:4, date:"2026-08-19", status:"منشور",
   text:"معايرة سريعة وشهادة واضحة. السعر مناسب.", flags:0},
  {id:4, provider:"جيو تك للتوريدات", client:"م. سيد كامل", rate:2, date:"2026-08-30", status:"قيد المراجعة",
   text:"تأخير في الرد وسعر مختلف عن المعلن على المنصة.", flags:1},
  {id:5, provider:"هورايزون جيو", client:"شركة المستقبل", rate:5, date:"2026-09-01", status:"قيد المراجعة",
   text:"تقييم بلا تفاصيل — يحتاج التحقق من ارتباطه بطلب فعلي.", flags:2}
];

const SEED_USERS = [
  {id:1, name:"م. محمد فرج", email:"admin@survsta.com", role:"مدير النظام", team:"الإدارة",
   status:"نشط", last:"2026-09-03 09:41", av:"مف"},
  {id:2, name:"أ. سارة منير", email:"ops@survsta.com", role:"مسؤول تشغيل", team:"التشغيل",
   status:"نشط", last:"2026-09-03 08:20", av:"سم"},
  {id:3, name:"أ. كريم عادل", email:"data@survsta.com", role:"مُدخل بيانات", team:"البيانات",
   status:"نشط", last:"2026-09-03 09:05", av:"كع"},
  {id:4, name:"أ. نهى صابر", email:"support@survsta.com", role:"دعم العملاء", team:"الدعم",
   status:"نشط", last:"2026-09-02 16:52", av:"نص"},
  {id:5, name:"م. أحمد النجار", email:"elite@provider.eg", role:"مزوّد", team:"مكتب النخبة",
   status:"نشط", last:"2026-09-03 07:30", av:"أن"},
  {id:6, name:"أ. ياسر لطفي", email:"y.lotfy@survsta.com", role:"مُدخل بيانات", team:"البيانات",
   status:"موقوف", last:"2026-07-18 12:10", av:"يل"}
];

const SEED_MEDIA = [
  {id:1, name:"مكتب النخبة للاستشارات المساحية", file:"assets/img/hero-engineering-office.jpg", type:"صورة", usedIn:"الهيرو الرئيسي، ملف النخبة، عن المنصة", size:"1.2 MB", date:"2026-06-01"},
  {id:2, name:"محطة CAD وأعمال الخرائط", file:"assets/img/office-cad-workstation.jpg", type:"صورة", usedIn:"الدورات، اتصل بنا، لوحة التحكم", size:"980 KB", date:"2026-06-01"},
  {id:3, name:"مكتب تخطيط وهندسة مساحية", file:"assets/img/office-survey-team.jpg", type:"صورة", usedIn:"دلتا جيوماتكس، الوظائف", size:"1.1 MB", date:"2026-06-01"},
  {id:4, name:"مركز تحليل وتخطيط GIS", file:"assets/img/gis-planning-center.jpg", type:"صورة", usedIn:"خدمات GIS، دورات QGIS", size:"1.4 MB", date:"2026-06-01"},
  {id:5, name:"مختبر معايرة أجهزة المساحة (كوليماتور)", file:"assets/img/calibration-lab-collimators.jpg", type:"صورة", usedIn:"مركز الدقة، خدمات المعايرة", size:"850 KB", date:"2026-06-01"},
  {id:6, name:"فحص إلكتروني ومعايرة دقيقة", file:"assets/img/calibration-bench-setup.jpg", type:"صورة", usedIn:"مركز الميزان للمعايرة", size:"780 KB", date:"2026-06-01"},
  {id:7, name:"Leica TS16 Robotic Total Station", file:"assets/img/leica-ts16-product.jpg", type:"صورة", usedIn:"سوق الأجهزة — إيجار/بيع", size:"920 KB", date:"2026-06-01"},
  {id:8, name:"Topcon GT-1200 روبوتيك", file:"assets/img/topcon-gt1200-product.jpg", type:"صورة", usedIn:"سوق الأجهزة — توريد", size:"890 KB", date:"2026-06-01"},
  {id:9, name:"Stonex S900 GNSS RTK Set", file:"assets/img/stonex-s900-product.jpg", type:"صورة", usedIn:"سوق الأجهزة — بيع وإيجار", size:"760 KB", date:"2026-06-01"},
  {id:10, name:"استوديو أجهزة ومعدات المساحة", file:"assets/img/survey-instruments-studio.jpg", type:"صورة", usedIn:"موردو الأجهزة، النيل للأجهزة", size:"1.3 MB", date:"2026-06-01"},
  {id:11, name:"طائرة مسح جوي وأورثوفوتو", file:"assets/img/drone-orthophoto-site.jpg", type:"صورة", usedIn:"DJI M300، خدمات المسح الجوي", size:"1.5 MB", date:"2026-06-01"},
  {id:12, name:"محطة رصد Total Station بموقع إنشاءات", file:"assets/img/totalstation-construction-crane.jpg", type:"صورة", usedIn:"الخدمات، كيف تعمل المنصة", size:"1.1 MB", date:"2026-06-01"}
];

/* ---------- download helper ---------- */
function download(filename, content, mime){
  const a = document.createElement("a");
  try{
    if(typeof URL!=="undefined" && URL.createObjectURL){
      const url = URL.createObjectURL(new Blob([content],{type:mime}));
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 4000);
      return true;
    }
  }catch(e){}
  try{
    a.href = "data:"+mime+";charset=utf-8," + encodeURIComponent(content);
    a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    return true;
  }catch(e){ console.warn("download unavailable", e); return false; }
}

/* ---------- internal state ---------- */
let DB = null;
const listeners = [];
let isSyncing = false;

function nowISO(){
  const d=new Date(); const p=n=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function currentActor(){
  try{ return JSON.parse(localStorage.getItem("SURVSTA_ACTOR") || localStorage.getItem("GS_ACTOR")) || {name:"م. محمد فرج", role:"مدير النظام"}; }
  catch(e){ return {name:"م. محمد فرج", role:"مدير النظام"}; }
}

function freshDB(){
  const db = { __v:SCHEMA_VERSION, __seeded:nowISO() };
  for(const k in COLLECTIONS){
    let seed = [];
    try{ seed = COLLECTIONS[k].seed() || []; }catch(e){ seed = []; }
    db[k] = JSON.parse(JSON.stringify(seed)).map(r=>({...r, _st:r._st||"active"}));
  }
  return db;
}

function load(){
  if(DB) return DB;
  let raw=null;
  try{ raw = localStorage.getItem(KEY); }catch(e){}
  if(raw){
    try{
      const parsed = JSON.parse(raw);
      if(parsed && parsed.__v === SCHEMA_VERSION){
        DB = parsed;
        for(const k in COLLECTIONS) if(!Array.isArray(DB[k])) DB[k] = freshDB()[k];
        return DB;
      }
    }catch(e){ console.warn("Survsta store: corrupt data, reseeding"); }
  }
  try{
    const legacy = localStorage.getItem(LEGACY_KEY);
    if(legacy){
      console.info("Survsta store: migrating from legacy schema");
      localStorage.removeItem(LEGACY_KEY);
    }
  }catch(e){}
  DB = freshDB();
  persist();
  return DB;
}

function persist(){
  try{
    localStorage.setItem(KEY, JSON.stringify(DB));
    return true;
  }catch(e){
    if(e && /quota/i.test(e.name+e.message)){
      GS._quotaHit = true;
      console.error("Survsta store: localStorage quota exceeded");
      if(global.toast) global.toast("⚠ مساحة التخزين ممتلئة — احذف صورًا كبيرة أو صدّر البيانات ثم أعد التعيين");
    }else{ console.error("Survsta store: save failed", e); }
    return false;
  }
}

function emit(coll, action, record){
  listeners.forEach(fn=>{ try{ fn({coll, action, record}); }catch(e){ console.error(e); } });
  try{ global.dispatchEvent(new CustomEvent("survsta:change",{detail:{coll,action,record}})); }catch(e){}
  try{ global.dispatchEvent(new CustomEvent("gs:change",{detail:{coll,action,record}})); }catch(e){}
}

function nextId(coll){
  const rows = load()[coll]||[];
  return rows.reduce((m,r)=>Math.max(m, Number(r.id)||0), 0) + 1;
}

/* ---------- audit ---------- */
function logAudit(action, entity, before, after, note){
  const db = load();
  const a = currentActor();
  const entry = {
    id: nextId("audit"), t: nowISO(), actor:a.name, role:a.role,
    act:action, ent:entity, before:before??"—", after:after??"—",
    ip:"hash:9f3a…c21", note:note||"", _st:"active"
  };
  db.audit.unshift(entry);
  if(db.audit.length > 400) db.audit.length = 400;

  // مزامنة سجل التدقيق سحابياً إذا كان مهيأ
  if (global.SupabaseService && global.SupabaseService.isConfigured()) {
    global.SupabaseService.insert("audit_logs", [{
      actor_role: a.role,
      action: action === "إضافة" ? "INSERT" : action === "تعديل" ? "UPDATE" : "DELETE",
      entity: entity.split("#")[0],
      entity_id: entity.split("#")[1] || "0",
      note: note || "",
      before_state: { summary: before },
      after_state: { summary: after }
    }]).catch(err => console.warn("[Audit Cloud Sync] لم يتمكن من مزامنة الأوديت سحابياً:", err));
  }
}

function summarize(rec){
  if(!rec) return "—";
  return rec.name || rec.title || rec.client || rec.subject || rec.text?.slice(0,30) || ("#"+rec.id);
}

/* ============================================================
   STALE-WHILE-REVALIDATE (SWR) CLOUD SYNCHRONIZATION
   ============================================================ */

/**
 * مزامنة سحابية خلفية لجلب أحدث البيانات من Supabase
 */
async function syncCloud(){
  if (isSyncing) return;
  if (!global.SupabaseService || !global.SupabaseService.isConfigured()) return;

  isSyncing = true;
  console.log("☁️ Survsta [Store]: بدء المزامنة الخلفية مع Supabase (SWR)...");

  try {
    const db = load();
    let updatedCount = 0;

    // مزامنة الجداول الموجودة فعلياً في Supabase فقط لتجنب أخطاء 404 في الكونسول
    const syncTargets = ["providers", "equipment"];

    for (const coll of syncTargets) {
      const meta = COLLECTIONS[coll];
      if (!meta || !meta.table) continue;

      try {
        const { data, error } = await global.SupabaseService.select(meta.table, { limit: 100 });
        if (!error && Array.isArray(data) && data.length > 0) {
          // تحديث السجلات المحلية بالسجلات الواردة من السحابة مع الحفاظ على التوافق
          db[coll] = data.map(cloudRow => ({
            ...cloudRow,
            // توافق الحقول الشائعة
            name: cloudRow.name || cloudRow.commercial_name || cloudRow.title,
            gov: cloudRow.gov || cloudRow.governorate,
            rate: cloudRow.rate || cloudRow.avg_rating || 0,
            reviews: cloudRow.reviews || cloudRow.reviews_count || 0,
            _st: cloudRow._st || "active"
          }));
          updatedCount++;
          emit(coll, "sync", db[coll]);
        }
      } catch (collErr) {
        console.warn(`[Store Sync] تخطي الجدول "${meta.table}" لعدم توفره في Supabase:`, collErr && collErr.message ? collErr.message : collErr);
      }
    }

    if (updatedCount > 0) {
      persist();
      emit("*", "sync", null);
      console.log(`✅ Survsta [Store]: تمت المزامنة السحابية بنجاح (${updatedCount} جداول).`);
    }
  } catch (err) {
    console.warn("⚠️ Survsta [Store]: حدث خطأ أثناء المزامنة السحابية:", err);
  } finally {
    isSyncing = false;
  }
}

/* ============================================================
   PUBLIC API
   ============================================================ */
const GS = {
  COLLECTIONS,

  /* --- read (instant synchronous read from memory) --- */
  all(coll){ return (load()[coll]||[]).slice(); },
  active(coll){ return (load()[coll]||[]).filter(r=>r._st!=="archived" && r._st!=="deleted"); },
  archived(coll){ return (load()[coll]||[]).filter(r=>r._st==="archived"); },
  get(coll, id){ return (load()[coll]||[]).find(r=>String(r.id)===String(id)) || null; },
  find(coll, pred){ return (load()[coll]||[]).filter(pred); },
  count(coll){ return GS.active(coll).length; },

  /* --- create / update with optimistic UI & cloud sync --- */
  save(coll, rec, note){
    const db = load();
    if(!db[coll]) db[coll] = [];
    const isNew = rec.id===undefined || rec.id===null || rec.id==="" || !GS.get(coll,rec.id);
    let before = null;

    if(isNew){
      rec.id = rec.id && !GS.get(coll,rec.id) ? rec.id : nextId(coll);
      rec._st = rec._st || "active";
      rec._created = nowISO();
      db[coll].unshift(rec);
      logAudit("إضافة", `${coll}#${rec.id}`, "—", summarize(rec), note);
    }else{
      const i = db[coll].findIndex(r=>String(r.id)===String(rec.id));
      before = db[coll][i];
      rec = {...before, ...rec, _updated:nowISO()};
      db[coll][i] = rec;
      logAudit("تعديل", `${coll}#${rec.id}`, summarize(before), summarize(rec), note);
    }

    persist(); 
    emit(coll, isNew?"create":"update", rec);

    // المزامنة السحابية غير المتزامنة (Fire & Promise)
    if (global.SupabaseService && global.SupabaseService.isConfigured()) {
      const table = (COLLECTIONS[coll] && COLLECTIONS[coll].table) || coll;
      const cloudPayload = { ...rec };
      delete cloudPayload._st;
      delete cloudPayload._created;
      delete cloudPayload._updated;

      const p = isNew 
        ? global.SupabaseService.insert(table, [cloudPayload])
        : global.SupabaseService.update(table, rec.id, cloudPayload);

      p.then(({ data, error }) => {
        if (error) {
          console.error(`[Cloud Sync Error] فشل حفظ ${coll}#${rec.id} سحابياً:`, error);
        } else if (data && data.length) {
          // دمج أي معرّف أو خصائص تم توليدها سحابياً
          Object.assign(rec, data[0]);
          persist();
        }
      }).catch(e => console.warn(e));
    }

    return rec;
  },

  /* نسخة async مباشرة عند الحاجة */
  async saveAsync(coll, rec, note){
    return GS.save(coll, rec, note);
  },

  /* --- soft delete (archive) --- */
  archive(coll, id, note){
    const r = GS.get(coll,id); if(!r) return false;
    r._st = "archived"; r._archived = nowISO();
    logAudit("أرشفة", `${coll}#${id}`, "منشور", "مؤرشف", note);
    persist(); emit(coll,"archive",r);

    if (global.SupabaseService && global.SupabaseService.isConfigured()) {
      const table = (COLLECTIONS[coll] && COLLECTIONS[coll].table) || coll;
      global.SupabaseService.update(table, id, { status: "archived" }).catch(e=>console.warn(e));
    }
    return true;
  },

  restore(coll, id, note){
    const r = GS.get(coll,id); if(!r) return false;
    r._st = "active"; delete r._archived;
    logAudit("استعادة", `${coll}#${id}`, "مؤرشف", "منشور", note);
    persist(); emit(coll,"restore",r);

    if (global.SupabaseService && global.SupabaseService.isConfigured()) {
      const table = (COLLECTIONS[coll] && COLLECTIONS[coll].table) || coll;
      global.SupabaseService.update(table, id, { status: "published" }).catch(e=>console.warn(e));
    }
    return true;
  },

  /* --- hard delete --- */
  remove(coll, id, note){
    const db = load();
    const i = (db[coll]||[]).findIndex(r=>String(r.id)===String(id));
    if(i<0) return false;
    const rec = db[coll][i];
    db[coll].splice(i,1);
    logAudit("حذف نهائي", `${coll}#${id}`, summarize(rec), "محذوف", note);
    persist(); emit(coll,"delete",rec);

    if (global.SupabaseService && global.SupabaseService.isConfigured()) {
      const table = (COLLECTIONS[coll] && COLLECTIONS[coll].table) || coll;
      global.SupabaseService.remove(table, id).catch(e=>console.warn(e));
    }
    return true;
  },

  /* --- bulk --- */
  bulkInsert(coll, rows, note){
    const db = load(); if(!db[coll]) db[coll]=[];
    let n=0;
    rows.forEach(r=>{ r.id = nextId(coll)+n; r._st="active"; r._created=nowISO(); db[coll].unshift(r); n++; });
    logAudit("استيراد", coll, "—", `${n} سجل`, note);
    persist(); emit(coll,"bulk",null);

    if (global.SupabaseService && global.SupabaseService.isConfigured()) {
      const table = (COLLECTIONS[coll] && COLLECTIONS[coll].table) || coll;
      global.SupabaseService.insert(table, rows).catch(e=>console.warn(e));
    }
    return n;
  },

  /* --- Pay-Per-Lead: فتح الطلب وخصم المحفظة عبر RPC --- */
  async unlockLead(leadId){
    const lead = GS.get("leads", leadId);
    if (!lead) {
      throw new Error("لم يتم العثور على الطلب رقم #" + leadId);
    }

    if (lead.is_charged && lead.status !== "جديد" && lead.status !== "new") {
      return { success: true, message: "الطلب مفتوح مسبقاً", lead };
    }

    // إذا كان العميل السحابي متصلاً، نستدعي الـ RPC السحابي المبرمج في Postgres
    if (global.SupabaseService && global.SupabaseService.isConfigured()) {
      const { data, error } = await global.SupabaseService.unlockLeadAndCharge(leadId);
      if (error) {
        throw new Error(error.message || "تعذر فتح الطلب وخصم الرصيد");
      }
      // تحديث الحالة محلياً
      lead.status = "تم التواصل";
      lead.is_charged = true;
      lead.opened_at = nowISO();
      GS.save("leads", lead, "فتح بيانات الاتصال وخصم الرصيد عبر Supabase RPC");
      return { success: true, data, lead };
    } else {
      // Fallback Mode: محاكاة الخصم محلياً للتجربة قبل إدخال مفاتيح Supabase
      lead.status = "تم التواصل";
      lead.is_charged = true;
      lead.opened_at = nowISO();
      GS.save("leads", lead, "فتح بيانات الاتصال وخصم الرصيد (محاكاة)");
      return { success: true, mock: true, lead };
    }
  },

  /* --- images: file -> compressed data URI with cloud storage fallback --- */
  uploadImage(file, opts){
    opts = opts||{};
    const maxW = opts.maxW || 1200, quality = opts.quality || .72, maxBytes = opts.maxBytes || 420*1024;
    return new Promise((resolve,reject)=>{
      if(!file || !/^image\//.test(file.type)) return reject(new Error("الملف ليس صورة صالحة"));

      // محاولة الرفع السحابي لـ Supabase Storage إن أمكن
      if (global.SupabaseService && global.SupabaseService.isConfigured()) {
        global.SupabaseService.Storage.uploadFile(file, "equipment-images").then(({ publicUrl, error }) => {
          if (!error && publicUrl) {
            return resolve({
              dataUrl: publicUrl,
              w: 1200, h: 800,
              bytes: file.size,
              sizeLabel: (file.size / 1024).toFixed(0) + " ك.ب (سحابي)"
            });
          }
          // إذا فشل الرفع السحابي، ننتقل للضغط المحلي
          fallbackLocalCompression();
        }).catch(() => fallbackLocalCompression());
        return;
      }

      fallbackLocalCompression();

      function fallbackLocalCompression(){
        const fr = new FileReader();
        fr.onerror = ()=>reject(new Error("تعذّرت قراءة الملف"));
        fr.onload = ()=>{
          const img = new Image();
          img.onerror = ()=>reject(new Error("تعذّر فتح الصورة"));
          img.onload = ()=>{
            let w=img.width, h=img.height;
            if(w>maxW){ h = Math.round(h*maxW/w); w = maxW; }
            const cv = document.createElement("canvas"); cv.width=w; cv.height=h;
            cv.getContext("2d").drawImage(img,0,0,w,h);
            let q = quality, url = cv.toDataURL("image/jpeg", q);
            while(url.length*0.75 > maxBytes && q > 0.32){ q -= 0.1; url = cv.toDataURL("image/jpeg", q); }
            const bytes = Math.round(url.length*0.75);
            if(bytes > maxBytes*1.6) return reject(new Error("الصورة كبيرة جدًا حتى بعد الضغط — اختر صورة أصغر"));
            resolve({ dataUrl:url, w, h, bytes,
                      sizeLabel: bytes>1024*1024 ? (bytes/1048576).toFixed(1)+" م.ب" : Math.round(bytes/1024)+" ك.ب" });
          };
          img.src = fr.result;
        };
        fr.readAsDataURL(file);
      }
    });
  },

  addMedia(name, dataUrl, sizeLabel, usedIn){
    return GS.save("media", { name, file:dataUrl, type:"صورة مرفوعة",
      usedIn: usedIn||"غير مستخدمة بعد", size:sizeLabel||"—", date:nowISO().slice(0,10) });
  },

  /* --- storage usage --- */
  usage(){
    let bytes=0;
    try{ bytes = new Blob([localStorage.getItem(KEY)||""]).size; }catch(e){ bytes=(localStorage.getItem(KEY)||"").length; }
    const cap = 5*1024*1024;
    return { bytes, cap, pct: Math.min(100, Math.round(bytes/cap*100)),
             label: bytes>1048576 ? (bytes/1048576).toFixed(2)+" م.ب" : Math.round(bytes/1024)+" ك.ب" };
  },

  /* --- export / import whole DB --- */
  exportJSON(){
    const ok = download(`survsta-db-${new Date().toISOString().slice(0,10)}.json`,
                        JSON.stringify(load(),null,2), "application/json");
    logAudit("تصدير", "قاعدة البيانات", "—", "ملف JSON"); persist();
    return ok;
  },

  exportCSV(coll){
    const rows = GS.active(coll); if(!rows.length) return false;
    const cols = [...new Set(rows.flatMap(r=>Object.keys(r)))].filter(c=>!c.startsWith("_"));
    const esc = v => { v = v==null ? "" : (typeof v==="object" ? JSON.stringify(v) : String(v));
                       return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; };
    const csv = "\uFEFF" + [cols.join(","), ...rows.map(r=>cols.map(c=>esc(r[c])).join(","))].join("\n");
    download(`survsta-${coll}-${new Date().toISOString().slice(0,10)}.csv`, csv, "text/csv");
    logAudit("تصدير", coll, "—", `CSV — ${rows.length} سجل`); persist();
    return true;
  },

  importJSON(text){
    let parsed;
    try{ parsed = JSON.parse(text); }catch(e){ return {ok:false, msg:"الملف ليس JSON صالحًا"}; }
    if(!parsed || typeof parsed!=="object") return {ok:false, msg:"بنية الملف غير صحيحة"};
    const found = Object.keys(COLLECTIONS).filter(k=>Array.isArray(parsed[k]));
    if(!found.length) return {ok:false, msg:"لم يُعثر على أي مجموعة بيانات معروفة داخل الملف"};
    DB = freshDB();
    found.forEach(k=>{ DB[k] = parsed[k]; });
    DB.__v = SCHEMA_VERSION;
    logAudit("استيراد", "قاعدة البيانات", "—", `${found.length} مجموعة`);
    persist(); emit("*","import",null);
    const total = found.reduce((s,k)=>s+parsed[k].length,0);
    return {ok:true, msg:`تم استيراد ${found.length} مجموعة و${total} سجل`, collections:found, total};
  },

  reset(){
    DB = freshDB();
    logAudit("إعادة تعيين", "قاعدة البيانات", "بيانات معدّلة", "البذرة الأصلية");
    persist(); emit("*","reset",null);
  },

  /* --- events & sync --- */
  onChange(fn){ listeners.push(fn); return ()=>{ const i=listeners.indexOf(fn); if(i>=0) listeners.splice(i,1); }; },
  syncCloud,

  /* --- misc --- */
  audit(){ return GS.all("audit"); },
  logAudit,
  nowISO,
  setActor(name, role){
    try{
      localStorage.setItem("SURVSTA_ACTOR", JSON.stringify({name,role}));
      localStorage.setItem("GS_ACTOR", JSON.stringify({name,role}));
    }catch(e){}
  },
  actor: currentActor,
  _load: load
};

load();
global.GS = GS;
global.SURVSTA = GS;

/* مزامنة البيانات تلقائياً في الخلفية فور تحميل المتصفح */
if (typeof window !== "undefined") {
  setTimeout(() => syncCloud(), 400);
}

/* ---- keep legacy globals pointing at live data so existing pages work ---- */
try{
  if(typeof PROVIDERS !== "undefined") global.PROVIDERS = GS.active("providers");
  if(typeof EQUIPMENT !== "undefined") global.EQUIPMENT = GS.active("equipment");
  if(typeof SERVICES  !== "undefined") global.SERVICES  = GS.active("services");
  if(typeof COURSES   !== "undefined") global.COURSES   = GS.active("courses");
  if(typeof JOBS      !== "undefined") global.JOBS      = GS.active("jobs");
}catch(e){ console.warn("GS: legacy binding skipped", e); }

})(typeof window !== "undefined" ? window : globalThis);
