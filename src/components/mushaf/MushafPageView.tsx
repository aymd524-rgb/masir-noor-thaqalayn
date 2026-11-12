import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { faNum } from "@/lib/format";
import { arNum, juzOfPage, pageRange, surahName, type VerseRef } from "@/lib/mushaf/metadata";
import type { MushafLine, MushafPageData, MushafWord } from "@/lib/mushaf/types";
import { cn } from "@/lib/utils";

export function MushafPageView({
  page,
  data,
  loading,
  scale,
  highlight,
  juzHint,
}: {
  page: number;
  data?: MushafPageData | undefined;
  loading?: boolean;
  scale: number;
  highlight: VerseRef | null;
  juzHint?: number;
}) {
  const standard = scale <= 1;
  const { start } = pageRange(page);
  const juz = juzHint ?? juzOfPage(page);
  const hasText = !!data?.provenance;
  // Pages 1–2 of the Madani mushaf are short, centred opening pages (not 15 full lines).
  const opening = page <= 2 && hasText;
  const allLines = data?.lines ?? [];
  const lines = opening ? trimEmpty(allLines) : allLines;

  const renderLine = (line: MushafLine, i: number) => (
    <LineSlot
      key={i}
      n={i + 1}
      line={line}
      standard={standard}
      centered={page <= 2}
      highlight={highlight}
      basmala={data?.basmala}
    />
  );

  return (
    <article
      aria-label={`صفحه ${faNum(page)} مصحف`}
      aria-busy={loading}
      className="rounded-[1.5rem] border-2 border-gold/50 bg-mushaf-paper p-1.5 text-mushaf-ink shadow-elegant"
    >
      <div className="rounded-[1.15rem] border border-gold/40 px-3 pb-1.5 pt-1 sm:px-5">
        <header className="flex items-center justify-between border-b border-gold/30 font-arabic text-sm leading-8 text-mushaf-ink/75">
          <span lang="ar">سورة {surahName(start.surah)}</span>
          <span lang="ar">الجزء {arNum(juz)}</span>
        </header>

        <div className="@container">
          <div
            dir="rtl"
            lang="ar"
            style={{ fontSize: `calc(${scale} * 4.6cqi)` } as CSSProperties}
            className={cn("font-mushaf transition-opacity", loading && "opacity-50")}
          >
            {lines.length === 0 ? (
              <div className="grid aspect-[5/7.6] grid-rows-[repeat(15,minmax(0,1fr))]">
                {Array.from({ length: 15 }, (_, i) => (
                  <PlaceholderLine key={i} n={i + 1} />
                ))}
              </div>
            ) : opening && standard ? (
              <div className="flex aspect-[5/7.6] flex-col justify-center py-[6%]">
                <div className="mx-auto flex w-[88%] flex-col rounded-[2rem] border-4 border-double border-gold/60 px-[5%] py-[4%]">
                  {lines.map((line, i) => (
                    <div key={i} className="grid h-[2.3em] items-center">
                      {renderLine(line, i)}
                    </div>
                  ))}
                </div>
              </div>
            ) : standard ? (
              <div className="grid aspect-[5/7.6] grid-rows-[repeat(15,minmax(0,1fr))]">{lines.map(renderLine)}</div>
            ) : (
              <div className="space-y-1 py-2">{lines.map(renderLine)}</div>
            )}
          </div>
        </div>

        <footer className="flex justify-center border-t border-gold/30 pt-1">
          <span className="grid min-w-9 place-items-center rounded-full border border-gold/60 bg-gold-soft px-2 font-arabic text-sm leading-7 text-gold-foreground">
            {arNum(page)}
          </span>
        </footer>
      </div>
    </article>
  );
}

function trimEmpty(lines: MushafLine[]) {
  let a = 0;
  let b = lines.length;
  while (a < b && lines[a]?.kind === "empty") a++;
  while (b > a && lines[b - 1]?.kind === "empty") b--;
  return lines.slice(a, b);
}

function LineSlot({
  n,
  line,
  standard,
  centered,
  highlight,
  basmala,
}: {
  n: number;
  line: MushafLine;
  standard: boolean;
  centered: boolean;
  highlight: VerseRef | null;
  basmala?: string[] | undefined;
}) {
  switch (line.kind) {
    case "ayah":
      return (
        <FitLine fit={standard} justify={!centered} wrap={!standard}>
          {line.words.map((w, i) => (
            <Word key={i} w={w} highlighted={!!highlight && highlight.surah === w.surah && highlight.ayah === w.ayah} />
          ))}
        </FitLine>
      );
    case "surah-header":
      return (
        <div className="flex items-center py-[0.12em]">
          <div className="grid h-full min-h-[1.6em] w-full place-items-center rounded-full border border-gold/70 bg-gold-soft/80 font-arabic text-[0.8em] leading-none text-primary-deep shadow-soft">
            سورة {surahName(line.surah)}
          </div>
        </div>
      );
    case "basmala":
      return basmala && basmala.length > 0 ? (
        <FitLine fit={standard} justify={false} wrap={!standard}>
          {basmala.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </FitLine>
      ) : (
        <div className="flex items-center justify-center">
          <span className="rounded-full border border-dashed border-gold/60 px-3 font-sans text-[0.4em] leading-loose text-muted-foreground">
            جای بسمله — از منبع داده
          </span>
        </div>
      );
    case "placeholder":
      return <PlaceholderLine n={n} />;
    default:
      return <div aria-hidden="true" />;
  }
}

function PlaceholderLine({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="h-[0.16em] flex-1 rounded-full bg-mushaf-ink/10" />
      <span className="font-sans text-[0.32em] leading-none text-muted-foreground/80">سطر {faNum(n)}</span>
      <span className="h-[0.16em] flex-1 rounded-full bg-mushaf-ink/10" />
    </div>
  );
}

/** Ayah-end markers are the source's own digits; the KFGQPC Hafs font draws the ornament around them. */
function Word({ w, highlighted }: { w: MushafWord; highlighted: boolean }) {
  if (w.kind === "end") {
    return (
      <span
        aria-label={`پایان آیه ${faNum(w.ayah)}`}
        className={cn("shrink-0 rounded-full text-gold-foreground", highlighted && "bg-gold-soft")}
      >
        {w.text}
      </span>
    );
  }
  return <span className={cn("rounded-md", highlighted && "bg-gold-soft text-primary-deep")}>{w.text}</span>;
}

/** Shrinks a single source line to fit the width; never moves words to another line. */
function FitLine({ children, fit, justify, wrap }: { children: ReactNode; fit: boolean; justify: boolean; wrap: boolean }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);

  useEffect(() => {
    if (!fit) {
      setK(1);
      return;
    }
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      i.style.fontSize = "1em";
      const natural = i.scrollWidth;
      const ratio = natural > 0 ? o.clientWidth / natural : 1;
      const current = ratio < 1 ? Math.max(0.55, ratio * 0.99) : 1;
      i.style.fontSize = `${current}em`;
      setK(current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [fit, children]);

  return (
    <div ref={outer} className="flex min-w-0 items-center overflow-hidden">
      <div
        ref={inner}
        style={{ fontSize: `${k}em` }}
        className={cn(
          "flex w-full items-center gap-x-[0.18em] leading-[2]",
          wrap ? "flex-wrap justify-center" : "whitespace-nowrap",
          !wrap && (justify ? "justify-between" : "justify-center"),
        )}
      >
        {children}
      </div>
    </div>
  );
}