/* GEO STATION — shared shell, components & interactions
   Concept, UX/UI & Platform Architecture by Eng. Mohamed Farag — CoreviaZone */

const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const qs = (k)=>new URLSearchParams(location.search).get(k)||"";
const stars = r=>"★".repeat(Math.round(r))+"☆".repeat(5-Math.round(r));
const money = e=>e.price==="حسب العرض"||e.price==="حسب المدة"?`<span class="price">${e.price}</span>`:`<span class="price">${e.price} <small>${e.unit}</small></span>`;
const pv = id=>PROVIDERS.find(p=>p.id===id);

/* ---------------- shell ---------------- */
const NAV = [
  {t:"الرئيسية", h:"index.html"},
  {t:"الدليل", h:"directory.html", sub:PROVIDER_TYPES.map(x=>({t:x.name, h:`providers.html?type=${x.slug}`, d:x.desc}))},
  {t:"الأجهزة", h:"equipment.html", sub:[
    {t:"كل الأجهزة", h:"equipment.html", d:"تصفح كل المعروض للبيع والإيجار"},
    {t:"أجهزة للإيجار", h:"equipment.html?mode=rent", d:"تأجير يومي وأسبوعي وشهري"},
    {t:"أجهزة للبيع", h:"equipment.html?mode=sale", d:"جديد ومستعمل من موردين معتمدين"},
    {t:"Total Station", h:"equipment.html?cat=Total%20Station", d:"أجهزة محطات رصد شاملة"},
    {t:"GNSS / RTK", h:"equipment.html?cat=GNSS%20%2F%20RTK", d:"أطقم استقبال أقمار صناعية"}
  ]},
  {t:"الخدمات", h:"services.html"},
  {t:"الخريطة", h:"map.html"},
  {t:"Academy", h:"academy.html", badge:"قريباً"},
  {t:"الوظائف", h:"jobs.html"},
  {t:"عن المنصة", h:"about.html", sub:[
    {t:"كيف تعمل المنصة", h:"how-it-works.html", d:"رحلة العميل والمزوّد خطوة بخطوة"},
    {t:"من نحن", h:"about.html", d:"الرؤية والفريق ونموذج العمل"},
    {t:"تطبيق الموبايل", h:"mobile-app.html", d:"تحميل التطبيق لأندرويد وiOS"},
    {t:"المساعدة والأسئلة", h:"help.html", d:"إجابات لأكثر الاستفسارات شيوعًا"},
    {t:"تواصل معنا", h:"contact.html", d:"فريق الدعم وخدمة الشركاء"}
  ]}
];

function buildHeader(active){
  const badgeHtml = b => b ? ` <span class="badge-soon" style="background:#fef3c7;color:#92400e;font-size:10px;font-weight:700;padding:2px 7px;border-radius:12px;border:1px solid #fde68a;margin-right:5px;vertical-align:middle;display:inline-block;line-height:1.2;">${b}</span>` : "";
  const link = n => n.sub
    ? `<div class="dd"><button>${n.t}${badgeHtml(n.badge)} <span style="font-size:10px">▾</span></button>
        <div class="dd-menu">${n.sub.map(s=>`<a href="${s.h}"><b>${s.t}${badgeHtml(s.badge)}</b>${s.d?`<small>${s.d}</small>`:""}</a>`).join("")}</div></div>`
    : `<a href="${n.h}" class="${active===n.h?"active":""}">${n.t}${badgeHtml(n.badge)}</a>`;
  return `
<div class="utility"><div class="wrap">
  <div>📍 نخدم حاليًا: الإسكندرية والقاهرة والجيزة — التوسع تباعًا لباقي المحافظات</div>
  <div class="u-right">
    <a href="mobile-app.html">📱 حمّل التطبيق</a>
    <a href="help.html">المساعدة</a>
    <a href="contact.html">تواصل معنا</a>
    <span id="nav-auth-util"><a href="login.html">🔐 دخول الشركاء</a></span>
    ${I18N.button()}
  </div>
</div></div>
<header class="header"><div class="wrap">
  <a href="index.html" class="brand"><span class="mark">◎</span><span class="bname" dir="ltr">GEO <span>STATION</span></span></a>
  <nav class="mainnav" id="mainnav">${NAV.map(link).join("")}</nav>
  <div class="head-actions">
    <span id="nav-auth-cta"><a href="join.html" class="btn btn-ghost btn-sm">انضم كشريك</a></span>
    <button class="btn btn-pri btn-sm" onclick="openModal('need')">أضف احتياجك</button>
    <button class="burger" onclick="$('#mainnav').classList.toggle('open')">☰</button>
  </div>
</div></header>`;
}

function buildFooter(){
  return `
<footer class="footer"><div class="wrap">
  <div class="fgrid">
    <div>
      <div class="brand" style="color:#fff"><span class="mark">◎</span><span class="bname" dir="ltr">GEO <span>STATION</span></span></div>
      <p style="margin-top:12px;font-size:13.5px;max-width:330px">المنصة الرقمية المتخصصة لقطاع المساحة والجيوماتكس في مصر — دليل، سوق أجهزة، خدمات، تدريب ووظائف في مكان واحد.</p>
      <div class="appbtns">
        <a class="storebtn" href="mobile-app.html" aria-label="Google Play"><svg viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="#4285F4" d="M47.6 12.5C42.6 17.8 39.7 26 39.7 36.6v438.8c0 10.6 2.9 18.8 7.9 24.1l1.5 1.4L295 255.9v-5.8L49.1 11.1z"/><path fill="#FBBC04" d="m377 337.8-82-82v-5.8l82.1-82.1 1.8 1.1 97.2 55.2c27.8 15.8 27.8 41.6 0 57.4l-97.2 55.2z"/><path fill="#EA4335" d="m378.9 336.7-83.9-83.9L47.6 499.5c9.2 9.7 24.3 10.9 41.4 1.2l289.9-164"/><path fill="#34A853" d="M378.9 168.9 89 5C71.9-4.7 56.8-3.5 47.6 6.2L295 252.8z"/></svg><span class="txt"><small>متاح قريبًا على</small><b>Google Play</b></span></a>
        <a class="storebtn" href="mobile-app.html" aria-label="App Store"><svg viewBox="0 0 384 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg><span class="txt"><small>متاح قريبًا على</small><b>App Store</b></span></a>
      </div>
    </div>
    <div><h4>استكشف</h4>
      <a href="directory.html">دليل المكاتب والشركات</a>
      <a href="equipment.html">سوق الأجهزة</a>
      <a href="services.html">الخدمات المساحية</a>
      <a href="map.html">الخريطة التفاعلية</a>
      <a href="academy.html">Academy <span style="background:#fef3c7;color:#92400e;font-size:9.5px;font-weight:700;padding:1px 5px;border-radius:4px;margin-right:4px;">قريباً</span></a>
      <a href="jobs.html">الوظائف</a></div>
    <div><h4>للشركاء</h4>
      <a href="login.html">🔐 تسجيل الدخول</a>
      <a href="register.html">✨ فتح حساب جديد</a>
      <a href="join.html">سجّل مكتبك أو شركتك</a>
      <a href="how-it-works.html">كيف تعمل المنصة</a>
      <a href="contact.html">خدمة الشركاء</a>
      <a href="p-dashboard.html">لوحة المزوّد</a>
      <a href="a-dashboard.html">لوحة الإدارة</a></div>
    <div><h4>المنصة</h4>
      <a href="about.html">من نحن</a>
      <a href="help.html">المساعدة والأسئلة</a>
      <a href="contact.html">تواصل معنا</a>
      <a href="terms.html">الشروط والأحكام</a>
      <a href="privacy.html">سياسة الخصوصية</a></div>
  </div>
  <div class="fbot">
    <div>© ${new Date().getFullYear()} Geo Station — جميع الحقوق محفوظة.</div>
    <div class="credit">Concept, UX/UI &amp; Platform Architecture by Eng. Mohamed Farag — CoreviaZone</div>
  </div>
</div></footer>
<div class="modal" id="modal" onclick="if(event.target===this)closeModal()"><div class="mbox" id="mbox"></div></div>
<div class="toast" id="toast"></div>`;
}

function mountShell(active){
  document.body.insertAdjacentHTML("afterbegin", buildHeader(active));
  document.body.insertAdjacentHTML("beforeend", buildFooter());
  updateNavbarAuth();
}

async function updateNavbarAuth(){
  const utilEl = document.getElementById("nav-auth-util");
  const ctaEl = document.getElementById("nav-auth-cta");
  if (!utilEl && !ctaEl) return;

  let user = null;
  if (typeof window.AuthGuard !== "undefined" && window.AuthGuard.getUser) {
    user = await window.AuthGuard.getUser();
  } else if (localStorage.getItem("GS_AUTH_USER") && localStorage.getItem("GS_LOGGED_OUT") !== "1") {
    try { user = JSON.parse(localStorage.getItem("GS_AUTH_USER")); } catch(e){}
  }

  if (user) {
    const isAdm = user.role === "admin" || user.role === "super_admin";
    const dashHref = isAdm ? "a-dashboard.html" : "p-dashboard.html";
    const dashLabel = isAdm ? "لوحة الإدارة" : "لوحة التحكم";

    if (utilEl) {
      utilEl.innerHTML = `
        <a href="${dashHref}" style="color:var(--cyan);font-weight:700">👤 ${user.name || "حسابي"}</a>
        <a href="javascript:void(0)" onclick="if(window.AuthGuard){AuthGuard.logout()}else{localStorage.removeItem('GS_AUTH_USER');location.reload()}" style="color:#f87171;margin-inline-start:10px">🚪 خروج</a>
      `;
    }
    if (ctaEl) {
      ctaEl.innerHTML = `
        <a href="${dashHref}" class="btn btn-ghost btn-sm" style="border-color:var(--cyan);color:var(--cyan)">📊 ${dashLabel}</a>
        <button class="btn btn-soft btn-sm" onclick="if(window.AuthGuard){AuthGuard.logout()}else{localStorage.removeItem('GS_AUTH_USER');location.reload()}" style="color:#ef4444" title="تسجيل الخروج">خروج</button>
      `;
    }
  }
}

/* ---------------- ui helpers ---------------- */
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._i);t._i=setTimeout(()=>t.classList.remove("show"),3000)}
function openModal(k,arg){$("#mbox").innerHTML=MODALS[k]?MODALS[k](arg):"";$("#modal").classList.add("open");document.body.style.overflow="hidden"}
function closeModal(){$("#modal").classList.remove("open");document.body.style.overflow=""}

/* ---------------- cards ---------------- */
function providerCard(p){
  return `<article class="mcard">
    <a href="provider.html?slug=${p.slug}"><div class="thumb"><img src="${p.img}" alt="${p.name}" loading="lazy">
      <div class="badges">${p.featured?'<span class="chip spon">⭐ مميّز</span>':""}<span class="chip solid">${p.type}</span></div></div></a>
    <div class="body">
      <a href="provider.html?slug=${p.slug}"><h3>${p.name}</h3></a>
      <div class="muted">📍 ${p.gov} — ${p.city} • منذ ${p.since}</div>
      <div style="margin-top:7px"><span class="stars">${stars(p.rate)}</span> <span class="muted">${p.rate} (${p.reviews} تقييم)</span></div>
      <div style="margin-top:8px">${p.svc.slice(0,3).map(s=>`<span class="chip">${s}</span>`).join("")}</div>
      <div style="margin-top:8px">${p.ver.map(v=>`<span class="chip ok">✔ ${v}</span>`).join("")}</div>
      <div class="rowb" style="margin-top:14px">
        <span class="muted">⏱ يرد ${p.resp}</span>
        <button class="btn btn-pri btn-sm" onclick="openModal('contact','${p.name}')">طلب تواصل</button>
      </div>
    </div></article>`;
}

function equipmentCard(e){
  const p=pv(e.pid);
  return `<article class="mcard">
    <a href="equipment-detail.html?slug=${e.slug}"><div class="thumb"><img src="${e.img}" alt="${e.title}" loading="lazy">
      <div class="badges">
        ${e.modes.includes("rent")?'<span class="chip solid">إيجار</span>':""}
        ${e.modes.includes("sale")?'<span class="chip solid">بيع</span>':""}
        <span class="chip ${e.avail.includes("متاح")?"ok":"warn"}">${e.avail}</span></div></div></a>
    <div class="body">
      <a href="equipment-detail.html?slug=${e.slug}"><h3>${e.title}</h3></a>
      <div class="muted">${e.cat} • ${e.brand} • 📍 ${e.gov}</div>
      <div style="margin-top:7px"><span class="chip">${e.cond}</span><span class="chip">موديل ${e.year}</span></div>
      <div style="margin-top:11px">${money(e)}</div>
      <div class="muted" style="margin-top:6px">المزوّد: <a href="provider.html?slug=${p.slug}" style="color:var(--cyan-d);font-weight:700">${p.name}</a></div>
      <button class="btn btn-pri btn-sm btn-block" style="margin-top:12px" onclick="openModal('contact','${e.title}')">طلب تواصل</button>
    </div></article>`;
}

function jobCard(j){
  return `<article class="card hov" onclick="location.href='job.html?slug=${j.slug}'">
    <div class="rowb"><h3 style="margin:0">${j.t}</h3><span class="chip cy">${j.type}</span></div>
    <div class="muted" style="margin-top:7px">${j.company} • 📍 ${j.gov} • خبرة ${j.exp}</div>
    <p style="margin-top:9px">${j.d}</p>
    <div class="rowb" style="margin-top:13px">
      <span class="muted">🕒 ${j.posted} • 💰 ${j.salary}</span>
      <button class="btn btn-soft btn-sm" onclick="event.stopPropagation();openModal('apply','${j.t}')">تقديم سريع</button></div>
  </article>`;
}

function serviceCard(s){
  return `<article class="mcard">
    <a href="service.html?slug=${s.slug}"><div class="thumb" style="height:150px"><img src="${s.img}" alt="${s.t}" loading="lazy"></div></a>
    <div class="body">
      <div class="ico">${s.icon}</div>
      <a href="service.html?slug=${s.slug}"><h3 style="margin-top:11px">${s.t}</h3></a>
      <div class="muted">${s.cat}</div>
      <p style="margin-top:8px">${s.d}</p>
      <div class="rowb" style="margin-top:12px"><span class="chip cy">${s.n} جهة مقدّمة</span>
        <a href="service.html?slug=${s.slug}" class="btn btn-soft btn-sm">التفاصيل ←</a></div>
    </div></article>`;
}

function courseCard(c){
  return `<article class="mcard">
    <a href="course.html?slug=${c.slug}"><div class="thumb" style="height:160px"><img src="${c.img}" alt="${c.t}" loading="lazy">
      <div class="badges"><span class="chip solid">${c.lvl}</span></div></div></a>
    <div class="body">
      <a href="course.html?slug=${c.slug}"><h3>${c.t}</h3></a>
      <div class="muted">${c.center} • ${c.hours}</div>
      <p style="margin-top:8px">${c.d}</p>
      <div class="rowb" style="margin-top:12px"><b>${c.price}</b>
        <a href="course.html?slug=${c.slug}" class="btn btn-soft btn-sm">تفاصيل الدورة</a></div>
    </div></article>`;
}

/* ---------------- modals ---------------- */
const MODALS = {
 contact:(name="المزوّد")=>`<button class="x" onclick="closeModal()">✕</button>
  <h3>طلب تواصل</h3><p class="muted">بخصوص: <b>${name}</b></p><div class="sep"></div>
  <form onsubmit="event.preventDefault();closeModal();toast('✅ تم إنشاء طلب التواصل — سيصلك رد المزوّد على رقمك')">
  <div class="formgrid">
    <div class="field"><label>الاسم *</label><input required placeholder="الاسم بالكامل"></div>
    <div class="field"><label>رقم الهاتف *</label><input required placeholder="01xxxxxxxxx"></div>
    <div class="field"><label>نوع الطلب</label><select><option>استفسار عن خدمة</option><option>تأجير جهاز</option><option>شراء جهاز</option><option>معايرة أو صيانة</option><option>تدريب</option></select></div>
    <div class="field"><label>المحافظة</label><select>${GOVS.map(g=>`<option>${g}</option>`).join("")}</select></div>
    <div class="field full"><label>تفاصيل الطلب</label><textarea rows="3" placeholder="اشرح احتياجك باختصار: نوع العمل، المساحة، المدة..."></textarea></div>
  </div>
  <label class="muted" style="display:flex;gap:9px;margin:14px 0"><input type="checkbox" checked required> أوافق على مشاركة بياناتي مع الجهة المختارة وفق شروط المنصة.</label>
  <div class="notice">Geo Station منصة ربط وتوليد طلبات؛ الاتفاق والتنفيذ والسداد تتم مباشرة بين الطرفين.</div>
  <button class="btn btn-pri btn-block btn-lg" style="margin-top:14px">إرسال الطلب</button></form>`,

 need:()=>`<button class="x" onclick="closeModal()">✕</button>
  <h3>أضف احتياجك</h3><p class="muted">اكتبه مرة واحدة، وتوجّهه المنصة تلقائيًا للمزوّدين المؤهلين في نطاقك.</p>
  <form onsubmit="event.preventDefault();closeModal();toast('✅ تم استلام احتياجك — جارٍ مطابقته مع المزوّدين المناسبين')">
  <div class="formgrid" style="margin-top:14px">
    <div class="field"><label>نوع الاحتياج</label><select><option>خدمة مساحية</option><option>تأجير جهاز</option><option>شراء جهاز</option><option>معايرة أو صيانة</option><option>تدريب</option><option>توظيف</option></select></div>
    <div class="field"><label>الفئة</label><select>${SERVICES.map(s=>`<option>${s.t}</option>`).join("")}</select></div>
    <div class="field"><label>المحافظة</label><select>${GOVS.map(g=>`<option>${g}</option>`).join("")}</select></div>
    <div class="field"><label>موعد البدء التقريبي</label><input type="date"></div>
    <div class="field full"><label>وصف الاحتياج *</label><textarea required rows="3" placeholder="المساحة، الموقع التقريبي، المخرجات المطلوبة، المدة..."></textarea></div>
    <div class="field"><label>الاسم *</label><input required></div>
    <div class="field"><label>رقم الهاتف *</label><input required placeholder="01xxxxxxxxx"></div>
    <div class="field"><label>الميزانية (اختياري — خاصة)</label><input placeholder="غير إلزامي"></div>
    <div class="field"><label>وسيلة التواصل المفضّلة</label><select><option>واتساب</option><option>مكالمة هاتفية</option><option>بريد إلكتروني</option></select></div>
  </div>
  <label class="muted" style="display:flex;gap:9px;margin:14px 0"><input type="checkbox" checked required> أوافق على توجيه طلبي للمزوّدين المطابقين وفق شروط المنصة.</label>
  <button class="btn btn-org btn-block btn-lg">إرسال الاحتياج</button></form>`,

 apply:(t="الوظيفة")=>`<button class="x" onclick="closeModal()">✕</button>
  <h3>التقديم على: ${t}</h3><p class="muted">سيصل تقديمك لجهة العمل بعد مراجعة سريعة من الإدارة.</p>
  <form onsubmit="event.preventDefault();closeModal();toast('✅ تم إرسال تقديمك بنجاح')">
  <div class="formgrid" style="margin-top:14px">
    <div class="field"><label>الاسم *</label><input required></div>
    <div class="field"><label>رقم الهاتف *</label><input required></div>
    <div class="field"><label>سنوات الخبرة</label><input placeholder="مثال: 5"></div>
    <div class="field"><label>المحافظة</label><select>${GOVS.map(g=>`<option>${g}</option>`).join("")}</select></div>
    <div class="field full"><label>السيرة الذاتية (PDF)</label><input type="file"></div>
    <div class="field full"><label>رسالة قصيرة</label><textarea rows="3" placeholder="لماذا أنت مناسب لهذه الوظيفة؟"></textarea></div>
  </div>
  <button class="btn btn-pri btn-block btn-lg" style="margin-top:14px">إرسال التقديم</button></form>`,

 enroll:(t="الدورة")=>`<button class="x" onclick="closeModal()">✕</button>
  <h3>طلب التحاق: ${t}</h3><p class="muted">يتم توجيه طلبك لمركز التدريب المسؤول عن الدورة.</p>
  <form onsubmit="event.preventDefault();closeModal();toast('✅ تم إرسال طلب الالتحاق لمركز التدريب')">
  <div class="formgrid" style="margin-top:14px">
    <div class="field"><label>الاسم *</label><input required></div>
    <div class="field"><label>رقم الهاتف *</label><input required></div>
    <div class="field"><label>المستوى الحالي</label><select><option>مبتدئ</option><option>لدي خبرة عملية</option><option>محترف</option></select></div>
    <div class="field"><label>الموعد المفضّل</label><select><option>صباحي — أيام الأسبوع</option><option>مسائي — أيام الأسبوع</option><option>نهاية الأسبوع</option></select></div>
  </div>
  <button class="btn btn-pri btn-block btn-lg" style="margin-top:14px">إرسال الطلب</button></form>`,

 report:()=>`<button class="x" onclick="closeModal()">✕</button>
  <h3>الإبلاغ عن محتوى</h3><p class="muted">تُراجع البلاغات من فريق الإدارة وتُسجَّل في سجل التدقيق.</p>
  <form onsubmit="event.preventDefault();closeModal();toast('تم استلام بلاغك — سيُراجع خلال 48 ساعة')">
  <div class="field" style="margin-top:14px"><label>سبب البلاغ</label>
    <select><option>بيانات غير صحيحة</option><option>الجهة غير موجودة</option><option>محتوى مخالف</option><option>ملف مكرر</option><option>سلوك غير مهني</option></select></div>
  <div class="field" style="margin-top:12px"><label>تفاصيل إضافية</label><textarea rows="3"></textarea></div>
  <button class="btn btn-pri btn-block" style="margin-top:14px">إرسال البلاغ</button></form>`
};

/* ---------------- filtering ---------------- */
function readFilters(){
  return {
    q:    $("#f-q")?.value.trim() || "",
    gov:  $("#f-gov")?.value || "",
    cat:  $("#f-cat")?.value || "",
    mode: $("#f-mode")?.value || "",
    sort: $("#f-sort")?.value || "relevance",
    verified: $("#f-ver")?.checked || false,
    top:  $("#f-top")?.checked || false
  };
}

function filterProviders(f, base=PROVIDERS){
  let r = base.filter(p=>
    (!f.q || p.name.includes(f.q) || p.svc.some(s=>s.includes(f.q)) || p.city.includes(f.q)) &&
    (!f.gov || p.gov===f.gov) &&
    (!f.cat || p.cat===f.cat) &&
    (!f.verified || p.ver.length>1) &&
    (!f.top || p.rate>=4.5));
  if(f.sort==="rating")   r=[...r].sort((a,b)=>b.rate-a.rate);
  if(f.sort==="reviews")  r=[...r].sort((a,b)=>b.reviews-a.reviews);
  if(f.sort==="featured") r=[...r].sort((a,b)=>b.featured-a.featured);
  if(f.sort==="newest")   r=[...r].sort((a,b)=>b.since-a.since);
  else if(f.sort==="relevance") r=[...r].sort((a,b)=>(b.featured-a.featured)||(b.rate-a.rate));
  return r;
}

function filterEquipment(f){
  const ql=f.q.toLowerCase();
  let r = EQUIPMENT.filter(e=>
    (!f.q || e.title.toLowerCase().includes(ql) || e.brand.toLowerCase().includes(ql) || e.cat.toLowerCase().includes(ql)) &&
    (!f.gov || e.gov===f.gov) &&
    (!f.cat || e.cat===f.cat) &&
    (!f.mode || e.modes.includes(f.mode)));
  if(f.sort==="newest") r=[...r].sort((a,b)=>b.year-a.year);
  return r;
}

/* ---------------- shared blocks ---------------- */
function trustBand(){
  return `<section class="sec alt"><div class="wrap">
    <div class="grid g4">
    ${[["✅","توثيق متدرّج","شارات تعكس فقط ما تمّت مراجعته فعليًا — بدون ادعاءات."],
       ["📍","نتائج قائمة على الموقع","بحث بالمحافظة والمدينة ونطاق الخدمة والأقرب إليك."],
       ["⚡","رد سريع","متوسط زمن الرد ظاهر على كل ملف قبل ما تتواصل."],
       ["🔐","خصوصية بياناتك","لا تُشارك بياناتك إلا مع الجهة التي تختارها بموافقتك."]]
      .map(([i,t,d])=>`<div class="card"><div class="ico">${i}</div><h3>${t}</h3><p>${d}</p></div>`).join("")}
    </div></div></section>`;
}

function ctaBand(){
  return `<section class="sec"><div class="wrap"><div class="band">
    <div><h2>عندك احتياج محدد؟ خلّي المزوّدين يوصلوك</h2>
      <p>اكتب احتياجك مرة واحدة، وتوجّهه Geo Station للمكاتب والشركات المؤهلة في نطاقك الجغرافي — مجانًا وبدون التزام.</p></div>
    <div class="rowf">
      <button class="btn btn-org btn-lg" onclick="openModal('need')">أضف احتياجك</button>
      <a href="join.html" class="btn btn-ghost btn-lg">انضم كشريك</a></div>
  </div></div></section>`;
}
