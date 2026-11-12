import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";
import { loadStudentWorkspace, requestStudentEnrollment } from "@/lib/backend/student";
import type { User } from "@/lib/domain/types";

const statusLabel = { pending: "در انتظار بررسی", approved: "تأیید شده", rejected: "رد شده" } as const;
const attendanceLabel = { present: "حاضر", absent: "غایب", late: "با تأخیر", excused: "غیبت موجه" } as const;

export function StudentBackendPanel({ user }: { user: User }) {
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof loadStudentWorkspace>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyClass, setBusyClass] = useState("");
  const reload = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("تنظیمات اتصال پایگاه داده هنوز در برنامه وارد نشده است.");
    setWorkspace(await loadStudentWorkspace(sb, user.id));
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
  const submitRequest = async (classId: string) => {
    const sb = getSupabase();
    if (!sb) return;
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

  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Metric label="کلاس‌های قطعی" value={workspace.enrollments.length}/>
      <Metric label="درخواست‌های منتظر" value={workspace.requests.filter((r) => r.status === "pending").length}/>
      <Metric label="نمره‌ها" value={workspace.grades.length}/>
      <Metric label="حضور مؤثر" value={attendanceRate === null ? "—" : attendanceRate + "٪"}/>
    </div>
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-extrabold">کلاس‌های قابل ثبت‌نام</h2>
      {workspace.classes.length ? <ul className="mt-3 divide-y">{workspace.classes.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.courseTitle}{item.description ? " · " + item.description : ""}</p></div>
        {enrolledIds.has(item.id) ? <span className="text-xs font-semibold text-muted-foreground">ثبت‌نام قطعی</span> : pendingIds.has(item.id) ? <span className="text-xs font-semibold text-muted-foreground">در انتظار بررسی</span> : <button disabled={!!busyClass} onClick={() => void submitRequest(item.id)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busyClass === item.id ? "در حال ارسال…" : "درخواست ثبت‌نام"}</button>}
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
