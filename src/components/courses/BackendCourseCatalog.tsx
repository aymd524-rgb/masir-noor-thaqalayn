import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, GraduationCap, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/states";
import { PageHeader } from "@/components/common/ui-bits";
import { getSupabase } from "@/lib/backend/supabase";
import {
  loadBackendCourseCatalog,
  loadBackendCourseEnrollmentStates,
  type CatalogCourse,
} from "@/lib/backend/catalog";
import { requestStudentEnrollment } from "@/lib/backend/student";
import type { User } from "@/lib/domain/types";
import { faNum } from "@/lib/format";

export function BackendCourseCatalog({ user }: { user: User | null }) {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveInstitute, setHasActiveInstitute] = useState(false);

  const reload = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("اتصال پایگاه داده در دسترس نیست.");
    const {data:authData,error:authError}=await sb.auth.getUser();
    if(authError) throw new Error(authError.message);
    const userId=authData.user?.id;
    if(!userId) throw new Error("برای مشاهدهٔ دوره‌ها ابتدا وارد حساب شوید.");
    const {data:preference,error:preferenceError}=await sb
      .from("user_institute_preferences").select("institute_id").eq("user_id",userId).maybeSingle();
    if(preferenceError) throw new Error(preferenceError.message);
    let active=false;
    if(preference?.institute_id){
      const [membershipResult,instituteResult]=await Promise.all([
        sb.from("institute_memberships").select("id").eq("user_id",userId)
          .eq("institute_id",preference.institute_id).eq("status","active").maybeSingle(),
        sb.from("institutions").select("id").eq("id",preference.institute_id)
          .eq("is_active",true).maybeSingle(),
      ]);
      if(membershipResult.error) throw new Error(membershipResult.error.message);
      if(instituteResult.error) throw new Error(instituteResult.error.message);
      active=!!membershipResult.data&&!!instituteResult.data;
    }
    const rows = await loadBackendCourseCatalog(sb);
    setHasActiveInstitute(active);
    setCourses(rows);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const sb = getSupabase();
    if (!user || !sb) {
      setCourses([]);
      setLoading(false);
      return () => { active = false; };
    }
    void reload().catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : "دریافت دوره‌ها انجام نشد.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload, user?.id]);

  const refresh = async () => {
    setLoading(true);
    try { await reload(); }
    catch (reason) {
      const message = reason instanceof Error ? reason.message : "دریافت دوره‌ها انجام نشد.";
      setError(message);
      toast.error(message);
    } finally { setLoading(false); }
  };

  return <>
    <PageHeader title="دوره‌ها و کلاس‌ها" subtitle="دوره‌ها و ظرفیت کلاس‌های فعال سامانه" icon={GraduationCap}/>
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      {!user ? <section className="rounded-2xl border bg-card p-6 text-center">
        <h2 className="font-extrabold">برای مشاهده دوره‌ها وارد حساب شوید</h2>
        <p className="mt-2 text-sm text-muted-foreground">فهرست دوره‌ها از پایگاه داده امن سامانه دریافت می‌شود.</p>
        <Button asChild className="mt-4"><Link to="/auth">ورود و ثبت‌نام</Link></Button>
      </section> : <>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">اطلاعات این فهرست مستقیماً از پایگاه داده خوانده می‌شود.</p>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className="me-2 h-4 w-4"/>به‌روزرسانی</Button>
        </div>
        {loading ? <p role="status" className="rounded-xl border p-5 text-sm text-muted-foreground">در حال دریافت دوره‌ها…</p>
          : error ? <section role="alert" className="rounded-2xl border border-destructive/40 p-5">
            <p className="text-sm">{error}</p><Button className="mt-3" onClick={() => void refresh()}>تلاش دوباره</Button>
          </section>
          : courses.length === 0 ? <section className="rounded-2xl border bg-card p-6 text-center">
            <h2 className="font-extrabold">{hasActiveInstitute ? "هنوز دورهٔ فعالی در مؤسسهٔ انتخاب‌شده نیست" : "ابتدا مؤسسهٔ آموزشی خود را انتخاب کنید"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{hasActiveInstitute ? "مدیر مؤسسه می‌تواند دوره و کلاس فعال ایجاد کند." : "برای جلوگیری از ثبت‌نام در مؤسسهٔ اشتباه، دوره‌ها فقط پس از انتخاب مؤسسهٔ فعال نمایش داده می‌شوند."}</p>
            <Button asChild className="mt-4"><Link to="/institutes">{hasActiveInstitute ? "مدیریت مؤسسهٔ من" : "انتخاب مؤسسهٔ فعال"}</Link></Button>
          </section>
          : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => <article key={course.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft">
              <h2 className="text-lg font-extrabold">{course.title}</h2>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{course.description || "توضیحی برای این دوره ثبت نشده است."}</p>
              <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Users className="h-4 w-4 text-primary"/>{faNum(course.classes.length)} کلاس فعال</span><strong>{course.price > 0 ? `${faNum(course.price)} تومان` : "رایگان"}</strong></div>
              <div className="mt-4 flex flex-wrap gap-2">
                {course.classes.slice(0, 3).map((item) => <span key={item.id} className="rounded-full bg-muted px-2.5 py-1 text-xs">{item.title}</span>)}
                {course.classes.length > 3 && <span className="rounded-full bg-muted px-2.5 py-1 text-xs">و {faNum(course.classes.length - 3)} کلاس دیگر</span>}
              </div>
              <Button asChild className="mt-5 w-full"><Link to="/courses/$courseId" params={{courseId:course.id}}>مشاهده جزئیات</Link></Button>
            </article>)}
          </div>}
      </>}
    </div>
  </>;
}

function dateLabel(value: string | null) {
  if (!value) return "زمان برگزاری اعلام نشده";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "زمان نامشخص";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function BackendCourseDetail({ user, courseId }: { user: User | null; courseId: string }) {
  const [course, setCourse] = useState<CatalogCourse | null>(null);
  const [states, setStates] = useState<Map<string, {requestStatus: "pending" | "approved" | "rejected" | null; enrolled: boolean}>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busyClass, setBusyClass] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("اتصال پایگاه داده در دسترس نیست.");
    const catalog = await loadBackendCourseCatalog(sb);
    const found = catalog.find((item) => item.id === courseId) ?? null;
    setCourse(found);
    if (found && user?.role === "student") {
      const rows = await loadBackendCourseEnrollmentStates(sb, found, user.id);
      setStates(new Map(rows.map((row) => [row.classId, {requestStatus:row.requestStatus,enrolled:row.enrolled}])));
    } else {
      setStates(new Map());
    }
    setError(null);
  }, [courseId, user?.id, user?.role]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const sb = getSupabase();
    if (!user || !sb) { setCourse(null); setLoading(false); return () => { active = false; }; }
    void reload().catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : "دریافت جزئیات انجام نشد.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload, user?.id]);

  const apply = async (classId: string) => {
    const sb = getSupabase();
    if (!sb || !user || user.role !== "student") return;
    setBusyClass(classId);
    try {
      await requestStudentEnrollment(sb, user.id, classId);
      await reload();
      toast.success("درخواست ثبت‌نام ارسال شد.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "ارسال درخواست انجام نشد.");
    } finally { setBusyClass(null); }
  };

  if (!user) return <div className="mx-auto max-w-3xl px-4 py-16 text-center">
    <h1 className="text-2xl font-extrabold">برای مشاهده جزئیات وارد حساب شوید</h1>
    <Button asChild className="mt-5"><Link to="/auth">ورود و ثبت‌نام</Link></Button>
  </div>;

  return <div className="mx-auto max-w-5xl px-4 py-6">
    <Link to="/courses" className="mb-5 inline-flex text-sm font-semibold text-primary">بازگشت به دوره‌ها</Link>
    {loading ? <p role="status" className="rounded-xl border p-5 text-sm text-muted-foreground">در حال دریافت اطلاعات دوره…</p>
      : error ? <section role="alert" className="rounded-2xl border border-destructive/40 p-5 text-sm">{error}</section>
      : !course ? <EmptyState title="دوره پیدا نشد" description="ممکن است دوره غیرفعال شده یا حذف شده باشد."/>
      : <>
        <section className="rounded-3xl bg-hero p-6 text-hero-foreground shadow-elegant sm:p-9">
          <p className="text-sm font-bold text-hero-foreground/75">دوره آموزشی</p>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{course.title}</h1>
          <p className="mt-4 leading-8 text-hero-foreground/85">{course.description || "توضیحی برای این دوره ثبت نشده است."}</p>
          <p className="mt-4 text-sm">{course.price > 0 ? `شهریه: ${faNum(course.price)} تومان · پرداخت آنلاین هنوز فعال نیست` : "رایگان"}</p>
        </section>
        <section className="mt-6 rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-extrabold">کلاس‌های فعال این دوره</h2>
          {course.classes.length ? <ul className="mt-4 space-y-3">{course.classes.map((item) => {
            const state = states.get(item.id);
            const full = item.remainingSeats !== null && item.remainingSeats <= 0;
            return <li key={item.id} className="rounded-xl border p-4">
              <h3 className="font-bold">{item.title}</h3>
              {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4"/>{dateLabel(item.startsAt)}</p>
                <p className="flex items-center gap-2"><Users className="h-4 w-4"/>{item.capacity === null ? "ظرفیت نامحدود اعلام شده" : `${faNum(item.remainingSeats ?? Math.max(0,item.capacity-item.enrolledCount))} جای خالی از ${faNum(item.capacity)} نفر`}</p>
              </div>
              {course.price > 0 && !state?.enrolled && state?.requestStatus !== "pending" && state?.requestStatus !== "approved" ? <p className="mt-3 text-sm text-muted-foreground">این دوره شهریه دارد؛ ثبت‌نام آنلاین تا فعال‌شدن درگاه پرداخت انجام نمی‌شود. برای اطلاع از شرایط با مدیر مؤسسه تماس بگیرید.</p>
                : state?.enrolled ? <p className="mt-3 text-sm font-semibold text-primary">در این کلاس ثبت‌نام قطعی دارید.</p>
                : state?.requestStatus === "pending" ? <p className="mt-3 text-sm">درخواست شما در انتظار بررسی است.</p>
                : state?.requestStatus === "approved" ? <p className="mt-3 text-sm font-semibold text-primary">درخواست شما تأیید شده است.</p>
                : state?.requestStatus === "rejected" ? <p className="mt-3 text-sm">درخواست قبلی رد شده است؛ برای پیگیری با مدیر تماس بگیرید.</p>
                : user.role === "student" ? <Button className="mt-4" disabled={full || busyClass === item.id} onClick={() => void apply(item.id)}>{full ? "ظرفیت تکمیل است" : busyClass === item.id ? "در حال ارسال…" : "درخواست ثبت‌نام"}</Button>
                : <p className="mt-3 text-xs text-muted-foreground">ثبت‌نام فقط با حساب دانش‌پژوه امکان‌پذیر است.</p>}
            </li>;
          })}</ul> : <p className="mt-3 text-sm text-muted-foreground">هنوز کلاسی برای این دوره تعریف نشده است.</p>}
        </section>
      </>}
  </div>;
}
