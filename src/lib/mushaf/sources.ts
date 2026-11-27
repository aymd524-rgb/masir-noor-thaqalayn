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

import { backendConfig, isBackendConfigured } from "../backend/config";

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
interface MushafProxyResponse {
  page: number;
  verses: V4Verse[];
  basmala: string[];
}

/**
 * Read-only browser adapter for our Supabase Edge Function.
 * Quran Foundation client credentials are kept only in the Edge Function secrets.
 */
export function quranFoundationEdgeSource(): MushafSource {
  return {
    id: "quran-foundation-edge",
    demo: false,
    name: "Quran Foundation Content API (secure proxy)",
    attribution:
      "متن عثمانی و شماره سطرها: Quran Foundation Content API، مصحف KFGQPC Hafs (mushaf 5)؛ فهرست صفحات و اجزا: Tanzil.net (CC BY 3.0)",
    async getPage(page, signal): Promise<MushafPageData> {
      const p = clampPage(page);
      if (!backendConfig.url || !backendConfig.publishableKey) {
        throw new Error("اتصال Supabase برای دریافت متن کامل مصحف پیکربندی نشده است.");
      }
      const response = await fetch(
        `${backendConfig.url.replace(/\/$/, "")}/functions/v1/mushaf-page?page=${p}`,
        {
          signal,
          headers: { apikey: backendConfig.publishableKey },
        },
      );
      const result = (await response.json().catch(() => null)) as MushafProxyResponse | { error?: string } | null;
      if (!response.ok || !result || !("verses" in result) || !Array.isArray(result.verses)) {
        const message = result && "error" in result ? result.error : undefined;
        throw new Error(message || "دریافت متن این صفحه از سرویس مصحف ناموفق بود.");
      }

      const toVerse = (v: V4Verse): SourceVerse => {
        const [s = 0, a = 0] = v.verse_key.split(":").map(Number);
        return {
          surah: s,
          ayah: a,
          words: (v.words ?? [])
            .filter((w) => w.char_type_name === "word" || w.char_type_name === "end")
            .map((w) => ({
              text: w.text_uthmani ?? w.text ?? "",
              kind: w.char_type_name === "end" ? ("end" as const) : ("word" as const),
              line: w.line_number,
            })),
        };
      };

      return {
        page: p,
        lines: buildPageLines(result.verses.map(toVerse)),
        basmala: result.basmala,
        provenance: {
          label: "متن از Quran Foundation Content API — صفحه‌بندی مصحف KFGQPC Hafs",
          attribution:
            "متن عثمانی و شماره سطرها: Quran Foundation Content API؛ مصحف KFGQPC Hafs (mushaf 5). لطفاً متن را با مصحف مرجع تطبیق دهید.",
        },
      };
    },
  };
}

/**
 * Active source: secure Edge Function when Supabase is configured; the clearly
 * labelled two-page prototype otherwise. Set VITE_MUSHAF_SOURCE=prototype
 * to explicitly select the demo source.
 */
export function getMushafSource(): MushafSource {
  const env = import.meta.env;
  if (env["VITE_MUSHAF_SOURCE"] === "prototype" || !isBackendConfigured) return prototypeSource;
  return quranFoundationEdgeSource();
}
