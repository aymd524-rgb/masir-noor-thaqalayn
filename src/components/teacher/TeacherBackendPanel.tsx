import { QURAN_SURAHS, getSurah } from "@/lib/quran/surahs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";
import { toLocalDateInputValue } from "@/lib/date";
import {
  loadTeacherWorkspace,
  saveTeacherAttendance,
  saveTeacherGrade,
  saveTeacherHifzRecord,
  saveTeacherHifzAssignment,
  type TeacherAttendance,
} from "@/lib/backend/teacher";
import type { User } from "@/lib/domain/types";

const statusLabels: Record<TeacherAttendance["status"], string> = {
  present: "حاضر",
  absent: "غایب",
  late: "با تأخیر",
  excused: "غیبت موجه",
};

export function TeacherBackendPanel({ user }: { user: User }) {
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof loadTeacherWorkspace>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classId, setClassId] = useState("");
  const [sessionDate, setSessionDate] = useState(toLocalDateInputValue(new Date()));
  const [gradeEnrollmentId, setGradeEnrollmentId] = useState("");
  const [gradeTitle, setGradeTitle] = useState("");
  const [gradeScore, setGradeScore] = useState("0");
  const [hifzEnrollmentId, setHifzEnrollmentId] = useState("");
  const [hifzSurah, setHifzSurah] = useState("1");
  const [hifzAyahStart, setHifzAyahStart] = useState("1");
  const [hifzAyahEnd, setHifzAyahEnd] = useState("1");
  const [hifzType, setHifzType] = useState<"memorization" | "review">("memorization");
  const [hifzAssessment, setHifzAssessment] = useState<"excellent" | "good" | "fair" | "needs_practice">("good");
  const [hifzNotes, setHifzNotes] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState(toLocalDateInputValue(new Date()));
  const [assignmentInstructions, setAssignmentInstructions] = useState("");

  const reload = async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("تنظیمات اتصال پایگاه داده هنوز در برنامه وارد نشده است.");
    const data = await loadTeacherWorkspace(sb, user.id, user.role === "admin");
    setWorkspace(data);
    setClassId((current) => data.classes.some((item) => item.id === current) ? current : data.classes[0]?.id ?? "");
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const sb = getSupabase();
        if (!sb) throw new Error("تنظیمات اتصال پایگاه داده هنوز در برنامه وارد نشده است.");
        const data = await loadTeacherWorkspace(sb, user.id, user.role === "admin");
        if (active) {
          setWorkspace(data);
          setClassId(data.classes[0]?.id ?? "");
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "دریافت اطلاعات کلاس‌ها انجام نشد.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [user.id, user.role]);

  const activeClass = workspace?.classes.find((item) => item.id === classId);
  const enrollments = useMemo(
    () => (workspace?.enrollments ?? []).filter((item) => item.classId === classId),
    [workspace, classId],
  );
  const requests = (workspace?.requests ?? []).filter((item) => item.classId === classId);
  const selectedEnrollmentId = enrollments.some((item) => item.id === gradeEnrollmentId)
    ? gradeEnrollmentId
    : enrollments[0]?.id ?? "";
  const selectedHifzEnrollmentId = enrollments.some((item) => item.id === hifzEnrollmentId)
    ? hifzEnrollmentId
    : enrollments[0]?.id ?? "";
  const selectedSurah = getSurah(Number(hifzSurah));
  const classHifzAssignments = (workspace?.hifzAssignments ?? []).filter((item) =>
    enrollments.some((enrollment) => enrollment.id === item.enrollmentId),
  );
  const todayIso = toLocalDateInputValue(new Date());
  const completedAssignments = classHifzAssignments.filter((item) => item.completionStatus === "completed").length;
  const overdueAssignments = classHifzAssignments.filter((item) => item.completionStatus !== "completed" && item.dueDate < todayIso).length;
  const pendingAssignments = classHifzAssignments.length - completedAssignments;
  const assignmentCompletionRate = classHifzAssignments.length
    ? Math.round(completedAssignments / classHifzAssignments.length * 100)
    : 0;
  const assignmentStudentProgress = enrollments.map((enrollment) => {
    const items = classHifzAssignments.filter((item) => item.enrollmentId === enrollment.id);
    const completed = items.filter((item) => item.completionStatus === "completed").length;
    return { ...enrollment, total: items.length, completed, rate: items.length ? Math.round(completed / items.length * 100) : 0 };
  }).filter((item) => item.total > 0);

  const studentReportCards = enrollments.map((enrollment) => {
    const hifzRecords = (workspace?.hifzRecords ?? []).filter((item) => item.enrollmentId === enrollment.id);
    const memorization = hifzRecords.filter((item) => item.recordType === "memorization");
    const reviews = hifzRecords.filter((item) => item.recordType === "review");
    const attendance = (workspace?.attendance ?? []).filter((item) => item.enrollmentId === enrollment.id);
    const grades = (workspace?.grades ?? []).filter((item) => item.enrollmentId === enrollment.id);
    const assignments = (workspace?.hifzAssignments ?? []).filter((item) => item.enrollmentId === enrollment.id);
    const present = attendance.filter((item) => item.status === "present").length;
    const late = attendance.filter((item) => item.status === "late").length;
    const absent = attendance.filter((item) => item.status === "absent").length;
    const excused = attendance.filter((item) => item.status === "excused").length;
    const average = grades.length ? grades.reduce((sum, item) => sum + item.score, 0) / grades.length : null;
    const completed = assignments.filter((item) => item.completionStatus === "completed").length;
    const overdue = assignments.filter((item) => item.completionStatus !== "completed" && item.dueDate < todayIso).length;
    const countAyahEntries = (items: typeof hifzRecords) => items.reduce((sum, item) => sum + item.ayahEnd - item.ayahStart + 1, 0);
    return {
      ...enrollment,
      memorizationCount: memorization.length,
      memorizationAyahs: countAyahEntries(memorization),
      reviewCount: reviews.length,
      reviewAyahs: countAyahEntries(reviews),
      assessmentCount: hifzRecords.length,
      excellent: hifzRecords.filter((item) => item.assessment === "excellent").length,
      good: hifzRecords.filter((item) => item.assessment === "good").length,
      fair: hifzRecords.filter((item) => item.assessment === "fair").length,
      needsPractice: hifzRecords.filter((item) => item.assessment === "needs_practice").length,
      attendanceCount: attendance.length,
      present, late, absent, excused,
      attendanceRate: attendance.length ? Math.round((present + late) / attendance.length * 100) : null,
      gradeCount: grades.length,
      average,
      assignmentCount: assignments.length,
      completedAssignments: completed,
      overdueAssignments: overdue,
      assignmentRate: assignments.length ? Math.round(completed / assignments.length * 100) : null,
    };
  });

  const saveAttendance = async (enrollmentId: string, status: TeacherAttendance["status"]) => {
    const sb = getSupabase();
    if (!sb) return;
    setSaving(true);
    try {
      await saveTeacherAttendance(sb, { enrollmentId, sessionDate, status });
      await reload();
      toast.success("حضور و غیاب در پایگاه داده ذخیره شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره حضور و غیاب انجام نشد.");
    } finally { setSaving(false); }
  };

  const submitGrade = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sb = getSupabase();
    if (!sb || !selectedEnrollmentId) return;
    setSaving(true);
    try {
      await saveTeacherGrade(sb, { enrollmentId: selectedEnrollmentId, title: gradeTitle, score: Number(gradeScore) });
      await reload();
      setGradeTitle("");
      setGradeScore("0");
      toast.success("نمره در پایگاه داده ذخیره شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت نمره انجام نشد.");
    } finally { setSaving(false); }
  };

  if (loading) return <p className="rounded-xl border p-4 text-sm text-muted-foreground">در حال دریافت اطلاعات از پایگاه داده…</p>;
  if (!workspace) return <p className="rounded-xl border p-4 text-sm">اطلاعات کلاس‌ها بارگذاری نشد. اتصال و دسترسی پایگاه داده را بررسی کنید.</p>;

  return <div className="space-y-5">
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-extrabold">کلاس‌های من</h2>
      {workspace.classes.length ? <div className="mt-3">
        <label className="text-sm font-semibold">انتخاب کلاس
          <select value={classId} onChange={(event) => setClassId(event.target.value)} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal">
            {workspace.classes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        {activeClass?.description && <p className="mt-2 text-sm text-muted-foreground">{activeClass.description}</p>}
      </div> : <p className="mt-3 text-sm text-muted-foreground">هنوز کلاسی برای این حساب تعریف نشده است.</p>}
    </section>

    {activeClass && <>
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-extrabold">دانش‌پژوهان کلاس</h2>
        <p className="mt-1 text-sm text-muted-foreground">{enrollments.length} ثبت‌نام قطعی</p>
        {enrollments.length ? <ul className="mt-3 divide-y">{enrollments.map((item) => <li key={item.id} className="py-2 text-sm">{item.studentName}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">هنوز دانش‌پژوهی در این کلاس ثبت‌نام قطعی ندارد.</p>}
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div><h2 className="font-extrabold">ثبت حضور و غیاب</h2><p className="mt-1 text-sm text-muted-foreground">تاریخ جلسه را انتخاب کنید و وضعیت هر دانش‌پژوه را ثبت کنید.</p></div>
        <label className="block text-sm font-semibold">تاریخ جلسه
          <input type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"/>
        </label>
        {enrollments.length ? <div className="divide-y rounded-xl border">{enrollments.map((item) => {
          const record = workspace.attendance.find((row) => row.enrollmentId === item.id && row.sessionDate === sessionDate);
          return <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
            <span className="text-sm font-semibold">{item.studentName}</span>
            <select aria-label={`وضعیت حضور ${item.studentName}`} disabled={saving} value={record?.status ?? ""} onChange={(event) => {
              if (event.target.value) void saveAttendance(item.id, event.target.value as TeacherAttendance["status"]);
            }} className="min-w-36 rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="" disabled>ثبت نشده</option>
              <option value="present">حاضر</option><option value="absent">غایب</option><option value="late">با تأخیر</option><option value="excused">غیبت موجه</option>
            </select>
            {record && <span className="text-xs text-muted-foreground">{statusLabels[record.status]}</span>}
          </div>;
        })}</div> : <p className="text-sm text-muted-foreground">برای ثبت حضور و غیاب، ابتدا باید دانش‌پژوهی ثبت‌نام قطعی داشته باشد.</p>}
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div><h2 className="font-extrabold">ثبت نمره</h2><p className="mt-1 text-sm text-muted-foreground">نمره در پایگاه داده مشترک ذخیره می‌شود.</p></div>
        <form onSubmit={submitGrade} className="grid gap-3">
          <label className="text-sm font-semibold">دانش‌پژوه
            <select value={selectedEnrollmentId} onChange={(event) => setGradeEnrollmentId(event.target.value)} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal">
              {enrollments.map((item) => <option key={item.id} value={item.id}>{item.studentName}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">عنوان ارزشیابی
            <input value={gradeTitle} onChange={(event) => setGradeTitle(event.target.value)} required placeholder="مثلاً آزمون حفظ سوره نبأ" className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"/>
          </label>
          <label className="text-sm font-semibold">نمره
            <input type="number" min="0" step="0.25" value={gradeScore} onChange={(event) => setGradeScore(event.target.value)} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"/>
          </label>
          <button type="submit" disabled={saving || !selectedEnrollmentId || !gradeTitle.trim()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">ذخیره نمره</button>
        </form>
        {workspace.grades.filter((item) => enrollments.some((enrollment) => enrollment.id === item.enrollmentId)).length > 0 && <ul className="divide-y border-t pt-2">{workspace.grades.filter((item) => enrollments.some((enrollment) => enrollment.id === item.enrollmentId)).map((item) => <li key={item.id} className="flex justify-between gap-3 py-2 text-sm"><span>{enrollments.find((enrollment) => enrollment.id === item.enrollmentId)?.studentName} · {item.title}</span><strong>{item.score}</strong></li>)}</ul>}
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div><h2 className="font-extrabold">برنامه هفتگی حفظ و مرور</h2><p className="mt-1 text-sm text-muted-foreground">برای هر دانش‌پژوه محدوده حفظ یا مرور و مهلت انجام تعیین کنید.</p></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-muted/50 p-3"><p className="text-xl font-extrabold">{classHifzAssignments.length}</p><p className="text-xs text-muted-foreground">کل برنامه‌ها</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p className="text-xl font-extrabold">{completedAssignments}</p><p className="text-xs text-muted-foreground">انجام‌شده</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p className="text-xl font-extrabold">{overdueAssignments}</p><p className="text-xs text-muted-foreground">عقب‌افتاده</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p className="text-xl font-extrabold">{assignmentCompletionRate}٪</p><p className="text-xs text-muted-foreground">درصد انجام</p></div>
        </div>
        {classHifzAssignments.length > 0 && <div className="space-y-2">
          <div className="flex justify-between text-xs"><span>پیشرفت کل کلاس</span><b>{assignmentCompletionRate}٪</b></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: assignmentCompletionRate + "%" }}/></div>
          <p className="text-xs text-muted-foreground">{pendingAssignments} برنامه هنوز تکمیل نشده است.</p>
        </div>}
        {assignmentStudentProgress.length > 0 && <div className="space-y-3">
          <h3 className="text-sm font-bold">پیشرفت هر دانش‌پژوه</h3>
          {assignmentStudentProgress.map((item) => <div key={item.id} className="space-y-1">
            <div className="flex justify-between gap-2 text-xs"><span>{item.studentName}</span><b>{item.completed} از {item.total} · {item.rate}٪</b></div>
            <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: item.rate + "%" }}/></div>
          </div>)}
        </div>}
        <form onSubmit={async (event) => {
          event.preventDefault();
          const sb = getSupabase();
          if (!sb || !selectedHifzEnrollmentId) return;
          setSaving(true);
          try {
            await saveTeacherHifzAssignment(sb, { enrollmentId: selectedHifzEnrollmentId, surahNumber: Number(hifzSurah), ayahStart: Number(hifzAyahStart), ayahEnd: Number(hifzAyahEnd), assignmentType: hifzType, dueDate: assignmentDueDate, instructions: assignmentInstructions, assignedBy: user.id });
            await reload();
            setAssignmentInstructions("");
            toast.success("برنامه هفتگی برای دانش‌پژوه ثبت شد.");
          } catch (error) { toast.error(error instanceof Error ? error.message : "ثبت برنامه انجام نشد."); }
          finally { setSaving(false); }
        }} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">دانش‌پژوه
            <select value={selectedHifzEnrollmentId} onChange={(event) => setHifzEnrollmentId(event.target.value)} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal">{enrollments.map((item) => <option key={item.id} value={item.id}>{item.studentName}</option>)}</select>
          </label>
          <label className="text-sm font-semibold">مهلت انجام
            <input type="date" value={assignmentDueDate} onChange={(event) => setAssignmentDueDate(event.target.value)} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"/>
          </label>
          <label className="text-sm font-semibold">راهنمایی استاد
            <input maxLength={1000} value={assignmentInstructions} onChange={(event) => setAssignmentInstructions(event.target.value)} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal" placeholder="اختیاری"/>
          </label>
          <button type="submit" disabled={saving || !selectedHifzEnrollmentId} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50 sm:col-span-2">ثبت برنامه هفتگی با محدوده انتخاب‌شده در فرم حفظ</button>
        </form>
        <div className="divide-y">{(workspace.hifzAssignments ?? []).filter((item) => enrollments.some((enrollment) => enrollment.id === item.enrollmentId)).slice(0, 20).map((item) => <div key={item.id} className="py-3 text-sm">
          <b>{item.studentName}</b> · {item.assignmentType === "memorization" ? "حفظ جدید" : "مرور"} · {getSurah(item.surahNumber)?.name}، آیات {item.ayahStart} تا {item.ayahEnd}
          <p className="mt-1 text-xs text-muted-foreground">مهلت: {new Date(item.dueDate + "T00:00:00").toLocaleDateString("fa-IR")} · وضعیت: {item.completionStatus === "completed" ? "انجام‌شده" : item.completionStatus === "needs_help" ? "درخواست کمک" : item.completionStatus === "in_progress" ? "در حال انجام" : "اعلام نشده"}</p>
          {item.completionNote && <p className="mt-1 text-xs">یادداشت دانش‌پژوه: {item.completionNote}</p>}
        </div>)}</div>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div><h2 className="font-extrabold">ثبت حفظ و مرور قرآن</h2><p className="mt-1 text-sm text-muted-foreground">محدوده آیات و ارزیابی هر جلسه را برای دانش‌پژوه ثبت کنید. این سوره {selectedSurah?.ayahCount ?? "—"} آیه دارد.</p></div>
        <form onSubmit={async (event) => {
          event.preventDefault();
          const sb = getSupabase();
          if (!sb || !selectedHifzEnrollmentId) return;
          setSaving(true);
          try {
            await saveTeacherHifzRecord(sb, { enrollmentId: selectedHifzEnrollmentId, surahNumber: Number(hifzSurah), ayahStart: Number(hifzAyahStart), ayahEnd: Number(hifzAyahEnd), recordType: hifzType, assessment: hifzAssessment, sessionDate, notes: hifzNotes });
            await reload();
            setHifzNotes("");
            toast.success("ارزیابی حفظ قرآن ثبت شد.");
          } catch (error) { toast.error(error instanceof Error ? error.message : "ثبت ارزیابی حفظ انجام نشد."); }
          finally { setSaving(false); }
        }} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">دانش‌پژوه
            <select value={selectedHifzEnrollmentId} onChange={(event) => setHifzEnrollmentId(event.target.value)} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal">{enrollments.map((item) => <option key={item.id} value={item.id}>{item.studentName}</option>)}</select>
          </label>
          <label className="text-sm font-semibold">سوره
            <select value={hifzSurah} onChange={(event) => { setHifzSurah(event.target.value); setHifzAyahStart("1"); setHifzAyahEnd("1"); }} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal">
              {QURAN_SURAHS.map(([name], index) => <option key={index + 1} value={String(index + 1)}>{index + 1}. {name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">نوع فعالیت
            <select value={hifzType} onChange={(event) => setHifzType(event.target.value as "memorization" | "review")} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"><option value="memorization">حفظ جدید</option><option value="review">مرور محفوظات</option></select>
          </label>
          <label className="text-sm font-semibold">از آیه
            <input type="number" min="1" max={selectedSurah?.ayahCount ?? 1} value={hifzAyahStart} onChange={(event) => setHifzAyahStart(event.target.value)} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"/>
          </label>
          <label className="text-sm font-semibold">تا آیه
            <input type="number" min={hifzAyahStart} max={selectedSurah?.ayahCount ?? 1} value={hifzAyahEnd} onChange={(event) => setHifzAyahEnd(event.target.value)} required className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"/>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">نتیجه ارزیابی
            <select value={hifzAssessment} onChange={(event) => setHifzAssessment(event.target.value as typeof hifzAssessment)} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal"><option value="excellent">عالی</option><option value="good">خوب</option><option value="fair">قابل قبول</option><option value="needs_practice">نیازمند تمرین</option></select>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">یادداشت استاد (اختیاری)
            <textarea maxLength={1000} rows={2} value={hifzNotes} onChange={(event) => setHifzNotes(event.target.value)} className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 font-normal" placeholder="نکته‌ای درباره کیفیت حفظ یا مرور..."/>
          </label>
          <button type="submit" disabled={saving || !selectedHifzEnrollmentId} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50 sm:col-span-2">ثبت ارزیابی قرآن</button>
        </form>
        {workspace.hifzRecords.filter((record) => enrollments.some((item) => item.id === record.enrollmentId)).slice(0, 12).map((record) => <p key={record.id} className="border-t pt-2 text-sm"><b>{enrollments.find((item) => item.id === record.enrollmentId)?.studentName}</b><span className="text-muted-foreground"> · {record.recordType === "memorization" ? "حفظ جدید" : "مرور"} · سوره {record.surahNumber}، آیات {record.ayahStart} تا {record.ayahEnd} · {record.assessment}</span></p>)}
      </section>
      <section id="student-report-print-root" className="print-report-area space-y-4 rounded-2xl border bg-card p-5">
        <div>
          <h2 className="font-extrabold">کارنامه تفصیلی دانش‌پژوهان</h2>
          <p className="mt-1 text-sm text-muted-foreground">گزارش هر ثبت‌نام شامل محفوظات، ارزیابی استاد، حضور و غیاب، نمرات و برنامه‌های هفتگی است. برای مشاهده جزئیات، نام دانش‌پژوه را باز کنید.</p>
        </div>
        {studentReportCards.length ? <div className="space-y-3">
          {studentReportCards.map((item) => <details key={item.id} className="rounded-xl border p-3">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{item.studentName}</span>
                <span className="text-xs text-muted-foreground">{item.attendanceCount} جلسه · {item.assessmentCount} ارزیابی حفظ · {item.assignmentCount} برنامه</span>
              </div>
            </summary>
            <div className="no-print flex justify-end pt-3">
              <button type="button" onClick={(event) => {
                const selected = event.currentTarget.closest("details");
                document.querySelectorAll("#student-report-print-root details").forEach((node) => {
                  node.classList.toggle("print-selected", node === selected);
                });
                window.print();
              }} className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted">چاپ کارنامه این دانش‌پژوه</button>
            </div>
            <div className="mt-4 space-y-4 border-t pt-3">
              <div>
                <h3 className="mb-2 text-sm font-bold">حفظ و مرور قرآن</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-muted/50 p-3"><b>{item.memorizationCount}</b><p className="text-xs text-muted-foreground">جلسات حفظ جدید</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><b>{item.memorizationAyahs}</b><p className="text-xs text-muted-foreground">آیه در رکوردهای حفظ</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><b>{item.reviewCount}</b><p className="text-xs text-muted-foreground">جلسات مرور</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><b>{item.reviewAyahs}</b><p className="text-xs text-muted-foreground">آیه در رکوردهای مرور</p></div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">تعداد آیات، مجموع محدوده‌های ثبت‌شده است؛ آیات تکراری حذف نشده‌اند و این عدد به‌تنهایی نشان‌دهنده تعداد آیات یکتای حفظ‌شده نیست.</p>
                <p className="mt-2 text-sm">ارزیابی‌ها: عالی {item.excellent} · خوب {item.good} · قابل قبول {item.fair} · نیازمند تمرین {item.needsPractice}</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold">حضور و غیاب</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <div className="rounded-lg bg-muted/50 p-3"><b>{item.attendanceCount}</b><p className="text-xs text-muted-foreground">جلسات ثبت‌شده</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><b>{item.present}</b><p className="text-xs text-muted-foreground">حاضر</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><b>{item.late}</b><p className="text-xs text-muted-foreground">با تأخیر</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><b>{item.absent}</b><p className="text-xs text-muted-foreground">غایب</p></div>
                  <div className="rounded-lg bg-muted/50 p-3"><b>{item.excused}</b><p className="text-xs text-muted-foreground">غیبت موجه</p></div>
                </div>
                <p className="mt-2 text-sm">درصد حضور مؤثر (حاضر و با تأخیر): <b>{item.attendanceRate === null ? "بدون داده" : item.attendanceRate + "٪"}</b></p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold">نمرات</h3>
                <p className="text-sm">{item.gradeCount} نمره ثبت‌شده · میانگین: <b>{item.average === null ? "بدون نمره" : Number(item.average.toFixed(2))}</b></p>
                {(workspace?.grades ?? []).filter((grade) => grade.enrollmentId === item.id).slice(0, 8).map((grade) => <p key={grade.id} className="mt-1 text-xs text-muted-foreground">{grade.title}: {grade.score}</p>)}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold">برنامه‌های هفتگی</h3>
                <p className="text-sm">{item.completedAssignments} از {item.assignmentCount} انجام‌شده · {item.assignmentRate === null ? "بدون برنامه" : item.assignmentRate + "٪ تکمیل"} · {item.overdueAssignments} عقب‌افتاده</p>
                {(workspace?.hifzAssignments ?? []).filter((assignment) => assignment.enrollmentId === item.id).slice(0, 8).map((assignment) => <p key={assignment.id} className="mt-1 text-xs text-muted-foreground">{getSurah(assignment.surahNumber)?.name}، آیات {assignment.ayahStart} تا {assignment.ayahEnd} · {assignment.completionStatus === "completed" ? "انجام‌شده" : assignment.completionStatus === "needs_help" ? "نیازمند کمک" : assignment.completionStatus === "in_progress" ? "در حال انجام" : "اعلام‌نشده"}</p>)}
              </div>
            </div>
          </details>)}
        </div> : <p className="text-sm text-muted-foreground">برای این کلاس هنوز ثبت‌نام قطعی وجود ندارد.</p>}
      </section>
    </>}

    {requests.length > 0 && <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-extrabold">درخواست‌های ثبت‌نام در انتظار بررسی</h2>
      <p className="mt-1 text-sm text-muted-foreground">طبق سیاست امنیتی فعلی پایگاه داده، بررسی نهایی این درخواست‌ها فقط از حساب مدیر انجام می‌شود.</p>
      <ul className="mt-3 divide-y">{requests.map((item) => <li key={item.id} className="py-2 text-sm">{item.studentName} <span className="text-muted-foreground">· وضعیت پرداخت: {item.paymentStatus === "paid" ? "پرداخت‌شده" : item.paymentStatus === "waived" ? "معاف" : item.paymentStatus === "failed" ? "ناموفق" : "در انتظار"}</span></li>)}</ul>
    </section>}
    <p className="text-xs text-muted-foreground">اطلاعات این صفحه از پایگاه داده Supabase خوانده می‌شود و دسترسی هر عملیات را سیاست‌های امنیتی پایگاه داده کنترل می‌کنند.</p>
  </div>;
}
