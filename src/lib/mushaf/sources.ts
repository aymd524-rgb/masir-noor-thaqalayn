import { QPC_HAFS_SNAPSHOT } from "./data/qpc-hafs-snapshot";
import { buildPageLines, type SourceVerse } from "./layout";
import { LINES_PER_PAGE, clampPage, pageRange } from "./metadata";
import type { MushafLine, MushafPageData, MushafSource } from "./types";

/**
 * Demo source: shows the 15-line frame, page/surah/juz navigation from Tanzil metadata,
 * and EMPTY placeholder lines. It never renders verse text.
 */
export const demoSource: MushafSource = {
  id: "demo",
  demo: true,
  name: "نمونه نمایشی",
  attribution: "فهرست سوره‌ها، شروع صفحات و اجزا: Tanzil.net (CC BY 3.0)",
  async getPage(page) {
    const p = clampPage(page);
    const lines: MushafLine[] = Array.from({ length: LINES_PER_PAGE }, () => ({ kind: "placeholder" }));
    const { start } = pageRange(p);
    if (start.ayah === 1) {
      lines[0] = { kind: "surah-header", surah: start.surah };
      if (start.surah !== 1 && start.surah !== 9) lines[1] = { kind: "basmala" };
    }
    return { page: p, lines };
  },
};

/** Pages whose verbatim text + line layout are bundled in the app (prototype). */
export const SNAPSHOT_PAGES = Object.keys(QPC_HAFS_SNAPSHOT.pages).map(Number);

export const QPC_PROVENANCE = {
  label: "نمونه اولیه — متن از منبع، هنوز با مرجع رسمی تطبیق انسانی نشده",
  attribution:
    "متن عثمانی حفص مجمع ملک فهد (KFGQPC) و شماره سطرها: Quran.com API v4 — قلم: KFGQPC HAFS Uthmanic Script — فهرست‌ها: Tanzil.net (CC BY 3.0)",
};

/**
 * Prototype source: pages in SNAPSHOT_PAGES (1–2) show the verbatim KFGQPC Hafs text with
 * the source's own line numbers; every other page falls back to the text-free demo frame.
 */
export const prototypeSource: MushafSource = {
  id: "qpc-hafs-prototype",
  demo: true,
  name: "نمونه اولیه صفحات ۱ و ۲",
  attribution: demoSource.attribution,
  async getPage(page, signal) {
    const p = clampPage(page);
    const verses = QPC_HAFS_SNAPSHOT.pages[String(p)];
    if (!verses) return demoSource.getPage(p, signal);
    return { page: p, lines: buildPageLines(verses), basmala: QPC_HAFS_SNAPSHOT.basmala, provenance: QPC_PROVENANCE };
  },
};

interface V4Word {
  char_type_name: string;
  text_uthmani?: string;
  text?: string;
  line_number: number;
}
interface V4Verse {
  verse_key: string;
  words: V4Word[];
}

/**
 * Adapter for a Quran.com API v4–compatible endpoint (verses/by_page with word line numbers).
 * Disabled by default — enable only after the usage licence for the text has been obtained.
 */
export function quranComV4Source(baseUrl: string): MushafSource {
  let basmala: Promise<string[]> | null = null;
  const base = baseUrl.replace(/\/$/, "");

  const fetchJson = async (url: string, signal?: AbortSignal) => {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Mushaf source responded ${res.status}`);
    return res.json();
  };

  const toVerse = (v: V4Verse): SourceVerse => {
    const [s = 0, a = 0] = v.verse_key.split(":").map(Number);
    return {
      surah: s,
      ayah: a,
      words: v.words
        .filter((w) => w.char_type_name === "word" || w.char_type_name === "end")
        .map((w) => ({
          text: w.text_uthmani ?? w.text ?? "",
          kind: w.char_type_name === "end" ? ("end" as const) : ("word" as const),
          line: w.line_number,
        })),
    };
  };

  return {
    id: "quran-com-v4",
    demo: false,
    name: "Quran.com API v4",
    attribution: "متن عثمانی و شماره سطرها: Quran.com API v4 — فهرست‌ها: Tanzil.net (CC BY 3.0)",
    async getPage(page, signal): Promise<MushafPageData> {
      const p = clampPage(page);
      const verses: V4Verse[] = [];
      let apiPage: number | null = 1;
      while (apiPage) {
        const j = await fetchJson(
          `${base}/verses/by_page/${p}?words=true&word_fields=text_uthmani,line_number&per_page=50&page=${apiPage}`,
          signal,
        );
        verses.push(...(j.verses as V4Verse[]));
        apiPage = j.pagination?.next_page ?? null;
      }
      basmala ??= fetchJson(`${base}/verses/by_key/1:1?words=true&word_fields=text_uthmani`).then((j) =>
        (j.verse.words as V4Word[]).filter((w) => w.char_type_name === "word").map((w) => w.text_uthmani ?? ""),
      );
      return {
        page: p,
        lines: buildPageLines(verses.map(toVerse)),
        basmala: await basmala,
        provenance: { label: "متن از Quran.com API v4 — هنوز با مرجع رسمی تطبیق انسانی نشده", attribution: "متن عثمانی و شماره سطرها: Quran.com API v4 — فهرست‌ها: Tanzil.net (CC BY 3.0)" },
      };
    },
  };
}

/**
 * Active source. Default is the prototype (real text on pages 1–2 only, demo frame elsewhere). Set VITE_MUSHAF_SOURCE=quran-com-v4 (and optionally
 * VITE_MUSHAF_API_BASE) only once the text licence is in place.
 */
export function getMushafSource(): MushafSource {
  const env = import.meta.env;
  if (env["VITE_MUSHAF_SOURCE"] === "quran-com-v4") {
    return quranComV4Source(env["VITE_MUSHAF_API_BASE"] || "https://api.quran.com/api/v4");
  }
  return prototypeSource;
}