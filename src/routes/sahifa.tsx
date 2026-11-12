import { createFileRoute } from "@tanstack/react-router";
import { BookHeart } from "lucide-react";
import { ContentSectionPage } from "@/components/content/ContentSectionPage";

export const Route = createFileRoute("/sahifa")({
  head: () => ({
    meta: [
      { title: "صحیفه سجادیه | مسیر نور ثقلین" },
      { name: "description", content: "دعاهای صحیفه سجادیه، زبور آل محمد (ص)، با متن عربی و ترجمه و شرح کوتاه." },
      { property: "og:title", content: "صحیفه سجادیه | مسیر نور ثقلین" },
      { property: "og:description", content: "زبور آل محمد (ص) — دعاهای امام سجاد (ع)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SahifaPage,
});

function SahifaPage() {
  return (
    <ContentSectionPage
      section="sahifa"
      title="صحیفه سجادیه"
      subtitle="زبور آل محمد (ص) — نیایش‌های امام زین‌العابدین (ع)"
      icon={BookHeart}
      listTitle="دعاهای منتخب"
      before={
        <blockquote className="bg-card pattern-stars rounded-2xl border p-5 text-center shadow-soft">
          <p className="text-sm leading-7 text-muted-foreground">
            صحیفه سجادیه مجموعه‌ای از دعاهای امام سجاد (ع) است که معارف توحیدی، اخلاقی و اجتماعی را در قالب
            نیایش بیان می‌کند و به «اخت القرآن» و «زبور آل محمد» شهرت دارد.
          </p>
        </blockquote>
      }
    />
  );
}