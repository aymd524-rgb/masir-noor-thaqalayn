import { backendConfig, isBackendConfigured } from "../backend/config";
import { QPC_HAFS_SNAPSHOT } from "./data/qpc-hafs-snapshot";
import { buildPageLines, type SourceVerse } from "./layout";
import { LINES_PER_PAGE, arNum, clampPage, pageRange } from "./metadata";
import type { MushafLine, MushafPageData, MushafSource, MushafWord } from "./types";

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



type CloudAyah = {
  number: number;
  text: string;
  numberInSurah: number;
  page: number;
  juz: number;
  surah: { number: number; name: string; numberOfAyahs: number };
};
type CloudPageResponse = {
  code: number;
  status: string;
  data?: { number: number; ayahs: CloudAyah[] };
};

let cloudBasmalaPromise: Promise<string[]> | null = null;

async function getAlQuranCloudBasmala(): Promise<string[]> {
  if (!cloudBasmalaPromise) {
    cloudBasmalaPromise = fetch("https://api.alquran.cloud/v1/ayah/1:1/quran-uthmani")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load basmala");
        const result = (await response.json()) as { code: number; data?: { text?: string } };
        if (result.code !== 200 || !result.data?.text) throw new Error("Invalid basmala response");
        return result.data.text.replace(/^\\uFEFF/, "").trim().split(/\s+/);
      })
      .catch((error) => {
        cloudBasmalaPromise = null;
        throw error;
      });
  }
  return cloudBasmalaPromise;
}

/**
 * Free, public AlQuran Cloud text source. It supplies all 604 page boundaries
 * and Uthmani ayah text, but not source line numbers, so the reader presents
 * each ayah in a flowing layout instead of claiming an exact 15-line facsimile.
 */
export function alQuranCloudSource(): MushafSource {
  return {
    id: "alquran-cloud-uthmani",
    demo: false,
    name: "AlQuran Cloud — Uthmani text",
    attribution:
      "متن عثمانی: AlQuran Cloud API (alquran.cloud)؛ متن عیناً از منبع دریافت می‌شود و برای پیگیری تغییرات به منبع ارجاع داده شده است.",
    async getPage(page, signal): Promise<MushafPageData> {
      const p = clampPage(page);
      const response = await fetch(`https://api.alquran.cloud/v1/page/${p}/quran-uthmani`, { signal });
      if (!response.ok) throw new Error("سرویس متن قرآن در دسترس نیست.");
      const result = (await response.json()) as CloudPageResponse;
      if (result.code !== 200 || result.data?.number !== p || !Array.isArray(result.data.ayahs) || !result.data.ayahs.length) {
        throw new Error("اطلاعات صفحه قرآن از منبع معتبر دریافت نشد.");
      }

      const hasBasmala = result.data.ayahs.some(
        (ayah) => ayah.numberInSurah === 1 && ayah.surah.number !== 1 && ayah.surah.number !== 9,
      );
      const basmala = hasBasmala ? await getAlQuranCloudBasmala() : [];
      const lines: MushafLine[] = [];

      for (const ayah of result.data.ayahs) {
        if (ayah.numberInSurah === 1) {
          lines.push({ kind: "surah-header", surah: ayah.surah.number });
          if (ayah.surah.number !== 1 && ayah.surah.number !== 9) lines.push({ kind: "basmala" });
        }
        const words: MushafWord[] = ayah.text
          .replace(/^\\uFEFF/, "")
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((text) => ({
            text,
            kind: "word",
            surah: ayah.surah.number,
            ayah: ayah.numberInSurah,
          }));
        words.push({
          text: `۝${arNum(ayah.numberInSurah)}`,
          kind: "end",
          surah: ayah.surah.number,
          ayah: ayah.numberInSurah,
        });
        lines.push({ kind: "ayah", words });
      }

      return {
        page: p,
        lines,
        layout: "verse-flow",
        basmala,
        provenance: {
          label: "متن کامل صفحه از AlQuran Cloud — رسم‌الخط عثمانی",
          attribution:
            "متن قرآن از AlQuran Cloud (alquran.cloud). متن عربی عیناً حفظ می‌شود؛ چینش سطرها به صورت روانخوانی است و الزاماً با خطوط مصحف چاپی یکسان نیست.",
        },
      };
    },
  };
}

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
      if (!response.ok || !result || !("verses" in result) || !Array.isArray(result.verses) || result.page !== p) {
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
  if (env["VITE_MUSHAF_SOURCE"] === "prototype") return prototypeSource;
  if (env["VITE_MUSHAF_SOURCE"] === "quran-foundation-edge") {
    if (!isBackendConfigured) return prototypeSource;
    return quranFoundationEdgeSource();
  }
  return alQuranCloudSource();
}
