import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Field, PageHeader } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { AppError } from "@/lib/domain/actions";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/domain/seed";
import { readDb } from "@/lib/store";
import { dashboardPath } from "@/lib/nav";
import { safeAuthRedirect } from "@/lib/auth-redirect";

type AuthSearch = { redirect?: string; mode?: "signin" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect: safeAuthRedirect(s.redirect),
    mode: s.mode === "signup" ? "signup" : "signin",
  }),
  head: () => ({
    meta: [
      { title: "ورود و ثبت‌نام | مسیر نور ثقلین" },
      { name: "description", content: "ورود به حساب کاربری یا ثبت‌نام در سامانه مسیر نور ثقلین." },
      { property: "og:title", content: "ورود و ثبت‌نام | مسیر نور ثقلین" },
      { property: "og:description", content: "ورود به حساب کاربری مسیر نور ثقلین." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { signIn, signUp, mode: backendMode } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  const goNext = (email: string) => {
    const u = readDb().users.find((x) => x.email === email.trim().toLowerCase());
    if (search.redirect) navigate({ to: search.redirect as "/" });
    else navigate({ to: u ? dashboardPath(u.role) : "/" });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!form.email.includes("@")) return setError("ایمیل معتبر وارد کنید.");
    if (mode === "signup" && form.fullName.trim().length < 3) return setError("نام کامل را وارد کنید.");
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(form.email, form.password);
        toast.success("خوش آمدید");
        goNext(form.email);
      } else {
        const r = await signUp(form);
        if (r.needsConfirmation) toast.success("ایمیل تأیید برای شما ارسال شد.");
        else {
          toast.success("حساب شما ساخته شد");
          goNext(form.email);
        }
      }
    } catch (err) {
      setError(err instanceof AppError ? err.message : "خطایی رخ داد.");
    } finally {
      setBusy(false);
    }
  };

  const quick = async (email: string) => {
    setBusy(true);
    try {
      await signIn(email, DEMO_PASSWORD);
      goNext(email);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={mode === "signin" ? "ورود به حساب" : "ساخت حساب جدید"} subtitle="به مسیر نور ثقلین خوش آمدید" icon={mode === "signin" ? LogIn : UserPlus} />
      <div className="mx-auto max-w-md space-y-5 px-4 py-6">
        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
          {mode === "signup" && (
            <Field id="fullName" label="نام و نام خانوادگی" required>
              <Input id="fullName" autoComplete="name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
          )}
          <Field id="email" label="ایمیل" required>
            <Input id="email" type="email" dir="ltr" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field id="password" label="رمز عبور" required hint={mode === "signup" ? "حداقل ۸ نویسه" : undefined}>
            <Input id="password" type="password" dir="ltr" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          {error && <p role="alert" className="rounded-xl bg-destructive-soft p-3 text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "لطفاً صبر کنید…" : mode === "signin" ? "ورود" : "ثبت‌نام"}
          </Button>
          <button type="button" className="w-full text-sm font-semibold text-primary" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(undefined); }}>
            {mode === "signin" ? "حساب ندارید؟ ثبت‌نام کنید" : "حساب دارید؟ وارد شوید"}
          </button>
          {mode === "signup" && <p className="text-xs text-muted-foreground">حساب‌های جدید با نقش دانش‌پژوه ساخته می‌شوند. نقش استاد یا مدیر فقط توسط مدیر سامانه داده می‌شود.</p>}
        </form>

        {backendMode === "demo" && (
          <section className="rounded-2xl border border-dashed bg-gold-soft/50 p-4">
            <h2 className="font-bold text-primary-deep">ورود سریع به حساب‌های نمایشی</h2>
            <p className="mt-1 text-xs text-muted-foreground">رمز همه حساب‌ها: <span dir="ltr">{DEMO_PASSWORD}</span></p>
            <div className="mt-3 grid gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <Button key={a.email} variant="outline" disabled={busy} onClick={() => quick(a.email)} className="justify-between">
                  <span>{a.label}</span>
                  <span dir="ltr" className="text-xs text-muted-foreground">{a.email}</span>
                </Button>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}