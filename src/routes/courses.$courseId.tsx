import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { EnrollmentBadge } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { approvedCount, requestEnrollment } from "@/lib/domain/actions";
import { categoryLabel, faNum, levelLabel } from "@/lib/format";
import { commit, useDb } from "@/lib/store";

export const Route = createFileRoute("/courses/$courseId")({
  head: () => ({ meta: [{ title: "جزئیات دوره | مسیر نور ثقلین" }] }),
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const db = useDb();
  const { user } = useAuth();
  const navigate = Route.useNavigate();
  const course = db.courses.find((item) => item.id === courseId);
  if (!course || !course.published) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold">دوره پیدا نشد</h1>
        <p className="mt-2 text-sm text-muted-foreground">ممکن است این دوره حذف شده یا هنوز منتشر نشده باشد.</p>
        <Button asChild className="mt-5"><Link to="/courses">بازگشت به دوره‌ها</Link></Button>
      </div>
    );
  }

  const teacher = db.users.find((item) => item.id === course.teacherId);
  const lessons = db.lessons.filter((item) => item.courseId === course.id).sort((a, b) => a.order - b.order);
  const materials = db.materials.filter((item) => item.courseId === course.id);
  const enrollment = user ? db.enrollments.find((item) => item.courseId === course.id && item.studentId === user.id && item.status !== "rejected") : undefined;
  const count = approvedCount(db, course.id);
  const full = count >= course.capacity;

  const apply = () => {
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    try {
      commit((current) => requestEnrollment(current, user, course.id));
      toast.success("درخواست ثبت‌نام شما ثبت شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت درخواست انجام نشد.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link to="/courses" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowRight className="h-4 w-4" /> بازگشت به دوره‌ها</Link>
      <section className="rounded-3xl bg-hero p-6 text-hero-foreground shadow-elegant sm:p-9">
        <p className="text-sm font-bold text-hero-foreground/75">{categoryLabel[course.category]} · {levelLabel[course.level]}</p>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{course.title}</h1>
        <p className="mt-4 max-w-3xl leading-8 text-hero-foreground/85">{course.description}</p>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> {teacher?.fullName ?? "مدرس دوره"}</p>
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {course.schedule}</p>
          <p className="flex items-center gap-2"><Users className="h-4 w-4" /> {faNum(count)} از {faNum(course.capacity)} نفر</p>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_19rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-lg font-extrabold">جلسات دوره</h2>
            {lessons.length ? <ol className="mt-4 space-y-3">{lessons.map((lesson) => (
              <li key={lesson.id} className="flex gap-3 rounded-xl bg-muted/50 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{faNum(lesson.order)}</span>
                <div><h3 className="font-bold">{lesson.title}</h3><p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> {faNum(lesson.durationMin)} دقیقه</p></div>
              </li>
            ))}</ol> : <p className="mt-3 text-sm text-muted-foreground">جلسات این دوره هنوز ثبت نشده‌اند.</p>}
          </section>
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-lg font-extrabold">محتوای آموزشی</h2>
            {materials.length ? <ul className="mt-3 space-y-2">{materials.map((material) => <li key={material.id} className="rounded-xl bg-muted/50 p-3 text-sm">{material.title} <span className="text-muted-foreground">· {material.type.toUpperCase()}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">محتوایی برای نمایش ثبت نشده است.</p>}
          </section>
        </div>
        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="font-extrabold">ثبت‌نام در دوره</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">مدت دوره: {faNum(course.durationWeeks)} هفته</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">ظرفیت باقی‌مانده: {faNum(Math.max(0, course.capacity - count))} نفر</p>
          {enrollment ? <div className="mt-4 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><EnrollmentBadge status={enrollment.status} /></div> : (
            <Button className="mt-5 w-full" disabled={full || user?.role !== "student"} onClick={apply}>{full ? "ظرفیت تکمیل است" : !user ? "ورود و درخواست ثبت‌نام" : user.role !== "student" ? "ویژه دانش‌پژوهان" : "درخواست ثبت‌نام"}</Button>
          )}
          {!user && <p className="mt-2 text-xs text-muted-foreground">برای ثبت درخواست ابتدا وارد حساب کاربری شوید.</p>}
        </aside>
      </div>
    </div>
  );
}
