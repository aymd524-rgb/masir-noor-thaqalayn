import { describe, expect, it } from "vitest";
import { isValidVerse } from "../metadata";
import { QPC_HAFS_SNAPSHOT } from "./qpc-hafs-snapshot";

describe("bundled KFGQPC Hafs snapshot integrity", () => {
  it("contains only valid page keys within the 604-page mushaf", () => {
    const pageKeys = Object.keys(QPC_HAFS_SNAPSHOT.pages).map(Number);
    expect(pageKeys.length).toBeGreaterThan(0);
    expect(pageKeys.every((page) => Number.isInteger(page) && page >= 1 && page <= 604)).toBe(true);
  });

  it("keeps verse references valid and words on source lines 1 through 15", () => {
    for (const [pageKey, verses] of Object.entries(QPC_HAFS_SNAPSHOT.pages)) {
      const page = Number(pageKey);
      expect(verses.length, `page ${page} should contain verses`).toBeGreaterThan(0);
      const seen = new Set<string>();
      for (const verse of verses) {
        const key = `${verse.surah}:${verse.ayah}`;
        expect(isValidVerse(verse.surah, verse.ayah), `invalid verse ${key} on page ${page}`).toBe(true);
        expect(seen.has(key), `duplicate verse ${key} on page ${page}`).toBe(false);
        seen.add(key);
        expect(verse.words.length, `verse ${key} should contain words`).toBeGreaterThan(0);
        for (const word of verse.words) {
          expect(word.text.trim(), `empty word in ${key}`).not.toBe("");
          expect(word.line, `invalid source line in ${key}`).toBeGreaterThanOrEqual(1);
          expect(word.line, `invalid source line in ${key}`).toBeLessThanOrEqual(15);
          expect(Number.isInteger(word.line), `non-integer source line in ${key}`).toBe(true);
          expect(["word", "end"]).toContain(word.kind);
        }
      }
    }
  });

  it("records its source and fixed-line mushaf identifiers", () => {
    expect(QPC_HAFS_SNAPSHOT.meta.source).toContain("Quran.com API");
    expect(QPC_HAFS_SNAPSHOT.meta.mushafId).toBe(5);
    expect(QPC_HAFS_SNAPSHOT.meta.layoutCrossCheckedWithMushafId).toBe(1);
    expect(QPC_HAFS_SNAPSHOT.basmala.length).toBeGreaterThan(0);
  });
});
