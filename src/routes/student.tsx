import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/lib/store";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/student")({ component: StudentDashboard });
function StudentDashboard() {
 const { user } = useAuth(); const db = useDb();
 const items = user ? db.enrollments.filter((e) => e.studentId === user.id) : [];
 return <><PageHeader title="پیشخوان دانش‌پژوه" subtitle="پیگیری دوره‌ها و روند یادگیری" icon={GraduationCap}/><div className="mx-auto max-w-4xl px-4 py-6">{!user ? <Button asChild><Link to="/auth">ورود به حساب</Link></Button> : user.role !== "student" ? <p className="rounded-xl border p-4 text-sm">این بخش برای حساب دانش‌پژوه طراحی شده است.</p> : <section className="rounded-2xl border bg-card p-5"><h2 className="font-bold">دوره‌های من</h2><p className="mt-2 text-sm text-muted-foreground">{items.length} درخواست یا ثبت‌نام</p><Link to="/courses" className="mt-4 inline-block text-sm font-bold text-primary">مشاهده دوره‌ها</Link></section>}</div></>;
}