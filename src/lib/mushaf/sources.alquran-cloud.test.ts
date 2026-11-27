import { afterEach, describe, expect, it, vi } from "vitest";
import { alQuranCloudSource } from "./sources";

describe("AlQuran Cloud complete-page source", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads page text in Uthmani script and preserves each verse text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          status: "OK",
          data: {
            number: 604,
            ayahs: [
              {
                number: 6236,
                text: "مِنَ الْجِنَّةِ وَالنَّاسِ",
                numberInSurah: 6,
                page: 604,
                juz: 30,
                surah: { number: 114, name: "النَّاس", numberOfAyahs: 6 },
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const data = await alQuranCloudSource().getPage(604);

    expect(data.page).toBe(604);
    expect(data.layout).toBe("verse-flow");
    expect(data.provenance?.attribution).toContain("AlQuran Cloud");
    const ayahLine = data.lines.find((line) => line.kind === "ayah");
    expect(ayahLine?.kind).toBe("ayah");
    if (ayahLine?.kind === "ayah") {
      expect(ayahLine.words.filter((word) => word.kind === "word").map((word) => word.text).join(" "))
        .toBe("مِنَ الْجِنَّةِ وَالنَّاسِ");
    }
  });

  it("inserts the source basmala and surah header when a page starts a surah", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: 200,
            status: "OK",
            data: {
              number: 2,
              ayahs: [
                {
                  number: 8,
                  text: "الٓمٓ",
                  numberInSurah: 1,
                  page: 2,
                  juz: 1,
                  surah: { number: 2, name: "البقرة", numberOfAyahs: 286 },
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 200, data: { text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const data = await alQuranCloudSource().getPage(2);

    expect(data.lines[0]).toEqual({ kind: "surah-header", surah: 2 });
    expect(data.lines[1]).toEqual({ kind: "basmala" });
    expect(data.basmala).toEqual(["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ"]);
  });
});
