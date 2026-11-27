import { describe, expect, it } from "vitest";
import { demoSource, prototypeSource, SNAPSHOT_PAGES } from "@/lib/mushaf/sources";

describe("Mushaf prototype source after API snapshot removal", () => {
  it("does not import or depend on the removed Quran Foundation snapshot", () => {
    expect(SNAPSHOT_PAGES).toEqual([]);
    expect(prototypeSource).toBe(demoSource);
    expect(prototypeSource.demo).toBe(true);
  });

  it("shows only navigation frame and never claims to contain real ayat", async () => {
    for (const page of [1, 2, 3, 100, 604]) {
      const result = await prototypeSource.getPage(page);
      expect(result.page).toBe(page);
      expect(result.lines).toHaveLength(15);
      expect(result.provenance).toBeUndefined();
      expect(result.lines.some((line) => line.kind === "ayah")).toBe(false);
    }
  });
});
