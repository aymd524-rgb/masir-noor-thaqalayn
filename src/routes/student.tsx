import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, BookOpen, CalendarCheck, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { attendanceLabel, enrollmentLabel, faNum } from "@/lib/format";
import { StudentBackendPanel } from "@/components/student/StudentBackendPanel";

export const Route = createFileRoute("/student")({ component: StudentDashboard });
function StudentDashboard() {
  const { user, mode } = useAuth();
  const db = useDb();
  const enrollments = user ? db.enrollments.filter((e) => e.studentId === user.id) : [];
  const active = enrollments.filter((e) => e.status === "approved");
  const grades = user ? db.grades.filter((g) => g.studentId === user.id) : [];
  const attendance = user ? db.attendance.filter((a) => a.studentId === user.id) : [];
  const certificates = user ? db.certificates.filter((c) => c.studentId === user.id) : [];
  const present = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendanceRate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  return <><PageHeader title="پیشخوان دانش‌پژوه" subtitle="پیگیری دوره‌ها و روند یادگیری" icon={GraduationCap}/><div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
    {!user ? <Button asChild><Link to="/auth">ورود به حساب</Link></Button> : user.role !== "student" ? <p className="rounded-xl border p-4 text-sm">این بخش برای حساب دانش‌پژوه طراحی شده است.</p> : mode === "backend" ? <StudentBackendPanel user={user}/> : <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={BookOpen} label="دوره‌های تأییدشده" value={active.length}/>
        <Metric icon={CalendarCheck} label="حضور مؤثر" value={attendance.length ? faNum(attendanceRate)+"٪" : "—"}/>
        <Metric icon={GraduationCap} label="نمره‌های ثبت‌شده" value={grades.length}/>
        <Metric icon={Award} label="گواهی‌ها" value={certificates.length}/>
      </div>
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">وضعیت درخواست‌های من</h2>
        {enrollments.length ? <ul className="mt-3 divide-y">{enrollments.map((e) => { const course=db.courses.find((c)=>c.id===e.courseId); return <li key={e.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold">{course?.title ?? "دوره حذف‌شده"}</p><p className="mt-1 text-xs text-muted-foreground">پیشرفت: {faNum(e.progress)}٪</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{enrollmentLabel[e.status]}</span></li>; })}</ul> : <p className="mt-3 text-sm text-muted-foreground">هنوز برای دوره‌ای درخواست نداده‌اید.</p>}
        <Button asChild className="mt-4"><Link to="/courses">مشاهده و ثبت‌نام در دوره‌ها</Link></Button>
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">آخرین نمره‌ها</h2>{grades.length ? <ul className="mt-3 space-y-2">{grades.slice(-5).reverse().map((g)=><li key={g.id} className="flex justify-between gap-3 text-sm"><span>{g.title}</span><b>{faNum(g.score)} از {faNum(g.max)}</b></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">هنوز نمره‌ای ثبت نشده است.</p>}</section>
        <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">گزارش حضور و غیاب</h2>{attendance.length ? <ul className="mt-3 space-y-2">{attendance.slice(-6).reverse().map((a)=><li key={a.id} className="flex justify-between gap-3 text-sm"><span>{db.lessons.find((l)=>l.id===a.lessonId)?.title ?? "جلسه"}</span><b>{attendanceLabel[a.status]}</b></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">گزارش حضور و غیاب هنوز ثبت نشده است.</p>}</section>
      </div>
    </>}
  </div></>;
}
function Metric({icon:Icon,label,value}:{icon:typeof BookOpen;label:string;value:number|string}) { return <div className="rounded-2xl border bg-card p-4"><Icon className="h-5 w-5 text-primary"/><p className="mt-3 text-xl font-extrabold">{typeof value==="number"?faNum(value):value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
