import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";

type Course = { id: string; title: string; description: string | null; is_active: boolean };
type Teacher = { id: string; full_name: string | null };
type ClassRow = { id: string; title: string; description: string | null; course_id: string | null; teacher_id: string | null; capacity: number | null; is_active: boolean; starts_at: string | null; ends_at: string | null };

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
  const [classStartsAt, setClassStartsAt] = useState("");
  const [classEndsAt, setClassEndsAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseDescription, setEditCourseDescription] = useState("");
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editClassTitle, setEditClassTitle] = useState("");
  const [editClassDescription, setEditClassDescription] = useState("");
  const [editCourseId, setEditCourseId] = useState("");
  const [editTeacherId, setEditTeacherId] = useState("");
  const [editCapacity, setEditCapacity] = useState("20");
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");

  async function reload() {
    const sb = getSupabase();
    if (!sb) throw new Error("اتصال پایگاه داده فعال نیست.");
    const [c, t, cl] = await Promise.all([
      sb.from("courses").select("id,title,description,is_active").order("created_at", { ascending: false }),
      sb.from("profiles").select("id,full_name").eq("role", "teacher").order("full_name"),
      sb.from("classes").select("id,title,description,course_id,teacher_id,capacity,is_active,starts_at,ends_at").order("created_at", { ascending: false }),
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
    if (classStartsAt && classEndsAt && new Date(classEndsAt) <= new Date(classStartsAt)) { toast.error("زمان پایان باید بعد از زمان شروع باشد."); return; }
    setBusy(true);
    try {
      const { error } = await sb.from("classes").insert({
        title: classTitle.trim(), description: classDescription.trim(), course_id: courseId,
        teacher_id: teacherId || null, capacity: seats, is_active: true,
        starts_at: classStartsAt ? new Date(classStartsAt).toISOString() : null,
        ends_at: classEndsAt ? new Date(classEndsAt).toISOString() : null,
      });
      if (error) throw error;
      setClassTitle(""); setClassDescription(""); setTeacherId(""); setCapacity("20"); setClassStartsAt(""); setClassEndsAt("");
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

  function beginCourseEdit(item: Course) {
    setEditingCourse(item.id);
    setEditCourseTitle(item.title);
    setEditCourseDescription(item.description ?? "");
  }

  async function saveCourseEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sb = getSupabase();
    if (!sb || !editingCourse || !editCourseTitle.trim()) return;
    setBusy(true);
    try {
      const { error } = await sb.from("courses").update({
        title: editCourseTitle.trim(), description: editCourseDescription.trim(),
      }).eq("id", editingCourse);
      if (error) throw error;
      setEditingCourse(null);
      await reload();
      toast.success("اطلاعات دوره ویرایش شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "ویرایش دوره انجام نشد."); }
    finally { setBusy(false); }
  }

  async function toggleCourse(item: Course) {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    try {
      const { error } = await sb.from("courses").update({ is_active: !item.is_active }).eq("id", item.id);
      if (error) throw error;
      await reload();
      toast.success(item.is_active ? "دوره غیرفعال شد." : "دوره فعال شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "تغییر وضعیت دوره انجام نشد."); }
    finally { setBusy(false); }
  }

  function beginClassEdit(item: ClassRow) {
    setEditingClass(item.id);
    setEditClassTitle(item.title);
    setEditClassDescription(item.description ?? "");
    setEditCourseId(item.course_id ?? "");
    setEditTeacherId(item.teacher_id ?? "");
    setEditCapacity(String(item.capacity ?? 20));
    setEditStartsAt(toDateTimeLocal(item.starts_at));
    setEditEndsAt(toDateTimeLocal(item.ends_at));
  }

  async function saveClassEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sb = getSupabase();
    const seats = Number(editCapacity);
    if (!sb || !editingClass || !editClassTitle.trim() || !editCourseId || !Number.isInteger(seats) || seats < 1 || seats > 500) return;
    if (editStartsAt && editEndsAt && new Date(editEndsAt) <= new Date(editStartsAt)) { toast.error("زمان پایان باید بعد از زمان شروع باشد."); return; }
    setBusy(true);
    try {
      const { count, error: countError } = await sb.from("enrollments")
        .select("id", { count: "exact", head: true }).eq("class_id", editingClass);
      if (countError) throw countError;
      if (count !== null && seats < count) throw new Error("ظرفیت جدید نمی‌تواند کمتر از تعداد ثبت‌نام‌های قطعی باشد.");
      const { error } = await sb.from("classes").update({
        title: editClassTitle.trim(), description: editClassDescription.trim(),
        course_id: editCourseId, teacher_id: editTeacherId || null, capacity: seats,
        starts_at: editStartsAt ? new Date(editStartsAt).toISOString() : null,
        ends_at: editEndsAt ? new Date(editEndsAt).toISOString() : null,
      }).eq("id", editingClass);
      if (error) throw error;
      setEditingClass(null);
      await reload();
      toast.success("اطلاعات کلاس ویرایش شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "ویرایش کلاس انجام نشد."); }
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
    <div className="border-t pt-4"><h3 className="font-bold">دوره‌های ثبت‌شده و ویرایش آن‌ها</h3>
      {courses.length ? <ul className="mt-2 divide-y">{courses.map(item => <li key={item.id} className="py-3 text-sm">
        {editingCourse === item.id ? <form onSubmit={saveCourseEdit} className="grid gap-2 sm:grid-cols-2">
          <label>عنوان دوره<input required maxLength={120} value={editCourseTitle} onChange={e => setEditCourseTitle(e.target.value)} className={field}/></label>
          <label>توضیحات<input maxLength={500} value={editCourseDescription} onChange={e => setEditCourseDescription(e.target.value)} className={field}/></label>
          <div className="flex gap-2"><button disabled={busy || !editCourseTitle.trim()} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">ذخیره</button><button type="button" onClick={() => setEditingCourse(null)} className="rounded-lg border px-3 py-2 text-xs">انصراف</button></div>
        </form> : <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{item.is_active ? "فعال" : "غیرفعال"}</p></div><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => beginCourseEdit(item)} className="rounded-lg border px-3 py-2 text-xs">ویرایش</button><button type="button" disabled={busy} onClick={() => void toggleCourse(item)} className="rounded-lg border px-3 py-2 text-xs">{item.is_active ? "غیرفعال‌کردن" : "فعال‌کردن"}</button></div></div>}
      </li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">هنوز دوره‌ای تعریف نشده است.</p>}
    </div>
    <div className="border-t pt-4"><h3 className="font-bold">تعریف کلاس جدید</h3>
      <form onSubmit={createClass} className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">نام کلاس<input required maxLength={120} value={classTitle} onChange={e => setClassTitle(e.target.value)} className={field} placeholder="مثلاً حفظ جزء سی‌ام"/></label>
        <label className="text-sm font-semibold">دوره<select required value={courseId} onChange={e => setCourseId(e.target.value)} className={field}><option value="">انتخاب دوره</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
        <label className="text-sm font-semibold">استاد<select value={teacherId} onChange={e => setTeacherId(e.target.value)} className={field}><option value="">بدون تعیین استاد</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || "استاد"}</option>)}</select></label>
        <label className="text-sm font-semibold">ظرفیت<input required type="number" min="1" max="500" value={capacity} onChange={e => setCapacity(e.target.value)} className={field}/></label>
        <label className="text-sm font-semibold">شروع کلاس<input type="datetime-local" value={classStartsAt} onChange={e => setClassStartsAt(e.target.value)} className={field}/></label>
        <label className="text-sm font-semibold">پایان کلاس<input type="datetime-local" min={classStartsAt || undefined} value={classEndsAt} onChange={e => setClassEndsAt(e.target.value)} className={field}/></label>
        <label className="text-sm font-semibold sm:col-span-2">توضیحات کلاس<input maxLength={500} value={classDescription} onChange={e => setClassDescription(e.target.value)} className={field} placeholder="توضیح کوتاه"/></label>
        <button disabled={busy || !classTitle.trim() || !courseId} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50">ایجاد کلاس</button>
      </form>
    </div>
    <div className="border-t pt-4"><h3 className="font-bold">کلاس‌های ثبت‌شده</h3>
      {classes.length ? <ul className="mt-2 divide-y">{classes.map(item => <li key={item.id} className="py-3 text-sm">
        {editingClass === item.id ? <form onSubmit={saveClassEdit} className="grid gap-2 sm:grid-cols-2">
          <label>نام کلاس<input required maxLength={120} value={editClassTitle} onChange={e => setEditClassTitle(e.target.value)} className={field}/></label>
          <label>دوره<select required value={editCourseId} onChange={e => setEditCourseId(e.target.value)} className={field}><option value="">انتخاب دوره</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
          <label>استاد<select value={editTeacherId} onChange={e => setEditTeacherId(e.target.value)} className={field}><option value="">بدون تعیین استاد</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.full_name || "استاد"}</option>)}</select></label>
          <label>ظرفیت<input required type="number" min="1" max="500" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} className={field}/></label>
          <label>شروع کلاس<input type="datetime-local" value={editStartsAt} onChange={e => setEditStartsAt(e.target.value)} className={field}/></label>
          <label>پایان کلاس<input type="datetime-local" min={editStartsAt || undefined} value={editEndsAt} onChange={e => setEditEndsAt(e.target.value)} className={field}/></label>
          <label className="sm:col-span-2">توضیحات<input maxLength={500} value={editClassDescription} onChange={e => setEditClassDescription(e.target.value)} className={field}/></label>
          <div className="flex gap-2"><button disabled={busy || !editClassTitle.trim() || !editCourseId} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">ذخیره</button><button type="button" onClick={() => setEditingClass(null)} className="rounded-lg border px-3 py-2 text-xs">انصراف</button></div>
        </form> : <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{courses.find(c => c.id === item.course_id)?.title || "بدون دوره"} · {teachers.find(t => t.id === item.teacher_id)?.full_name || "استاد تعیین نشده"} · ظرفیت {item.capacity ?? "نامحدود"} · {item.is_active ? "فعال" : "غیرفعال"}</p><p className="mt-1 text-xs text-muted-foreground">زمان: {item.starts_at ? new Date(item.starts_at).toLocaleString("fa-IR") : "تعیین‌نشده"} تا {item.ends_at ? new Date(item.ends_at).toLocaleString("fa-IR") : "تعیین‌نشده"}</p></div><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => beginClassEdit(item)} className="rounded-lg border px-3 py-2 text-xs">ویرایش</button><button type="button" disabled={busy} onClick={() => void toggleClass(item)} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">{item.is_active ? "غیرفعال‌کردن" : "فعال‌کردن"}</button></div></div>}
      </li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">هنوز کلاسی تعریف نشده است.</p>}
    </div>
    <p className="text-xs text-muted-foreground">این عملیات با حساب مدیر و سیاست‌های RLS پایگاه داده انجام می‌شود؛ هیچ کلید مدیریتی در مرورگر استفاده نمی‌شود.</p>
  </section>;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
