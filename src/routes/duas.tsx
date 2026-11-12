import { createFileRoute } from "@tanstack/react-router";
import { HandHeart } from "lucide-react";
import { ContentSectionPage } from "@/components/content/ContentSectionPage";

export const Route = createFileRoute("/duas")({
  head: () => ({
    meta: [
      { title: "ادعیه و زیارات | مسیر نور ثقلین" },
      { name: "description", content: "دعای کمیل، دعای فرج، زیارت عاشورا، زیارت امین‌الله و دیگر ادعیه با متن عربی و ترجمه." },
      { property: "og:title", content: "ادعیه و زیارات | مسیر نور ثقلین" },
      { property: "og:description", content: "دعاها و زیارت‌نامه‌ها با متن عربی و ترجمه فارسی." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DuasPage,
});

function DuasPage() {
  return (
    <ContentSectionPage
      section="duas"
      title="ادعیه و زیارات"
      subtitle="دعاها و زیارت‌نامه‌ها با متن و ترجمه"
      icon={HandHeart}
      listTitle="دعاها و زیارت‌نامه‌ها"
    />
  );
}