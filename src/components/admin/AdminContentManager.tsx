import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/backend/supabase";

type ContentType = "library" | "hadith" | "dua" | "ziyarat" | "munajat" | "madahi";
type ContentLanguage = "fa" | "ar" | "tr" | "other";
type ContentSection = "quran" | "ahlulbayt" | "nahj" | "sahifa" | "library" | "duas";

type ContentEntry = {
  id: string;
  content_type: ContentType;
  title: string;
  body: string;
  summary: string;
  topic: string;
  language: ContentLanguage;
  author_name: string;
  source_name: string;
  source_url: string | null;
  media_url: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

type ContentDraft = {
  content_type: ContentType;
  title: string;
  body: string;
  summary: string;
  topic: string;
  language: ContentLanguage;
  author_name: string;
  source_name: string;
  source_url: string;
  media_url: string;
  tags: string;
  section: ContentSection;
  arabic: string;
  sort_order: string;
};

const EMPTY_DRAFT: ContentDraft = {
  content_type: "library",
  title: "",
  body: "",
  summary: "",
  topic: "",
  language: "fa",
  author_name: "",
  source_name: "",
  source_url: "",
  media_url: "",
  tags: "",
  section: "library",
  arabic: "",
  sort_order: "0",
};

const TYPE_LABELS: Record<ContentType, string> = {
  library: "مطلب قرآنی / کتابخانه",
  hadith: "حدیث و روایت",
  dua: "دعا",
  ziyarat: "زیارت",
  munajat: "مناجات",
  madahi: "مداحی",
};

const SECTION_LABELS: Record<ContentSection, string> = {
  quran: "آموزش قرآن",
  ahlulbayt: "اهل‌بیت (ع)",
  nahj: "نهج‌البلاغه",
  sahifa: "صحیفه سجادیه",
  library: "کتابخانه",
  duas: "ادعیه و زیارات",
};

const CONTENT_SELECT =
  "id,content_type,title,body,summary,topic,language,author_name,source_name,source_url,media_url,tags,metadata,is_published,sort_order,created_at";

function toDraft(entry: ContentEntry): ContentDraft {
  const metadata = entry.metadata ?? {};
  const section = metadata.section;
  const validSection = typeof section === "string" && section in SECTION_LABELS
    ? (section as ContentSection)
    : entry.content_type === "hadith" ? "ahlulbayt"
      : entry.content_type === "dua" || entry.content_type === "ziyarat" ? "duas"
        : entry.content_type === "munajat" ? "sahifa" : "library";
  return {
    content_type: entry.content_type,
    title: entry.title,
    body: entry.body,
    summary: entry.summary ?? "",
    topic: entry.topic ?? "",
    language: entry.language,
    author_name: entry.author_name ?? "",
    source_name: entry.source_name ?? "",
    source_url: entry.source_url ?? "",
    media_url: entry.media_url ?? "",
    tags: (entry.tags ?? []).join("، "),
    section: validSection,
    arabic: typeof metadata.arabic === "string" ? metadata.arabic : "",
    sort_order: String(entry.sort_order ?? 0),
  };
}

export function AdminContentManager() {
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContentDraft>(EMPTY_DRAFT);
  const [filter, setFilter] = useState<"all" | ContentType>("all");
  const [search, setSearch] = useState("");

  const loadEntries = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("اتصال پایگاه داده تنظیم نشده است.");
    const { data, error } = await sb
      .from("content_entries")
      .select(CONTENT_SELECT)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    setEntries((data ?? []) as ContentEntry[]);
  }, []);

  useEffect(() => {
    let active = true;
    void loadEntries()
      .catch((error: unknown) => {
        if (active) toast.error(error instanceof Error ? error.message : "دریافت محتوا ناموفق بود.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadEntries]);

  const visibleEntries = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return entries.filter((entry) =>
      (filter === "all" || entry.content_type === filter) &&
      (!term || [entry.title, entry.topic, entry.source_name, entry.author_name]
        .some((value) => (value ?? "").toLocaleLowerCase().includes(term))),
    );
  }, [entries, filter, search]);

  const change = <K extends keyof ContentDraft>(key: K, value: ContentDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title || title.length > 240 || !body) {
      toast.error("عنوان (حداکثر ۲۴۰ نویسه) و متن اصلی را کامل کنید.");
      return;
    }
    const sortOrder = Number(draft.sort_order);
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100000) {
      toast.error("ترتیب نمایش باید عدد صحیح بین صفر تا ۱۰۰۰۰۰ باشد.");
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      toast.error("اتصال پایگاه داده تنظیم نشده است.");
      return;
    }
    const metadata: Record<string, unknown> = { section: draft.section };
    if (draft.arabic.trim()) metadata.arabic = draft.arabic.trim();
    const payload = {
      content_type: draft.content_type,
      title,
      body,
      summary: draft.summary.trim(),
      topic: draft.topic.trim(),
      language: draft.language,
      author_name: draft.author_name.trim(),
      source_name: draft.source_name.trim(),
      source_url: draft.source_url.trim() || null,
      media_url: draft.media_url.trim() || null,
      tags: draft.tags.split(/[،,]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
      metadata,
      sort_order: sortOrder,
    };
    setSaving(true);
    try {
      if (editingId) {
        const { data, error } = await sb.from("content_entries")
          .update(payload).eq("id", editingId).select("id").maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) throw new Error("محتوا ویرایش نشد؛ مجوز مدیر را بررسی کنید.");
        toast.success("تغییرات محتوا ذخیره شد.");
      } else {
        const { error } = await sb.from("content_entries").insert({
          ...payload,
          is_published: false,
        });
        if (error) throw new Error(error.message);
        toast.success("محتوا به‌صورت پیش‌نویس ذخیره شد.");
      }
      resetForm();
      await loadEntries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ذخیره محتوا ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (entry: ContentEntry) => {
    const sb = getSupabase();
    if (!sb || busyId) return;
    setBusyId(entry.id);
    try {
      const { data, error } = await sb.from("content_entries")
        .update({ is_published: !entry.is_published })
        .eq("id", entry.id).select("id").maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("وضعیت انتشار تغییر نکرد؛ دسترسی مدیر را بررسی کنید.");
      await loadEntries();
      toast.success(entry.is_published ? "محتوا از انتشار خارج شد." : "محتوا منتشر شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تغییر وضعیت انتشار ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteDraft = async (entry: ContentEntry) => {
    if (entry.is_published || busyId || !window.confirm("این پیش‌نویس برای همیشه حذف شود؟")) return;
    const sb = getSupabase();
    if (!sb) return;
    setBusyId(entry.id);
    try {
      const { data, error } = await sb.from("content_entries")
        .delete().eq("id", entry.id).eq("is_published", false).select("id").maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("پیش‌نویس حذف نشد؛ ممکن است قبلاً تغییر کرده باشد.");
      await loadEntries();
      toast.success("پیش‌نویس حذف شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حذف پیش‌نویس ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (entry: ContentEntry) => {
    setEditingId(entry.id);
    setDraft(toDraft(entry));
    if (typeof document !== "undefined") {
      document.getElementById("admin-content-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-extrabold">مدیریت محتوای دینی و قرآنی</h2>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          ثبت و ویرایش قرآن، حدیث، دعا، زیارت، مناجات و مداحی همراه با منبع و پدیدآورنده. محتوای تازه تا زمان انتشار، فقط پیش‌نویس است.
        </p>
      </div>

      <form id="admin-content-editor" onSubmit={(event) => void save(event)} className="scroll-mt-4 space-y-3 rounded-xl bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">{editingId ? "ویرایش محتوا" : "افزودن محتوای تازه"}</h3>
          {editingId ? <button type="button" onClick={resetForm} className="rounded-lg border px-3 py-1.5 text-xs">لغو ویرایش</button> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">نوع محتوا
            <select value={draft.content_type} onChange={(event) => change("content_type", event.target.value as ContentType)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal">
              {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">بخش نمایش
            <select value={draft.section} onChange={(event) => change("section", event.target.value as ContentSection)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal">
              {Object.entries(SECTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">زبان
            <select value={draft.language} onChange={(event) => change("language", event.target.value as ContentLanguage)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal">
              <option value="fa">فارسی</option><option value="ar">عربی</option><option value="tr">ترکی</option><option value="other">سایر</option>
            </select>
          </label>
          <label className="text-sm font-semibold">موضوع
            <input value={draft.topic} onChange={(event) => change("topic", event.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" placeholder="مثلاً اخلاق، تفسیر، حفظ" />
          </label>
        </div>
        <label className="block text-sm font-semibold">عنوان
          <input value={draft.title} onChange={(event) => change("title", event.target.value)} maxLength={240} required className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold">خلاصه
          <textarea value={draft.summary} onChange={(event) => change("summary", event.target.value)} maxLength={1000} rows={2} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" />
        </label>
        <label className="block text-sm font-semibold">متن اصلی
          <textarea value={draft.body} onChange={(event) => change("body", event.target.value)} required rows={6} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" placeholder="متن مستند را وارد کنید؛ برای آیات قرآن از رسم‌الخط عثمان‌طه استفاده کنید." />
        </label>
        <label className="block text-sm font-semibold">متن عربی جداگانه (اختیاری)
          <textarea value={draft.arabic} onChange={(event) => change("arabic", event.target.value)} rows={3} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" dir="rtl" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">نام پدیدآورنده / راوی
            <input value={draft.author_name} onChange={(event) => change("author_name", event.target.value)} maxLength={160} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" />
          </label>
          <label className="text-sm font-semibold">نام منبع
            <input value={draft.source_name} onChange={(event) => change("source_name", event.target.value)} maxLength={200} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" placeholder="نام کتاب، جلد و صفحه یا پایگاه معتبر" />
          </label>
          <label className="text-sm font-semibold">پیوند منبع
            <input type="url" value={draft.source_url} onChange={(event) => change("source_url", event.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" placeholder="https://" />
          </label>
          <label className="text-sm font-semibold">پیوند رسانه (اختیاری)
            <input type="url" value={draft.media_url} onChange={(event) => change("media_url", event.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" placeholder="https://" />
          </label>
          <label className="text-sm font-semibold">برچسب‌ها
            <input value={draft.tags} onChange={(event) => change("tags", event.target.value)} maxLength={500} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" placeholder="قرآن، نوجوانان، اخلاق" />
          </label>
          <label className="text-sm font-semibold">ترتیب نمایش
            <input type="number" min="0" max="100000" step="1" value={draft.sort_order} onChange={(event) => change("sort_order", event.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">انتشار فقط با دکمهٔ جداگانه در فهرست انجام می‌شود.</span>
          <button type="submit" disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {saving ? "در حال ذخیره…" : editingId ? "ذخیره ویرایش" : "ذخیره پیش‌نویس"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">فهرست محتوا</h3>
          <span className="text-xs text-muted-foreground">حداکثر ۲۰۰ مورد اخیر</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm font-semibold">جست‌وجو
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="عنوان، موضوع یا منبع" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal" />
          </label>
          <label className="text-sm font-semibold">نوع
            <select value={filter} onChange={(event) => setFilter(event.target.value as "all" | ContentType)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-normal">
              <option value="all">همهٔ انواع</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        {loading ? <p className="text-sm text-muted-foreground">در حال دریافت محتوا…</p> : visibleEntries.length ? (
          <ul className="divide-y">
            {visibleEntries.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{entry.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{TYPE_LABELS[entry.content_type]} · {SECTION_LABELS[(entry.metadata?.section as ContentSection) in SECTION_LABELS ? entry.metadata?.section as ContentSection : "library"]} · {entry.source_name || "بدون منبع ثبت‌شده"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.is_published ? "منتشرشده" : "پیش‌نویس"} · {new Date(entry.created_at).toLocaleDateString("fa-IR")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => startEdit(entry)} className="rounded-lg border px-3 py-2 text-xs font-semibold">ویرایش</button>
                  <button type="button" onClick={() => void togglePublished(entry)} disabled={busyId !== null} className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-60">
                    {busyId === entry.id ? "در حال ذخیره…" : entry.is_published ? "لغو انتشار" : "انتشار"}
                  </button>
                  {!entry.is_published ? <button type="button" onClick={() => void deleteDraft(entry)} disabled={busyId !== null} className="rounded-lg border px-3 py-2 text-xs font-semibold text-destructive disabled:opacity-60">حذف پیش‌نویس</button> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">محتوایی با این فیلتر پیدا نشد.</p>}
      </div>
    </section>
  );
}
