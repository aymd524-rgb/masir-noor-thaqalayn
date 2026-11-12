import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/teacher")({ component: TeacherDashboard });
function TeacherDashboard() {
 const { user } = useAuth();
 return <><PageHeader title="پیشخوان استاد" subtitle="مدیریت کلاس‌ها و آموزش" icon={GraduationCap}/><div className="mx-auto max-w-4xl px-4 py-6">{!user ? <Button asChild><Link to="/auth">ورود به حساب</Link></Button> : user.role !== "teacher" && user.role !== "admin" ? <p className="rounded-xl border p-4 text-sm">این بخش برای حساب استاد طراحی شده است.</p> : <section className="rounded-2xl border bg-card p-5"><h2 className="font-bold">مدیریت آموزشی</h2><p className="mt-2 text-sm text-muted-foreground">ابزارهای مدیریت کلاس، حضور و غیاب و نمره‌دهی در مرحله تکمیل هستند.</p><Link to="/courses" className="mt-4 inline-block text-sm font-bold text-primary">مشاهده دوره‌ها</Link></section>}</div></>;
}