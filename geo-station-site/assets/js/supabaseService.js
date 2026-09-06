/**
 * ============================================================
 *   Survsta — SUPABASE SERVICE LAYER
 *   Production Data Access Layer (DAL), Auth, Storage, and RPC
 *   Survsta — All Rights Reserved
 * ============================================================
 */

(function(global) {
  "use strict";

  // ============================================================
  // 🔑 SUPABASE CONFIGURATION — ضع مفاتيح مشروعك هنا
  // ============================================================
  const SUPABASE_URL = "";       // مثال: "https://xyzcompany.supabase.co"
  const SUPABASE_ANON_KEY = "";  // مثال: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

  const CDN_MODULE_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

  let clientInstance = null;
  let initPromise = null;

  /**
   * دالة تهيئة العميل السحابي عبر Dynamic ESM Import
   * تعمل بسلاسة في بيئة Vanilla JS العادية دون الحاجة لتعديل الوسوم في HTML
   */
  async function getClient() {
    if (clientInstance) return clientInstance;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      // إذا لم يتم ملء المفاتيح بعد، نُرجع كائن وهمي آمن لتفادي توقف الموقع
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn("⚠️ Survsta [SupabaseService]: لم يتم تعيين SUPABASE_URL و SUPABASE_ANON_KEY بعد. سيعمل النظام في وضع التخزين المحلي المؤقت (Fallback Mode).");
        return null;
      }

      try {
        const { createClient } = await import(CDN_MODULE_URL);
        clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        console.log("✅ Survsta [SupabaseService]: تم الاتصال بنجاح مع Supabase Client.");
        return clientInstance;
      } catch (err) {
        console.error("❌ Survsta [SupabaseService]: تعذر استيراد عميل Supabase من CDN:", err);
        return null;
      }
    })();

    return initPromise;
  }

  function isConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  // ============================================================
  // 1. DATA ACCESS LAYER (DAL) — دوال التعامل مع الجداول
  // ============================================================

  /**
   * جلب كافة السجلات من جدول محدد مع خيارات التصفية والفرز
   */
  async function select(table, options = {}) {
    const supabase = await getClient();
    if (!supabase) return { data: null, error: new Error("Supabase غير مهيأ") };

    try {
      let query = supabase.from(table).select(options.columns || "*");

      if (options.filters && Array.isArray(options.filters)) {
        options.filters.forEach(f => {
          if (query[f.op]) query = query[f.op](f.column, f.value);
        });
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error(`[Supabase DAL] خطأ في جلب بيانات الجدول ${table}:`, err);
      return { data: null, error: err };
    }
  }

  /**
   * جلب سجل محدد بواسطة معرّفه (ID)
   */
  async function getById(table, id) {
    const supabase = await getClient();
    if (!supabase) return { data: null, error: new Error("Supabase غير مهيأ") };

    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error(`[Supabase DAL] خطأ في جلب السجل ${table}#${id}:`, err);
      return { data: null, error: err };
    }
  }

  /**
   * إدراج سجل أو مصفوفة سجلات جديدة
   */
  async function insert(table, records) {
    const supabase = await getClient();
    if (!supabase) return { data: null, error: new Error("Supabase غير مهيأ") };

    try {
      const { data, error } = await supabase
        .from(table)
        .insert(records)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error(`[Supabase DAL] خطأ في إدراج السجل في ${table}:`, err);
      return { data: null, error: err };
    }
  }

  /**
   * تعديل سجل موجود بواسطة المعرّف
   */
  async function update(table, id, values) {
    const supabase = await getClient();
    if (!supabase) return { data: null, error: new Error("Supabase غير مهيأ") };

    try {
      const { data, error } = await supabase
        .from(table)
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select();

      if (error) throw error;
      return { data: data ? data[0] : null, error: null };
    } catch (err) {
      console.error(`[Supabase DAL] خطأ في تحديث السجل ${table}#${id}:`, err);
      return { data: null, error: err };
    }
  }

  /**
   * حذف سجل نهائياً
   */
  async function remove(table, id) {
    const supabase = await getClient();
    if (!supabase) return { success: false, error: new Error("Supabase غير مهيأ") };

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      console.error(`[Supabase DAL] خطأ في حذف السجل ${table}#${id}:`, err);
      return { success: false, error: err };
    }
  }

  // ============================================================
  // 2. SPECIFIC ENTITY HELPERS — دوال الكيانات المخصصة
  // ============================================================

  const Providers = {
    getAll: () => select("providers", { orderBy: "created_at", ascending: false }),
    getById: (id) => getById("providers", id),
    update: (id, data) => update("providers", id, data)
  };

  const Equipment = {
    getAll: () => select("equipment", { orderBy: "created_at", ascending: false }),
    getById: (id) => getById("equipment", id),
    create: (data) => insert("equipment", data),
    update: (id, data) => update("equipment", id, data),
    delete: (id) => remove("equipment", id)
  };

  const Leads = {
    getAll: () => select("leads", { orderBy: "created_at", ascending: false }),
    getById: (id) => getById("leads", id),
    create: (data) => insert("leads", data),
    update: (id, data) => update("leads", id, data)
  };

  const Reviews = {
    getAll: () => select("reviews", { orderBy: "created_at", ascending: false }),
    create: (data) => insert("reviews", data)
  };

  const Wallet = {
    getTransactions: (providerId) => select("wallet_transactions", {
      filters: providerId ? [{ op: "eq", column: "provider_id", value: providerId }] : [],
      orderBy: "created_at",
      ascending: false
    })
  };

  // ============================================================
  // 3. AUTH WRAPPERS — دوال الهوية والمصادقة
  // ============================================================

  async function signIn({ email, password }) {
    const supabase = await getClient();
    if (!supabase) return { data: null, error: new Error("Supabase غير مهيأ") };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function signUp({ email, password, options = {} }) {
    const supabase = await getClient();
    if (!supabase) return { data: null, error: new Error("Supabase غير مهيأ") };

    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async function signOut() {
    const supabase = await getClient();
    if (!supabase) return { error: null };

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  async function getSession() {
    const supabase = await getClient();
    if (!supabase) return { session: null, error: null };

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (err) {
      return { session: null, error: err };
    }
  }

  async function getUser() {
    const supabase = await getClient();
    if (!supabase) return { user: null, error: null };

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (err) {
      return { user: null, error: err };
    }
  }

  async function onAuthStateChange(callback) {
    const supabase = await getClient();
    if (!supabase) return { unsubscribe: () => {} };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  }

  // ============================================================
  // 4. STORAGE WRAPPERS — دوال رفع وإدارة الملفات السحابية
  // ============================================================

  /**
   * رفع ملف إلى Supabase Storage
   * @param {File|Blob} file ملف الصورة أو المستند
   * @param {string} bucket اسم الحاوية (equipment-images, calibration-certs, resumes)
   * @param {string} [path] المسار الاختياري داخل الحاوية
   */
  async function uploadFile(file, bucket = "equipment-images", path = null) {
    const supabase = await getClient();
    if (!supabase) return { publicUrl: null, error: new Error("Supabase غير مهيأ") };

    try {
      const ext = file.name ? file.name.split(".").pop() : "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path ? `${path.replace(/\/$/, "")}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (error) throw error;

      // توليد الرابط العام إذا كان الباكت عاماً
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return { publicUrl: urlData.publicUrl, path: data.path, error: null };
    } catch (err) {
      console.error(`[Supabase Storage] خطأ أثناء رفع الملف إلى ${bucket}:`, err);
      return { publicUrl: null, error: err };
    }
  }

  // ============================================================
  // 5. RPC WRAPPER: UNLOCK LEAD & CHARGE (PAY-PER-LEAD)
  // ============================================================

  /**
   * استدعاء الإجراء المخزن open_lead_and_charge لفتح الطلب وخصم الرصيد ذرياً
   * @param {string|number} leadId معرّف الطلب
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async function unlockLeadAndCharge(leadId) {
    const supabase = await getClient();
    if (!supabase) {
      return { 
        data: null, 
        error: new Error("Supabase غير مهيأ. تأكد من إعداد SUPABASE_URL و SUPABASE_ANON_KEY") 
      };
    }

    try {
      // استدعاء دالة الـ Postgres Function المنفذة في قاعدة البيانات
      const { data, error } = await supabase.rpc("open_lead_and_charge", {
        p_lead_id: leadId
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error(`[Supabase RPC] فشل إجراء خصم الليد #${leadId}:`, err);
      return { data: null, error: err };
    }
  }

  // ============================================================
  // تصدير الواجهة العامة للكائن
  // ============================================================
  const SupabaseService = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    isConfigured,
    getClient,
    select,
    getById,
    insert,
    update,
    remove,
    Providers,
    Equipment,
    Leads,
    Reviews,
    Wallet,
    Auth: { signIn, signUp, signOut, getSession, getUser, onAuthStateChange },
    Storage: { uploadFile },
    unlockLeadAndCharge
  };

  global.SupabaseService = SupabaseService;

  // دعم الاستيراد كـ ES Module إن رغب المطور بذلك
  if (typeof module !== "undefined" && module.exports) {
    module.exports = SupabaseService;
  }

})(typeof window !== "undefined" ? window : globalThis);
