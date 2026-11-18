import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { AppError } from "@/lib/domain/actions";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "تعیین رمز جدید | مسیر نور ثقلین" },
      { name: "description", content: "ثبت رمز عبور جدید برای حساب کاربری." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, mode } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ نویسه باشد.");
      return;
    }
    if (password !== confirm) {
      setError("تکرار رمز عبور با رمز جدید یکسان نیست.");
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      toast.success("رمز عبور با موفقیت تغییر کرد.");
      await navigate({ to: "/auth" });
    } catch (cause) {
      setError(cause instanceof AppError ? cause.message : "تغییر رمز انجام نشد. پیوند بازیابی را دوباره دریافت کنید.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="تعیین رمز عبور جدید" subtitle="رمز تازه‌ای برای حساب خود انتخاب کنید." />
      <main className="mx-auto max-w-md space-y-4 px-4 py-6">
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
          {mode === "demo" ? (
            <p role="status" className="text-sm text-muted-foreground">تغییر رمز از طریق پیوند ایمیل فقط در حالت اتصال به سرویس احراز هویت فعال است.</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-semibold">رمز عبور جدید</label>
                <Input id="new-password" type="password" dir="ltr" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-semibold">تکرار رمز عبور</label>
                <Input id="confirm-password" type="password" dir="ltr" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
              </div>
              {error && <p role="alert" className="rounded-xl bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "در حال ذخیره…" : "ذخیره رمز جدید"}</Button>
            </form>
          )}
          <a href="/auth" className="block text-center text-sm font-semibold text-primary underline-offset-4 hover:underline">بازگشت به صفحه ورود</a>
        </section>
      </main>
    </>
  );
}
