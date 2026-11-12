import { createFileRoute } from "@tanstack/react-router";
import { Library } from "lucide-react";
import { ContentSectionPage } from "@/components/content/ContentSectionPage";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "کتابخانه دیجیتال | مسیر نور ثقلین" },
      { name: "description", content: "معرفی کتاب‌های مرجع و منتخب: نهج‌البلاغه، صحیفه سجادیه، مفاتیح‌الجنان و آثار شهید مطهری." },
      { property: "og:title", content: "کتابخانه دیجیتال | مسیر نور ثقلین" },
      { property: "og:description", content: "کتاب‌های مرجع و منتخب معارف اسلامی." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <ContentSectionPage
      section="library"
      title="کتابخانه دیجیتال"
      subtitle="کتاب‌های مرجع و منتخب معارف قرآن و عترت"
      icon={Library}
      listTitle="کتاب‌ها"
    />
  );
}