/**
 * ============================================================
 *   GEO STATION — AUTH GUARD & RBAC SESSION MANAGER
 *   Role-Based Access Control (RBAC) for Provider & Admin Portals
 *   Concept, UX/UI & Platform Architecture by Eng. Mohamed Farag — CoreviaZone
 * ============================================================
 */

(function(global) {
  "use strict";

  const STORAGE_KEY_USER = "GS_AUTH_USER";
  const STORAGE_KEY_LOGGED_OUT = "GS_LOGGED_OUT";

  const DEFAULT_ADMIN = {
    id: "admin-demo-1",
    email: "admin@geostation.eg",
    name: "م. محمد فرج",
    role: "super_admin",
    org: "Geo Station Admin",
    av: "مف"
  };

  const DEFAULT_PROVIDER = {
    id: "provider-demo-1",
    email: "elite@provider.eg",
    name: "م. أحمد النجار",
    role: "provider",
    org: "مكتب النخبة للمساحة",
    av: "أن"
  };

  const AuthGuard = {
    /**
     * هل مفاتيح Supabase مهيأة وحقيقية؟
     */
    isCloudMode() {
      return typeof global.SupabaseService !== "undefined" && global.SupabaseService.isConfigured();
    },

    /**
     * الحصول على المستخدم الحالي (حقيقي من السحابة أو من الجلسة المحلية)
     */
    async getUser() {
      // 1. إذا كان Supabase مهيأ
      if (this.isCloudMode()) {
        try {
          const { session } = await global.SupabaseService.Auth.getSession();
          if (session && session.user) {
            const u = session.user;
            const meta = u.user_metadata || {};
            const role = meta.role || u.app_metadata?.role || "provider";
            const userObj = {
              id: u.id,
              email: u.email,
              name: meta.full_name || meta.name || u.email.split("@")[0],
              role: role,
              org: meta.org_name || (role === "admin" || role === "super_admin" ? "Geo Station Admin" : "مكتب شريك"),
              av: (meta.full_name || u.email).substring(0, 2).toUpperCase()
            };
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));
            localStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
            return userObj;
          }
        } catch (e) {
          console.warn("[AuthGuard] تعذر جلب جلسة Supabase:", e);
        }
      }

      // 2. وضع المحاكاة / التخزين المحلي (Fallback Mode)
      if (localStorage.getItem(STORAGE_KEY_LOGGED_OUT) === "1") {
        return null;
      }

      const cached = localStorage.getItem(STORAGE_KEY_USER);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY_USER);
        }
      }

      // إذا لم يكن هناك تسجيل خروج صريح في وضع العرض، نوفر جلسة افتراضية متوافقة
      const page = this.getCurrentPage();
      if (page.startsWith("a-")) {
        return DEFAULT_ADMIN;
      } else if (page.startsWith("p-")) {
        return DEFAULT_PROVIDER;
      }

      return null;
    },

    /**
     * جلب الصفحة الحالية
     */
    getCurrentPage() {
      const parts = (location.pathname || "").split("/");
      return parts[parts.length - 1] || "index.html";
    },

    /**
     * فحص صلاحيات الصفحة الحالية وتطبيق الحماية (RBAC Guard)
     */
    async check() {
      const page = this.getCurrentPage();
      const isProvider = page.startsWith("p-");
      const isAdmin = page.startsWith("a-");

      // الصفحات العامة لا تحتاج تحقق حظر
      if (!isProvider && !isAdmin) return true;

      const user = await this.getUser();

      // إذا لم يكن مسجل الدخول نهائياً
      if (!user) {
        console.warn(`[AuthGuard] وصول غير مصرح لصفحة (${page}) — تحويل لصفحة تسجيل الدخول.`);
        const redirectUrl = `login.html?redirect=${encodeURIComponent(page + location.search)}`;
        location.href = redirectUrl;
        return false;
      }

      // فحص صلاحيات الإدارة (Admin Guard)
      if (isAdmin) {
        const allowed = user.role === "admin" || user.role === "super_admin";
        if (!allowed) {
          alert("⚠️ عذرًا: هذه الصفحة مخصصة لمديري النظام فقط. سيتم تحويلك إلى لوحة المزوّد.");
          location.href = "p-dashboard.html";
          return false;
        }
      }

      // فحص صلاحيات المزوّد (Provider Guard)
      if (isProvider) {
        if (user.role === "client") {
          alert("⚠️ عذرًا: حسابك مسجل كـ 'عميل'. هذه اللوحة مخصصة للشركاء ومزودي الخدمات.");
          location.href = "index.html";
          return false;
        }
      }

      return true;
    },

    /**
     * تسجيل الدخول
     */
    async signIn(email, password, mockRole = null) {
      localStorage.removeItem(STORAGE_KEY_LOGGED_OUT);

      // إذا كان Supabase متصلاً
      if (this.isCloudMode()) {
        const res = await global.SupabaseService.Auth.signIn({ email, password });
        if (res.error) return res;
        await this.getUser();
        return { user: await this.getUser(), error: null };
      }

      // محاكاة تسجيل الدخول المحلي (Demo / Offline Mode)
      const role = mockRole || (email.includes("admin") ? "super_admin" : "provider");
      const user = role === "super_admin" || role === "admin"
        ? { ...DEFAULT_ADMIN, email }
        : { ...DEFAULT_PROVIDER, email };

      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return { user, error: null };
    },

    /**
     * تسجيل مستخدم جديد
     */
    async signUp(email, password, metadata = {}) {
      localStorage.removeItem(STORAGE_KEY_LOGGED_OUT);

      if (this.isCloudMode()) {
        return await global.SupabaseService.Auth.signUp({
          email,
          password,
          options: { data: metadata }
        });
      }

      // محاكاة التسجيل المحلي
      const role = metadata.role || "provider";
      const user = {
        id: "usr-" + Date.now(),
        email,
        name: metadata.full_name || email.split("@")[0],
        role: role,
        org: metadata.org_name || (role === "admin" ? "Geo Station Admin" : "مكتب مساحة"),
        av: (metadata.full_name || email).substring(0, 2).toUpperCase()
      };
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      return { user, error: null };
    },

    /**
     * تسجيل الخروج
     */
    async logout() {
      if (this.isCloudMode()) {
        try {
          await global.SupabaseService.Auth.signOut();
        } catch (e) {
          console.error("[AuthGuard] خطأ أثناء تسجيل الخروج من السحابة:", e);
        }
      }

      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.setItem(STORAGE_KEY_LOGGED_OUT, "1");

      const page = this.getCurrentPage();
      if (page.startsWith("p-") || page.startsWith("a-")) {
        location.href = "login.html";
      } else {
        location.reload();
      }
    }
  };

  global.AuthGuard = AuthGuard;

  // التشغيل التلقائي لفحص الصلاحيات عند تحميل الصفحة
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => AuthGuard.check());
    } else {
      AuthGuard.check();
    }
  }

})(typeof window !== "undefined" ? window : globalThis);
