/**
 * Navigation helpers over the Tanzil structural metadata (surahs, Madani page starts, juz).
 * This module never contains or produces verse text.
 */
import { JUZ_STARTS, PAGE_STARTS, SAJDAS, SURAHS } from "./tanzil-metadata";

export const TOTAL_PAGES = 604;
export const TOTAL_SURAHS = 114;
export const TOTAL_JUZ = 30;
export const LINES_PER_PAGE = 15;

export interface VerseRef {
  surah: number;
  ayah: number;
}

const key = (s: number, a: number) => s * 1000 + a;

export const surahName = (s: number) => SURAHS[s - 1]?.[0] ?? "";
export const ayahCount = (s: number) => SURAHS[s - 1]?.[1] ?? 0;
export const surahType = (s: number) => (SURAHS[s - 1]?.[2] === "m" ? "مکی" : "مدنی");

export const isValidVerse = (s: number, a: number) =>
  Number.isInteger(s) && Number.isInteger(a) && s >= 1 && s <= TOTAL_SURAHS && a >= 1 && a <= ayahCount(s);

export const clampPage = (n: number) => Math.min(TOTAL_PAGES, Math.max(1, Math.round(Number.isFinite(n) ? n : 1)));

/** Index of the last start point <= (s, a). `starts` must be sorted. */
function lastStartIndex(starts: ReadonlyArray<readonly [number, number]>, s: number, a: number) {
  const k = key(s, a);
  let lo = 0;
  let hi = starts.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const st = starts[mid]!;
    if (key(st[0], st[1]) <= k) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

export const pageOfVerse = (s: number, a: number) => Math.min(TOTAL_PAGES, lastStartIndex(PAGE_STARTS, s, a) + 1);
export const juzOfVerse = (s: number, a: number) => Math.min(TOTAL_JUZ, lastStartIndex(JUZ_STARTS, s, a) + 1);
export const surahStartPage = (s: number) => pageOfVerse(s, 1);
export const juzStartPage = (j: number) => {
  const [s, a] = (JUZ_STARTS[j - 1] ?? JUZ_STARTS[0])!;
  return pageOfVerse(s, a);
};

function prevVerse(s: number, a: number): VerseRef {
  if (a > 1) return { surah: s, ayah: a - 1 };
  return { surah: s - 1, ayah: ayahCount(s - 1) };
}

export function pageRange(page: number): { start: VerseRef; end: VerseRef } {
  const p = clampPage(page);
  const [s, a] = PAGE_STARTS[p - 1]!;
  const [ns, na] = PAGE_STARTS[p]!;
  return { start: { surah: s, ayah: a }, end: prevVerse(ns, na) };
}

export const juzOfPage = (page: number) => {
  const { start } = pageRange(page);
  return juzOfVerse(start.surah, start.ayah);
};

export function surahsOnPage(page: number): number[] {
  const { start, end } = pageRange(page);
  const out: number[] = [];
  for (let s = start.surah; s <= end.surah; s++) out.push(s);
  return out;
}

/** Surahs whose first ayah falls on this page. */
export const surahsStartingOnPage = (page: number) => surahsOnPage(page).filter((s) => surahStartPage(s) === page);

export const sajdasOnPage = (page: number): VerseRef[] =>
  SAJDAS.filter(([s, a]) => pageOfVerse(s, a) === page).map(([s, a]) => ({ surah: s, ayah: a }));

export const arNum = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d] ?? d);

/* ---------------- Search (by reference or surah name — not by verse text) ---------------- */

const toLatinDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

export function normalizeName(s: string) {
  return s
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[يىئ]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ؤ/g, "و")
    .replace(/[\u200c\s]+/g, "")
    .replace(/^سور[هة]/, "")
    .replace(/^ال/, "");
}

const NORMALIZED_SURAHS = SURAHS.map(([name]) => normalizeName(name));

export function searchSurahs(query: string): number[] {
  const q = normalizeName(toLatinDigits(query).replace(/\d+/g, ""));
  if (!q) return [];
  const exact: number[] = [];
  const starts: number[] = [];
  const contains: number[] = [];
  NORMALIZED_SURAHS.forEach((n, i) => {
    if (n === q) exact.push(i + 1);
    else if (n.startsWith(q)) starts.push(i + 1);
    else if (n.includes(q)) contains.push(i + 1);
  });
  return [...exact, ...starts, ...contains];
}

export type VerseQueryResult =
  | { kind: "verse"; surah: number; ayah: number; page: number }
  | { kind: "page"; page: number }
  | { kind: "error"; message: string }
  | { kind: "empty" };

/**
 * Parses "2:255", "۲:۲۵۵", "بقره ۲۵۵", "سوره آل عمران", "صفحه ۴۲" or a bare page number.
 */
export function parseVerseQuery(raw: string): VerseQueryResult {
  const q = toLatinDigits(raw).trim();
  if (!q) return { kind: "empty" };

  const pageMatch = q.match(/^(?:صفحه|ص|page|p)\s*(\d{1,3})$/i) ?? q.match(/^(\d{1,3})$/);
  if (pageMatch) {
    const n = Number(pageMatch[1]);
    if (n < 1 || n > TOTAL_PAGES) return { kind: "error", message: `شماره صفحه باید بین ۱ تا ۶۰۴ باشد.` };
    return { kind: "page", page: n };
  }

  const ref = q.match(/^(\d{1,3})\s*[:：.\-/،,]\s*(\d{1,3})$/);
  if (ref) {
    const s = Number(ref[1]);
    const a = Number(ref[2]);
    if (!isValidVerse(s, a)) return { kind: "error", message: "این شماره سوره یا آیه وجود ندارد." };
    return { kind: "verse", surah: s, ayah: a, page: pageOfVerse(s, a) };
  }

  const num = q.match(/(\d{1,3})\s*$/);
  const matches = searchSurahs(q);
  if (matches.length === 0) return { kind: "error", message: "سوره‌ای با این نام پیدا نشد." };
  const s = matches[0]!;
  const a = num ? Number(num[1]) : 1;
  if (!isValidVerse(s, a)) return { kind: "error", message: `سوره ${surahName(s)} ${ayahCount(s)} آیه دارد.` };
  return { kind: "verse", surah: s, ayah: a, page: pageOfVerse(s, a) };
}