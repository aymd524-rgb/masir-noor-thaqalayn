import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { UserRound, Save } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, updateProfile, status } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [busy, setBusy] = useState(false);

  // Keep the editor in sync when authentication finishes or the account changes.
  const [lastUserId, setLastUserId] = useState(user?.id ?? "");
  if (user && user.id !== lastUserId) {
    setLastUserId(user.id);
    setFullName(user.fullName);
    setPhone(user.phone ?? "");
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (fullName.trim().length < 3) {
      toast.error("نام و نام خانوادگی را کامل وارد کنید.");
      return;
    }
    setBusy(true);
    try {
      await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      toast.success("اطلاعات حساب ذخیره شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره اطلاعات انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="حساب کاربری" subtitle="مشاهده و ویرایش اطلاعات حساب شما" icon={UserRound} />
      <div className="mx-auto max-w-xl space-y-5 px-4 py-6">
        {status === "loading" ? (
          <section className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">در حال بررسی وضعیت ورود…</section>
        ) : user ? (
          <>
            <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
              <h2 className="text-lg font-extrabold">اطلاعات شخصی</h2>
              <div className="space-y-2">
                <label htmlFor="account-full-name" className="text-sm font-semibold">نام و نام خانوادگی</label>
                <Input id="account-full-name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={3} maxLength={100} />
              </div>
              <div className="space-y-2">
                <label htmlFor="account-phone" className="text-sm font-semibold">شماره تماس</label>
                <Input id="account-phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} placeholder="اختیاری" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">ایمیل</label>
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm" dir="ltr">{user.email}</p>
                <p className="text-xs text-muted-foreground">ایمیل از این بخش قابل تغییر نیست.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">نقش کاربری</label>
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">{roleLabel[user.role]}</p>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                <Save className="ml-2 h-4 w-4" />
                {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
              </Button>
            </form>
            <p className="text-xs leading-6 text-muted-foreground">در حالت اتصال به پایگاه داده، نام و شماره تماس در پروفایل حساب شما ذخیره می‌شود. در حالت نمایشی، اطلاعات فقط در همین محیط آزمایشی نگهداری می‌شود.</p>
          </>
        ) : (
          <section className="rounded-2xl border bg-card p-5 text-center">
            <p>برای مشاهده و ویرایش حساب کاربری ابتدا وارد شوید.</p>
            <Button asChild className="mt-4"><Link to="/auth">ورود به حساب</Link></Button>
          </section>
        )}
      </div>
    </>
  );
}
