import { describe, expect, it } from "vitest";
import { buildPageLines, MushafIntegrityError } from "./layout";

describe("fixed-line Mushaf layout", () => {
  it("always returns 15 slots and keeps source line breaks without wrapping", () => {
    const lines = buildPageLines([
      {
        surah: 2,
        ayah: 255,
        words: [
          { text: "اللَّهُ", kind: "word", line: 2 },
          { text: "لَا", kind: "word", line: 2 },
          { text: "إِلَٰهَ", kind: "word", line: 3 },
          { text: "إِلَّا", kind: "word", line: 3 },
        ],
      },
    ]);

    expect(lines).toHaveLength(15);
    expect(lines[1]).toEqual({
      kind: "ayah",
      words: [
        { text: "اللَّهُ", kind: "word", surah: 2, ayah: 255 },
        { text: "لَا", kind: "word", surah: 2, ayah: 255 },
      ],
    });
    expect(lines[2]).toEqual({
      kind: "ayah",
      words: [
        { text: "إِلَٰهَ", kind: "word", surah: 2, ayah: 255 },
        { text: "إِلَّا", kind: "word", surah: 2, ayah: 255 },
      ],
    });
    expect(lines[0]).toEqual({ kind: "empty" });
    expect(lines[14]).toEqual({ kind: "empty" });
  });

  it("rejects source line numbers outside the 15-line page", () => {
    expect(() =>
      buildPageLines([
        { surah: 2, ayah: 1, words: [{ text: "bad", kind: "word", line: 16 }] },
      ]),
    ).toThrow(MushafIntegrityError);
  });

  it("rejects invalid surah and ayah references from an external source", () => {
    expect(() =>
      buildPageLines([
        { surah: 115, ayah: 1, words: [{ text: "invalid", kind: "word", line: 1 }] },
      ]),
    ).toThrow(/invalid verse reference/);

    expect(() =>
      buildPageLines([
        { surah: 2, ayah: 287, words: [{ text: "invalid", kind: "word", line: 1 }] },
      ]),
    ).toThrow(/invalid verse reference/);
  });

  it("rejects blank word text instead of rendering an empty source word", () => {
    expect(() =>
      buildPageLines([
        { surah: 2, ayah: 1, words: [{ text: "  ", kind: "word", line: 1 }] },
      ]),
    ).toThrow(/empty text/);
  });

  it("keeps words from consecutive ayahs on the same source line in order", () => {
    const lines = buildPageLines([
      { surah: 2, ayah: 1, words: [{ text: "بِسْمِ", kind: "word", line: 3 }] },
      { surah: 2, ayah: 2, words: [{ text: "الْحَمْدُ", kind: "word", line: 3 }] },
    ]);

    expect(lines[2]).toEqual({
      kind: "ayah",
      words: [
        { text: "بِسْمِ", kind: "word", surah: 2, ayah: 1 },
        { text: "الْحَمْدُ", kind: "word", surah: 2, ayah: 2 },
      ],
    });
  });

  it("places the opening surah header and basmala only in the free lines above its first ayah", () => {
    const lines = buildPageLines([
      { surah: 2, ayah: 1, words: [{ text: "الم", kind: "word", line: 3 }] },
      { surah: 2, ayah: 2, words: [{ text: "ذَٰلِكَ", kind: "word", line: 4 }] },
    ]);

    expect(lines[0]).toEqual({ kind: "surah-header", surah: 2 });
    expect(lines[1]).toEqual({ kind: "basmala" });
    expect(lines[2]).toEqual({
      kind: "ayah",
      words: [{ text: "الم", kind: "word", surah: 2, ayah: 1 }],
    });
    expect(lines[3]).toEqual({
      kind: "ayah",
      words: [{ text: "ذَٰلِكَ", kind: "word", surah: 2, ayah: 2 }],
    });
  });

  it("places the next surah header and basmala in the last two free lines after a short surah", () => {
    const lines = buildPageLines([
      { surah: 112, ayah: 4, words: [{ text: "أَحَدٌ", kind: "word", line: 13 }] },
    ]);

    expect(lines[12]).toEqual({
      kind: "ayah",
      words: [{ text: "أَحَدٌ", kind: "word", surah: 112, ayah: 4 }],
    });
    expect(lines[13]).toEqual({ kind: "surah-header", surah: 113 });
    expect(lines[14]).toEqual({ kind: "basmala" });
  });

  it("rejects an invalid word kind from an external source", () => {
    expect(() =>
      buildPageLines([
        { surah: 2, ayah: 1, words: [{ text: "bad", kind: "not-a-word" as "word", line: 1 }] },
      ]),
    ).toThrow(/invalid word type/);
  });

  it("rejects non-integer source line numbers", () => {
    expect(() =>
      buildPageLines([
        { surah: 2, ayah: 1, words: [{ text: "bad", kind: "word", line: 1.5 }] },
      ]),
    ).toThrow(/out of range/);
  });
});