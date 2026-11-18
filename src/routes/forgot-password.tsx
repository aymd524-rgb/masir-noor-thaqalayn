import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { AppError } from "@/lib/domain/actions";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "بازیابی رمز عبور | مسیر نور ثقلین" },
      { name: "description", content: "ارسال پیوند امن برای بازیابی رمز عبور حساب کاربری." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { requestPasswordReset, mode } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim().includes("@")) {
      setError("ایمیل معتبر وارد کنید.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      toast.success("اگر این ایمیل در سامانه ثبت شده باشد، پیوند بازیابی ارسال می‌شود.");
    } catch (cause) {
      setError(cause instanceof AppError ? cause.message : "ارسال درخواست انجام نشد. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="بازیابی رمز عبور" subtitle="برای دریافت پیوند بازیابی، ایمیل حساب خود را وارد کنید." />
      <main className="mx-auto max-w-md space-y-4 px-4 py-6">
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
          {mode === "demo" ? (
            <p role="status" className="text-sm text-muted-foreground">بازیابی رمز در حالت نمایشی فعال نیست. برای استفاده از این امکان، اتصال سامانه به سرویس احراز هویت باید برقرار باشد.</p>
          ) : sent ? (
            <p role="status" className="text-sm leading-7">اگر این ایمیل در سامانه ثبت شده باشد، پیام بازیابی ارسال شده است. صندوق ورودی و پوشه هرزنامه را بررسی کنید. پیوند ممکن است پس از مدتی منقضی شود.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <label htmlFor="recovery-email" className="block text-sm font-semibold">ایمیل حساب</label>
              <Input id="recovery-email" type="email" dir="ltr" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
              {error && <p role="alert" className="rounded-xl bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "در حال ارسال…" : "ارسال پیوند بازیابی"}</Button>
            </form>
          )}
          <a href="/auth" className="block text-center text-sm font-semibold text-primary underline-offset-4 hover:underline">بازگشت به صفحه ورود</a>
        </section>
      </main>
    </>
  );
}
