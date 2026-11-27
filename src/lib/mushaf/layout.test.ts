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
});
