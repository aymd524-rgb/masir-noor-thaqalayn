import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Check, ClipboardCheck, GraduationCap, Save, Users, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/ui-bits";
import { useAuth } from "@/lib/auth";
import { useDb, commit } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { addGrade, decideEnrollment, recordAttendance } from "@/lib/domain/actions";
import type { AttendanceStatus } from "@/lib/domain/types";
import { attendanceLabel, enrollmentLabel, faNum } from "@/lib/format";
import { TeacherBackendPanel } from "@/components/teacher/TeacherBackendPanel";

export const Route = createFileRoute("/teacher")({ component: TeacherDashboard });

function TeacherDashboard() {
 const { user, mode } = useAuth();
 const db = useDb();
 const courses = user ? db.courses.filter((c) => user.role === "admin" || c.teacherId === user.id) : [];
 const courseIds = new Set(courses.map((c) => c.id));
 const enrollments = db.enrollments.filter((e) => courseIds.has(e.courseId));
 const pending = enrollments.filter((e) => e.status === "pending");
 const approved = enrollments.filter((e) => e.status === "approved");
 const students = new Set(approved.map((e) => e.studentId));
 const lessons = db.lessons.filter((l) => courseIds.has(l.courseId));
 const [courseChoice, setCourseChoice] = useState("");
 const [lessonChoice, setLessonChoice] = useState("");
 const [gradeStudent, setGradeStudent] = useState("");
 const [gradeTitle, setGradeTitle] = useState("");
 const [gradeScore, setGradeScore] = useState("0");
 const [gradeMax, setGradeMax] = useState("20");
 const activeCourseId = courses.some((c) => c.id === courseChoice) ? courseChoice : courses[0]?.id ?? "";
 const courseLessons = lessons.filter((l) => l.courseId === activeCourseId);
 const activeLessonId = courseLessons.some((l) => l.id === lessonChoice) ? lessonChoice : courseLessons[0]?.id ?? "";
 const courseStudents = approved.filter((e) => e.courseId === activeCourseId);
 const selectedGradeStudent = courseStudents.some((e) => e.studentId === gradeStudent) ? gradeStudent : courseStudents[0]?.studentId ?? "";

 const decide = (id: string, status: "approved" | "rejected") => {
   if (!user) return;
   try {
     commit((current) => decideEnrollment(current, user, id, status));
     toast.success(status === "approved" ? "درخواست ثبت‌نام تأیید شد." : "درخواست ثبت‌نام رد شد.");
   } catch (error) { toast.error(error instanceof Error ? error.message : "ثبت تغییر انجام نشد."); }
 };

 const saveAttendance = (studentId: string, status: AttendanceStatus) => {
   if (!user || !activeLessonId) return;
   try {
     commit((current) => recordAttendance(current, user, activeLessonId, studentId, status));
     toast.success("وضعیت حضور و غیاب ذخیره شد.");
   } catch (error) { toast.error(error instanceof Error ? error.message : "ذخیره حضور و غیاب انجام نشد."); }
 };

 const saveGrade = (event: React.FormEvent<HTMLFormElement>) => {
   event.preventDefault();
   if (!user || !activeCourseId || !selectedGradeStudent) return;
   try {
     commit((current) => addGrade(current, user, {
       courseId: activeCourseId,
       studentId: selectedGradeStudent,
       title: gradeTitle,
       score: Number(gradeScore),
       max: Number(gradeMax),
     }));
     toast.success("نمره با موفقیت ثبت شد.");
     setGradeTitle("");
     setGradeScore("0");
   } catch (error) { toast.error(error instanceof Error ? error.message : "ثبت نمره انجام نشد."); }
 };

 return <>
  <PageHeader title="پیشخوان استاد" subtitle="مدیریت کلاس‌ها، حضور و غیاب و نمرات" icon={GraduationCap}/>
  <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
   {!user ? <Button asChild><Link to="/auth">ورود به حساب</Link></Button> : user.role !== "teacher" && user.role !== "admin" ? <p className="rounded-xl border p-4 text-sm">این بخش برای حساب استاد طراحی شده است.</p> : mode === "backend" ? <TeacherBackendPanel user={user}/> : <>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
     <Metric icon={BookOpen} label="دوره‌ها" value={courses.length}/>
     <Metric icon={Users} label="دانش‌پژوهان تأییدشده" value={students.size}/>
     <Metric icon={ClipboardCheck} label="درخواست‌های منتظر" value={pending.length}/>
     <Metric icon={CalendarDays} label="جلسه‌های ثبت‌شده" value={lessons.length}/>
    </div>

    <section className="rounded-2xl border bg-card p-5">
     <h2 className="font-extrabold">دوره‌های من</h2>
     {courses.length ? <ul className="mt-3 divide-y">{courses.map((c) => {
       const count = enrollments.filter((e) => e.courseId === c.id).length;
       return <li key={c.id} className="flex items-center justify-between gap-3 py-3">
        <div><p className="font-semibold">{c.title}</p><p className="mt-1 text-xs text-muted-foreground">{faNum(count)} درخواست یا ثبت‌نام</p></div>
        <Link to="/courses/$courseId" params={{ courseId: c.id }} className="text-sm font-bold text-primary">جزئیات</Link>
       </li>;
     })}</ul> : <p className="mt-3 text-sm text-muted-foreground">هنوز دوره‌ای برای این حساب ثبت نشده است.</p>}
    </section>

    <section className="rounded-2xl border bg-card p-5">
     <h2 className="font-extrabold">بررسی درخواست‌های ثبت‌نام</h2>
     {pending.length ? <ul className="mt-3 divide-y">{pending.map((e) => <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div><p className="font-semibold">{db.users.find((u) => u.id === e.studentId)?.fullName ?? "دانش‌پژوه"}</p><p className="mt-1 text-xs text-muted-foreground">{db.courses.find((c) => c.id === e.courseId)?.title} · {enrollmentLabel[e.status]}</p>{e.note && <p className="mt-1 text-xs text-muted-foreground">{e.note}</p>}</div>
      <div className="flex gap-2"><Button size="sm" onClick={() => decide(e.id, "approved")}><Check className="me-1 h-4 w-4"/>تأیید</Button><Button size="sm" variant="outline" onClick={() => decide(e.id, "rejected")}><X className="me-1 h-4 w-4"/>رد</Button></div>
     </li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">درخواست منتظر بررسی وجود ندارد.</p>}
    </section>

    <section className="space-y-4 rounded-2xl border bg-card p-5">
     <div><h2 className="font-extrabold">ثبت حضور و غیاب</h2><p className="mt-1 text-sm text-muted-foreground">برای هر دانش‌پژوه وضعیت همان جلسه را انتخاب کنید؛ تغییرات ذخیره می‌شود.</p></div>
     <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">انتخاب دوره
       <select value={activeCourseId} onChange={(e) => { setCourseChoice(e.target.value); setLessonChoice(""); }} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal">
        {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
       </select>
      </label>
      <label className="text-sm font-semibold">انتخاب جلسه
       <select value={activeLessonId} onChange={(e) => setLessonChoice(e.target.value)} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal">
        {courseLessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
       </select>
      </label>
     </div>
     {!activeCourseId ? <p className="text-sm text-muted-foreground">ابتدا برای این حساب دوره‌ای ثبت کنید.</p> : !activeLessonId ? <p className="text-sm text-muted-foreground">برای این دوره هنوز جلسه‌ای تعریف نشده است.</p> : !courseStudents.length ? <p className="text-sm text-muted-foreground">دانش‌پژوه تأییدشده‌ای در این دوره وجود ندارد.</p> :
      <div className="divide-y rounded-xl border">{courseStudents.map((enrollment) => {
       const student = db.users.find((u) => u.id === enrollment.studentId);
       const saved = db.attendance.find((a) => a.lessonId === activeLessonId && a.studentId === enrollment.studentId);
       return <div key={enrollment.studentId} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
        <span className="text-sm font-semibold">{student?.fullName ?? "دانش‌پژوه"}</span>
        <select aria-label={`وضعیت حضور ${student?.fullName ?? "دانش‌پژوه"}`} value={saved?.status ?? ""} onChange={(e) => saveAttendance(enrollment.studentId, e.target.value as AttendanceStatus)} className="min-w-36 rounded-lg border bg-background px-3 py-2 text-sm">
         <option value="" disabled>ثبت نشده</option>
         <option value="present">{attendanceLabel.present}</option><option value="absent">{attendanceLabel.absent}</option><option value="late">{attendanceLabel.late}</option><option value="excused">{attendanceLabel.excused}</option>
        </select>
       </div>;
      })}</div>}
    </section>

    <section className="space-y-4 rounded-2xl border bg-card p-5">
     <div><h2 className="font-extrabold">ثبت نمره</h2><p className="mt-1 text-sm text-muted-foreground">نمره برای دانش‌پژوه ثبت‌نام قطعی‌شده در همین دوره ذخیره می‌شود.</p></div>
     <form onSubmit={saveGrade} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold sm:col-span-2">دانش‌پژوه
       <select value={selectedGradeStudent} onChange={(e) => setGradeStudent(e.target.value)} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal">
        {courseStudents.map((e) => <option key={e.studentId} value={e.studentId}>{db.users.find((u) => u.id === e.studentId)?.fullName ?? "دانش‌پژوه"}</option>)}
       </select>
      </label>
      <label className="text-sm font-semibold sm:col-span-2">عنوان ارزشیابی
       <input value={gradeTitle} onChange={(e) => setGradeTitle(e.target.value)} required placeholder="مثلاً آزمون حفظ سوره نبأ" className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"/>
      </label>
      <label className="text-sm font-semibold">نمره کسب‌شده
       <input type="number" min="0" step="0.25" value={gradeScore} onChange={(e) => setGradeScore(e.target.value)} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"/>
      </label>
      <label className="text-sm font-semibold">نمره کل
       <input type="number" min="0.01" step="0.25" value={gradeMax} onChange={(e) => setGradeMax(e.target.value)} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"/>
      </label>
      <div className="sm:col-span-2"><Button type="submit" disabled={!activeCourseId || !selectedGradeStudent || !gradeTitle.trim()}><Save className="me-2 h-4 w-4"/>ذخیره نمره</Button></div>
     </form>
     {activeCourseId && <div className="border-t pt-3"><h3 className="text-sm font-bold">نمرات ثبت‌شده این دوره</h3>
      {db.grades.filter((g) => g.courseId === activeCourseId).length ? <ul className="mt-2 divide-y">{db.grades.filter((g) => g.courseId === activeCourseId).slice().reverse().map((g) => <li key={g.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{db.users.find((u) => u.id === g.studentId)?.fullName ?? "دانش‌پژوه"} · {g.title}</span><strong>{faNum(g.score)} / {faNum(g.max)}</strong></li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">هنوز نمره‌ای ثبت نشده است.</p>}
     </div>}
    </section>
    <p className="text-xs text-muted-foreground">توجه: این تغییرات فعلاً فقط در حافظه محلی همین مرورگر ذخیره می‌شوند؛ تا زمان اتصال و آزمایش Supabase، اطلاعات بین دستگاه‌ها مشترک نیستند.</p>
   </>}
  </div>
 </>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) {
 return <div className="rounded-2xl border bg-card p-4"><Icon className="h-5 w-5 text-primary"/><p className="mt-3 text-xl font-extrabold">{faNum(value)}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>;
}
