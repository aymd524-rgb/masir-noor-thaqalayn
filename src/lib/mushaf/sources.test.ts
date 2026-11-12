import { demoSource, prototypeSource, SNAPSHOT_PAGES } from "./sources";

describe("Mushaf page sources", () => {
  it("clearly limits the bundled prototype text to pages 1 and 2", () => {
    expect(SNAPSHOT_PAGES.sort((a, b) => a - b)).toEqual([1, 2]);
    expect(prototypeSource.demo).toBe(true);
  });

  it("provides source-attributed Arabic text on the two prototype pages", async () => {
    for (const page of [1, 2]) {
      const data = await prototypeSource.getPage(page);
      expect(data.page).toBe(page);
      expect(data.lines).toHaveLength(15);
      expect(data.provenance?.attribution).toContain("Quran.com API v4");
      expect(data.lines.some((line) => line.kind === "ayah")).toBe(true);
    }
  });

  it("does not invent verse text for pages without bundled source data", async () => {
    for (const page of [3, 100, 604]) {
      const data = await prototypeSource.getPage(page);
      expect(data.page).toBe(page);
      expect(data.provenance).toBeUndefined();
      expect(data.lines).toHaveLength(15);
      expect(data.lines.every((line) => line.kind === "placeholder" || line.kind === "surah-header" || line.kind === "basmala")).toBe(true);
    }
  });

  it("keeps the generic demo source free of verse text", async () => {
    const data = await demoSource.getPage(42);
    expect(data.page).toBe(42);
    expect(data.provenance).toBeUndefined();
    expect(data.lines).toHaveLength(15);
    expect(data.lines.some((line) => line.kind === "ayah")).toBe(false);
  });
});
