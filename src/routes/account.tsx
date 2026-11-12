import { createFileRoute, Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account")({ component: AccountPage });
function AccountPage() {
  const { user } = useAuth();
  return <><PageHeader title="حساب کاربری" subtitle="اطلاعات حساب شما" icon={UserRound} /><div className="mx-auto max-w-xl px-4 py-6">
    {user ? <section className="rounded-2xl border bg-card p-5 shadow-soft"><h2 className="text-lg font-extrabold">{user.fullName}</h2><p className="mt-2 text-sm text-muted-foreground" dir="ltr">{user.email}</p><p className="mt-3 text-sm">نقش کاربری: {roleLabel[user.role]}</p><p className="mt-4 text-xs text-muted-foreground">ویرایش اطلاعات حساب در نسخه بعدی فعال خواهد شد.</p></section> : <section className="rounded-2xl border bg-card p-5 text-center"><p>برای مشاهده حساب کاربری ابتدا وارد شوید.</p><Button asChild className="mt-4"><Link to="/auth">ورود به حساب</Link></Button></section>}
  </div></>;
}