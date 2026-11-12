import { describe, expect, it } from "vitest";
import { buildPageLines } from "@/lib/mushaf/layout";
import { pageOfVerse, pageRange, parseVerseQuery } from "@/lib/mushaf/metadata";
import { demoSource } from "@/lib/mushaf/sources";

const w = (line: number) => ({ text: "x", kind: "word" as const, line });

describe("mushaf pagination metadata", () => {
  it("page 3 starts at 2:6", () => expect(pageRange(3).start).toEqual({ surah: 2, ayah: 6 }));
  it("Aal Imran starts on page 50", () => expect(pageOfVerse(3, 1)).toBe(50));
  it("last page 604 spans 112:1 to 114:6", () =>
    expect(pageRange(604)).toEqual({ start: { surah: 112, ayah: 1 }, end: { surah: 114, ayah: 6 } }));
});

describe("verse search", () => {
  it("parses Persian digits reference", () => expect(parseVerseQuery("۳:۱")).toMatchObject({ surah: 3, ayah: 1, page: 50 }));
  it("parses surah name in Persian spelling", () =>
    expect(parseVerseQuery("آل عمران")).toMatchObject({ kind: "verse", surah: 3, ayah: 1 }));
  it("rejects an ayah beyond the surah", () => expect(parseVerseQuery("1:8").kind).toBe("error"));
});

describe("15-line layout", () => {
  it("every page always has exactly 15 lines", async () => {
    for (const p of [1, 2, 50, 604]) expect((await demoSource.getPage(p)).lines).toHaveLength(15);
  });

  it("places surah headers and basmala in free lines above each surah (page 604 shape)", () => {
    const lines = buildPageLines([
      { surah: 112, ayah: 1, words: [w(3)] },
      { surah: 112, ayah: 4, words: [w(4)] },
      { surah: 113, ayah: 1, words: [w(7)] },
      { surah: 114, ayah: 1, words: [w(12)] },
      { surah: 114, ayah: 6, words: [w(15)] },
    ]);
    expect(lines).toHaveLength(15);
    expect(lines.map((l) => l.kind).slice(0, 7)).toEqual([
      "surah-header", "basmala", "ayah", "ayah", "surah-header", "basmala", "ayah",
    ]);
    expect(lines[9]?.kind).toBe("surah-header");
  });

  it("rejects line numbers outside 1-15 instead of re-wrapping", () => {
    expect(() => buildPageLines([{ surah: 2, ayah: 6, words: [w(16)] }])).toThrow();
  });
});