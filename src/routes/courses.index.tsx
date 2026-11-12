import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, GraduationCap, Users } from "lucide-react";
import { Chip } from "@/components/content/ContentSectionPage";
import { EmptyState } from "@/components/common/states";
import { PageHeader } from "@/components/common/ui-bits";
import { Badge } from "@/components/ui/badge";
import { approvedCount } from "@/lib/domain/actions";
import type { CourseCategory } from "@/lib/domain/types";
import { categoryLabel, faNum, levelLabel } from "@/lib/format";
import { useDb } from "@/lib/store";

const CATS = Object.keys(categoryLabel) as CourseCategory[];

export const Route = createFileRoute("/courses/")({
  validateSearch: (s: Record<string, unknown>): { category?: CourseCategory } => ({
    category: CATS.includes(s.category as CourseCategory) ? (s.category as CourseCategory) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "دوره‌ها و کلاس‌ها | مسیر نور ثقلین" },
      { name: "description", content: "کلاس‌های تجوید، حفظ قرآن، نهج‌البلاغه، صحیفه سجادیه و سیره اهل‌بیت؛ درخواست ثبت‌نام آنلاین." },
      { property: "og:title", content: "دوره‌ها و کلاس‌ها | مسیر نور ثقلین" },
      { property: "og:description", content: "ثبت‌نام در کلاس‌های معارف قرآن و عترت." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const db = useDb();
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const list = db.courses.filter((c) => c.published && (!category || c.category === category));

  return (
    <>
      <PageHeader title="دوره‌ها و کلاس‌ها" subtitle="کلاس مناسب خود را انتخاب و درخواست ثبت‌نام دهید" icon={GraduationCap} />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="دسته‌بندی">
          <Chip active={!category} onClick={() => navigate({ search: {} })}>همه</Chip>
          {CATS.map((c) => (
            <Chip key={c} active={category === c} onClick={() => navigate({ search: { category: c } })}>{categoryLabel[c]}</Chip>
          ))}
        </div>
        {list.length === 0 ? (
          <EmptyState title="دوره‌ای در این دسته نیست" description="دسته دیگری را انتخاب کنید." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => {
              const teacher = db.users.find((u) => u.id === c.teacherId);
              const taken = approvedCount(db, c.id);
              return (
                <li key={c.id}>
                  <Link to="/courses/$courseId" params={{ courseId: c.id }} className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                    <div className="bg-hero pattern-stars p-4 text-hero-foreground">
                      <div className="flex gap-2"><Badge variant="gold">{categoryLabel[c.category]}</Badge><Badge variant="hero" className="border-hero-foreground/30 bg-transparent text-hero-foreground">{levelLabel[c.level]}</Badge></div>
                      <h2 className="mt-3 text-lg font-extrabold">{c.title}</h2>
                      <p className="text-sm text-hero-foreground/80">{teacher?.fullName}</p>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4 text-sm">
                      <p className="line-clamp-2 text-muted-foreground">{c.description}</p>
                      <p className="mt-auto flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{c.schedule}</p>
                      <p className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{faNum(taken)} از {faNum(c.capacity)} نفر</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}