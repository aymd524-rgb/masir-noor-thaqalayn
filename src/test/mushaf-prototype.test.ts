import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { QPC_HAFS_SNAPSHOT } from "@/lib/mushaf/data/qpc-hafs-snapshot";
import { pageRange } from "@/lib/mushaf/metadata";
import { prototypeSource } from "@/lib/mushaf/sources";

const verses = (p: number) => QPC_HAFS_SNAPSHOT.pages[String(p)] ?? [];

/** Letters only: drops harakat, Quranic annotation marks, tatweel and hamza-carrier differences. */
const skeleton = (t: string) =>
  t
    .normalize("NFC")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/\s+/g, " ")
    .trim();
const waqfMarks = (t: string) => t.match(/[\u06D6-\u06DC]/g) ?? [];

const tanzil = new Map(
  readFileSync(path.resolve(__dirname, "fixtures/tanzil-uthmani-pages-1-2.txt"), "utf8")
    .split("\n")
    .filter((l) => /^\d+\|\d+\|/.test(l))
    .map((l) => {
      const [s, a, text] = l.split("|");
      return [`${s}:${a}`, text ?? ""] as const;
    }),
);

describe("prototype pages 1–2 (KFGQPC Hafs snapshot)", () => {
  it("page 1 holds exactly al-Fatiha 1–7 and page 2 holds al-Baqarah 1–5", () => {
    expect(verses(1).map((v) => `${v.surah}:${v.ayah}`)).toEqual(["1:1", "1:2", "1:3", "1:4", "1:5", "1:6", "1:7"]);
    expect(verses(2).map((v) => `${v.surah}:${v.ayah}`)).toEqual(["2:1", "2:2", "2:3", "2:4", "2:5"]);
  });

  it("page boundaries agree with the independent Tanzil page index", () => {
    for (const p of [1, 2]) {
      const v = verses(p);
      const { start, end } = pageRange(p);
      expect({ surah: v[0]?.surah, ayah: v[0]?.ayah }).toEqual(start);
      expect({ surah: v.at(-1)?.surah, ayah: v.at(-1)?.ayah }).toEqual(end);
    }
  });

  it("every ayah ends with its own number marker, and the page ends on an ayah end", () => {
    for (const p of [1, 2]) {
      for (const v of verses(p)) {
        const last = v.words.at(-1);
        expect(last?.kind).toBe("end");
        expect(last?.text).toBe(String(v.ayah).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]!));
      }
    }
  });

  it("uses the source line numbers: Fatiha on lines 2–8, Baqarah text on lines 3–8", () => {
    const lines = (p: number) => [...new Set(verses(p).flatMap((v) => v.words.map((w) => w.line)))].sort((a, b) => a - b);
    expect(lines(1)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(lines(2)).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it("places the surah header (and basmala on page 2) above the text", async () => {
    const p1 = await prototypeSource.getPage(1);
    const p2 = await prototypeSource.getPage(2);
    expect(p1.lines.slice(0, 2).map((l) => l.kind)).toEqual(["surah-header", "ayah"]);
    expect(p2.lines.slice(0, 3).map((l) => l.kind)).toEqual(["surah-header", "basmala", "ayah"]);
    expect(p1.provenance).toBeDefined();
    // Page 1 holds al-Fatiha only: no al-Baqarah header or basmala below it.
    expect(p1.lines.filter((l) => l.kind === "surah-header")).toHaveLength(1);
    expect(p1.lines.some((l) => l.kind === "basmala")).toBe(false);
  });

  it("pages without a verified snapshot stay text-free demo pages", async () => {
    const p3 = await prototypeSource.getPage(3);
    expect(p3.provenance).toBeUndefined();
    expect(p3.lines.some((l) => l.kind === "ayah")).toBe(false);
  });

  it("letter skeleton of every ayah matches the Tanzil Uthmani text", () => {
    for (const p of [1, 2]) {
      for (const v of verses(p)) {
        const qpc = v.words.filter((w) => w.kind === "word").map((w) => w.text).join(" ");
        let ref = tanzil.get(`${v.surah}:${v.ayah}`) ?? "";
        // Tanzil prefixes the basmala to the first ayah of each surah except 1 and 9.
        if (v.ayah === 1 && v.surah !== 1 && v.surah !== 9) ref = ref.split(" ").slice(4).join(" ");
        expect(skeleton(qpc), `${v.surah}:${v.ayah}`).toBe(skeleton(ref));
      }
    }
  });

  it("pause (waqf) marks match Tanzil in order for every ayah", () => {
    for (const p of [1, 2]) {
      for (const v of verses(p)) {
        const qpc = v.words.map((w) => w.text).join(" ");
        expect(waqfMarks(qpc), `${v.surah}:${v.ayah}`).toEqual(waqfMarks(tanzil.get(`${v.surah}:${v.ayah}`) ?? ""));
      }
    }
  });

  it("the basmala on page 2 matches Tanzil 1:1", () => {
    expect(skeleton(QPC_HAFS_SNAPSHOT.basmala.join(" "))).toBe(skeleton(tanzil.get("1:1") ?? ""));
  });
});