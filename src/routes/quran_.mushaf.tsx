import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MushafReader } from "@/components/mushaf/MushafReader";
import { clampPage, isValidVerse, type VerseRef } from "@/lib/mushaf/metadata";

interface MushafSearch {
  page?: number;
  verse?: string;
}

export const Route = createFileRoute("/quran_/mushaf")({
  validateSearch: (search: Record<string, unknown>): MushafSearch => {
    const out: MushafSearch = {};
    const p = Number(search.page);
    if (Number.isFinite(p) && p >= 1) out.page = clampPage(p);
    if (typeof search.verse === "string" && /^\d{1,3}:\d{1,3}$/.test(search.verse)) out.verse = search.verse;
    return out;
  },
  head: () => ({
    meta: [
      { title: "مصحف ۱۵ سطری | مسیر نور ثقلین" },
      { name: "description", content: "نمایشگر مصحف حفظی ۱۵ سطری با ورق زدن، انتخاب سوره و جزء، جست‌وجوی آیه و نشانک." },
      { property: "og:title", content: "مصحف ۱۵ سطری | مسیر نور ثقلین" },
      { property: "og:description", content: "نمایشگر مصحف حفظی ۱۵ سطری برای تلاوت و حفظ قرآن کریم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MushafPage,
});

function MushafPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/quran/mushaf" });
  const page = search.page ?? 1;
  let verse: VerseRef | null = null;
  if (search.verse) {
    const [s = 0, a = 0] = search.verse.split(":").map(Number);
    if (isValidVerse(s, a)) verse = { surah: s, ayah: a };
  }

  return (
    <MushafReader
      page={page}
      verse={verse}
      onNavigate={(p, v) =>
        navigate({ search: { page: p, verse: v ? `${v.surah}:${v.ayah}` : undefined }, replace: true })
      }
    />
  );
}