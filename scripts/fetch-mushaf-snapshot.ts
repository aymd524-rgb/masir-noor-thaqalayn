/**
 * Regenerates src/lib/mushaf/data/qpc-hafs-snapshot.ts from the Quran.com API v4.
 *   bun scripts/fetch-mushaf-snapshot.ts
 *
 * Text: field `text_qpc_hafs` (KFGQPC Hafs Uthmanic text as served by Quran.com).
 * Layout: word `line_number` for the KFGQPC Hafs 15-line mushaf (mushaf=5), cross-checked
 * against the QCF V2 Madani layout (mushaf=1). The script aborts if the two disagree.
 * The text is stored byte-for-byte as returned — never edit the generated file by hand.
 */
import { writeFileSync } from "node:fs";

const API = "https://api.quran.com/api/v4";
const MUSHAF_ID = 5; // KFGQPC Hafs
const CHECK_MUSHAF_ID = 1; // QCF V2 (Madani 1421)
// Default to the two-page prototype. Use `--all` to fetch all 604 pages, or
// `--pages=1,2,50,604` for a selected verification batch.
const args = process.argv.slice(2);
const allPages = args.includes("--all");
const pagesArg = args.find((arg) => arg.startsWith("--pages="))?.slice("--pages=".length);
const PAGES = allPages
  ? Array.from({ length: 604 }, (_, i) => i + 1)
  : pagesArg
    ? [...new Set(pagesArg.split(",").map(Number))]
    : [1, 2];
if (!PAGES.length || PAGES.some((page) => !Number.isInteger(page) || page < 1 || page > 604)) {
  throw new Error("Pages must be integers from 1 to 604; use --all or --pages=1,2,604");
}

interface ApiWord {
  char_type_name: string;
  text_qpc_hafs: string;
  line_number: number;
  page_number: number;
}
interface ApiVerse {
  verse_key: string;
  page_number: number;
  words: ApiWord[];
}

async function getJson(url: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) return await res.json();
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === 3) throw new Error(`${res.status} for `${url}`);
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 30000)
        : 800 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    } catch (error) {
      lastError = error;
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 800 * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Quran API request failed");
}

async function versesOnPage(page: number, mushaf: number): Promise<ApiVerse[]> {
  const out: ApiVerse[] = [];
  let p: number | null = 1;
  while (p) {
    const j = await getJson(
      `${API}/verses/by_page/${page}?mushaf=${mushaf}&words=true&word_fields=text_qpc_hafs,line_number,page_number&per_page=50&page=${p}`,
    );
    out.push(...j.verses);
    p = j.pagination?.next_page ?? null;
  }
  return out;
}

const toSource = (v: ApiVerse) => {
  const [surah, ayah] = v.verse_key.split(":").map(Number);
  return {
    surah,
    ayah,
    words: v.words
      .filter((w) => w.char_type_name === "word" || w.char_type_name === "end")
      .map((w) => ({ text: w.text_qpc_hafs, kind: w.char_type_name === "end" ? "end" : "word", line: w.line_number })),
  };
};

const pages: Record<number, ReturnType<typeof toSource>[]> = {};
for (const page of PAGES) {
  const rawMain = await versesOnPage(page, MUSHAF_ID);
  const main = rawMain.map(toSource);
  const check = (await versesOnPage(page, CHECK_MUSHAF_ID)).map(toSource);
  if (!main.length) throw new Error(`No verses returned for page ${page}`);
  const keys = new Set<string>();
  for (const verse of main) {
    const key = `${verse.surah}:${verse.ayah}`;
    if (keys.has(key)) throw new Error(`Duplicate verse ${key} on page ${page}`);
    keys.add(key);
    const rawVerse = rawMain.find((v) => v.verse_key === key);
    if (!rawVerse || rawVerse.page_number !== page) throw new Error(`Unexpected page metadata for ${key}; expected page ${page}`);
    if (!verse.words.length) throw new Error(`No word/end markers for ${key} on page ${page}`);
    for (const word of verse.words) {
      if (!word.text.trim()) throw new Error(`Empty word text in ${key} on page ${page}`);
      if (!Number.isInteger(word.line) || word.line < 1 || word.line > 15) {
        throw new Error(`Invalid 15-line source line ${word.line} in ${key} on page ${page}`);
      }
    }
  }
  const sig = (vs: typeof main) => vs.map((v) => `${v.surah}:${v.ayah}=` + v.words.map((w) => `${w.line}:${w.text}`).join(",")).join("|");
  if (sig(main) !== sig(check)) throw new Error(`Text/layout mismatch on page ${page} between mushaf ${MUSHAF_ID} and ${CHECK_MUSHAF_ID}`);
  pages[page] = main;
}

if (allPages && (Object.keys(pages).length !== 604 || Array.from({ length: 604 }, (_, i) => i + 1).some((page) => !pages[page]))) {
  throw new Error("Full mushaf snapshot incomplete: expected all 604 pages");
}

const basmalaVerse = (await getJson(`${API}/verses/by_key/1:1?words=true&word_fields=text_qpc_hafs`)).verse as ApiVerse;
const basmala = basmalaVerse.words.filter((w) => w.char_type_name === "word").map((w) => w.text_qpc_hafs);

const snapshot = {
  meta: {
    source: "Quran.com API v4 (Quran Foundation)",
    endpoint: `${API}/verses/by_page/{page}?mushaf=${MUSHAF_ID}&words=true&word_fields=text_qpc_hafs,line_number`,
    textField: "text_qpc_hafs",
    mushafId: MUSHAF_ID,
    layoutCrossCheckedWithMushafId: CHECK_MUSHAF_ID,
    fetchedAt: new Date().toISOString(),
  },
  basmala,
  pages,
};

const header = `/**
 * GENERATED by scripts/fetch-mushaf-snapshot.ts — DO NOT EDIT BY HAND.
 * Quran text (KFGQPC Hafs, field text_qpc_hafs) and 15-line layout as returned by Quran.com API v4.
 * Stored verbatim; any change must come from re-running the script.
 */
import type { SourceVerse } from "../layout";

export const QPC_HAFS_SNAPSHOT: {
  meta: Record<string, string | number>;
  basmala: string[];
  pages: Record<string, SourceVerse[]>;
} = `;
writeFileSync("src/lib/mushaf/data/qpc-hafs-snapshot.ts", header + JSON.stringify(snapshot, null, 2) + ";\n");
console.log("wrote pages", PAGES.join(","), "verses:", Object.values(pages).map((v) => v.length).join("+"));