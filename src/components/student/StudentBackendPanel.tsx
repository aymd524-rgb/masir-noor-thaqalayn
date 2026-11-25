import { getSurah } from "@/lib/quran/surahs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/backend/supabase";
import { toLocalDateInputValue } from "@/lib/date";
import { loadStudentWorkspace, requestStudentEnrollment, saveStudentHifzAssignmentStatus } from "@/lib/backend/student";
import type { User } from "@/lib/domain/types";

const statusLabel = { pending: "در انتظار بررسی", approved: "تأیید شده", rejected: "رد شده" } as const;
const attendanceLabel = { present: "حاضر", absent: "غایب", late: "با تأخیر", excused: "غیبت موجه" } as const;
const hifzTypeLabel = { memorization: "حفظ جدید", review: "مرور" } as const;
const hifzAssessmentLabel = { excellent: "عالی", good: "خوب", fair: "قابل قبول", needs_practice: "نیازمند تمرین" } as const;

type StudentInstituteCard = { id: string; name: string; role: string; status: string; active: boolean; courseCount: number; classCount: number };

export function StudentBackendPanel({ user }: { user: User }) {
  const [institutes, setInstitutes] = useState<StudentInstituteCard[]>([]);
  const [activeInstituteId, setActiveInstituteId] = useState("");
  const [busyInstitute, setBusyInstitute] = useState("");
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof loadStudentWorkspace>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyClass, setBusyClass] = useState("");
  const [busyAssignment, setBusyAssignment] = useState("");
  const reload = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("تنظیمات اتصال پایگاه داده هنوز در برنامه وارد نشده است.");
    const [workspaceData, membershipResult, preferenceResult] = await Promise.all([
      loadStudentWorkspace(sb, user.id),
      sb.from("institute_memberships").select("institute_id,role,status").eq("user_id", user.id).order("requested_at", { ascending: false }),
      sb.from("user_institute_preferences").select("institute_id").eq("user_id", user.id).maybeSingle(),
    ]);
    if (membershipResult.error) throw new Error(membershipResult.error.message);
    if (preferenceResult.error) throw new Error(preferenceResult.error.message);
    const activeMemberships = (membershipResult.data ?? []).filter((item) => item.status === "active");
    const instituteIds = [...new Set(activeMemberships.map((item) => item.institute_id))];
    const [institutionResult, courseResult, classResult] = instituteIds.length ? await Promise.all([
      sb.from("institutions").select("id,name,is_active").in("id", instituteIds),
      sb.from("courses").select("id,institute_id").eq("is_active", true).in("institute_id", instituteIds),
      sb.from("classes").select("id,institute_id").eq("is_active", true).in("institute_id", instituteIds),
    ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
    if (institutionResult.error) throw new Error(institutionResult.error.message);
    if (courseResult.error) throw new Error(courseResult.error.message);
    if (classResult.error) throw new Error(classResult.error.message);
    const institutionsById = new Map((institutionResult.data ?? []).map((item) => [item.id, item]));
    const courseCounts = new Map<string, number>();
    const classCounts = new Map<string, number>();
    for (const item of courseResult.data ?? []) courseCounts.set(item.institute_id, (courseCounts.get(item.institute_id) ?? 0) + 1);
    for (const item of classResult.data ?? []) classCounts.set(item.institute_id, (classCounts.get(item.institute_id) ?? 0) + 1);
    const cards = activeMemberships.map((membership) => {
      const institution = institutionsById.get(membership.institute_id);
      return institution ? {
        id: institution.id, name: institution.name, role: membership.role, status: membership.status,
        active: institution.is_active, courseCount: courseCounts.get(institution.id) ?? 0,
        classCount: classCounts.get(institution.id) ?? 0,
      } : null;
    }).filter((item): item is StudentInstituteCard => item !== null);
    setInstitutes(cards);
    setActiveInstituteId(cards.some((item) => item.id === preferenceResult.data?.institute_id) ? preferenceResult.data!.institute_id! : "");
    setWorkspace(workspaceData);
  }, [user.id]);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const sb = getSupabase();
        if (!sb) throw new Error("تنظیمات اتصال پایگاه داده هنوز در برنامه وارد نشده است.");
        const data = await loadStudentWorkspace(sb, user.id);
        if (active) setWorkspace(data);
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "دریافت اطلاعات انجام نشد.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [user.id]);

  const pendingIds = useMemo(() => new Set((workspace?.requests ?? []).filter((r) => r.status === "pending").map((r) => r.classId)), [workspace]);
  const enrolledIds = useMemo(() => new Set((workspace?.enrollments ?? []).map((r) => r.classId)), [workspace]);
  const updateAssignment = async (assignmentId: string, status: "in_progress" | "completed" | "needs_help") => {
    const sb = getSupabase();
    if (!sb) return;
    setBusyAssignment(assignmentId);
    try {
      await saveStudentHifzAssignmentStatus(sb, { assignmentId, studentId: user.id, status, note: "" });
      await reload();
      toast.success("وضعیت برنامه حفظ به‌روزرسانی شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "به‌روزرسانی وضعیت انجام نشد."); }
    finally { setBusyAssignment(""); }
  };

  const submitRequest = async (classId: string) => {
    const sb = getSupabase();
    const targetClass = workspace?.classes.find((item) => item.id === classId);
    if (!sb || !targetClass) return;
    if (targetClass.coursePrice > 0) {
      toast.error("این دوره شهریه دارد؛ ثبت‌نام آنلاین تا فعال‌شدن درگاه پرداخت امکان‌پذیر نیست.");
      return;
    }
    setBusyClass(classId);
    try {
      await requestStudentEnrollment(sb, user.id, classId);
      await reload();
      toast.success("درخواست ثبت‌نام ارسال شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "ارسال درخواست انجام نشد."); }
    finally { setBusyClass(""); }
  };

  if (loading) return <p className="rounded-xl border p-4 text-sm text-muted-foreground">در حال دریافت اطلاعات از پایگاه داده…</p>;
  if (!workspace) return <p className="rounded-xl border p-4 text-sm">اطلاعات بارگذاری نشد. اتصال و دسترسی پایگاه داده را بررسی کنید.</p>;
  const present = workspace.attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendanceRate = workspace.attendance.length ? Math.round(present / workspace.attendance.length * 100) : null;
  const memorizationRecords = workspace.hifzRecords.filter((record) => record.recordType === "memorization");
  const reviewRecords = workspace.hifzRecords.filter((record) => record.recordType === "review");
  const memorizationAyahEntries = memorizationRecords.reduce((sum, record) => sum + record.ayahEnd - record.ayahStart + 1, 0);
  const reviewAyahEntries = reviewRecords.reduce((sum, record) => sum + record.ayahEnd - record.ayahStart + 1, 0);
  const excellentHifzAssessments = workspace.hifzRecords.filter((record) => record.assessment === "excellent").length;
  const todayIso = toLocalDateInputValue(new Date());
  const completedHifzAssignments = workspace.hifzAssignments.filter((item) => item.status === "completed").length;
  const overdueHifzAssignments = workspace.hifzAssignments.filter((item) => item.status !== "completed" && item.dueDate < todayIso).length;
  const activeHifzAssignments = workspace.hifzAssignments.filter((item) => item.status !== "completed").length;
  const hifzAssignmentRate = workspace.hifzAssignments.length
    ? Math.round(completedHifzAssignments / workspace.hifzAssignments.length * 100)
    : 0;

  const enrollmentProgress = workspace.enrollments.map((enrollment) => {
    const records = workspace.attendance.filter((item) => item.enrollmentId === enrollment.id);
    const effective = records.filter((item) => item.status === "present" || item.status === "late").length;
    const grades = workspace.grades.filter((item) => item.enrollmentId === enrollment.id);
    const average = grades.length ? grades.reduce((sum, item) => sum + item.score, 0) / grades.length : null;
    return { ...enrollment, attendanceCount: records.length, attendanceRate: records.length ? Math.round(effective / records.length * 100) : null, gradeCount: grades.length, average };
  });

  const chooseInstitute = async (instituteId: string) => {
    const sb = getSupabase();
    if (!sb) return;
    setBusyInstitute(instituteId);
    try {
      const { error } = await sb.from("user_institute_preferences").upsert(
        { user_id: user.id, institute_id: instituteId, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
      if (error) throw new Error(error.message);
      setActiveInstituteId(instituteId);
      toast.success("این مؤسسه برای فعالیت‌های بعدی انتخاب شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "انتخاب مؤسسه انجام نشد.");
    } finally { setBusyInstitute(""); }
  };

  return <div className="space-y-5">
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-extrabold">مؤسسه‌های من</h2>
      <p className="mt-1 text-sm text-muted-foreground">هر مؤسسه در بخش جداگانه نمایش داده می‌شود. تغییر مؤسسهٔ فعال، عضویت شما در مؤسسه‌های دیگر را حذف نمی‌کند.</p>
      {institutes.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{institutes.map((institute) => <article key={institute.id} className="rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-bold">{institute.name}</h3><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{institute.role === "teacher" ? "استاد" : institute.role === "owner" ? "مالک" : institute.role === "manager" ? "مدیر" : "دانش‌پژوه"}</span></div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><p className="rounded-lg bg-muted/50 p-2">دوره‌های فعال: {institute.courseCount}</p><p className="rounded-lg bg-muted/50 p-2">کلاس‌های فعال: {institute.classCount}</p></div>
        {activeInstituteId === institute.id ? <p className="mt-3 text-sm font-semibold text-primary">مؤسسهٔ فعال فعلی</p> : <Button className="mt-3 w-full" variant="outline" size="sm" disabled={!!busyInstitute} onClick={() => void chooseInstitute(institute.id)}>{busyInstitute === institute.id ? "در حال ذخیره…" : "انتخاب برای ثبت‌نام و مشاهدهٔ دوره‌ها"}</Button>}
        <Button asChild variant="link" className="mt-1 px-0"><Link to="/courses">رفتن به فهرست دوره‌ها</Link></Button>
      </article>)}</div> : <p className="mt-3 text-sm text-muted-foreground">هنوز عضویت فعال در مؤسسه‌ای ندارید. پس از تأیید عضویت، کارت مؤسسه در این قسمت ظاهر می‌شود.</p>}
    </section>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric label="کلاس‌های قطعی" value={workspace.enrollments.length}/>
      <Metric label="درخواست‌های منتظر" value={workspace.requests.filter((r) => r.status === "pending").length}/>
      <Metric label="نمره‌ها" value={workspace.grades.length}/>
      <Metric label="حضور مؤثر" value={attendanceRate === null ? "—" : attendanceRate + "٪"}/>
    </div>
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-extrabold">گزارش پیشرفت آموزشی من</h2>
      <p className="mt-1 text-xs text-muted-foreground">این گزارش بر اساس حضور و غیاب و نمره‌های ثبت‌شده برای هر ثبت‌نام تهیه شده است.</p>
      {enrollmentProgress.length ? <ul className="mt-3 divide-y">{enrollmentProgress.map((item) => <li key={item.id} className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><b>{item.classTitle}</b><span className="text-xs text-muted-foreground">شروع ثبت‌نام: {new Date(item.createdAt).toLocaleDateString("fa-IR")}</span></div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-muted/50 p-3"><p className="font-bold">{item.attendanceCount}</p><p className="text-xs text-muted-foreground">جلسات ثبت‌شده</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p className="font-bold">{item.attendanceRate === null ? "—" : item.attendanceRate + "٪"}</p><p className="text-xs text-muted-foreground">حضور مؤثر</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p className="font-bold">{item.gradeCount}</p><p className="text-xs text-muted-foreground">نمره‌های ثبت‌شده</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p className="font-bold">{item.average === null ? "—" : Number(item.average.toFixed(2))}</p><p className="text-xs text-muted-foreground">میانگین نمره</p></div>
        </div>
      </li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">پس از قطعی‌شدن ثبت‌نام در کلاس، گزارش پیشرفت شما اینجا نمایش داده می‌شود.</p>}
      <div className="mt-4 border-t pt-4">
        <h3 className="font-bold">گزارش حفظ و مرور قرآن</h3>
        <p className="mt-1 text-xs text-muted-foreground">ارزیابی‌های ثبت‌شده توسط استاد برای هر کلاس؛ آمار زیر تعداد آیاتِ موجود در رکوردهاست و آیات تکراری را حذف نمی‌کند.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-extrabold">{memorizationRecords.length}</p><p className="text-xs text-muted-foreground">جلسات ثبت حفظ جدید</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-extrabold">{memorizationAyahEntries}</p><p className="text-xs text-muted-foreground">آیه در رکوردهای حفظ</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-extrabold">{reviewRecords.length}</p><p className="text-xs text-muted-foreground">جلسات ثبت مرور</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-extrabold">{reviewAyahEntries}</p><p className="text-xs text-muted-foreground">آیه در رکوردهای مرور</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p className="text-lg font-extrabold">{excellentHifzAssessments}</p><p className="text-xs text-muted-foreground">ارزیابی عالی</p></div>
        </div>
        {enrollmentProgress.length ? <ul className="mt-3 divide-y">{enrollmentProgress.map((enrollment) => {
          const records = workspace.hifzRecords.filter((record) => record.enrollmentId === enrollment.id);
          return <li key={enrollment.id} className="py-3">
            <p className="text-sm font-semibold">{enrollment.classTitle} — {records.length} ارزیابی</p>
            {records.length ? <ul className="mt-2 space-y-2">{records.slice(0, 8).map((record) => <li key={record.id} className="rounded-xl bg-muted/50 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>{hifzTypeLabel[record.recordType]} · سوره {getSurah(record.surahNumber)?.name ?? record.surahNumber}، آیات {record.ayahStart}{record.ayahEnd !== record.ayahStart ? ` تا ${record.ayahEnd}` : ""}</b>
                <span className="text-xs text-muted-foreground">{new Date(record.sessionDate + "T00:00:00").toLocaleDateString("fa-IR")}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">ارزیابی: {hifzAssessmentLabel[record.assessment]}</p>
              {record.notes ? <p className="mt-1 text-xs">{record.notes}</p> : null}
            </li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">هنوز ارزیابی حفظی برای این کلاس ثبت نشده است.</p>}
          </li>;
        })}</ul> : <p className="mt-2 text-xs text-muted-foreground">پس از ثبت‌نام قطعی در کلاس، ارزیابی‌های استاد در این قسمت نمایش داده می‌شود.</p>}
      </div>
    </section>
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-extrabold">برنامه هفتگی حفظ و مرور من</h2>
      <p className="mt-1 text-xs text-muted-foreground">برنامه‌های تعیین‌شده توسط استاد و مهلت انجام آن‌ها در این قسمت نمایش داده می‌شود.</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xl font-extrabold">{workspace.hifzAssignments.length}</p><p className="text-xs text-muted-foreground">کل برنامه‌ها</p></div>
        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xl font-extrabold">{completedHifzAssignments}</p><p className="text-xs text-muted-foreground">انجام‌شده</p></div>
        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xl font-extrabold">{overdueHifzAssignments}</p><p className="text-xs text-muted-foreground">عقب‌افتاده</p></div>
        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xl font-extrabold">{hifzAssignmentRate}٪</p><p className="text-xs text-muted-foreground">درصد انجام</p></div>
      </div>
      {workspace.hifzAssignments.length > 0 && <div className="mt-3 space-y-1">
        <div className="flex justify-between text-xs"><span>پیشرفت برنامه‌های حفظ</span><b>{hifzAssignmentRate}٪</b></div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: hifzAssignmentRate + "%" }}/></div>
        <p className="text-xs text-muted-foreground">{activeHifzAssignments} برنامه تکمیل‌نشده باقی مانده است.</p>
      </div>}

      {workspace.hifzAssignments.length ? <ul className="mt-3 divide-y">{workspace.hifzAssignments.map((item) => <li key={item.id} className="py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <b className="text-sm">{item.assignmentType === "memorization" ? "حفظ جدید" : "مرور"} · {getSurah(item.surahNumber)?.name ?? ("سوره " + item.surahNumber)}، آیات {item.ayahStart} تا {item.ayahEnd}</b>
            <p className="mt-1 text-xs text-muted-foreground">{item.classTitle} · مهلت: {new Date(item.dueDate + "T00:00:00").toLocaleDateString("fa-IR")}</p>
            {item.instructions && <p className="mt-1 text-sm">{item.instructions}</p>}
          </div>
          <select aria-label="وضعیت برنامه حفظ" disabled={busyAssignment === item.id} value={item.status ?? "in_progress"} onChange={(event) => void updateAssignment(item.id, event.target.value as "in_progress" | "completed" | "needs_help")} className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="in_progress">در حال انجام</option>
            <option value="completed">انجام شد</option>
            <option value="needs_help">نیاز به کمک دارم</option>
          </select>
        </div>
      </li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">هنوز برنامه‌ای از طرف استاد تعیین نشده است.</p>}
    </section>
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-extrabold">کلاس‌های قابل ثبت‌نام</h2>
      {workspace.classes.length ? <ul className="mt-3 divide-y">{workspace.classes.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.courseTitle}{item.description ? " · " + item.description : ""} · {item.coursePrice > 0 ? `شهریه ${item.coursePrice.toLocaleString("fa-IR")} تومان` : "رایگان"}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{item.capacity === null ? "ظرفیت نامحدود" : item.remainingSeats === 0 ? "ظرفیت تکمیل" : `${item.remainingSeats} جای خالی از ${item.capacity}`}</p></div>
        {enrolledIds.has(item.id) ? <span className="text-xs font-semibold text-muted-foreground">ثبت‌نام قطعی</span> : pendingIds.has(item.id) ? <span className="text-xs font-semibold text-muted-foreground">در انتظار بررسی</span> : item.remainingSeats === 0 ? <span className="text-xs font-semibold text-muted-foreground">ظرفیت تکمیل</span> : item.coursePrice > 0 ? <span className="text-xs font-semibold text-muted-foreground">ثبت‌نام پس از راه‌اندازی پرداخت</span> : <button disabled={!!busyClass} onClick={() => void submitRequest(item.id)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busyClass === item.id ? "در حال ارسال…" : "درخواست ثبت‌نام"}</button>}
      </li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">فعلاً کلاس فعالی برای ثبت‌نام وجود ندارد.</p>}
    </section>
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-extrabold">وضعیت درخواست‌های من</h2>
      {workspace.requests.length ? <ul className="mt-3 divide-y">{workspace.requests.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{item.classTitle} — {item.courseTitle}</span><b>{statusLabel[item.status]}</b></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">هنوز درخواستی ثبت نکرده‌اید.</p>}
    </section>
    <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">آخرین نمره‌ها</h2>{workspace.grades.length ? <ul className="mt-3 space-y-2">{workspace.grades.slice(-5).reverse().map((g) => <li key={g.id} className="flex justify-between gap-3 text-sm"><span>{g.title}</span><b>{g.score}</b></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">هنوز نمره‌ای ثبت نشده است.</p>}</section>
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-extrabold">حضور و غیاب</h2>{workspace.attendance.length ? <ul className="mt-3 space-y-2">{workspace.attendance.slice(-6).reverse().map((a) => <li key={a.id} className="flex justify-between gap-3 text-sm"><span>{a.sessionDate}</span><b>{attendanceLabel[a.status]}</b></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">گزارشی ثبت نشده است.</p>}</section>
    </div>
  </div>;
}
function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl border bg-card p-4"><p className="text-xl font-extrabold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>;
}
