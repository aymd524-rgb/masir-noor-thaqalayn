import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { ContentSectionPage } from "@/components/content/ContentSectionPage";

export const Route = createFileRoute("/nahj-al-balagha")({
  head: () => ({
    meta: [
      { title: "نهج‌البلاغه | مسیر نور ثقلین" },
      { name: "description", content: "خطبه‌ها، نامه‌ها و حکمت‌های امیرالمؤمنین علی (ع) با متن عربی و ترجمه فارسی." },
      { property: "og:title", content: "نهج‌البلاغه | مسیر نور ثقلین" },
      { property: "og:description", content: "خطبه‌ها، نامه‌ها و حکمت‌های امیرالمؤمنین علی (ع)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NahjPage,
});

const PARTS = [
  { title: "خطبه‌ها", text: "سخنرانی‌های امام در موضوعات توحید، اخلاق و جامعه" },
  { title: "نامه‌ها", text: "نامه‌ها و فرمان‌ها به کارگزاران و یاران" },
  { title: "حکمت‌ها", text: "سخنان کوتاه و حکیمانه" },
];

function NahjPage() {
  return (
    <ContentSectionPage
      section="nahj"
      title="نهج‌البلاغه"
      subtitle="سخنان امیرالمؤمنین علی علیه‌السلام — گردآوری سید رضی"
      icon={ScrollText}
      listTitle="منتخب نهج‌البلاغه"
      before={
        <section aria-label="بخش‌های نهج‌البلاغه" className="grid gap-3 sm:grid-cols-3">
          {PARTS.map((p) => (
            <div key={p.title} className="rounded-2xl border-s-4 border-gold bg-card p-4 shadow-soft">
              <h2 className="font-extrabold text-primary-deep">{p.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </section>
      }
    />
  );
}