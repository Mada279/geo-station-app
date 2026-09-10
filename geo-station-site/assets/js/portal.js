/* Survsta — Portal shell, data & shared components
   Survsta — All Rights Reserved */

if (typeof window !== "undefined" && typeof window.AuthGuard === "undefined" && typeof document !== "undefined") {
  const ag = document.createElement("script");
  ag.src = "assets/js/authGuard.js";
  document.head.appendChild(ag);
}

const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const qs = k=>new URLSearchParams(location.search).get(k)||"";
const num = n=>n.toLocaleString("en-US");

/* ================= NAVIGATION ================= */
const PROVIDER_NAV = [
  ["_","التشغيل"],
  ["p-dashboard.html","📊","لوحة التحكم"],
  ["p-leads.html","📥","صندوق الطلبات","6"],
  ["p-listings.html","📡","إدارة الأجهزة"],
  ["p-services.html","🧭","الخدمات"],
  ["_","الملف والحساب"],
  ["p-profile.html","🏢","ملف الجهة"],
  ["p-locations.html","📍","المواقع والتغطية"],
  ["p-team.html","👥","الفريق والصلاحيات"],
  ["_","النمو"],
  ["p-analytics.html","📈","التحليلات"],
  ["p-jobs.html","💼","الوظائف المنشورة"],
  ["p-reviews.html","⭐","التقييمات"],
  ["p-ads.html","📣","الظهور المميّز"],
  ["_","النظام"],
  ["p-notifications.html","🔔","الإشعارات","3"],
  ["p-settings.html","⚙️","الإعدادات"]
];
const ADMIN_NAV = [
  ["_","نظرة عامة"],
  ["a-dashboard.html","🛡️","لوحة الإدارة"],
  ["a-analytics.html","📈","تحليلات المنصة"],
  ["_","المراجعة والاعتماد"],
  ["a-approvals.html","✅","مركز الاعتمادات","12"],
  ["a-equipment.html","📡","مراجعة الأجهزة","4"],
  ["a-verification.html","🔎","مركز التوثيق"],
  ["a-reviews.html","⭐","مراجعة التقييمات","2"],
  ["a-reports.html","🚩","البلاغات","5"],
  ["_","إدارة البيانات"],
  ["a-providers.html","🏢","المزوّدون"],
  ["a-clients.html","👥","العملاء"],
  ["a-users.html","👤","المستخدمون"],
  ["a-content.html","🗃️","المحتوى"],
  ["a-media.html","🖼️","مكتبة الوسائط"],
  ["a-jobs.html","💼","الوظائف"],
  ["a-data.html","🗂️","تجميع البيانات"],
  ["a-import.html","🔄","الاستيراد والتصدير"],
  ["_","المتابعة"],
  ["a-leads.html","📥","إدارة الطلبات"],
  ["a-audit.html","📜","سجل التدقيق"],
  ["a-settings.html","⚙️","إعدادات النظام"]
];

const CTX = {
  provider:{ title:"بوابة المزوّد", org:"مكتب النخبة للمساحة", sub:"مكتب مساحة • الإسكندرية",
             user:"م. أحمد النجار", role:"مدير الحساب", av:"أن", nav:PROVIDER_NAV, home:"p-dashboard.html" },
  admin:{    title:"لوحة الإدارة", org:"Survsta Admin", sub:"بيئة التشغيل — الإصدار 1.0",
             user:"م. محمد فرج", role:"مدير النظام", av:"مف", nav:ADMIN_NAV, home:"a-dashboard.html" }
};

function survstaLogo(idSuffix = "side", isDark = false){
  return `<img alt="Survsta" src="assets/img/Designer.png" class="h-12 w-auto object-contain survsta-logo" width="200" height="65" style="height:48px;max-height:54px;width:auto;display:block;object-fit:contain;">`;
}
if(typeof window !== "undefined") window.survstaLogo = survstaLogo;

function mountPortal(mode, active, pageTitle, crumbHtml){
  const c = CTX[mode];
  const nav = c.nav.map(item=>{
    if(item[0]==="_") return `<h5>${item[1]}</h5>`;
    const [href,ic,label,badge]=item;
    return `<a class="nv ${active===href?"on":""}" href="${href}"><span class="ic">${ic}</span>${label}${badge?`<span class="bdg">${badge}</span>`:""}</a>`;
  }).join("");

  document.body.insertAdjacentHTML("afterbegin", `
<div class="shell">
 <aside class="side" id="side">
   <a class="brand" href="${c.home}" aria-label="Survsta">${(window.survstaLogo||survstaLogo)("side")}</a>
   <div class="ctx"><b>${c.org}</b><small>${c.sub}</small></div>
   ${nav}
   <div class="backsite">
     <a class="nv" href="index.html"><span class="ic">🌐</span>عرض الموقع العام</a>
     <a class="nv" href="${mode==="admin"?"p-dashboard.html":"a-dashboard.html"}"><span class="ic">🔀</span>${mode==="admin"?"بوابة المزوّد":"لوحة الإدارة"}</a>
     <a class="nv" href="javascript:void(0)" onclick="if(window.AuthGuard){AuthGuard.logout()}else{toast('تم تسجيل الخروج');location.href='login.html'}"><span class="ic">🚪</span>تسجيل الخروج</a>
   </div>
 </aside>
 <div class="main">
  <header class="topbar">
    <button class="burger" onclick="$('#side').classList.toggle('open')">☰</button>
    <h1>${pageTitle}</h1>
    <div class="sp"></div>
    <input class="tsearch" placeholder="بحث سريع…" onkeydown="if(event.key==='Enter')toast('بحث: '+this.value)">
    <button class="iconbtn" onclick="location.href='${mode==='admin'?'a-dashboard.html':'p-notifications.html'}'">🔔<span class="dot"></span></button>
    <button class="iconbtn" onclick="toast('مركز المساعدة')">❓</button>
    ${I18N.button()}
    <div class="who"><div class="av">${c.av}</div><div><b>${c.user}</b><small>${c.role}</small></div></div>
  </header>
  <div class="body" id="pbody">
    <div class="crumb">${crumbHtml||""}</div>
    <div id="content"></div>
    <div class="pcredit" style="display:flex;justify-content:space-between;align-items:center;padding:18px 4px 6px;color:#64748b;font-size:11.5px"><span>© 2026 Survsta — جميع الحقوق محفوظة.</span><span style="font-size:11px;color:#64748b">Powered by <a href="#" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">Coreviazone</a></span></div>
  </div>
 </div>
</div>
<div class="modal" id="modal" onclick="if(event.target===this)closeModal()"><div class="mbox" id="mbox"></div></div>
<div class="toast" id="toast"></div>`);

  // تحديث بيانات المستخدم في شريط اللوحة ديناميكياً عند توفر الجلسة
  setTimeout(async () => {
    if (window.AuthGuard && window.AuthGuard.getUser) {
      const u = await window.AuthGuard.getUser();
      if (u) {
        const whoEl = document.querySelector(".topbar .who");
        if (whoEl) {
          whoEl.innerHTML = `<div class="av">${u.av || "GS"}</div><div><b>${u.name}</b><small>${u.role === 'admin' || u.role === 'super_admin' ? 'مدير النظام' : (u.role === 'provider' ? 'مزوّد خدمات' : u.role)}</small></div>`;
        }
        const ctxEl = document.querySelector(".side .ctx");
        if (ctxEl && u.org) {
          ctxEl.innerHTML = `<b>${u.org}</b><small>${u.email}</small>`;
        }
      }
    }
  }, 50);
}

function setContent(html){ $("#content").innerHTML = html; }

/* ================= UI HELPERS ================= */
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._i);t._i=setTimeout(()=>t.classList.remove("show"),2900)}
function openModal(html){ $("#mbox").innerHTML=html; $("#modal").classList.add("open"); document.body.style.overflow="hidden" }
function closeModal(){ $("#modal").classList.remove("open"); document.body.style.overflow="" }
function confirmAction(title, body, btn, cb){
  openModal(`<button class="x" onclick="closeModal()">✕</button><h3>${title}</h3>
    <p class="muted" style="margin-top:8px">${body}</p>
    <div class="field" style="margin-top:14px"><label>ملاحظة داخلية (تُسجَّل في سجل التدقيق)</label><textarea rows="3" placeholder="سبب القرار أو التوضيح المطلوب"></textarea></div>
    <div class="rowf" style="margin-top:16px"><button class="btn btn-pri" onclick="closeModal();(${cb})()">${btn}</button>
      <button class="btn btn-soft" onclick="closeModal()">إلغاء</button></div>`);
}

function kpi(lab,n,delta,dir,ic){
  return `<div class="kpi"><div class="ic">${ic||"📊"}</div><div class="lab">${lab}</div><div class="n">${n}</div>
    ${delta?`<div class="d ${dir||"up"}">${delta}</div>`:""}</div>`;
}
function spark(vals,hiLast){
  const mx=Math.max(...vals);
  return `<div class="spark">${vals.map((v,i)=>`<i class="${hiLast&&i===vals.length-1?'hi':''}" style="height:${Math.max(6,v/mx*100)}%" title="${v}"></i>`).join("")}</div>`;
}
function barRow(label,val,max,cls){
  return `<div style="margin-bottom:11px"><div class="rowb"><span class="muted">${label}</span><b>${val}${max===100?"%":""}</b></div>
    <div class="bar ${cls||""}"><i style="width:${max===100?val:Math.round(val/max*100)}%"></i></div></div>`;
}
function userCell(name, sub, av){
  return `<div class="uinfo"><div class="av">${av||name.slice(0,2)}</div><div><b>${name}</b><small>${sub}</small></div></div>`;
}
function table(cols, rows){
  return `<div class="tblwrap"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function tabs(items, cur, fn){
  return `<div class="tabs">${items.map(([k,l,c])=>`<button class="${cur===k?"on":""}" onclick="${fn}('${k}')">${l}${c!==undefined?`<span class="c">${c}</span>`:""}</button>`).join("")}</div>`;
}
const STATUS = {
  "جديد":"cy","مُسلَّم":"cy","مُطّلع عليه":"pur","تم التواصل":"warn","مؤهل":"warn","تفاوض":"warn",
  "مغلق — ناجح":"ok","مغلق — غير ناجح":"err","مكرر":"err","غير صالح":"err",
  "منشور":"ok","معتمد":"ok","قيد المراجعة":"warn","مسودة":"","مرفوض":"err","مطلوب تعديل":"err","موقوف":"err","نشط":"ok"
};
const st = s=>`<span class="chip ${STATUS[s]??""}">${s}</span>`;

/* ================= PORTAL DATA ================= */
const P_LEADS = [
  {id:"LD-1042",cust:"شركة أوركيد للتطوير",contact:"م. هشام عادل",subj:"رفع مساحي 6 أفدنة — برج العرب",gov:"الإسكندرية",src:"ملف المزوّد",status:"جديد",date:"2026-09-03 09:12",val:"عالية"},
  {id:"LD-1041",cust:"م. أحمد سليم",contact:"م. أحمد سليم",subj:"تأجير GNSS RTK لمدة أسبوع",gov:"الجيزة",src:"صفحة جهاز",status:"جديد",date:"2026-09-03 08:40",val:"متوسطة"},
  {id:"LD-1038",cust:"مقاولات الدلتا",contact:"م. سمير فؤاد",subj:"مسح ليزري لمنشأة صناعية",gov:"القاهرة",src:"طلب احتياج",status:"تم التواصل",date:"2026-09-01 14:22",val:"عالية"},
  {id:"LD-1036",cust:"م. منى فؤاد",contact:"م. منى فؤاد",subj:"معايرة Total Station",gov:"الجيزة",src:"الخريطة",status:"مؤهل",date:"2026-08-31 11:05",val:"متوسطة"},
  {id:"LD-1035",cust:"مجموعة النيل العقارية",contact:"أ. كريم لطفي",subj:"تقسيم أرض 12 فدان",gov:"البحيرة",src:"نتائج البحث",status:"تفاوض",date:"2026-08-29 16:48",val:"عالية"},
  {id:"LD-1030",cust:"مكتب البناء الحديث",contact:"م. ياسر ثابت",subj:"حصر كميات أعمال ترابية",gov:"الإسكندرية",src:"ملف المزوّد",status:"مغلق — ناجح",date:"2026-08-21 10:30",val:"متوسطة"},
  {id:"LD-1024",cust:"م. طارق عبد الحميد",contact:"م. طارق عبد الحميد",subj:"استفسار عن أسعار الرفع",gov:"الإسكندرية",src:"صفحة جهاز",status:"مغلق — غير ناجح",date:"2026-08-16 13:15",val:"منخفضة"},
  {id:"LD-1019",cust:"شركة هرم للمقاولات",contact:"م. عمرو صابر",subj:"طلب مكرر — نفس المشروع",gov:"الجيزة",src:"طلب احتياج",status:"مكرر",date:"2026-08-12 09:02",val:"—"}
];
const P_LISTINGS = [
  {id:"EQ-118",t:"Leica TS16 Total Station",cat:"Total Station",mode:"إيجار",price:"500 ج/يوم",cal:"سارية حتى 04/2026",status:"منشور",views:842,leads:11,upd:"2026-08-30"},
  {id:"EQ-121",t:"Trimble R12i GNSS",cat:"GNSS / RTK",mode:"إيجار + بيع",price:"1,200 ج/يوم",cal:"سارية حتى 07/2026",status:"منشور",views:611,leads:8,upd:"2026-08-28"},
  {id:"EQ-127",t:"Leica DISTO S910",cat:"ملحقات",mode:"بيع",price:"حسب العرض",cal:"لا ينطبق",status:"قيد المراجعة",views:0,leads:0,upd:"2026-09-02"},
  {id:"EQ-129",t:"حزمة حوامل وعواكس",cat:"ملحقات",mode:"بيع",price:"حسب العرض",cal:"لا ينطبق",status:"قيد المراجعة",views:0,leads:0,upd:"2026-09-01"},
  {id:"EQ-131",t:"South N7 Total Station",cat:"Total Station",mode:"إيجار",price:"320 ج/يوم",cal:"منتهية — يلزم معايرة",status:"مطلوب تعديل",views:0,leads:0,upd:"2026-08-27"},
  {id:"EQ-134",t:"جهاز ميزان أوتوماتيك",cat:"أجهزة ميزان",mode:"بيع",price:"حسب العرض",cal:"شهادة مصنع",status:"مسودة",views:0,leads:0,upd:"2026-09-03"},
  {id:"EQ-136",t:"Topcon GM-52",cat:"Total Station",mode:"إيجار",price:"420 ج/يوم",cal:"سارية حتى 11/2026",status:"منشور",views:389,leads:5,upd:"2026-08-19"}
];
const A_APPROVALS = [
  {id:"AP-311",item:"شركة أبعاد للمساحة",kind:"ملف مزوّد",owner:"م. وليد عصام",gov:"القاهرة",date:"2026-09-03",risk:"تكرار محتمل",sla:"اليوم"},
  {id:"AP-310",item:"Trimble R12i — للإيجار",kind:"جهاز",owner:"مكتب النخبة",gov:"الإسكندرية",date:"2026-09-03",risk:"—",sla:"اليوم"},
  {id:"AP-309",item:"وظيفة: مسّاح أول",kind:"وظيفة",owner:"هورايزون جيو",gov:"الجيزة",date:"2026-09-02",risk:"بيانات ناقصة",sla:"متأخر"},
  {id:"AP-308",item:"مركز الميزان للمعايرة",kind:"مركز معايرة",owner:"م. سامح رفعت",gov:"القاهرة",date:"2026-09-02",risk:"—",sla:"غدًا"},
  {id:"AP-307",item:"دورة: المسح الجوي المتقدم",kind:"دورة تدريبية",owner:"دلتا جيوماتكس",gov:"القاهرة",date:"2026-09-01",risk:"—",sla:"غدًا"},
  {id:"AP-305",item:"FARO Focus 3D — للإيجار",kind:"جهاز",owner:"دلتا جيوماتكس",gov:"القاهرة",date:"2026-09-01",risk:"صور غير كافية",sla:"متأخر"},
  {id:"AP-303",item:"الغرب للخدمات المساحية — تحديث",kind:"تعديل ملف",owner:"م. رمضان علي",gov:"البحيرة",date:"2026-08-31",risk:"—",sla:"غدًا"},
  {id:"AP-301",item:"مكتب الأمانة للمساحة",kind:"ملف مزوّد",owner:"م. إبراهيم زكي",gov:"الدقهلية",date:"2026-08-30",risk:"هاتف غير مؤكد",sla:"متأخر"}
];
const A_AUDIT = [
  {t:"2026-09-03 09:41",actor:"admin@survsta.com",role:"مدير النظام",act:"اعتماد ملف مزوّد",ent:"providers#42",before:"pending",after:"published",ip:"a1f9…"},
  {t:"2026-09-03 09:12",actor:"ops@survsta.com",role:"مشرف محتوى",act:"طلب تعديلات",ent:"equipment#131",before:"pending",after:"changes_requested",ip:"c7d2…"},
  {t:"2026-09-03 08:55",actor:"data@survsta.com",role:"مسؤول بيانات",act:"استيراد سجلات",ent:"import#17",before:"—",after:"120 record",ip:"9b31…"},
  {t:"2026-09-02 17:05",actor:"admin@survsta.com",role:"مدير النظام",act:"إخفاء تقييم مشبوه",ent:"reviews#903",before:"visible",after:"hidden",ip:"a1f9…"},
  {t:"2026-09-02 15:22",actor:"ops@survsta.com",role:"مشرف محتوى",act:"رفض إدراج",ent:"equipment#127",before:"pending",after:"rejected",ip:"c7d2…"},
  {t:"2026-09-02 11:48",actor:"admin@survsta.com",role:"مدير النظام",act:"منح شارة توثيق",ent:"providers#2",before:"basic",after:"business_verified",ip:"a1f9…"},
  {t:"2026-09-01 16:30",actor:"support@survsta.com",role:"دعم",act:"تعليم طلب كمكرر",ent:"leads#1019",before:"new",after:"duplicate",ip:"5e88…"},
  {t:"2026-09-01 10:04",actor:"admin@survsta.com",role:"مدير النظام",act:"تعديل إعدادات النظام",ent:"settings#lead_sla",before:"48h",after:"24h",ip:"a1f9…"}
];
const A_PROVIDERS = [
  {id:1,name:"مكتب النخبة للمساحة",type:"مكتب مساحة",gov:"الإسكندرية",owner:"م. أحمد النجار",listings:7,leads:36,rate:4.8,status:"منشور",ver:"نشاط موثّق"},
  {id:2,name:"دلتا جيوماتكس",type:"شركة مساحة",gov:"القاهرة",owner:"م. هاني مرسي",listings:12,leads:64,rate:4.6,status:"منشور",ver:"معدات موثّقة"},
  {id:3,name:"النيل لأجهزة المساحة",type:"مورد أجهزة",gov:"القاهرة",owner:"أ. مجدي سعد",listings:19,leads:41,rate:4.4,status:"منشور",ver:"ملف موثّق"},
  {id:4,name:"مركز الدقة للمعايرة",type:"مركز معايرة",gov:"الجيزة",owner:"م. شريف قاسم",listings:4,leads:22,rate:4.9,status:"منشور",ver:"نشاط موثّق"},
  {id:5,name:"جيو أكاديمي مصر",type:"مركز تدريب",gov:"الإسكندرية",owner:"د. نهى سليم",listings:6,leads:18,rate:4.7,status:"منشور",ver:"ملف موثّق"},
  {id:6,name:"الغرب للخدمات المساحية",type:"مكتب مساحة",gov:"البحيرة",owner:"م. رمضان علي",listings:3,leads:9,rate:4.2,status:"منشور",ver:"ملف موثّق"},
  {id:7,name:"شركة أبعاد للمساحة",type:"شركة مساحة",gov:"القاهرة",owner:"م. وليد عصام",listings:0,leads:0,rate:0,status:"قيد المراجعة",ver:"—"},
  {id:8,name:"مكتب الأمانة للمساحة",type:"مكتب مساحة",gov:"الدقهلية",owner:"م. إبراهيم زكي",listings:0,leads:0,rate:0,status:"قيد المراجعة",ver:"—"},
  {id:9,name:"جيو تك للتوريدات",type:"مورد أجهزة",gov:"الجيزة",owner:"أ. باسم راضي",listings:2,leads:3,rate:3.4,status:"موقوف",ver:"—"}
];
const A_USERS = [
  {id:"U-1201",name:"م. أحمد النجار",email:"ahmed@elite-survey.eg",role:"مدير مزوّد",org:"مكتب النخبة",joined:"2024-03-11",status:"نشط"},
  {id:"U-1244",name:"م. هاني مرسي",email:"hani@delta-geo.eg",role:"مدير مزوّد",org:"دلتا جيوماتكس",joined:"2024-06-02",status:"نشط"},
  {id:"U-1310",name:"م. كريم عبد الله",email:"karim.a@mail.com",role:"مسّاح",org:"—",joined:"2025-01-19",status:"نشط"},
  {id:"U-1355",name:"شركة أوركيد للتطوير",email:"projects@orchid.eg",role:"عميل",org:"أوركيد",joined:"2025-04-07",status:"نشط"},
  {id:"U-1402",name:"م. وليد عصام",email:"walid@abaad.eg",role:"مدير مزوّد",org:"أبعاد للمساحة",joined:"2026-09-01",status:"قيد المراجعة"},
  {id:"U-1408",name:"أ. باسم راضي",email:"bassem@geotech.eg",role:"مدير مزوّد",org:"جيو تك",joined:"2025-11-23",status:"موقوف"},
  {id:"U-0001",name:"م. محمد فرج",email:"admin@survsta.com",role:"مدير النظام",org:"Survsta",joined:"2024-01-01",status:"نشط"}
];
