"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

interface ClientData {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone_number: string;
  company_name?: string | null;
  category?: string;
  preferences?: Record<string, any>;
  status?: string;
  created_at?: string;
}

interface ClientOrder {
  id: string;
  client_id: string;
  service_type: string;
  title: string;
  description?: string;
  amount?: number;
  status: string;
  created_at: string;
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<ClientData | null>(null);
  const [orders, setOrders] = useState<ClientOrder[]>([]);

  // Profile Edit State
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [notificationPref, setNotificationPref] = useState("all");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security / Password Update State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadClientData();
  }, []);

  async function loadClientData() {
    setLoading(true);
    setProfileMessage(null);
    try {
      // 1. Fetch real Supabase Auth session / user
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (sessionErr || !user) {
        // Check if there is a local session from custom login
        let localUser: any = null;
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("SURVSTA_AUTH_USER");
          if (stored) {
            try {
              localUser = JSON.parse(stored);
            } catch {}
          }
        }

        if (localUser && (localUser.id || localUser.email)) {
          setCurrentUser(localUser);
          const email = localUser.email || "";
          const name = localUser.name || "";

          // Query live clients table by email or id
          const { data: dbClient } = await supabase
            .from("clients")
            .select("*")
            .or(`email.eq.${email},user_id.eq.${localUser.id}`)
            .maybeSingle();

          if (dbClient) {
            setClientProfile(dbClient);
            setFullName(dbClient.full_name || name);
            setPhoneNumber(dbClient.phone_number || "");
            setCompanyName(dbClient.company_name || "");
            setNotificationPref(dbClient.preferences?.notifications || "all");

            const { data: ordersData } = await supabase
              .from("orders")
              .select("*")
              .eq("client_id", dbClient.id)
              .order("created_at", { ascending: false });

            if (ordersData) setOrders(ordersData);
          } else {
            const fallbackProfile: ClientData = {
              id: localUser.id || "local-user",
              user_id: localUser.id,
              full_name: name,
              email: email,
              phone_number: localUser.phone || "",
              company_name: localUser.organization || "",
              status: "active",
            };
            setClientProfile(fallbackProfile);
            setFullName(name);
            setPhoneNumber(localUser.phone || "");
            setCompanyName(localUser.organization || "");
          }
          setLoading(false);
          return;
        }

        // Not authenticated -> redirect to login
        router.push("/login?callbackUrl=/client/dashboard");
        return;
      }

      // Authenticated with Supabase Auth
      setCurrentUser(user);
      const userEmail = user.email || "";
      const metaName = user.user_metadata?.full_name || user.user_metadata?.name || "";
      const metaPhone = user.user_metadata?.phone || "";

      // 2. Query clients table using user.id
      const { data: profile, error: profileErr } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setClientProfile(profile);
        setFullName(profile.full_name || metaName);
        setPhoneNumber(profile.phone_number || metaPhone);
        setCompanyName(profile.company_name || "");
        setNotificationPref(profile.preferences?.notifications || "all");

        // Fetch client orders
        const { data: ordersData } = await supabase
          .from("orders")
          .select("*")
          .eq("client_id", profile.id)
          .order("created_at", { ascending: false });

        if (ordersData) {
          setOrders(ordersData);
        }
      } else {
        // Construct real client profile record from user auth metadata
        const newClientRecord: ClientData = {
          id: user.id,
          user_id: user.id,
          full_name: metaName || userEmail.split("@")[0],
          email: userEmail,
          phone_number: metaPhone,
          company_name: "",
          status: "active",
        };
        setClientProfile(newClientRecord);
        setFullName(newClientRecord.full_name);
        setPhoneNumber(newClientRecord.phone_number);
        setCompanyName("");
      }
    } catch (err: any) {
      console.error("Error loading real client details:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Profile (Phone, Name, Company, Preferences) Update
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      if (!currentUser?.id) {
        throw new Error("جلسة المستخدم غير صالحة. يرجى إعادة تسجيل الدخول.");
      }

      const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
      const phoneDigits = cleanPhone.replace(/\D/g, '');

      if (!cleanPhone || phoneDigits.length < 8) {
        throw new Error("رقم الهاتف والواتساب إلزامي (8 أرقام على الأقل) لإجراء المعاملات وتأكيد الحجوزات.");
      }

      const updatePayload = {
        user_id: currentUser.id,
        email: clientProfile?.email || currentUser.email,
        full_name: fullName.trim(),
        phone_number: cleanPhone,
        company_name: companyName.trim() || null,
        preferences: {
          ...(clientProfile?.preferences || {}),
          notifications: notificationPref,
        },
        updated_at: new Date().toISOString(),
      };

      // Live DB upsert to Supabase
      const { error } = await supabase
        .from("clients")
        .upsert(updatePayload, { onConflict: "user_id" });

      if (error) {
        // Fallback update by user_id
        const { error: updateErr } = await supabase
          .from("clients")
          .update(updatePayload)
          .eq("user_id", currentUser.id);

        if (updateErr) throw updateErr;
      }

      // Also update Supabase Auth user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            phone: phoneNumber.trim(),
          },
        });
      } catch {}

      // Update local storage session
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("SURVSTA_AUTH_USER");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.name = fullName.trim();
            parsed.phone = phoneNumber.trim();
            localStorage.setItem("SURVSTA_AUTH_USER", JSON.stringify(parsed));
          } catch {}
        }
      }

      setClientProfile((prev) =>
        prev
          ? {
              ...prev,
              ...updatePayload,
            }
          : null
      );

      setProfileMessage({
        type: "success",
        text: "تم حفظ وتحديث بيانات حسابك ورقم الهاتف بنجاح في قاعدة البيانات.",
      });
    } catch (err: any) {
      setProfileMessage({
        type: "error",
        text: err.message || "حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Handle Password Update via Supabase Auth
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة المحاولة.",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMessage({
        type: "success",
        text: "تم تحديث كلمة المرور الخاصة بحسابك بنجاح.",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({
        type: "error",
        text: err.message || "تعذر تحديث كلمة المرور، يرجى المحاولة لاحقاً.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch {}
    document.cookie = "survsta_session=; path=/; max-age=0";
    document.cookie = "user_role=; path=/; max-age=0";
    if (typeof window !== "undefined") {
      localStorage.removeItem("SURVSTA_AUTH_USER");
    }
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-white" dir="rtl">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20">
              S
            </div>
            <div>
              <span className="font-bold text-lg text-white">بوابة العميل</span>
              <span className="text-xs text-cyan-400 block -mt-1 font-mono">Survsta Client Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
            >
              الرئيسية
              <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition"
            >
              اللوحة الموحدة
            </Link>
            {currentUser && (
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                تسجيل الخروج
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                حساب نشط
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {loading ? "جاري التحقق من الجلسة..." : clientProfile?.email || "غير متوفر"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {loading ? "جاري التحميل..." : `أهلاً بك، ${clientProfile?.full_name || fullName || "عزيزنا العميل"}`}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              إدارة بيانات الحساب الشخصي، تحديث رقم الهاتف، وتغيير كلمة المرور الخاصة بحسابك بأمان.
            </p>
          </div>

          <button
            onClick={loadClientData}
            disabled={loading}
            className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            تحديث البيانات
          </button>
        </div>

        {/* Content Grid: Settings & Security */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Account Settings & Phone Update Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">إعدادات الحساب وبيانات الاتصال</h2>
                  <p className="text-xs text-slate-400">تحديث رقم الهاتف المسجل والمعلومات الأساسية</p>
                </div>
              </div>

              {profileMessage && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
                    profileMessage.type === "success"
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                      : "bg-rose-950/40 text-rose-300 border-rose-800/60"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      الاسم الكامل
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل الاسم الكامل"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      رقم الهاتف (الواتساب)
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+201xxxxxxxxx"
                      dir="ltr"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 text-left focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition font-mono"
                      required
                    />
                    <span className="text-[11px] text-slate-500 block">
                      يستخدم هذا الرقم للتواصل المباشر عبر الواتساب وتأكيد حجوزات الأجهزة.
                    </span>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      اسم الشركة أو المكتب الهندسي
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="اسم شركتك أو جهة عملك (اختياري)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>

                  {/* Email (Read-Only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      البريد الإلكتروني المسجل
                    </label>
                    <input
                      type="email"
                      value={clientProfile?.email || ""}
                      readOnly
                      dir="ltr"
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed text-left font-mono"
                    />
                  </div>
                </div>

                {/* Notifications & Preferences */}
                <div className="pt-2">
                  <label className="text-xs font-medium text-slate-300 block mb-2">تفضيلات الإشعارات</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {[
                      { id: "all", label: "جميع التنبيهات (واتساب وبريد)" },
                      { id: "orders_only", label: "تحديثات الطلبات فقط" },
                      { id: "critical", label: "الحالات الطارئة فقط" },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                          notificationPref === item.id
                            ? "bg-cyan-950/30 border-cyan-500/50 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="notificationPref"
                          value={item.id}
                          checked={notificationPref === item.id}
                          onChange={(e) => setNotificationPref(e.target.value)}
                          className="accent-cyan-500"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    {isSavingProfile ? "جاري الحفظ..." : "حفظ التغييرات في الحساب"}
                  </button>
                </div>
              </form>
            </div>

            {/* Orders Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">سجل طلباتك وحجوزاتك</h2>
                    <p className="text-xs text-slate-400">تتبع حالة استئجار الأجهزة والخدمات المساحية</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Link
                    href="/client/orders"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-xl border border-cyan-500/20 transition"
                  >
                    <span>مركز التتبع والتقييم</span>
                    <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {orders.length} طلبات
                  </span>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/50 border border-dashed border-slate-800 rounded-xl">
                  <svg className="w-8 h-8 mx-auto text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-sm text-slate-400 font-medium">لا توجد طلبات مسجلة حالياً</p>
                  <p className="text-xs text-slate-500 mt-1">
                    عند قيامك بطلب معدات مساحية أو استشارة ستظهر كافة التفاصيل هنا تلقائياً.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {orders.map((order) => (
                    <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">{order.title}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>{order.service_type}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-500">
                            {new Date(order.created_at).toLocaleDateString("ar-EG")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {order.amount && (
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {order.amount} ج.م
                          </span>
                        )}
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {orders.length > 0 && (
                <div className="pt-3 border-t border-slate-800 text-center">
                  <Link
                    href="/client/orders"
                    className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition"
                  >
                    <span>عرض وإدارة كافة الطلبات وتتبع مراحل التنفيذ</span>
                    <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Security & Password Update */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">أمان الحساب</h2>
                  <p className="text-xs text-slate-400">تحديث كلمة المرور الخاصة بحسابك</p>
                </div>
              </div>

              {passwordMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                      : "bg-rose-950/40 text-rose-300 border-rose-800/60"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition pl-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    تأكيد كلمة المرور
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="font-semibold text-slate-300 mb-1">تعليمات الأمان:</div>
                  <p>• كلمة المرور يجب ألا تقل عن 6 خانات.</p>
                  <p>• يُفضل استخدام مزيج من الحروف الكبيرة والصغيرة والأرقام.</p>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {isUpdatingPassword ? "جاري التحديث..." : "تحديث كلمة المرور"}
                </button>
              </form>
            </div>

            {/* Quick Support Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-200">تحتاج إلى مساعدة؟</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                فريق الدعم الفني متواجد على مدار الساعة لمساعدتك في إدارة طلباتك أو حل أي مشكلة تتعلق بالحساب.
              </p>
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                تواصل مع الدعم عبر واتساب ←
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
