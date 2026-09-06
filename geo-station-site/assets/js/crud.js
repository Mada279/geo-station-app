/* ============================================================
   Survsta — Schema-driven CRUD engine
   One reusable modal form + table renderer for every entity.
   Requires: store.js, portal.js (openModal/closeModal/toast/table)
   Concept, UX/UI & Platform Architecture by Eng. Mohamed Farag — CoreviaZone
   ============================================================ */
(function(global){
"use strict";

/* ---------------- field schemas per collection ---------------- */
const SCHEMAS = {

  providers: {
    label:"مزوّد", labelEn:"Provider", icon:"🏢",
    fields:[
      {k:"name",  l:"الاسم التجاري", lEn:"Trade name", t:"text", req:true, w:"full"},
      {k:"nameEn",l:"الاسم بالإنجليزية", lEn:"English name", t:"text"},
      {k:"slug",  l:"المعرّف (slug)", lEn:"Slug", t:"text", hint:"حروف إنجليزية وشرطات فقط"},
      {k:"type",  l:"نوع الجهة", lEn:"Type", t:"select", req:true,
       opts:["مكتب مساحة","شركة مساحة","مورد أجهزة","مركز معايرة","مركز تدريب","مسّاح مستقل"]},
      {k:"cat",   l:"التصنيف الفني", lEn:"Category", t:"select",
       opts:["offices","companies","suppliers","calibration","training","surveyors"]},
      {k:"gov",   l:"المحافظة", lEn:"Governorate", t:"select", req:true,
       opts:["الإسكندرية","القاهرة","الجيزة","البحيرة","مطروح","الدقهلية","المنوفية","القليوبية"]},
      {k:"city",  l:"المدينة / الحي", lEn:"City", t:"text", req:true},
      {k:"since", l:"سنة بدء النشاط", lEn:"Founded", t:"number", min:1950, max:2026},
      {k:"staff", l:"حجم الفريق", lEn:"Team size", t:"text", ph:"12 موظف"},
      {k:"resp",  l:"زمن الاستجابة", lEn:"Response time", t:"select",
       opts:["خلال ساعة","خلال 3 ساعات","خلال 6 ساعات","خلال يوم عمل"]},
      {k:"rate",  l:"التقييم", lEn:"Rating", t:"number", step:"0.1", min:0, max:5},
      {k:"reviews",l:"عدد التقييمات", lEn:"Reviews", t:"number", min:0},
      {k:"phone", l:"الهاتف", lEn:"Phone", t:"tel", ph:"01xxxxxxxxx"},
      {k:"email", l:"البريد الإلكتروني", lEn:"Email", t:"email"},
      {k:"svc",   l:"الخدمات المقدّمة", lEn:"Services", t:"tags", w:"full", hint:"افصل بفاصلة"},
      {k:"ver",   l:"شارات التوثيق", lEn:"Verification badges", t:"multi", w:"full",
       opts:["ملف موثّق","نشاط موثّق","معدات موثّقة","سجل معايرة"]},
      {k:"featured",l:"ظهور مميّز (مدفوع وموسوم)", lEn:"Featured", t:"bool"},
      {k:"x",     l:"موضع الخريطة X %", lEn:"Map X", t:"number", min:0, max:100},
      {k:"y",     l:"موضع الخريطة Y %", lEn:"Map Y", t:"number", min:0, max:100},
      {k:"img",   l:"الصورة الرئيسية", lEn:"Main image", t:"image", w:"full"},
      {k:"about", l:"نبذة تعريفية", lEn:"About", t:"textarea", w:"full", rows:4, req:true}
    ]
  },

  clients: {
    label:"عميل", labelEn:"Client", icon:"👥",
    fields:[
      {k:"name",   l:"اسم العميل / الجهة", lEn:"Client name", t:"text", req:true, w:"full"},
      {k:"nameEn", l:"الاسم بالإنجليزية", lEn:"English name", t:"text"},
      {k:"type",   l:"نوع العميل", lEn:"Client type", t:"select", req:true,
       opts:["شركة مقاولات","شركة تطوير عقاري","جهة حكومية","مكتب استشاري","عميل فردي","أخرى"]},
      {k:"contact",l:"مسؤول التواصل", lEn:"Contact person", t:"text", req:true},
      {k:"phone",  l:"الهاتف", lEn:"Phone", t:"tel", req:true, ph:"01xxxxxxxxx"},
      {k:"email",  l:"البريد الإلكتروني", lEn:"Email", t:"email"},
      {k:"gov",    l:"المحافظة", lEn:"Governorate", t:"select", req:true,
       opts:["الإسكندرية","القاهرة","الجيزة","البحيرة","مطروح","الدقهلية","المنوفية","القليوبية"]},
      {k:"city",   l:"المدينة / الحي", lEn:"City", t:"text"},
      {k:"since",  l:"تاريخ التسجيل", lEn:"Registered", t:"date"},
      {k:"leads",  l:"عدد الطلبات", lEn:"Leads", t:"number", min:0},
      {k:"closed", l:"صفقات مغلقة", lEn:"Closed deals", t:"number", min:0},
      {k:"value",  l:"القيمة التقديرية", lEn:"Est. value", t:"text", ph:"420,000 ج.م"},
      {k:"status", l:"الحالة", lEn:"Status", t:"select", opts:["نشط","خامل","موقوف"]},
      {k:"notes",  l:"ملاحظات داخلية", lEn:"Internal notes", t:"textarea", w:"full", rows:3}
    ]
  },

  equipment: {
    label:"جهاز", labelEn:"Equipment", icon:"📡",
    fields:[
      {k:"name",  l:"اسم الجهاز", lEn:"Equipment name", t:"text", req:true, w:"full"},
      {k:"brand", l:"العلامة التجارية", lEn:"Brand", t:"select", req:true,
       opts:["Leica","Topcon","Trimble","Sokkia","South","Stonex","CHCNAV","أخرى"]},
      {k:"cat",   l:"الفئة", lEn:"Category", t:"select", req:true,
       opts:["Total Station","GNSS / RTK","Level","Laser Scanner","Drone","ملحقات"]},
      {k:"mode",  l:"نوع العرض", lEn:"Listing mode", t:"select", req:true, opts:["بيع","إيجار","بيع وإيجار"]},
      {k:"price", l:"السعر", lEn:"Price", t:"number", min:0},
      {k:"unit",  l:"وحدة السعر", lEn:"Price unit", t:"select", opts:["ج.م","ج.م / يوم","ج.م / أسبوع","ج.م / شهر"]},
      {k:"cond",  l:"الحالة", lEn:"Condition", t:"select", opts:["جديد","مستعمل — ممتاز","مستعمل — جيد","مجدّد"]},
      {k:"year",  l:"سنة الصنع", lEn:"Year", t:"number", min:1990, max:2026},
      {k:"provider", l:"الجهة المالكة", lEn:"Owner", t:"text", req:true},
      {k:"gov",   l:"المحافظة", lEn:"Governorate", t:"select", req:true,
       opts:["الإسكندرية","القاهرة","الجيزة","البحيرة","مطروح","الدقهلية"]},
      {k:"calib", l:"حالة المعايرة", lEn:"Calibration", t:"select",
       opts:["سارية","منتهية","غير مُدرجة"], hint:"لا يجوز عرض معايرة منتهية كسارية"},
      {k:"calibDate", l:"تاريخ انتهاء المعايرة", lEn:"Calibration expiry", t:"date"},
      {k:"img",   l:"صورة الجهاز", lEn:"Image", t:"image", w:"full"},
      {k:"specs", l:"المواصفات", lEn:"Specs", t:"tags", w:"full", hint:"افصل بفاصلة"},
      {k:"desc",  l:"الوصف", lEn:"Description", t:"textarea", w:"full", rows:3}
    ]
  },

  services: {
    label:"خدمة", labelEn:"Service", icon:"🛠️",
    fields:[
      {k:"name", l:"اسم الخدمة", lEn:"Service name", t:"text", req:true, w:"full"},
      {k:"nameEn", l:"الاسم بالإنجليزية", lEn:"English name", t:"text"},
      {k:"ic",   l:"الأيقونة", lEn:"Icon", t:"text", ph:"📐"},
      {k:"cat",  l:"التصنيف", lEn:"Category", t:"select",
       opts:["مساحة أرضية","مسح جوي","GIS","مسح ليزري","معايرة","استشارات"]},
      {k:"from", l:"يبدأ من (ج.م)", lEn:"Starting price", t:"number", min:0},
      {k:"dur",  l:"المدة التقديرية", lEn:"Duration", t:"text", ph:"3 - 7 أيام"},
      {k:"providers", l:"عدد المزوّدين", lEn:"Providers", t:"number", min:0},
      {k:"img",  l:"صورة الخدمة", lEn:"Image", t:"image", w:"full"},
      {k:"desc", l:"الوصف", lEn:"Description", t:"textarea", w:"full", rows:4, req:true}
    ]
  },

  courses: {
    label:"دورة", labelEn:"Course", icon:"🎓",
    fields:[
      {k:"name",  l:"اسم الدورة", lEn:"Course name", t:"text", req:true, w:"full"},
      {k:"center",l:"مركز التدريب", lEn:"Training center", t:"text", req:true},
      {k:"level", l:"المستوى", lEn:"Level", t:"select", opts:["مبتدئ","متوسط","متقدم"]},
      {k:"mode",  l:"نمط التدريب", lEn:"Mode", t:"select", opts:["حضوري","أونلاين","هجين"]},
      {k:"hours", l:"عدد الساعات", lEn:"Hours", t:"number", min:1},
      {k:"price", l:"الرسوم (ج.م)", lEn:"Fee", t:"number", min:0},
      {k:"gov",   l:"المحافظة", lEn:"Governorate", t:"select", opts:["الإسكندرية","القاهرة","الجيزة","أونلاين"]},
      {k:"start", l:"تاريخ البدء", lEn:"Start date", t:"date"},
      {k:"seats", l:"المقاعد المتاحة", lEn:"Seats", t:"number", min:0},
      {k:"img",   l:"صورة الدورة", lEn:"Image", t:"image", w:"full"},
      {k:"topics",l:"المحاور", lEn:"Topics", t:"tags", w:"full", hint:"افصل بفاصلة"},
      {k:"desc",  l:"الوصف", lEn:"Description", t:"textarea", w:"full", rows:3}
    ]
  },

  jobs: {
    label:"وظيفة", labelEn:"Job", icon:"💼",
    fields:[
      {k:"title", l:"المسمى الوظيفي", lEn:"Job title", t:"text", req:true, w:"full"},
      {k:"company",l:"جهة العمل", lEn:"Company", t:"text", req:true},
      {k:"type",  l:"نوع التعاقد", lEn:"Contract", t:"select", req:true,
       opts:["دوام كامل","دوام جزئي","عقد مشروع","تدريب"]},
      {k:"gov",   l:"المحافظة", lEn:"Governorate", t:"select", req:true,
       opts:["الإسكندرية","القاهرة","الجيزة","البحيرة","مطروح","الدقهلية"]},
      {k:"exp",   l:"سنوات الخبرة", lEn:"Experience", t:"text", ph:"2 - 5 سنوات"},
      {k:"salary",l:"نطاق الراتب", lEn:"Salary range", t:"text", ph:"8,000 - 12,000 ج.م"},
      {k:"posted",l:"تاريخ النشر", lEn:"Posted", t:"date"},
      {k:"skills",l:"المهارات المطلوبة", lEn:"Skills", t:"tags", w:"full", hint:"افصل بفاصلة"},
      {k:"desc",  l:"الوصف الوظيفي", lEn:"Description", t:"textarea", w:"full", rows:4, req:true}
    ]
  },

  users: {
    label:"مستخدم", labelEn:"User", icon:"👤",
    fields:[
      {k:"name",  l:"الاسم", lEn:"Name", t:"text", req:true, w:"full"},
      {k:"email", l:"البريد الإلكتروني", lEn:"Email", t:"email", req:true},
      {k:"role",  l:"الدور", lEn:"Role", t:"select", req:true,
       opts:["مدير النظام","مسؤول تشغيل","مُدخل بيانات","دعم العملاء","مزوّد","مراجع محتوى"]},
      {k:"team",  l:"الفريق / الجهة", lEn:"Team", t:"text"},
      {k:"status",l:"الحالة", lEn:"Status", t:"select", opts:["نشط","موقوف","بانتظار التفعيل"]},
      {k:"av",    l:"الأحرف الأولى", lEn:"Initials", t:"text", ph:"مف", hint:"حرفان"},
      {k:"last",  l:"آخر دخول", lEn:"Last login", t:"text"}
    ]
  },

  leads: {
    label:"طلب", labelEn:"Lead", icon:"📥",
    fields:[
      {k:"client",  l:"العميل", lEn:"Client", t:"text", req:true},
      {k:"provider",l:"المزوّد", lEn:"Provider", t:"text", req:true},
      {k:"subject", l:"موضوع الطلب", lEn:"Subject", t:"text", req:true, w:"full"},
      {k:"phone",   l:"هاتف العميل", lEn:"Client phone", t:"tel"},
      {k:"gov",     l:"المحافظة", lEn:"Governorate", t:"select",
       opts:["الإسكندرية","القاهرة","الجيزة","البحيرة","مطروح","الدقهلية"]},
      {k:"source",  l:"مصدر الطلب", lEn:"Source", t:"select",
       opts:["ملف المزوّد","صفحة جهاز","طلب احتياج","نتائج البحث","الخريطة"]},
      {k:"status",  l:"الحالة", lEn:"Status", t:"select", req:true,
       opts:["جديد","مُسلَّم","مُطّلع عليه","تم التواصل","مؤهل","تفاوض","مغلق ناجح","مغلق غير ناجح","مكرر","غير صالح"]},
      {k:"date",    l:"التاريخ", lEn:"Date", t:"date"},
      {k:"flag",    l:"تنبيه", lEn:"Flag", t:"text", ph:"بلا رد 31 ساعة"}
    ]
  },

  reviews: {
    label:"تقييم", labelEn:"Review", icon:"⭐",
    fields:[
      {k:"provider",l:"المزوّد", lEn:"Provider", t:"text", req:true},
      {k:"client",  l:"العميل", lEn:"Client", t:"text", req:true},
      {k:"rate",    l:"التقييم (1-5)", lEn:"Rating", t:"number", req:true, min:1, max:5},
      {k:"status",  l:"الحالة", lEn:"Status", t:"select", opts:["منشور","قيد المراجعة","مخفي","مرفوض"]},
      {k:"date",    l:"التاريخ", lEn:"Date", t:"date"},
      {k:"flags",   l:"عدد البلاغات", lEn:"Flags", t:"number", min:0},
      {k:"text",    l:"نص التقييم", lEn:"Review text", t:"textarea", w:"full", rows:4, req:true}
    ]
  },

  media: {
    label:"ملف وسائط", labelEn:"Media", icon:"🖼️",
    fields:[
      {k:"name",  l:"اسم الملف", lEn:"File name", t:"text", req:true, w:"full"},
      {k:"file",  l:"الصورة", lEn:"Image", t:"image", w:"full", req:true},
      {k:"type",  l:"النوع", lEn:"Type", t:"select", opts:["صورة","صورة مرفوعة","شعار","مستند"]},
      {k:"usedIn",l:"مواضع الاستخدام", lEn:"Used in", t:"text"},
      {k:"size",  l:"الحجم", lEn:"Size", t:"text"},
      {k:"date",  l:"تاريخ الرفع", lEn:"Upload date", t:"date"}
    ]
  }
};

/* ---------------- helpers ---------------- */
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const isImg = v => typeof v==="string" && (v.startsWith("data:image") || /\.(jpe?g|png|webp|gif|svg)$/i.test(v));

/* holds the working copy while a form is open */
let DRAFT = null;

function fieldHTML(f, val){
  const id = "fld_"+f.k;
  const req = f.req ? '<span style="color:var(--err)">*</span>' : "";
  const hint = f.hint ? `<small class="hint">${esc(f.hint)}</small>` : "";
  const w = f.w==="full" ? " full" : "";
  let input = "";

  switch(f.t){
    case "textarea":
      input = `<textarea id="${id}" rows="${f.rows||3}" data-k="${f.k}">${esc(val||"")}</textarea>`; break;
    case "select":
      input = `<select id="${id}" data-k="${f.k}">${!f.req?'<option value="">— اختر —</option>':""}`+
        (f.opts||[]).map(o=>`<option ${String(val)===String(o)?"selected":""}>${esc(o)}</option>`).join("")+`</select>`; break;
    case "bool":
      input = `<label class="check"><input type="checkbox" id="${id}" data-k="${f.k}" ${val?"checked":""}> نعم</label>`; break;
    case "multi":
      { const arr = Array.isArray(val)?val:[];
        input = `<div id="${id}" data-k="${f.k}" data-multi="1" style="display:flex;flex-wrap:wrap;gap:4px 14px">`+
          (f.opts||[]).map(o=>`<label class="check" style="margin:0"><input type="checkbox" value="${esc(o)}" ${arr.includes(o)?"checked":""}> ${esc(o)}</label>`).join("")+
          `</div>`; } break;
    case "tags":
      { const arr = Array.isArray(val)?val.join("، "):(val||"");
        input = `<input type="text" id="${id}" data-k="${f.k}" data-tags="1" value="${esc(arr)}" placeholder="${esc(f.ph||"عنصر، عنصر، عنصر")}">`; } break;
    case "image":
      input = `
        <div class="imgfield" data-k="${f.k}">
          <div class="imgprev" id="prev_${f.k}">${
            val ? `<img src="${esc(val)}" alt="">` : `<span class="muted">لا توجد صورة</span>`}</div>
          <div class="imgctl">
            <input type="file" accept="image/*" id="file_${f.k}" style="display:none"
                   onchange="CRUD.pickImage('${f.k}', this)">
            <button type="button" class="btn btn-soft btn-sm" onclick="document.getElementById('file_${f.k}').click()">📤 رفع صورة</button>
            <button type="button" class="btn btn-soft btn-sm" onclick="CRUD.pickFromLibrary('${f.k}')">🖼️ من المكتبة</button>
            ${val?`<button type="button" class="btn btn-err btn-sm" onclick="CRUD.clearImage('${f.k}')">حذف</button>`:""}
          </div>
          <input type="hidden" id="${id}" data-k="${f.k}" value="${esc(val||"")}">
          <small class="hint" id="imginfo_${f.k}">JPG / PNG — يُضغط تلقائيًا حتى 400 ك.ب</small>
        </div>`; break;
    case "number":
      input = `<input type="number" id="${id}" data-k="${f.k}" value="${esc(val??"")}"
        ${f.min!=null?`min="${f.min}"`:""} ${f.max!=null?`max="${f.max}"`:""} ${f.step?`step="${f.step}"`:""}>`; break;
    default:
      input = `<input type="${f.t||"text"}" id="${id}" data-k="${f.k}" value="${esc(val??"")}" placeholder="${esc(f.ph||"")}">`;
  }
  return `<div class="field${w}"><label for="${id}">${esc(f.l)} ${req}</label>${input}${hint}
            <small class="err-msg" id="err_${f.k}"></small></div>`;
}

const CRUD = {
  SCHEMAS,

  /* ---------- open create/edit form ---------- */
  open(coll, id){
    const sc = SCHEMAS[coll];
    if(!sc){ toast("لا يوجد مخطط لهذه المجموعة"); return; }
    const rec = id!=null ? GS.get(coll,id) : null;
    DRAFT = rec ? JSON.parse(JSON.stringify(rec)) : {};
    const title = rec ? `تعديل ${sc.label}` : `إضافة ${sc.label} جديد`;

    openModal(`
      <button class="x" onclick="closeModal()">✕</button>
      <h3>${sc.icon} ${title}</h3>
      <p class="muted">${rec?`المعرّف: <code>${coll}#${rec.id}</code> — كل تعديل يُسجَّل في سجل التدقيق`
                          :"سيُسجَّل الإنشاء في سجل التدقيق باسمك وزمنه"}</p>
      <div class="sep"></div>
      <form id="crudForm" class="formgrid" onsubmit="return false">
        ${sc.fields.map(f=>fieldHTML(f, DRAFT[f.k])).join("")}
      </form>
      <div class="notice" style="margin-top:14px">الحقول المعلّمة بـ <span style="color:var(--err)">*</span> إلزامية. لا يُحفظ السجل ناقصًا.</div>
      <div class="rowf" style="margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-cta" onclick="CRUD.submit('${coll}', ${rec?rec.id:"null"})">
          ${rec?"💾 حفظ التعديلات":"➕ إضافة وحفظ"}</button>
        <button class="btn btn-soft" onclick="closeModal()">إلغاء</button>
        ${rec?`<div style="flex:1"></div>
        <button class="btn btn-err btn-sm" onclick="CRUD.confirmDelete('${coll}',${rec.id})">🗑️ حذف</button>`:""}
      </div>`);
  },

  /* ---------- read form values ---------- */
  collect(coll){
    const sc = SCHEMAS[coll], out = {}, errs = [];
    sc.fields.forEach(f=>{
      const el = document.getElementById("fld_"+f.k);
      let v;
      if(f.t==="bool") v = el.checked;
      else if(f.t==="multi") v = [...el.querySelectorAll("input:checked")].map(i=>i.value);
      else if(f.t==="tags") v = el.value.split(/[،,]/).map(s=>s.trim()).filter(Boolean);
      else if(f.t==="number") v = el.value===""?null:Number(el.value);
      else v = el.value.trim();

      const em = document.getElementById("err_"+f.k);
      if(em) em.textContent="";
      const empty = v===null||v===""||(Array.isArray(v)&&!v.length);
      if(f.req && empty){ errs.push(f); if(em) em.textContent="هذا الحقل إلزامي"; }
      else if(f.t==="email" && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){
        errs.push(f); if(em) em.textContent="صيغة البريد غير صحيحة"; }
      else if(f.t==="tel" && v && !/^0\d{9,10}$/.test(String(v).replace(/\s/g,""))){
        errs.push(f); if(em) em.textContent="رقم الهاتف يجب أن يبدأ بـ 0 ويتكوّن من 10-11 رقمًا"; }
      else if(f.t==="number" && v!=null){
        if(f.min!=null && v<f.min){ errs.push(f); if(em) em.textContent=`أقل قيمة مسموحة ${f.min}`; }
        if(f.max!=null && v>f.max){ errs.push(f); if(em) em.textContent=`أعلى قيمة مسموحة ${f.max}`; }
      }
      out[f.k] = v;
    });
    return {data:out, errs};
  },

  async submit(coll, id){
    const {data, errs} = CRUD.collect(coll);
    if(errs.length){
      toast(`⚠ راجع ${errs.length} حقل — ${errs[0].l}`);
      const el = document.getElementById("fld_"+errs[0].k);
      if(el && el.scrollIntoView) el.scrollIntoView({block:"center",behavior:"smooth"});
      return;
    }
    if(id!=null) data.id = id;

    try {
      const saved = await GS.save(coll, data);
      closeModal();
      toast(`✅ تم ${id!=null?"حفظ التعديلات على":"إضافة"} ${SCHEMAS[coll].label}: ${saved.name||saved.title||saved.client||"#"+saved.id}`);
      if(global.refreshTable) global.refreshTable();
    } catch(err) {
      console.error("[CRUD Error]", err);
      toast("⚠ حدث خطأ أثناء الحفظ: " + (err.message || err));
    }
  },

  /* ---------- images ---------- */
  pickImage(k, input){
    const file = input.files && input.files[0]; if(!file) return;
    const info = document.getElementById("imginfo_"+k);
    if(info) info.textContent = "⏳ جارٍ معالجة ورفع الصورة…";
    GS.uploadImage(file).then(r=>{
      document.getElementById("fld_"+k).value = r.dataUrl;
      document.getElementById("prev_"+k).innerHTML = `<img src="${r.dataUrl}" alt="">`;
      if(info) info.textContent = `✅ ${r.w}×${r.h} — ${r.sizeLabel}`;
      toast("✅ تم رفع الصورة بنجاح");
    }).catch(e=>{
      if(info) info.textContent = "⚠ "+e.message;
      toast("⚠ "+e.message);
    });
  },
  clearImage(k){
    document.getElementById("fld_"+k).value="";
    document.getElementById("prev_"+k).innerHTML='<span class="muted">لا توجد صورة</span>';
    toast("تم حذف الصورة من هذا السجل");
  },
  pickFromLibrary(k){
    const lib = GS.active("media");
    const prev = document.getElementById("mbox").innerHTML;
    openModal(`<button class="x" onclick="closeModal()">✕</button><h3>🖼️ اختر من مكتبة الوسائط</h3>
      <p class="muted">${lib.length} ملف متاح</p><div class="sep"></div>
      <div class="medgrid">${lib.map(m=>`
        <button type="button" class="medcard" onclick="CRUD.useMedia('${k}', ${m.id})">
          <img src="${esc(m.file)}" alt="${esc(m.name)}">
          <span>${esc(m.name)}</span></button>`).join("")}</div>
      <div class="rowf" style="margin-top:14px"><button class="btn btn-soft" onclick="closeModal()">إلغاء</button></div>`);
    CRUD._prevModal = prev; CRUD._prevKey = k;
  },
  useMedia(k, id){
    const m = GS.get("media", id);
    closeModal();
    if(CRUD._prevModal){
      openModal(CRUD._prevModal);
      document.getElementById("fld_"+k).value = m.file;
      document.getElementById("prev_"+k).innerHTML = `<img src="${esc(m.file)}" alt="">`;
      CRUD._prevModal = null;
    }
    toast("✅ تم اختيار: "+m.name);
  },

  /* ---------- delete ---------- */
  confirmDelete(coll, id){
    const sc = SCHEMAS[coll], rec = GS.get(coll,id);
    const nm = rec ? (rec.name||rec.title||rec.client||"#"+rec.id) : "#"+id;
    openModal(`<button class="x" onclick="closeModal()">✕</button>
      <h3>🗑️ حذف ${sc.label}</h3>
      <p class="muted">${esc(nm)}</p><div class="sep"></div>
      <div class="notice">اختر الإجراء المناسب — الأرشفة قابلة للتراجع، والحذف النهائي لا يمكن التراجع عنه.</div>
      <div class="grid g2" style="margin-top:14px">
        <button class="btn btn-org" onclick="CRUD.doArchive('${coll}',${id})">📦 أرشفة (قابل للاستعادة)</button>
        <button class="btn btn-err" onclick="CRUD.doDelete('${coll}',${id},'${esc(nm).replace(/'/g,"")}')">⛔ حذف نهائي</button>
      </div>
      <div class="rowf" style="margin-top:12px"><button class="btn btn-soft btn-block" onclick="closeModal()">إلغاء</button></div>`);
  },
  async doArchive(coll,id){ 
    try {
      await GS.archive(coll,id); 
      closeModal(); 
      toast("📦 تمت الأرشفة — يمكن استعادته من تبويب المؤرشف");
      if(global.refreshTable) global.refreshTable();
    } catch(err) {
      toast("⚠ فشلت الأرشفة: " + (err.message || err));
    }
  },
  doDelete(coll,id,nm){
    openModal(`<button class="x" onclick="closeModal()">✕</button>
      <h3 style="color:var(--err)">⛔ تأكيد الحذف النهائي</h3>
      <p class="muted">${esc(nm)}</p><div class="sep"></div>
      <p>اكتب كلمة <b>حذف</b> للتأكيد. هذا الإجراء لا يمكن التراجع عنه وسيُسجَّل باسمك.</p>
      <div class="field" style="margin-top:12px"><input id="delConfirm" placeholder="اكتب: حذف" autocomplete="off"></div>
      <div class="rowf" style="margin-top:14px">
        <button class="btn btn-err" onclick="CRUD.finalDelete('${coll}',${id})">تأكيد الحذف</button>
        <button class="btn btn-soft" onclick="closeModal()">تراجع</button></div>`);
  },
  async finalDelete(coll,id){
    const v = (document.getElementById("delConfirm")||{}).value;
    if((v||"").trim()!=="حذف"){ toast("⚠ اكتب كلمة «حذف» بالضبط للتأكيد"); return; }
    try {
      await GS.remove(coll,id); 
      closeModal(); 
      toast("🗑️ تم الحذف النهائي وسُجِّل في سجل التدقيق");
      if(global.refreshTable) global.refreshTable();
    } catch(err) {
      toast("⚠ فشل الحذف: " + (err.message || err));
    }
  },
  async doRestore(coll,id){ 
    try {
      await GS.restore(coll,id); 
      toast("♻️ تمت الاستعادة"); 
      if(global.refreshTable) global.refreshTable();
    } catch(err) {
      toast("⚠ فشلت الاستعادة: " + (err.message || err));
    }
  },

  /* ---------- quick view ---------- */
  view(coll, id){
    const sc = SCHEMAS[coll], r = GS.get(coll,id);
    if(!r) return;
    openModal(`<button class="x" onclick="closeModal()">✕</button>
      <h3>${sc.icon} ${esc(r.name||r.title||r.client||"#"+r.id)}</h3>
      <p class="muted"><code>${coll}#${r.id}</code> ${r._created?" — أُنشئ "+r._created:""} ${r._updated?" — عُدّل "+r._updated:""}</p>
      <div class="sep"></div>
      <div class="viewgrid">${sc.fields.map(f=>{
        let v = r[f.k]; if(v==null||v===""||(Array.isArray(v)&&!v.length)) return "";
        if(f.t==="image"||isImg(v)) return `<div class="full"><label>${esc(f.l)}</label><img src="${esc(v)}" style="max-height:170px;border-radius:10px;margin-top:6px"></div>`;
        if(Array.isArray(v)) v = v.map(x=>`<span class="chip">${esc(x)}</span>`).join("");
        else if(f.t==="bool") v = v?'<span class="chip ok">نعم</span>':'<span class="chip">لا</span>';
        else v = esc(v);
        return `<div${f.w==="full"?' class="full"':""}><label>${esc(f.l)}</label><div>${v}</div></div>`;
      }).join("")}</div>
      <div class="rowf" style="margin-top:16px">
        <button class="btn btn-pri" onclick="CRUD.open('${coll}',${id})">✏️ تعديل</button>
        <button class="btn btn-soft" onclick="closeModal()">إغلاق</button></div>`);
  },

  /* ---------- action buttons for tables ---------- */
  actions(coll, id, archived){
    return archived
      ? `<div class="acts">
           <button class="btn btn-soft btn-sm" onclick="CRUD.view('${coll}',${id})">عرض</button>
           <button class="btn btn-ok btn-sm" onclick="CRUD.doRestore('${coll}',${id})">♻️ استعادة</button>
           <button class="btn btn-err btn-sm" onclick="CRUD.doDelete('${coll}',${id},'سجل مؤرشف')">حذف</button></div>`
      : `<div class="acts">
           <button class="btn btn-soft btn-sm" onclick="CRUD.view('${coll}',${id})">عرض</button>
           <button class="btn btn-pri btn-sm" onclick="CRUD.open('${coll}',${id})">تعديل</button>
           <button class="btn btn-err btn-sm" onclick="CRUD.confirmDelete('${coll}',${id})">حذف</button></div>`;
  },

  /* ---------- add button ---------- */
  addBtn(coll, label){
    const sc = SCHEMAS[coll];
    return `<button class="btn btn-cta" onclick="CRUD.open('${coll}')">➕ ${label||("إضافة "+sc.label)}</button>`;
  }
};

global.CRUD = CRUD;
})(window);
