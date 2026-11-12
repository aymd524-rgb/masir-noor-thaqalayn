import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/admin")({ component: AdminDashboard });
function AdminDashboard() {
 const { user } = useAuth();
 return <><PageHeader title="پیشخوان مدیر" subtitle="مدیریت سامانه مسیر نور ثقلین" icon={ShieldCheck}/><div className="mx-auto max-w-4xl px-4 py-6">{!user ? <Button asChild><Link to="/auth">ورود به حساب</Link></Button> : user.role !== "admin" ? <p className="rounded-xl border p-4 text-sm">دسترسی این بخش مخصوص مدیر سامانه است.</p> : <section className="rounded-2xl border bg-card p-5"><h2 className="font-bold">مدیریت سامانه</h2><p className="mt-2 text-sm text-muted-foreground">ابزارهای مدیریتی در مرحله تکمیل هستند. تنظیمات امنیتی و سطح دسترسی سرور تغییر داده نشده‌اند.</p><Link to="/courses" className="mt-4 inline-block text-sm font-bold text-primary">مشاهده دوره‌ها</Link></section>}</div></>;
}