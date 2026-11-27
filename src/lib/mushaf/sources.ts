import { buildPageLines, type SourceVerse } from "./layout";
import { LINES_PER_PAGE, clampPage, pageRange } from "./metadata";
import type { MushafLine, MushafPageData, MushafSource } from "./types";

/**
 * Text-free 15-line frame for navigation while no approved full-text dataset is bundled.
 * Never fills missing pages with guessed or generated Qur'an text.
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

/** No Quran Foundation text is bundled in the public repository. */
export const SNAPSHOT_PAGES: number[] = [];

/** Kept as a compatibility alias for existing reader imports. */
export const prototypeSource: MushafSource = demoSource;

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
 * Live Quran Foundation API adapter.
 * Enable only after the developer has accepted the current Developer Terms,
 * obtained production API access, and configured the app's attribution/privacy requirements.
 * This adapter requests content for display; do not turn regular API responses into
 * a bundled/public dataset or retain them beyond the permitted period.
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
    attribution: "Quran data provided by Quran Foundation.",
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
        provenance: {
          label: "متن زنده از Quran Foundation API",
          attribution: "Quran data provided by Quran Foundation.",
        },
      };
    },
  };
}

/**
 * Default is the text-free demo. Enable the live API only after production
 * access and all current Quran Foundation Developer Terms requirements are met.
 */
export function getMushafSource(): MushafSource {
  const env = import.meta.env;
  if (env["VITE_MUSHAF_SOURCE"] === "quran-com-v4") {
    return quranComV4Source(env["VITE_MUSHAF_API_BASE"] || "https://api.quran.com/api/v4");
  }
  return demoSource;
}
