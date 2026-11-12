import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ClipboardCheck, GraduationCap, Users } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { enrollmentLabel, faNum } from "@/lib/format";

export const Route = createFileRoute("/teacher")({ component: TeacherDashboard });
function TeacherDashboard() {
 const { user } = useAuth(); const db = useDb();
 const courses = user ? db.courses.filter((c)=>user.role==="admin" || c.teacherId===user.id) : [];
 const courseIds = new Set(courses.map((c)=>c.id));
 const enrollments = db.enrollments.filter((e)=>courseIds.has(e.courseId));
 const pending = enrollments.filter((e)=>e.status==="pending");
 const students = new Set(enrollments.filter((e)=>e.status==="approved").map((e)=>e.studentId));
 const lessons = db.lessons.filter((l)=>courseIds.has(l.courseId));
 return <><PageHeader title="پیشخوان استاد" subtitle="نمای کلی کلاس‌ها و درخواست‌های ثبت‌نام" icon={GraduationCap}/><div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
 {!user ? <Button asChild><Link to="/auth">ورود به حساب</Link></Button> : user.role!=="teacher" && user.role!=="admin" ? <p className="rounded-xl border p-4 text-sm">این بخش برای حساب استاد طراحی شده است.</p> : <>
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric icon={BookOpen} label="دوره‌ها" value={courses.length}/><Metric icon={Users} label="دانش‌پژوهان تأییدشده" value={students.size}/><Metric icon={ClipboardCheck} label="درخواست‌های منتظر" value={pending.length}/><Metric icon={GraduationCap} label="جلسه‌های ثبت‌شده" value={lessons.length}/></div>
 <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">دوره‌های من</h2>{courses.length ? <ul className="mt-3 divide-y">{courses.map((c)=>{const count=enrollments.filter((e)=>e.courseId===c.id).length;return <li key={c.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold">{c.title}</p><p className="mt-1 text-xs text-muted-foreground">{faNum(count)} درخواست یا ثبت‌نام</p></div><Link to="/courses/$courseId" params={{courseId:c.id}} className="text-sm font-bold text-primary">جزئیات</Link></li>})}</ul>:<p className="mt-3 text-sm text-muted-foreground">هنوز دوره‌ای برای این حساب ثبت نشده است.</p>}</section>
 <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">درخواست‌های اخیر</h2>{pending.length ? <ul className="mt-3 space-y-2">{pending.slice(0,8).map((e)=><li key={e.id} className="flex justify-between gap-3 rounded-xl bg-muted/50 p-3 text-sm"><span>{db.users.find((u)=>u.id===e.studentId)?.fullName ?? "دانش‌پژوه"} · {db.courses.find((c)=>c.id===e.courseId)?.title}</span><b>{enrollmentLabel[e.status]}</b></li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">درخواست منتظر بررسی وجود ندارد.</p>}</section>
 <p className="text-xs text-muted-foreground">مدیریت و تأیید درخواست‌ها، ثبت حضور و نمره‌دهی در گام بعدی به این پیشخوان افزوده می‌شود.</p>
 </>}
 </div></>;
}
function Metric({icon:Icon,label,value}:{icon:typeof BookOpen;label:string;value:number}) { return <div className="rounded-2xl border bg-card p-4"><Icon className="h-5 w-5 text-primary"/><p className="mt-3 text-xl font-extrabold">{faNum(value)}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
