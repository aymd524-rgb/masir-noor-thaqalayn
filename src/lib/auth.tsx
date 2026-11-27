import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isBackendConfigured, isDemoMode } from "./backend/config";
import { getSupabase, resolveBackendUser } from "./backend/supabase";
import { AppError, registerStudent, updateOwnProfile, upsertVerifiedUser } from "./domain/actions";
import type { User } from "./domain/types";
import { commit, readDb, useDb } from "./store";

const SESSION_KEY = "masir-noor-session";

type Status = "loading" | "signed-out" | "signed-in";
type PhoneCodeRequest = {
  phone: string;
  intent: "signin" | "signup";
  fullName?: string;
  email?: string;
};

function normalizePhone(phone: string) {
  const compact = phone.trim().replace(/[\s()-]/g, "");
  return compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
}

interface AuthContextValue {
  status: Status;
  user: User | null;
  mode: "demo" | "backend" | "unavailable";
  requestPhoneCode: (input: PhoneCodeRequest) => Promise<void>;
  verifyPhoneCode: (input: { phone: string; code: string; email?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { fullName: string; phone?: string; bio?: string; city?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const db = useDb();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const mode: AuthContextValue["mode"] = isBackendConfigured ? "backend" : isDemoMode ? "demo" : "unavailable";

  // Restore a local session only in development demo mode; production requires Supabase.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setUserId(isDemoMode ? window.localStorage.getItem(SESSION_KEY) : null);
      setReady(true);
      return;
    }
    let cancelled = false;
    const sync = async () => {
      const { data } = await sb.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        const u = await resolveBackendUser(sb, data.user);
        commit((d) => upsertVerifiedUser(d, u));
        setUserId(u.id);
      } else {
        setUserId(null);
      }
      setReady(true);
    };
    void sync();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void sync();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = useMemo(() => (userId ? (db.users.find((u) => u.id === userId) ?? null) : null), [db, userId]);
  const activeUser = user && user.active ? user : null;
  const status: Status = !ready ? "loading" : activeUser ? "signed-in" : "signed-out";

  const requestPhoneCode = useCallback(async (input: PhoneCodeRequest) => {
    const sb = getSupabase();
    if (!sb) {
      throw new AppError("ارسال پیامک واقعی فقط پس از اتصال Supabase و پیکربندی سرویس پیامک فعال می‌شود.");
    }
    const phone = normalizePhone(input.phone);
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new AppError("شماره را همراه کد کشور وارد کنید؛ مانند +98912…");
    }
    if (input.intent === "signup" && (input.fullName?.trim().length ?? 0) < 3) {
      throw new AppError("نام و نام خانوادگی را وارد کنید.");
    }
    const options =
      input.intent === "signup"
        ? {
            shouldCreateUser: true,
            data: {
              full_name: input.fullName?.trim(),
              ...(input.email?.trim() ? { contact_email: input.email.trim().toLowerCase() } : {}),
            },
          }
        : { shouldCreateUser: false };
    const { error } = await sb.auth.signInWithOtp({ phone, options });
    if (error) {
      if (/sms|provider|phone/i.test(error.message)) {
        throw new AppError("ارسال پیامک انجام نشد. سرویس پیامک در تنظیمات Supabase باید پیکربندی شود.");
      }
      throw new AppError("ارسال کد انجام نشد. شماره را بررسی کنید و کمی بعد دوباره تلاش کنید.");
    }
  }, []);

  const verifyPhoneCode = useCallback(async (input: { phone: string; code: string; email?: string }) => {
    const sb = getSupabase();
    if (!sb) throw new AppError("تأیید پیامکی تا زمان اتصال Supabase فعال نیست.");
    const phone = normalizePhone(input.phone);
    const code = input.code.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new AppError("شماره تلفن معتبر نیست.");
    if (!/^\d{4,8}$/.test(code)) throw new AppError("کد پیامک را درست وارد کنید.");

    const { data, error } = await sb.auth.verifyOtp({ phone, token: code, type: "sms" });
    if (error || !data.user) throw new AppError("کد تأیید نادرست یا منقضی شده است.");
    const contactEmail = input.email?.trim().toLowerCase();
    // Always persist the verified phone in the private contact table so
    // authorized admin contact tools can find it. Preserve an existing
    // optional email when a user signs in without entering one.
    const { data: previousContact, error: contactReadError } = await sb
      .from("profile_contacts")
      .select("email")
      .eq("user_id", data.user.id)
      .maybeSingle<{ email: string | null }>();
    if (contactReadError) {
      throw new AppError("حساب تأیید شد، اما اطلاعات تماس خوانده نشد. دوباره وارد شوید.");
    }
    const { error: contactError } = await sb
      .from("profile_contacts")
      .upsert(
        {
          user_id: data.user.id,
          phone,
          email: contactEmail || previousContact?.email || null,
        },
        { onConflict: "user_id" },
      );
    if (contactError) {
      throw new AppError("حساب تأیید شد، اما ذخیره اطلاعات تماس انجام نشد. دوباره وارد شوید.");
    }

    const appUser = await resolveBackendUser(sb, data.user);
    commit((d) => upsertVerifiedUser(d, appUser));
    setUserId(appUser.id);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    const normalized = email.trim().toLowerCase();
    if (sb) {
      const { data, error } = await sb.auth.signInWithPassword({ email: normalized, password });
      if (error || !data.user) throw new AppError("ایمیل یا رمز عبور نادرست است.");
      const u = await resolveBackendUser(sb, data.user);
      commit((d) => upsertVerifiedUser(d, u));
      setUserId(u.id);
      return;
    }
    if (!isDemoMode) throw new AppError("ورود فعلاً فعال نیست؛ اتصال امن سامانه به Supabase هنوز پیکربندی نشده است.");
    const current = readDb();
    const account = current.users.find((u) => u.email.toLowerCase() === normalized);
    if (!account || current.demoCredentials[normalized] !== password)
      throw new AppError("ایمیل یا رمز عبور نادرست است.");
    if (!account.active) throw new AppError("حساب کاربری شما غیرفعال شده است. با مدیر تماس بگیرید.");
    window.localStorage.setItem(SESSION_KEY, account.id);
    setUserId(account.id);
  }, []);

  const signUp = useCallback(async (input: { fullName: string; email: string; password: string }) => {
    if (input.password.length < 8) throw new AppError("رمز عبور باید حداقل ۸ نویسه باشد.");
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.auth.signUp({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        options: { data: { full_name: input.fullName.trim() }, emailRedirectTo: window.location.origin },
      });
      if (error) throw new AppError(error.message.includes("registered") ? "این ایمیل قبلاً ثبت شده است." : "ثبت‌نام انجام نشد. دوباره تلاش کنید.");
      return { needsConfirmation: !data.session };
    }
    if (!isDemoMode) throw new AppError("ثبت‌نام فعلاً فعال نیست؛ اتصال امن سامانه به Supabase هنوز پیکربندی نشده است.");
    const holder: { user?: User } = {};
    commit((d) => {
      const r = registerStudent(d, input);
      holder.user = r.user;
      return r.db;
    });
    const newId = holder.user!.id;
    window.localStorage.setItem(SESSION_KEY, newId);
    setUserId(newId);
    return { needsConfirmation: false };
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    window.localStorage.removeItem(SESSION_KEY);
    setUserId(null);
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    async (patch) => {
      const sb = getSupabase();
      if (sb && activeUser) {
        const { error } = await sb
          .from("profiles")
          .update({ full_name: patch.fullName })
          .eq("id", activeUser.id);
        if (error) throw new AppError("ذخیره پروفایل در سرور انجام نشد.");
        const { data: previousContact, error: contactReadError } = await sb
          .from("profile_contacts")
          .select("email")
          .eq("user_id", activeUser.id)
          .maybeSingle<{ email: string | null }>();
        if (contactReadError) throw new AppError("خواندن اطلاعات تماس در سرور انجام نشد.");
        const { error: contactError } = await sb
          .from("profile_contacts")
          .upsert(
            {
              user_id: activeUser.id,
              phone: patch.phone?.trim() || null,
              email: previousContact?.email ?? null,
            },
            { onConflict: "user_id" },
          );
        if (contactError) throw new AppError("ذخیره اطلاعات تماس در سرور انجام نشد.");
      } else if (!isDemoMode) {
        throw new AppError("ویرایش حساب تا زمان اتصال Supabase فعال نیست.");
      }
      commit((d) => updateOwnProfile(d, activeUser, patch));
    },
    [activeUser],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: activeUser, mode, requestPhoneCode, verifyPhoneCode, signIn, signUp, signOut, updateProfile }),
    [status, activeUser, mode, requestPhoneCode, verifyPhoneCode, signIn, signUp, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
