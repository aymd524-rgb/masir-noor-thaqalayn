import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { faNum } from "@/lib/format";
import { AdminBackendPanel } from "@/components/admin/AdminBackendPanel";

export const Route = createFileRoute("/admin")({ component: AdminDashboard });
function AdminDashboard() {
 const { user, mode } = useAuth(); const db = useDb();
 const published = db.courses.filter((c)=>c.published);
 const pending = db.enrollments.filter((e)=>e.status==="pending");
 const activeUsers = db.users.filter((u)=>u.active);
 return <><PageHeader title="پیشخوان مدیر" subtitle="نمای کلی سامانه مسیر نور ثقلین" icon={ShieldCheck}/><div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
 {!user ? <Button asChild><Link to="/auth">ورود به حساب</Link></Button> : user.role!=="admin" ? <p className="rounded-xl border p-4 text-sm">دسترسی این بخش مخصوص مدیر سامانه است.</p> : mode==="backend" ? <AdminBackendPanel/> : <>
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric icon={Users} label="حساب‌های فعال" value={activeUsers.length}/><Metric icon={BookOpen} label="دوره‌های منتشرشده" value={published.length}/><Metric icon={GraduationCap} label="درخواست‌های ثبت‌نام" value={db.enrollments.length}/><Metric icon={ShieldCheck} label="درخواست‌های منتظر" value={pending.length}/></div>
 <div className="grid gap-5 md:grid-cols-2"><section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">ترکیب کاربران</h2><ul className="mt-3 space-y-3 text-sm">{(["student","teacher","admin"] as const).map((role)=><li key={role} className="flex justify-between"><span>{role==="student"?"دانش‌پژوه":role==="teacher"?"استاد":"مدیر"}</span><b>{faNum(activeUsers.filter((u)=>u.role===role).length)}</b></li>)}</ul></section>
 <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">محتوای منتشرشده</h2><ul className="mt-3 space-y-3 text-sm"><li className="flex justify-between"><span>مطالب آموزشی</span><b>{faNum(db.content.filter((c)=>c.published).length)}</b></li><li className="flex justify-between"><span>آزمون‌های فعال</span><b>{faNum(db.quizzes.filter((q)=>q.open).length)}</b></li><li className="flex justify-between"><span>جلسات آموزشی</span><b>{faNum(db.lessons.length)}</b></li></ul></section></div>
 <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">آخرین درخواست‌های ثبت‌نام</h2>{pending.length?<ul className="mt-3 space-y-2">{pending.slice(0,10).map(e=><li key={e.id} className="rounded-xl bg-muted/50 p-3 text-sm">{db.users.find(u=>u.id===e.studentId)?.fullName??"دانش‌پژوه"} — {db.courses.find(c=>c.id===e.courseId)?.title??"دوره"}</li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">درخواست منتظر بررسی وجود ندارد.</p>}</section>
 <p className="text-xs text-muted-foreground">نمایش اطلاعات آزمایشی؛ در حالت دمو هیچ تغییری در پایگاه داده واقعی انجام نمی‌شود.</p>
 </>}
 </div></>;
}
function Metric({icon:Icon,label,value}:{icon:typeof BookOpen;label:string;value:number}){return <div className="rounded-2xl border bg-card p-4"><Icon className="h-5 w-5 text-primary"/><p className="mt-3 text-xl font-extrabold">{faNum(value)}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>}
