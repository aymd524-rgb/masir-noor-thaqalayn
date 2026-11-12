import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Mic, Brain } from "lucide-react";
import { ContentSectionPage } from "@/components/content/ContentSectionPage";
import { SectionTitle } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/quran")({
  head: () => ({
    meta: [
      { title: "آموزش قرآن کریم | مسیر نور ثقلین" },
      { name: "description", content: "آموزش تلاوت، تجوید، حفظ و مفاهیم قرآن کریم با متن و ترجمه سوره‌ها." },
      { property: "og:title", content: "آموزش قرآن کریم | مسیر نور ثقلین" },
      { property: "og:description", content: "تلاوت، تجوید، حفظ و مفاهیم قرآن کریم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuranPage,
});

const PATHS = [
  { icon: Mic, title: "روخوانی و روانخوانی", text: "خواندن صحیح و روان آیات" },
  { icon: BookOpen, title: "تجوید", text: "مخارج، صفات و احکام تلاوت" },
  { icon: Brain, title: "حفظ", text: "برنامه حفظ گام‌به‌گام" },
];

function QuranPage() {
  return (
    <ContentSectionPage
      section="quran"
      title="آموزش قرآن کریم"
      subtitle="تلاوت، تجوید، حفظ و انس با کلام وحی"
      icon={BookOpen}
      listTitle="سوره‌ها و درس‌ها"
      before={
        <>
        <Link
          to="/quran/mushaf"
          className="bg-hero pattern-stars flex items-center gap-3 rounded-2xl p-4 text-hero-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold-gradient text-gold-foreground">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold">مصحف حفظی ۱۵ سطری</span>
            <span className="block text-xs text-hero-foreground/80">ورق زدن، انتخاب سوره و جزء، جست‌وجوی آیه و نشانک</span>
          </span>
          <span className="text-sm font-bold">←</span>
        </Link>
        <section>
          <SectionTitle title="مسیرهای یادگیری" />
          <div className="grid grid-cols-3 gap-3">
            {PATHS.map((p) => (
              <div key={p.title} className="rounded-2xl border bg-card p-3 text-center shadow-soft">
                <p.icon className="mx-auto h-6 w-6 text-primary" aria-hidden="true" />
                <p className="mt-2 text-sm font-bold">{p.title}</p>
                <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{p.text}</p>
              </div>
            ))}
          </div>
          <Button asChild variant="soft" className="mt-3 w-full sm:w-auto">
            <Link to="/courses" search={{ category: "quran" }}>
              <GraduationCap /> مشاهده کلاس‌های قرآن
            </Link>
          </Button>
        </section>
        </>
      }
    />
  );
}