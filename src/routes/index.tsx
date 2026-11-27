import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, GraduationCap, Heart, Library, ScrollText, Sparkles } from "lucide-react";
import { useDb } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { categoryLabel, faNum, levelLabel } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مسیر نور ثقلین | آموزش قرآن و عترت" },
      { name: "description", content: "سامانه آموزش قرآن کریم، معارف اهل‌بیت علیهم‌السلام و مدیریت کلاس‌های آموزشی." },
    ],
  }),
  component: HomePage,
});

const features = [
  { title: "آموزش قرآن", description: "تلاوت، روخوانی، تجوید و حفظ قرآن کریم", icon: BookOpen },
  { title: "معارف اهل‌بیت", description: "آشنایی با سیره و سخنان پیامبر و اهل‌بیت", icon: Sparkles },
  { title: "نهج‌البلاغه", description: "مطالعه خطبه‌ها، نامه‌ها و حکمت‌ها", icon: ScrollText },
  { title: "کتابخانه دیجیتال", description: "دسترسی به منابع و محتوای آموزشی", icon: Library },
];

function HomePage() {
  const db = useDb();
  const { mode } = useAuth();
  const courses = db.courses.filter((course) => course.published).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-hero px-5 py-10 text-hero-foreground shadow-elegant sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full border border-hero-foreground/15" />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-sm font-bold tracking-wide text-hero-foreground/75">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">مسیر نور ثقلین</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-hero-foreground/85 sm:text-lg">
            گامی در مسیر یادگیری قرآن کریم و معارف اهل‌بیت علیهم‌السلام؛
            با آموزش، تدبر، مطالعه و همراهی در کلاس‌های قرآنی.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/courses" className="inline-flex items-center gap-2 rounded-xl bg-background px-5 py-3 text-sm font-bold text-foreground shadow-sm transition hover:opacity-90">
              مشاهده دوره‌ها <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl border border-hero-foreground/35 px-5 py-3 text-sm font-bold text-hero-foreground transition hover:bg-hero-foreground/10">
              ورود و ثبت‌نام
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="h-7 w-7" /></span>
          <div>
            <h2 className="text-xl font-extrabold">مصحف قرآن کریم</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">پیمایش صفحات قرآن؛ نسخهٔ حفظی ۱۵ سطری در حال تکمیل اتصال و بررسی منبع صفحات است.</p>
          </div>
        </div>
        <Link to="/quran/mushaf" className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground sm:mt-0">باز کردن مصحف <ArrowLeft className="h-4 w-4" /></Link>
      </section>

      <section className="py-10">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold sm:text-2xl">در این مسیر چه می‌آموزیم؟</h2>
          <p className="mt-2 text-sm text-muted-foreground">آموزش و آشنایی با میراث گران‌بهای قرآن و عترت</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border bg-card p-5 shadow-soft">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold sm:text-2xl">دوره‌های آموزشی</h2>
            <p className="mt-2 text-sm text-muted-foreground">برای یادگیری، یک کلاس را انتخاب کنید</p>
          </div>
          <Link to="/courses" className="shrink-0 text-sm font-bold text-primary">همه دوره‌ها</Link>
        </div>
        {mode === "backend" ? (
          <div className="rounded-2xl border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">فهرست دوره‌های واقعی از پایگاه داده دریافت می‌شود.</p>
            <Link to="/courses" className="mt-3 inline-flex text-sm font-bold text-primary">مشاهده دوره‌های فعال</Link>
          </div>
        ) : mode === "unavailable" ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            پس از پیکربندی اتصال امن سامانه، دوره‌های فعال در این بخش نمایش داده می‌شوند.
          </div>
        ) : courses.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link key={course.id} to="/courses" className="rounded-2xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant">
                <p className="text-xs font-bold text-primary">{categoryLabel[course.category]}</p>
                <h3 className="mt-2 font-extrabold">{course.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{course.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{levelLabel[course.level]}</span>
                  <span>{faNum(course.durationWeeks)} هفته</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            هنوز دوره‌ای منتشر نشده است.
          </div>
        )}
      </section>

      <section className="mb-6 flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold-foreground"><Heart className="h-5 w-5" /></span>
          <div>
            <h2 className="font-extrabold">همراه مسیر نور ثقلین باشید</h2>
            <p className="mt-1 text-sm text-muted-foreground">در کلاس‌ها شرکت کنید و مسیر یادگیری خود را پیگیری کنید.</p>
          </div>
        </div>
        <Link to="/courses" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">شروع یادگیری <GraduationCap className="h-4 w-4" /></Link>
      </section>
    </div>
  );
}
