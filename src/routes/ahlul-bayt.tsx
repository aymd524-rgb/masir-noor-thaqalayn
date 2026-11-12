import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { ContentSectionPage } from "@/components/content/ContentSectionPage";
import { SectionTitle } from "@/components/common/ui-bits";
import { faNum } from "@/lib/format";

export const Route = createFileRoute("/ahlul-bayt")({
  head: () => ({
    meta: [
      { title: "اهل‌بیت علیهم‌السلام | مسیر نور ثقلین" },
      { name: "description", content: "آشنایی با زندگی، سیره و سخنان چهارده معصوم علیهم‌السلام و حدیث ثقلین." },
      { property: "og:title", content: "اهل‌بیت علیهم‌السلام | مسیر نور ثقلین" },
      { property: "og:description", content: "سیره و سخنان چهارده معصوم علیهم‌السلام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AhlulBaytPage,
});

const MASUMIN = [
  "حضرت محمد (ص)",
  "حضرت فاطمه زهرا (س)",
  "امام علی (ع)",
  "امام حسن مجتبی (ع)",
  "امام حسین (ع)",
  "امام سجاد (ع)",
  "امام محمد باقر (ع)",
  "امام جعفر صادق (ع)",
  "امام موسی کاظم (ع)",
  "امام رضا (ع)",
  "امام محمد تقی (ع)",
  "امام علی النقی (ع)",
  "امام حسن عسکری (ع)",
  "امام مهدی (عج)",
];

function AhlulBaytPage() {
  return (
    <ContentSectionPage
      section="ahlulbayt"
      title="اهل‌بیت علیهم‌السلام"
      subtitle="سیره، سخن و زندگی چهارده معصوم"
      icon={Sparkles}
      listTitle="احادیث و زندگی‌نامه‌ها"
      before={
        <section aria-label="چهارده معصوم">
          <SectionTitle title="چهارده معصوم علیهم‌السلام" />
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
            {MASUMIN.map((name, i) => (
              <li key={name} className="flex items-center gap-2 rounded-xl border bg-card p-2.5 text-sm font-semibold shadow-soft">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-soft text-xs font-bold text-gold-foreground">
                  {faNum(i + 1)}
                </span>
                <span className="leading-6">{name}</span>
              </li>
            ))}
          </ol>
        </section>
      }
    />
  );
}