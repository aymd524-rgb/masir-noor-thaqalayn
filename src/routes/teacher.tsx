import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Check, ClipboardCheck, GraduationCap, Users, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/ui-bits";
import { useAuth } from "@/lib/auth";
import { useDb, commit } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { decideEnrollment } from "@/lib/domain/actions";
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
 const decide = (id:string,status:"approved"|"rejected") => {
   if(!user) return;
   try { commit((current)=>decideEnrollment(current,user,id,status)); toast.success(status==="approved"?"درخواست ثبت‌نام تأیید شد.":"درخواست ثبت‌نام رد شد."); }
   catch(error) { toast.error(error instanceof Error?error.message:"ثبت تغییر انجام نشد."); }
 };
 return <><PageHeader title="پیشخوان استاد" subtitle="مدیریت کلاس‌ها و درخواست‌های ثبت‌نام" icon={GraduationCap}/><div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
 {!user ? <Button asChild><Link to="/auth">ورود به حساب</Link></Button> : user.role!=="teacher" && user.role!=="admin" ? <p className="rounded-xl border p-4 text-sm">این بخش برای حساب استاد طراحی شده است.</p> : <>
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric icon={BookOpen} label="دوره‌ها" value={courses.length}/><Metric icon={Users} label="دانش‌پژوهان تأییدشده" value={students.size}/><Metric icon={ClipboardCheck} label="درخواست‌های منتظر" value={pending.length}/><Metric icon={GraduationCap} label="جلسه‌های ثبت‌شده" value={lessons.length}/></div>
 <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">دوره‌های من</h2>{courses.length ? <ul className="mt-3 divide-y">{courses.map((c)=>{const count=enrollments.filter((e)=>e.courseId===c.id).length;return <li key={c.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold">{c.title}</p><p className="mt-1 text-xs text-muted-foreground">{faNum(count)} درخواست یا ثبت‌نام</p></div><Link to="/courses/$courseId" params={{courseId:c.id}} className="text-sm font-bold text-primary">جزئیات</Link></li>})}</ul>:<p className="mt-3 text-sm text-muted-foreground">هنوز دوره‌ای برای این حساب ثبت نشده است.</p>}</section>
 <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">بررسی درخواست‌های ثبت‌نام</h2>{pending.length ? <ul className="mt-3 divide-y">{pending.map((e)=><li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{db.users.find((u)=>u.id===e.studentId)?.fullName ?? "دانش‌پژوه"}</p><p className="mt-1 text-xs text-muted-foreground">{db.courses.find((c)=>c.id===e.courseId)?.title} · {enrollmentLabel[e.status]}</p>{e.note&&<p className="mt-1 text-xs text-muted-foreground">{e.note}</p>}</div><div className="flex gap-2"><Button size="sm" onClick={()=>decide(e.id,"approved")}><Check className="me-1 h-4 w-4"/>تأیید</Button><Button size="sm" variant="outline" onClick={()=>decide(e.id,"rejected")}><X className="me-1 h-4 w-4"/>رد</Button></div></li>)}</ul>:<p className="mt-3 text-sm text-muted-foreground">درخواست منتظر بررسی وجود ندارد.</p>}</section>
 <p className="text-xs text-muted-foreground">این نسخه اطلاعات را در حافظه محلی همین مرورگر ذخیره می‌کند؛ برای استفاده چنددستگاهی باید اتصال پایگاه داده فعال و تأیید شود.</p>
 </>}
 </div></>;
}
function Metric({icon:Icon,label,value}:{icon:typeof BookOpen;label:string;value:number}) { return <div className="rounded-2xl border bg-card p-4"><Icon className="h-5 w-5 text-primary"/><p className="mt-3 text-xl font-extrabold">{faNum(value)}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
