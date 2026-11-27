import { demoSource, prototypeSource, SNAPSHOT_PAGES } from "./sources";

describe("Mushaf page sources", () => {
  it("does not bundle Quran Foundation verse text in the public repository", () => {
    expect(SNAPSHOT_PAGES).toEqual([]);
    expect(prototypeSource).toBe(demoSource);
    expect(prototypeSource.demo).toBe(true);
  });

  it("keeps a clear 15-line placeholder frame on every page until a permitted source is enabled", async () => {
    for (const page of [1, 2, 3, 100, 604]) {
      const data = await prototypeSource.getPage(page);
      expect(data.page).toBe(page);
      expect(data.lines).toHaveLength(15);
      expect(data.provenance).toBeUndefined();
      expect(data.lines.every((line) =>
        line.kind === "placeholder" || line.kind === "surah-header" || line.kind === "basmala"
      )).toBe(true);
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
