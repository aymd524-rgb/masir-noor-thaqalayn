import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";

type Course = { id: string; title: string };
type Teacher = { id: string; full_name: string | null };
type ClassRow = { id: string; title: string; course_id: string | null; teacher_id: string | null; capacity: number | null; is_active: boolean };

export function AdminCourseClassManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [classTitle, setClassTitle] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [busy, setBusy] = useState(false);

  async function reload() {
    const sb = getSupabase();
    if (!sb) throw new Error("اتصال پایگاه داده فعال نیست.");
    const [c, t, cl] = await Promise.all([
      sb.from("courses").select("id,title").order("created_at", { ascending: false }),
      sb.from("profiles").select("id,full_name").eq("role", "teacher").order("full_name"),
      sb.from("classes").select("id,title,course_id,teacher_id,capacity,is_active").order("created_at", { ascending: false }),
    ]);
    for (const result of [c, t, cl]) if (result.error) throw new Error(result.error.message);
    setCourses(c.data ?? []);
    setTeachers(t.data ?? []);
    setClasses(cl.data ?? []);
  }

  useEffect(() => { void reload().catch((error) => toast.error(error instanceof Error ? error.message : "بارگذاری انجام نشد.")); }, []);

  async function createCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sb = getSupabase();
    if (!sb || !courseTitle.trim()) return;
    setBusy(true);
    try {
      const { error } = await sb.from("courses").insert({ title: courseTitle.trim(), description: courseDescription.trim(), is_active: true });
      if (error) throw error;
      setCourseTitle(""); setCourseDescription("");
      await reload();
      toast.success("دوره ایجاد شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "ایجاد دوره انجام نشد."); }
    finally { setBusy(false); }
  }

  async function createClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sb = getSupabase();
    const seats = Number(capacity);
    if (!sb || !classTitle.trim() || !courseId || !Number.isInteger(seats) || seats < 1 || seats > 500) return;
    setBusy(true);
    try {
      const { error } = await sb.from("classes").insert({
        title: classTitle.trim(), description: classDescription.trim(), course_id: courseId,
        teacher_id: teacherId || null, capacity: seats, is_active: true,
      });
      if (error) throw error;
      setClassTitle(""); setClassDescription(""); setTeacherId(""); setCapacity("20");
      await reload();
      toast.success("کلاس ایجاد شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "ایجاد کلاس انجام نشد."); }
    finally { setBusy(false); }
  }

  async function toggleClass(item: ClassRow) {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    try {
      const { error } = await sb.from("classes").update({ is_active: !item.is_active }).eq("id", item.id);
      if (error) throw error;
      await reload();
      toast.success(item.is_active ? "کلاس غیرفعال شد." : "کلاس فعال شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "تغییر وضعیت انجام نشد."); }
    finally { setBusy(false); }
  }

  const field = "mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm";
  return <section className="space-y-5 rounded-2xl border bg-card p-5">
    <div><h2 className="font-extrabold">مدیریت دوره‌ها و کلاس‌ها</h2><p className="mt-1 text-sm text-muted-foreground">ایجاد دوره، تعریف کلاس، تعیین استاد و ظرفیت کلاس</p></div>
    <form onSubmit={createCourse} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">عنوان دوره<input required maxLength={120} value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className={field} placeholder="مثلاً آموزش حفظ قرآن"/></label>
      <label className="text-sm font-semibold">توضیحات دوره<input maxLength={500} value={courseDescription} onChange={e => setCourseDescription(e.target.value)} className={field} placeholder="شرح کوتاه دوره"/></label>
      <button disabled={busy || !courseTitle.trim()} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">ایجاد دوره</button>
    </form>
    <div className="border-t pt-4"><h3 className="font-bold">تعریف کلاس جدید</h3>
      <form onSubmit={createClass} className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">نام کلاس<input required maxLength={120} value={classTitle} onChange={e => setClassTitle(e.target.value)} className={field} placeholder="مثلاً حفظ جزء سی‌ام"/></label>
        <label className="text-sm font-semibold">دوره<select required value={courseId} onChange={e => setCourseId(e.target.value)} className={field}><option value="">انتخاب دوره</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label className="text-sm font-semibold">استاد<select value={teacherId} onChange={e => setTeacherId(e.target.value)} className={field}><option value="">بدون تعیین استاد</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || "استاد"}</option>)}</select></label>
        <label className="text-sm font-semibold">ظرفیت<input required type="number" min="1" max="500" value={capacity} onChange={e => setCapacity(e.target.value)} className={field}/></label>
        <label className="text-sm font-semibold sm:col-span-2">توضیحات کلاس<input maxLength={500} value={classDescription} onChange={e => setClassDescription(e.target.value)} className={field} placeholder="زمان‌بندی یا توضیح کوتاه"/></label>
        <button disabled={busy || !classTitle.trim() || !courseId} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">ایجاد کلاس</button>
      </form>
    </div>
    <div className="border-t pt-4"><h3 className="font-bold">کلاس‌های ثبت‌شده</h3>
      {classes.length ? <ul className="mt-2 divide-y">{classes.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <div><p className="font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{courses.find(c => c.id === item.course_id)?.title || "بدون دوره"} · {teachers.find(t => t.id === item.teacher_id)?.full_name || "استاد تعیین نشده"} · ظرفیت {item.capacity ?? "نامحدود"}</p></div>
        <button type="button" disabled={busy} onClick={() => void toggleClass(item)} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">{item.is_active ? "غیرفعال‌کردن" : "فعال‌کردن"}</button>
      </li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">هنوز کلاسی تعریف نشده است.</p>}
    </div>
    <p className="text-xs text-muted-foreground">این عملیات با حساب مدیر و سیاست‌های RLS پایگاه داده انجام می‌شود؛ هیچ کلید مدیریتی در مرورگر استفاده نمی‌شود.</p>
  </section>;
}
