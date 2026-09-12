/**
 * ============================================================
 *   Survsta — AUTH GUARD & RBAC SESSION MANAGER
 *   Role-Based Access Control (RBAC) for Provider & Admin Portals
 *   Synchronized with Edge Middleware & survsta_session Cookie
 *   Survsta — All Rights Reserved
 * ============================================================
 */

(function(global) {
  "use strict";

  const STORAGE_KEY_USER = "SURVSTA_AUTH_USER";
  const LEGACY_STORAGE_KEY_USER = "GS_AUTH_USER";
  const STORAGE_KEY_LOGGED_OUT = "SURVSTA_LOGGED_OUT";
  const LEGACY_STORAGE_KEY_LOGGED_OUT = "GS_LOGGED_OUT";

  const DEFAULT_ADMIN = {
    id: "admin-demo-1",
    email: "admin@survsta.com",
    name: "م. محمد فرج",
    role: "admin",
    org: "Survsta Admin",
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
     * قراءة وفك تشفير كوكيز الجلسة survsta_session والمزامنة مع Edge Middleware
     */
    getSessionCookie() {
      if (typeof document === "undefined" || !document.cookie) return null;
      try {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.startsWith("survsta_session=")) {
            const raw = cookie.substring("survsta_session=".length);
            let parsed = null;
            try {
              parsed = JSON.parse(decodeURIComponent(raw));
            } catch {
              try {
                parsed = JSON.parse(raw);
              } catch {}
            }
            if (parsed && typeof parsed === "object" && parsed.role) {
              return parsed;
            }
          }
        }
      } catch (e) {
        console.warn("[AuthGuard] خطأ في قراءة كوكيز survsta_session:", e);
      }

      // بديل احتياطي: user_role cookie
      try {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.startsWith("user_role=")) {
            const role = decodeURIComponent(cookie.substring("user_role=".length)).trim();
            if (role) return { role: role };
          }
        }
      } catch (e) {}

      return null;
    },

    /**
     * جلب الصفحة والمسار الحالي بدقة
     */
    getCurrentPage() {
      const pathname = (typeof location !== "undefined" ? location.pathname || "" : "").toLowerCase();
      const parts = pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || "index.html";
    },

    /**
     * الحصول على المستخدم الحالي (حقيقي من السحابة، أو من كوكيز الجلسة، أو من التخزين المحلي)
     */
    async getUser() {
      // 0. فحص كوكيز الجلسة أولاً (Sync with Edge Middleware)
      const sessionCookie = this.getSessionCookie();
      if (sessionCookie && sessionCookie.role) {
        // جلسة سارية عبر الكوكيز -> إلغاء أي حالة خروج سابقة فوراً
        try {
          localStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
          localStorage.removeItem(LEGACY_STORAGE_KEY_LOGGED_OUT);
        } catch (e) {}

        const isAdminRole = sessionCookie.role === "admin" || sessionCookie.role === "super_admin";
        const baseDefault = isAdminRole ? DEFAULT_ADMIN : DEFAULT_PROVIDER;

        const userObj = {
          id: sessionCookie.userId || sessionCookie.id || baseDefault.id,
          email: sessionCookie.email || (isAdminRole ? "admin@survsta.com" : "provider@survsta.com"),
          name: sessionCookie.name || baseDefault.name,
          role: sessionCookie.role,
          org: sessionCookie.org || baseDefault.org,
          av: sessionCookie.av || baseDefault.av
        };

        try {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));
          localStorage.setItem(LEGACY_STORAGE_KEY_USER, JSON.stringify(userObj));
        } catch (e) {}

        return userObj;
      }

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
              org: meta.org_name || (role === "admin" || role === "super_admin" ? "Survsta Admin" : "مكتب شريك"),
              av: (meta.full_name || u.email).substring(0, 2).toUpperCase()
            };
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));
            localStorage.setItem(LEGACY_STORAGE_KEY_USER, JSON.stringify(userObj));
            localStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
            localStorage.removeItem(LEGACY_STORAGE_KEY_LOGGED_OUT);
            return userObj;
          }
        } catch (e) {
          console.warn("[AuthGuard] تعذر جلب جلسة Supabase:", e);
        }
      }

      // 2. وضع المحاكاة / التخزين المحلي (Fallback Mode)
      if (localStorage.getItem(STORAGE_KEY_LOGGED_OUT) === "1" || localStorage.getItem(LEGACY_STORAGE_KEY_LOGGED_OUT) === "1") {
        return null;
      }

      const cached = localStorage.getItem(STORAGE_KEY_USER) || localStorage.getItem(LEGACY_STORAGE_KEY_USER);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY_USER);
          localStorage.removeItem(LEGACY_STORAGE_KEY_USER);
        }
      }

      // 3. التوافق التجريبي التلقائي إذا لم يتم تسجيل الخروج صراحة
      const page = this.getCurrentPage();
      const pathname = (typeof location !== "undefined" ? location.pathname || "" : "").toLowerCase();
      if (page.startsWith("a-") || page === "admin" || pathname.startsWith("/admin") || pathname.includes("/a-")) {
        return DEFAULT_ADMIN;
      } else if (page.startsWith("p-") || page === "provider" || pathname.startsWith("/provider") || pathname.includes("/p-")) {
        return DEFAULT_PROVIDER;
      }

      return null;
    },

    /**
     * فحص صلاحيات الصفحة الحالية وتطبيق الحماية (RBAC Guard)
     * يمنع الـ "Flash and Bounce" ويتحقق من كوكيز survsta_session
     */
    async check() {
      const page = this.getCurrentPage();
      const pathname = (typeof location !== "undefined" ? location.pathname || "" : "").toLowerCase();

      const isProvider = page.startsWith("p-") || pathname.startsWith("/provider") || pathname.includes("/p-") || page === "provider";
      const isAdmin = page.startsWith("a-") || pathname.startsWith("/admin") || pathname.includes("/a-") || page === "admin" || page === "a-dashboard";

      // الصفحات العامة لا تحتاج تحقق حظر
      if (!isProvider && !isAdmin) return true;

      // أولوية 1: فحص فوري لكوكيز الجلسة survsta_session المعتمَدة في Edge Middleware
      const sessionCookie = this.getSessionCookie();
      if (sessionCookie && sessionCookie.role) {
        const isCookieAdmin = sessionCookie.role === "admin" || sessionCookie.role === "super_admin";
        const isCookieProvider = sessionCookie.role === "provider";

        if (isAdmin && isCookieAdmin) {
          // مدير نظام مصادق عليه رسمياً - عدم التوجيه مطلقاً
          this.getUser().catch(() => {});
          return true;
        }

        if (isProvider && (isCookieProvider || isCookieAdmin)) {
          // مزود خدمة أو مدير نظام يتصفح بوابة المزوّد
          this.getUser().catch(() => {});
          return true;
        }

        if (isAdmin && isCookieProvider) {
          alert("⚠️ عذرًا: هذه الصفحة مخصصة لمديري النظام فقط. سيتم تحويلك إلى لوحة المزوّد.");
          location.href = "p-dashboard.html";
          return false;
        }
      }

      const user = await this.getUser();

      // إذا لم يكن مسجل الدخول نهائياً ولا توجد كوكيز صالحة
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
      localStorage.removeItem(LEGACY_STORAGE_KEY_LOGGED_OUT);

      // إذا كان Supabase متصلاً
      if (this.isCloudMode()) {
        const res = await global.SupabaseService.Auth.signIn({ email, password });
        if (res.error) return res;
        await this.getUser();
        return { user: await this.getUser(), error: null };
      }

      // محاكاة تسجيل الدخول المحلي (Demo / Offline Mode)
      const role = mockRole || (email.includes("admin") ? "admin" : "provider");
      const user = role === "super_admin" || role === "admin"
        ? { ...DEFAULT_ADMIN, email }
        : { ...DEFAULT_PROVIDER, email };

      // مزامنة الكوكيز مع التخزين المحلي
      document.cookie = `survsta_session=${encodeURIComponent(JSON.stringify({ role: user.role, email: user.email, name: user.name, org: user.org }))}; path=/; max-age=86400`;
      document.cookie = `user_role=${user.role}; path=/; max-age=86400`;

      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(LEGACY_STORAGE_KEY_USER, JSON.stringify(user));
      return { user, error: null };
    },

    /**
     * تسجيل مستخدم جديد
     */
    async signUp(email, password, metadata = {}) {
      localStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
      localStorage.removeItem(LEGACY_STORAGE_KEY_LOGGED_OUT);

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
        org: metadata.org_name || (role === "admin" ? "Survsta Admin" : "مكتب مساحة"),
        av: (metadata.full_name || email).substring(0, 2).toUpperCase()
      };

      document.cookie = `survsta_session=${encodeURIComponent(JSON.stringify({ role: user.role, email: user.email, name: user.name, org: user.org }))}; path=/; max-age=86400`;
      document.cookie = `user_role=${user.role}; path=/; max-age=86400`;

      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      localStorage.setItem(LEGACY_STORAGE_KEY_USER, JSON.stringify(user));
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

      // مسح الكوكيز لجعل Edge Middleware يرفض الوصول أيضاً
      document.cookie = "survsta_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(LEGACY_STORAGE_KEY_USER);
      localStorage.setItem(STORAGE_KEY_LOGGED_OUT, "1");
      localStorage.setItem(LEGACY_STORAGE_KEY_LOGGED_OUT, "1");

      const page = this.getCurrentPage();
      const pathname = (typeof location !== "undefined" ? location.pathname || "" : "").toLowerCase();
      if (page.startsWith("p-") || page.startsWith("a-") || pathname.startsWith("/admin") || pathname.startsWith("/provider")) {
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
