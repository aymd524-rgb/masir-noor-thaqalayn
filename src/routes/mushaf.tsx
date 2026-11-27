import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, BookOpen, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { faNum } from "@/lib/format";

type Ayah = {
  number: number;
  text: string;
  numberInSurah: number;
  surah: { number: number; name: string };
};
type PageResponse = { code: number; data?: { number: number; ayahs: Ayah[] }; status?: string };

export const Route = createFileRoute("/mushaf")({
  validateSearch: (search: Record<string, unknown>): { page: number } => {
    const page = Number(search.page);
    return { page: Number.isInteger(page) && page >= 1 && page <= 604 ? page : 1 };
  },
  head: () => ({
    meta: [
      { title: "مصحف قرآن کریم | مسیر نور ثقلین" },
      { name: "description", content: "مطالعه همه ۶۰۴ صفحه قرآن کریم با رسم‌الخط عثمان طه، صفحه‌به‌صفحه." },
      { name: "google", content: "notranslate" },
    ],
  }),
  component: MushafPage,
});

function MushafPage() {
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`https://api.alquran.cloud/v1/page/${page}/quran-uthmani`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("خطا در دریافت صفحه");
        return (await response.json()) as PageResponse;
      })
      .then((result) => {
        if (result.code !== 200 || !result.data?.ayahs?.length) throw new Error("متن این صفحه در حال حاضر در دسترس نیست.");
        setAyahs(result.data.ayahs);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "دریافت متن قرآن با مشکل روبه‌رو شد.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page]);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > 604) return;
    navigate({ search: { page: nextPage }, replace: false });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowRight className="h-4 w-4" /> صفحه اصلی</Link>
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">مصحف قرآن کریم</h1>
          <p className="mt-1 text-sm text-muted-foreground">متن عثمانی · مصحف مدینه · ۶۰۴ صفحه</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-card p-2">
          <label htmlFor="mushaf-page" className="text-sm font-semibold">صفحه</label>
          <input id="mushaf-page" type="number" min={1} max={604} value={page} onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isInteger(value) && value >= 1 && value <= 604) goToPage(value);
          }} className="w-20 rounded-lg border bg-background px-2 py-1.5 text-center text-sm" />
          <span className="text-xs text-muted-foreground">از {faNum(604)}</span>
        </div>
      </div>

      <section className="rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b px-4 py-3 text-sm font-bold">
          <span className="text-muted-foreground">صفحه {faNum(page)}</span>
          <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div className="min-h-[50vh] px-4 py-8 sm:px-8 sm:py-12">
          {loading ? (
            <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" /> در حال بارگذاری صفحه…</div>
          ) : error ? (
            <div role="alert" className="mx-auto max-w-md py-12 text-center">
              <p className="font-bold text-destructive">{error}</p>
              <button onClick={() => goToPage(page)} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">تلاش دوباره</button>
            </div>
          ) : (
            <div translate="no" className="quran-text text-center text-3xl leading-[2.5] sm:text-4xl sm:leading-[2.6]" dir="rtl" lang="ar">
              {ayahs.map((ayah) => (
                <span key={ayah.number}>
                  {ayah.numberInSurah === 1 && ayah.surah.number !== 1 && ayah.surah.number !== 9 && (
                    <span className="block py-4 text-2xl sm:text-3xl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
                  )}
                  <span>{ayah.text} <span className="inline-flex items-center justify-center rounded-full border border-primary/40 px-2 text-base text-primary">{faNum(ayah.numberInSurah)}</span> </span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t p-4">
          <button disabled={page === 1} onClick={() => goToPage(page - 1)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-40"><ArrowRight className="h-4 w-4" /> صفحه قبل</button>
          <span className="text-xs text-muted-foreground">{faNum(page)} / {faNum(604)}</span>
          <button disabled={page === 604} onClick={() => goToPage(page + 1)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold disabled:opacity-40">صفحه بعد <ArrowLeft className="h-4 w-4" /></button>
        </div>
      </section>
      <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">متن مصحف از سرویس عمومی AlQuran Cloud دریافت می‌شود. برای نمایش کامل همه صفحات، اتصال اینترنت لازم است.</p>
    </div>
  );
}
