import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  List,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { EmptyState } from "@/components/common/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { faNum } from "@/lib/format";
import {
  TOTAL_JUZ,
  TOTAL_PAGES,
  TOTAL_SURAHS,
  ayahCount,
  clampPage,
  juzOfPage,
  juzOfVerse,
  juzStartPage,
  pageOfVerse,
  pageRange,
  parseVerseQuery,
  sajdasOnPage,
  searchSurahs,
  surahName,
  surahStartPage,
  surahType,
  surahsOnPage,
  type VerseRef,
} from "@/lib/mushaf/metadata";
import { SNAPSHOT_PAGES, getMushafSource } from "@/lib/mushaf/sources";
import { SCALE_STEPS, useMushafBookmarks, useMushafPrefs } from "@/lib/mushaf/storage";
import { JUZ_STARTS } from "@/lib/mushaf/tanzil-metadata";
import { cn } from "@/lib/utils";
import { MushafPageView } from "./MushafPageView";

export const DEMO_LABEL = "نمونه نمایشی — متن و صفحه‌بندی نهایی هنوز متصل نشده";

const WAQF_SIGNS = [
  { mark: "\u06D8", name: "وقف لازم", text: "باید توقف کرد؛ وصل کردن معنا را تغییر می‌دهد." },
  { mark: "\u06D9", name: "وقف ممنوع", text: "نباید توقف کرد." },
  { mark: "\u06DA", name: "وقف جایز", text: "توقف و وصل هر دو جایز است." },
  { mark: "\u06D6", name: "وصل اولی", text: "وقف جایز است ولی وصل بهتر است." },
  { mark: "\u06D7", name: "وقف اولی", text: "وصل جایز است ولی وقف بهتر است." },
  { mark: "\u06DB", name: "وقف معانقه", text: "بر یکی از دو موضع سه‌نقطه توقف شود، نه هر دو." },
  { mark: "\u06E9", name: "سجده", text: "محل سجده تلاوت." },
];

export function MushafReader({
  page,
  verse,
  onNavigate,
}: {
  page: number;
  verse: VerseRef | null;
  onNavigate: (page: number, verse?: VerseRef | null) => void;
}) {
  const source = useMemo(() => getMushafSource(), []);
  const queryClient = useQueryClient();
  const { prefs, update } = useMushafPrefs();
  const bookmarks = useMushafBookmarks();
  const scale = prefs.scale;
  const shellRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState<"off" | "native" | "css">("off");
  const [dialog, setDialog] = useState<null | "search" | "bookmarks" | "legend">(null);
  const [pageInput, setPageInput] = useState(String(page));

  const query = useQuery({
    queryKey: ["mushaf-page", source.id, page],
    queryFn: ({ signal }) => source.getPage(page, signal),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  // Prefetch neighbours for instant page turns.
  useEffect(() => {
    for (const p of [page - 1, page + 1]) {
      if (p < 1 || p > TOTAL_PAGES) continue;
      void queryClient.prefetchQuery({
        queryKey: ["mushaf-page", source.id, p],
        queryFn: ({ signal }) => source.getPage(p, signal),
        staleTime: Infinity,
      });
    }
  }, [page, queryClient, source]);

  useEffect(() => {
    setPageInput(String(page));
    update({ lastPage: page });
  }, [page, update]);

  const highlight = verse && pageOfVerse(verse.surah, verse.ayah) === page ? verse : null;
  const go = (p: number, v?: VerseRef | null) => onNavigate(clampPage(p), v ?? null);
  const next = () => page < TOTAL_PAGES && go(page + 1);
  const prev = () => page > 1 && go(page - 1);

  // Keyboard: in RTL, the next page lies to the left.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable=true], [role=dialog], [role=listbox]") || e.altKey || e.metaKey || e.ctrlKey))
        return;
      if (e.key === "ArrowLeft") next();
      else if (e.key === "ArrowRight") prev();
      else if (e.key === "Escape" && full === "css") setFull("off");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const onChange = () => !document.fullscreenElement && setFull((f) => (f === "native" ? "off" : f));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFull = async () => {
    if (full !== "off") {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      setFull("off");
      return;
    }
    const el = shellRef.current;
    if (el?.requestFullscreen) {
      try {
        await el.requestFullscreen();
        setFull("native");
        return;
      } catch {
        /* fall back to an in-page overlay (e.g. iPhone Safari) */
      }
    }
    setFull("css");
  };

  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => (touch.current = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY });
  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const dx = e.changedTouches[0]!.clientX - s.x;
    const dy = e.changedTouches[0]!.clientY - s.y;
    if (Math.abs(dx) < 60 || Math.abs(dy) > 50) return;
    if (dx > 0) next();
    else prev();
  };

  const scaleIdx = Math.max(0, SCALE_STEPS.findIndex((s) => s === scale));
  const setScaleIdx = (i: number) => update({ scale: SCALE_STEPS[Math.min(SCALE_STEPS.length - 1, Math.max(0, i))] ?? 1 });

  const { start } = pageRange(page);
  const currentSurah = highlight?.surah ?? start.surah;
  const currentJuz = highlight ? juzOfVerse(highlight.surah, highlight.ayah) : juzOfPage(page);
  const sajdas = sajdasOnPage(page);
  const bookmarked = bookmarks.has(page);
  const isFull = full !== "off";
  const pageData = query.data?.page === page ? query.data : undefined;
  const provenance = pageData?.provenance;

  const commitPageInput = () => {
    const n = Number(pageInput.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))));
    if (Number.isFinite(n) && n >= 1) go(n);
    else setPageInput(String(page));
  };

  return (
    <div
      ref={shellRef}
      className={cn(
        "bg-background",
        isFull && "flex flex-col overflow-y-auto",
        full === "css" && "fixed inset-0 z-[70]",
        full === "native" && "h-full",
      )}
    >
      <div className={cn("mx-auto w-full space-y-3 px-3 py-4", isFull ? "max-w-2xl" : "max-w-3xl")}>
        {!isFull &&
          (!provenance ? (
            <Alert className="border-warning/40 bg-warning-soft text-foreground" role="note">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertTitle className="font-extrabold text-warning">{DEMO_LABEL}</AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground">
                این صفحه فقط قاب ۱۵ سطری، شماره صفحه، نام سوره، جزء و ابزارهای مطالعه را نشان می‌دهد. هیچ متنی از آیات در
                آن درج نشده است؛ سطرها پس از اتصال داده مجاز مصحف پر می‌شوند.
                {SNAPSHOT_PAGES.length > 0 && (
                  <>
                    {" "}در نمونه اولیه فقط صفحه‌های {SNAPSHOT_PAGES.map((n) => faNum(n)).join(" و ")} متن دارند.{" "}
                    <button type="button" className="font-bold text-primary underline" onClick={() => go(1)}>
                      رفتن به صفحه ۱
                    </button>
                  </>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-info/40 bg-info-soft text-foreground" role="note">
              <Info className="h-4 w-4 text-info" />
              <AlertTitle className="font-extrabold text-info">{provenance.label}</AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground">
                متن عربی بدون هیچ تغییری از داده منبع آمده و قلم آن قلم رسمی مجمع ملک فهد است؛ اما قلم به‌تنهایی ضامن صحت نیست
                و تطبیق این صفحه با مصحف چاپی مرجع هنوز توسط کارشناس انجام نشده است.
              </AlertDescription>
            </Alert>
          ))}

        {/* Navigation & tools */}
        <div className="space-y-2 rounded-2xl border bg-card p-2.5 shadow-soft">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Select value={String(currentSurah)} onValueChange={(v) => go(surahStartPage(+v), { surah: +v, ayah: 1 })}>
              <SelectTrigger aria-label="انتخاب سوره" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {Array.from({ length: TOTAL_SURAHS }, (_, i) => i + 1).map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {faNum(s)}. {surahName(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(currentJuz)}
              onValueChange={(v) => {
                const [s, a] = JUZ_STARTS[+v - 1]!;
                go(juzStartPage(+v), { surah: s, ayah: a });
              }}
            >
              <SelectTrigger aria-label="انتخاب جزء" className="h-10 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1).map((j) => (
                  <SelectItem key={j} value={String(j)}>
                    جزء {faNum(j)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="scrollbar-none -mx-1 flex items-center gap-1 overflow-x-auto px-1">
            <ToolButton label="جست‌وجوی آیه" onClick={() => setDialog("search")}>
              <Search />
            </ToolButton>
            <ToolButton
              label={bookmarked ? "حذف نشانک این صفحه" : "افزودن نشانک"}
              pressed={bookmarked}
              onClick={() => bookmarks.toggle(page)}
            >
              {bookmarked ? <BookmarkCheck className="text-gold" /> : <Bookmark />}
            </ToolButton>
            <ToolButton label="فهرست نشانک‌ها" onClick={() => setDialog("bookmarks")}>
              <List />
            </ToolButton>
            <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden="true" />
            <ToolButton label="کوچک‌کردن متن" onClick={() => setScaleIdx(scaleIdx - 1)} disabled={scaleIdx === 0}>
              <Minus />
            </ToolButton>
            <span className="min-w-12 shrink-0 text-center text-xs font-bold tabular-nums" aria-live="polite">
              {faNum(Math.round(scale * 100))}٪
            </span>
            <ToolButton
              label="بزرگ‌کردن متن"
              onClick={() => setScaleIdx(scaleIdx + 1)}
              disabled={scaleIdx === SCALE_STEPS.length - 1}
            >
              <Plus />
            </ToolButton>
            <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden="true" />
            <ToolButton label={isFull ? "خروج از تمام‌صفحه" : "تمام‌صفحه"} onClick={toggleFull}>
              {isFull ? <Minimize2 /> : <Maximize2 />}
            </ToolButton>
            <ToolButton label="راهنمای علائم وقف" onClick={() => setDialog("legend")}>
              <Info />
            </ToolButton>
          </div>
          {scale > 1 && (
            <p className="rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
              در اندازه‌های بزرگ‌تر از ۱۰۰٪ سطرها برای خوانایی شکسته می‌شوند و چینش ۱۵ سطری استاندارد نمایش داده نمی‌شود.
            </p>
          )}
        </div>

        {/* Page */}
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={cn("mx-auto w-full", isFull ? "max-w-[min(100%,calc((100dvh-9rem)*0.62))]" : "max-w-[30rem]")}
        >
          {query.isError && !query.data ? (
            <EmptyState
              icon={AlertTriangle}
              title="بارگذاری این صفحه ممکن نشد"
              description="اتصال به منبع متن برقرار نشد. دوباره تلاش کنید."
              action={
                <Button variant="outline" onClick={() => query.refetch()}>
                  تلاش دوباره
                </Button>
              }
            />
          ) : (
            <MushafPageView
              page={page}
              data={pageData}
              loading={query.isFetching}
              scale={scale}
              highlight={highlight}
              juzHint={currentJuz}
            />
          )}
          <p className={cn("mt-2 text-center text-xs font-bold", provenance ? "text-info" : "text-warning")} aria-hidden="true">
            {provenance ? provenance.label : DEMO_LABEL}
          </p>
        </div>

        {/* Page controls */}
        <nav aria-label="ورق زدن صفحات" className="mx-auto flex max-w-[30rem] items-center justify-between gap-2">
          <Button variant="outline" onClick={prev} disabled={page <= 1} aria-label="صفحه قبل">
            <ChevronRight /> قبلی
          </Button>
          <form
            className="flex items-center gap-1.5 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              commitPageInput();
            }}
          >
            <label htmlFor="mushaf-page" className="text-muted-foreground">
              صفحه
            </label>
            <Input
              id="mushaf-page"
              inputMode="numeric"
              value={faNum(pageInput)}
              onChange={(e) => setPageInput(e.target.value.replace(/[^\d۰-۹]/g, ""))}
              onBlur={commitPageInput}
              className="h-10 w-16 text-center font-bold"
            />
            <span className="text-muted-foreground">از {faNum(TOTAL_PAGES)}</span>
          </form>
          <Button variant="outline" onClick={next} disabled={page >= TOTAL_PAGES} aria-label="صفحه بعد">
            بعدی <ChevronLeft />
          </Button>
        </nav>

        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="muted">جزء {faNum(juzOfPage(page))}</Badge>
          {surahsOnPage(page).map((s) => (
            <Badge key={s} variant="outline">
              سوره {surahName(s)}
            </Badge>
          ))}
          {sajdas.map((s) => (
            <Badge key={`${s.surah}:${s.ayah}`} variant="gold">
              سجده — آیه {faNum(s.ayah)}
            </Badge>
          ))}
        </div>
        {!isFull && <p className="text-center text-[11px] text-muted-foreground">{provenance?.attribution ?? source.attribution}</p>}
      </div>

      <SearchDialog
        open={dialog === "search"}
        onOpenChange={(o) => setDialog(o ? "search" : null)}
        demo={source.demo}
        onPick={(p, v) => {
          setDialog(null);
          go(p, v);
        }}
      />

      <Dialog open={dialog === "bookmarks"} onOpenChange={(o) => setDialog(o ? "bookmarks" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نشانک‌ها</DialogTitle>
            <DialogDescription>نشانک‌ها روی همین دستگاه ذخیره می‌شوند.</DialogDescription>
          </DialogHeader>
          {prefs.lastPage && prefs.lastPage !== page && (
            <Button variant="soft" onClick={() => (setDialog(null), go(prefs.lastPage!))}>
              ادامه از آخرین صفحه ({faNum(prefs.lastPage)})
            </Button>
          )}
          {bookmarks.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">هنوز نشانکی اضافه نکرده‌اید.</p>
          ) : (
            <ul className="max-h-80 divide-y overflow-y-auto rounded-xl border">
              {bookmarks.items.map((b) => (
                <li key={b.page} className="flex items-center gap-2 px-3 py-2">
                  <button
                    className="flex-1 text-start"
                    onClick={() => {
                      setDialog(null);
                      go(b.page);
                    }}
                  >
                    <span className="font-bold">صفحه {faNum(b.page)}</span>
                    <span className="ms-2 text-xs text-muted-foreground">
                      سوره {surahName(pageRange(b.page).start.surah)} · جزء {faNum(juzOfPage(b.page))}
                    </span>
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => bookmarks.toggle(b.page)} aria-label={`حذف نشانک صفحه ${faNum(b.page)}`}>
                    حذف
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "legend"} onOpenChange={(o) => setDialog(o ? "legend" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>راهنمای علائم وقف و نشانه‌ها</DialogTitle>
            <DialogDescription>
              {provenance
                ? "در این صفحه علائم وقف و شماره آیات همان‌گونه که در داده منبع آمده نمایش داده می‌شوند."
                : "پس از اتصال داده مجاز، این علائم همراه متن از منبع نمایش داده می‌شوند."}
            </DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2">
            {WAQF_SIGNS.map((w) => (
              <li key={w.name} className="flex items-center gap-3 rounded-xl border bg-card p-2.5">
                <span lang="ar" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-soft font-mushaf text-2xl text-primary-deep">
                  {"\u25CC" + w.mark}
                </span>
                <span>
                  <span className="block text-sm font-bold">{w.name}</span>
                  <span className="block text-xs text-muted-foreground">{w.text}</span>
                </span>
              </li>
            ))}
            <li className="flex items-center gap-3 rounded-xl border bg-card p-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold bg-gold-soft font-arabic text-sm text-gold-foreground">
                ٧
              </span>
              <span>
                <span className="block text-sm font-bold">نشانه پایان آیه</span>
                <span className="block text-xs text-muted-foreground">شماره آیه داخل دایره در انتهای هر آیه.</span>
              </span>
            </li>
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  children,
  pressed,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-10 w-10 shrink-0"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

function SearchDialog({
  open,
  onOpenChange,
  onPick,
  demo,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (page: number, verse: VerseRef | null) => void;
  demo: boolean;
}) {
  const [q, setQ] = useState("");
  const result = parseVerseQuery(q);
  const surahs = searchSurahs(q).slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>جست‌وجوی آیه</DialogTitle>
          <DialogDescription>نشانی آیه یا نام سوره را وارد کنید؛ مثال: ۲:۲۵۵ ، بقره ۲۵۵ ، صفحه ۴۲</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (result.kind === "verse") onPick(result.page, { surah: result.surah, ayah: result.ayah });
            else if (result.kind === "page") onPick(result.page, null);
          }}
        >
          <label htmlFor="mushaf-search" className="sr-only">
            نشانی آیه
          </label>
          <Input id="mushaf-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثلاً: آل عمران ۱۹۰" />
        </form>

        {result.kind === "error" && <p className="text-sm font-semibold text-destructive">{result.message}</p>}
        {result.kind === "verse" && (
          <Button variant="soft" className="h-auto justify-between py-3" onClick={() => onPick(result.page, result)}>
            <span>
              سوره {surahName(result.surah)} — آیه {faNum(result.ayah)}
            </span>
            <span className="text-xs text-muted-foreground">صفحه {faNum(result.page)} · جزء {faNum(juzOfVerse(result.surah, result.ayah))}</span>
          </Button>
        )}
        {result.kind === "page" && (
          <Button variant="soft" onClick={() => onPick(result.page, null)}>
            رفتن به صفحه {faNum(result.page)}
          </Button>
        )}
        {surahs.length > 1 && (
          <ul className="max-h-60 divide-y overflow-y-auto rounded-xl border">
            {surahs.map((s) => (
              <li key={s}>
                <button className="flex w-full items-center justify-between px-3 py-2 text-start hover:bg-accent" onClick={() => onPick(surahStartPage(s), { surah: s, ayah: 1 })}>
                  <span className="font-semibold">
                    {faNum(s)}. سوره {surahName(s)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {surahType(s)} · {faNum(ayahCount(s))} آیه · صفحه {faNum(surahStartPage(s))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          {demo
            ? "جست‌وجو در متن آیات پس از اتصال داده مجاز مصحف فعال می‌شود."
            : "جست‌وجوی متنی هنوز فعال نشده است؛ فعلاً با نشانی آیه یا نام سوره جست‌وجو کنید."}
        </p>
      </DialogContent>
    </Dialog>
  );
}