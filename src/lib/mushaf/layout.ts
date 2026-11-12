import { LINES_PER_PAGE, TOTAL_SURAHS, ayahCount } from "./metadata";
import type { MushafLine, MushafWord } from "./types";

export interface SourceVerse {
  surah: number;
  ayah: number;
  words: { text: string; kind: "word" | "end"; line: number }[];
}

export class MushafIntegrityError extends Error {}

/**
 * Places source words on their source-given line numbers (1–15). Never re-wraps text:
 * lines without words are filled only with surah headers / basmala implied by the layout,
 * otherwise left empty.
 */
export function buildPageLines(verses: SourceVerse[]): MushafLine[] {
  const slots: (MushafLine | null)[] = Array.from({ length: LINES_PER_PAGE }, () => null);

  for (const v of verses) {
    for (const w of v.words) {
      if (!Number.isInteger(w.line) || w.line < 1 || w.line > LINES_PER_PAGE) {
        throw new MushafIntegrityError(`line ${w.line} out of range for ${v.surah}:${v.ayah}`);
      }
      const idx = w.line - 1;
      const word: MushafWord = { text: w.text, kind: w.kind, surah: v.surah, ayah: v.ayah };
      const slot = slots[idx];
      if (slot && slot.kind === "ayah") slot.words.push(word);
      else slots[idx] = { kind: "ayah", words: [word] };
    }
  }

  const placeHeader = (surah: number, firstLine: number) => {
    // firstLine is 1-based; header/basmala occupy the free lines right above it.
    const needsBasmala = surah !== 1 && surah !== 9;
    const b = firstLine - 2;
    const h = needsBasmala ? firstLine - 3 : firstLine - 2;
    if (needsBasmala && b >= 0 && !slots[b]) slots[b] = { kind: "basmala" };
    if (h >= 0 && !slots[h]) slots[h] = { kind: "surah-header", surah };
  };

  for (const v of verses) {
    if (v.ayah !== 1 || v.words.length === 0) continue;
    placeHeader(v.surah, Math.min(...v.words.map((w) => w.line)));
  }

  // One or two free lines at the bottom after a completed surah belong to the next surah's
  // header/basmala. More free lines means a short opening page (1–2): leave them empty.
  const last = verses.at(-1);
  if (last && last.ayah === ayahCount(last.surah) && last.surah < TOTAL_SURAHS) {
    let lastUsed = -1;
    slots.forEach((s, i) => s && (lastUsed = i));
    const free = LINES_PER_PAGE - 1 - lastUsed;
    if (free > 0 && free <= 2) {
      const next = last.surah + 1;
      slots[lastUsed + 1] = { kind: "surah-header", surah: next };
      if (free > 1 && next !== 9) slots[lastUsed + 2] = { kind: "basmala" };
    }
  }

  return slots.map((s) => s ?? { kind: "empty" });
}