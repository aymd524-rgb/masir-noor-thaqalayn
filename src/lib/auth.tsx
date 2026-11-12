import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isBackendConfigured } from "./backend/config";
import { getSupabase, resolveBackendUser } from "./backend/supabase";
import { AppError, registerStudent, updateOwnProfile, upsertVerifiedUser } from "./domain/actions";
import type { User } from "./domain/types";
import { commit, readDb, useDb } from "./store";

const SESSION_KEY = "masir-noor-session";

type Status = "loading" | "signed-out" | "signed-in";

interface AuthContextValue {
  status: Status;
  user: User | null;
  mode: "demo" | "backend";
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
  const mode = isBackendConfigured ? "backend" : "demo";

  // Restore session after hydration (sessions live in browser storage).
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setUserId(window.localStorage.getItem(SESSION_KEY));
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
    const current = readDb();
    const account = current.users.find((u) => u.email.toLowerCase() === normalized);
    if (!account || current.demoCredentials[normalized] !== password)
      throw new AppError("ایمیل یا رمز عبور نادرست است.");
    if (!account.active) throw new AppError("حساب کاربری شما غیرفعال شده است. با مدیر تماس بگیرید.");
    window.localStorage.setItem(SESSION_KEY, account.id);
    setUserId(account.id);
  }, []);

  const signUp = useCallback(async (input: { fullName: string; email: string; password: string }) => {
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
          .update({ full_name: patch.fullName, phone: patch.phone ?? null })
          .eq("id", activeUser.id);
        if (error) throw new AppError("ذخیره پروفایل در سرور انجام نشد.");
      }
      commit((d) => updateOwnProfile(d, activeUser, patch));
    },
    [activeUser],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: activeUser, mode, signIn, signUp, signOut, updateProfile }),
    [status, activeUser, mode, signIn, signUp, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}