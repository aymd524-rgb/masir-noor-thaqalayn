import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { isBackendConfigured, isDemoMode } from "./backend/config";
import { getSupabase, resolveBackendUser } from "./backend/supabase";
import { AppError, registerStudent, updateOwnProfile, upsertVerifiedUser } from "./domain/actions";
import type { User } from "./domain/types";
import { commit, readDb, useDb } from "./store";

const SESSION_KEY = "masir-noor-session";

type Status = "loading" | "signed-out" | "signed-in";

interface AuthContextValue {
  status: Status;
  user: User | null;
  mode: "demo" | "backend" | "unavailable";
  /** A safe, user-facing explanation when the backend identity could not be verified. */
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { fullName: string; phone?: string; bio?: string; city?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_VERIFY_ERROR = "امکان تأیید امن حساب وجود ندارد. اتصال اینترنت را بررسی و دوباره تلاش کنید.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const db = useDb();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Shared by bootstrap, auth events, sign-in and sign-out to prevent stale
  // asynchronous requests from restoring an identity after a newer action.
  const authRequestRef = useRef(0);
  const manualSignInRef = useRef(false);
  const mode: AuthContextValue["mode"] = isBackendConfigured ? "backend" : isDemoMode ? "demo" : "unavailable";

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setUserId(isDemoMode ? window.localStorage.getItem(SESSION_KEY) : null);
      setAuthError(null);
      setReady(true);
      return;
    }

    let cancelled = false;
    const sync = async () => {
      const requestId = ++authRequestRef.current;
      try {
        const { data, error } = await sb.auth.getUser();
        if (error) throw error;
        if (!data.user) {
          if (!cancelled && requestId === authRequestRef.current) {
            setUserId(null);
            setAuthError(null);
          }
          return;
        }

        const verifiedUser = await resolveBackendUser(sb, data.user);
        if (cancelled || requestId !== authRequestRef.current) return;
        commit((d) => upsertVerifiedUser(d, verifiedUser));
        setUserId(verifiedUser.id);
        setAuthError(null);
      } catch {
        if (!cancelled && requestId === authRequestRef.current) {
          // Never turn a failed profile lookup into a student identity.
          setUserId(null);
          setAuthError(SESSION_VERIFY_ERROR);
        }
      } finally {
        if (!cancelled && requestId === authRequestRef.current) setReady(true);
      }
    };

    void sync();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        // Invalidate any in-flight getUser/profile request immediately.
        authRequestRef.current += 1;
        setUserId(null);
        setAuthError(null);
        setReady(true);
      } else if ((event === "SIGNED_IN" && !manualSignInRef.current) || event === "USER_UPDATED") {
        // Do not await Supabase work inside its auth callback (avoids lock
        // contention); the next microtask performs a guarded verification.
        const eventVersion = authRequestRef.current;
        void Promise.resolve().then(() => {
          if (!cancelled && eventVersion === authRequestRef.current) void sync();
        });
      }
    });

    return () => {
      cancelled = true;
      authRequestRef.current += 1;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = useMemo(() => (userId ? (db.users.find((u) => u.id === userId) ?? null) : null), [db, userId]);
  const activeUser = user && user.active ? user : null;
  const status: Status = !ready ? "loading" : activeUser ? "signed-in" : "signed-out";

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    const normalized = email.trim().toLowerCase();
    if (sb) {
      const requestId = ++authRequestRef.current;
      manualSignInRef.current = true;
      setAuthError(null);
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email: normalized, password });
        if (error || !data.user) throw new AppError("ایمیل یا رمز عبور نادرست است.");
        const verifiedUser = await resolveBackendUser(sb, data.user);
        if (requestId !== authRequestRef.current) throw new AppError("درخواست ورود تغییر کرده است؛ دوباره تلاش کنید.");
        commit((d) => upsertVerifiedUser(d, verifiedUser));
        setUserId(verifiedUser.id);
        setAuthError(null);
        setReady(true);
        return;
      } catch (error) {
        if (requestId === authRequestRef.current) {
          setUserId(null);
          setAuthError(SESSION_VERIFY_ERROR);
          setReady(true);
        }
        if (error instanceof AppError) throw error;
        throw new AppError(SESSION_VERIFY_ERROR);
      } finally {
        manualSignInRef.current = false;
      }
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
    authRequestRef.current += 1;
    setUserId(null);
    setAuthError(null);
    setReady(true);
    if (sb) await sb.auth.signOut();
    window.localStorage.removeItem(SESSION_KEY);
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
        const { error: contactError } = await sb
          .from("profile_contacts")
          .upsert(
            { user_id: activeUser.id, phone: patch.phone?.trim() || null },
            { onConflict: "user_id" },
          );
        if (contactError) throw new AppError("ذخیره اطلاعات تماس در سرور انجام نشد.");
        // The profile and contact records are intentionally stored separately.
      } else if (!isDemoMode) {
        throw new AppError("ویرایش حساب تا زمان اتصال Supabase فعال نیست.");
      }
      commit((d) => updateOwnProfile(d, activeUser, patch));
    },
    [activeUser],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: activeUser, mode, authError, signIn, signUp, signOut, updateProfile }),
    [status, activeUser, mode, authError, signIn, signUp, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
