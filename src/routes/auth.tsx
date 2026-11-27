import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Field, PageHeader } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { AppError } from "@/lib/domain/actions";
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
      { name: "description", content: "ورود با شماره تلفن و کد تأیید پیامکی در مسیر نور ثقلین." },
      { property: "og:title", content: "ورود و ثبت‌نام | مسیر نور ثقلین" },
      { property: "og:description", content: "ورود امن با شماره تلفن." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function normalizePhone(phone: string) {
  const compact = phone.trim().replace(/[\s()-]/g, "");
  return compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { requestPhoneCode, verifyPhoneCode, mode: backendMode } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", code: "" });

  const goNext = (phone: string) => {
    const normalized = normalizePhone(phone);
    const u = readDb().users.find((x) => normalizePhone(x.phone ?? "") === normalized);
    if (search.redirect) navigate({ to: search.redirect as "/" });
    else navigate({ to: u ? dashboardPath(u.role) : "/" });
  };

  const requestCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const phone = normalizePhone(form.phone);
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return setError("شماره را همراه کد کشور وارد کنید؛ مانند +98912…");
    if (mode === "signup" && form.fullName.trim().length < 3) return setError("نام و نام خانوادگی را وارد کنید.");
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("ایمیل اختیاری واردشده معتبر نیست.");
    setBusy(true);
    try {
      await requestPhoneCode({ phone, intent: mode, fullName: form.fullName, email: form.email });
      setStep("code");
      toast.success("کد تأیید پیامکی درخواست شد.");
    } catch (err) {
      setError(err instanceof AppError ? err.message : "ارسال کد انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!/^\d{4,8}$/.test(form.code.trim())) return setError("کد پیامک را وارد کنید.");
    setBusy(true);
    try {
      await verifyPhoneCode({ phone: form.phone, code: form.code, email: form.email });
      toast.success("شماره تلفن تأیید شد؛ خوش آمدید.");
      goNext(form.phone);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "تأیید کد انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setStep("phone");
    setError(undefined);
    setForm({ ...form, code: "" });
  };

  return (
    <>
      <PageHeader title={mode === "signin" ? "ورود با شماره تلفن" : "ثبت‌نام با شماره تلفن"} subtitle="به مسیر نور ثقلین خوش آمدید" icon={mode === "signin" ? LogIn : UserPlus} />
      <div className="mx-auto max-w-md space-y-5 px-4 py-6">
        {backendMode !== "backend" && (
          <p role="alert" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            ورود پیامکی در پیش‌نمایش بدون اتصال Supabase و تنظیم سرویس ارسال پیامک، کد واقعی نمی‌فرستد.
          </p>
        )}
        <form onSubmit={step === "phone" ? requestCode : verifyCode} noValidate className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
          {step === "phone" && mode === "signup" && (
            <Field id="fullName" label="نام و نام خانوادگی" required>
              <Input id="fullName" autoComplete="name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
          )}
          <Field id="phone" label="شماره تلفن همراه" required hint="با کد کشور وارد کنید؛ مانند +98912…">
            <Input id="phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="+98…" value={form.phone} disabled={step === "code"} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          {step === "phone" && mode === "signup" && (
            <Field id="email" label="ایمیل (اختیاری)">
              <Input id="email" type="email" dir="ltr" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          )}
          {step === "code" && (
            <Field id="code" label="کد تأیید پیامک" required hint="کد ارسال‌شده به شماره بالا را وارد کنید.">
              <Input id="code" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "").slice(0, 8) })} />
            </Field>
          )}
          {error && <p role="alert" className="rounded-xl bg-destructive-soft p-3 text-sm font-medium text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy || backendMode !== "backend"}>
            {busy ? "لطفاً صبر کنید…" : step === "phone" ? "ارسال کد پیامکی" : "تأیید کد و ورود"}
          </Button>
          {step === "code" && (
            <button type="button" className="w-full text-sm font-semibold text-primary" onClick={() => { setStep("phone"); setError(undefined); }}>
              تغییر شماره تلفن
            </button>
          )}
          <button type="button" className="w-full text-sm font-semibold text-primary" onClick={switchMode}>
            {mode === "signin" ? "حساب ندارید؟ ثبت‌نام کنید" : "حساب دارید؟ وارد شوید"}
          </button>
          {mode === "signup" && <p className="text-xs text-muted-foreground">حساب‌های جدید با نقش دانش‌پژوه ساخته می‌شوند. نقش استاد یا مدیر فقط توسط مدیر سامانه داده می‌شود.</p>}
        </form>
      </div>
    </>
  );
}
