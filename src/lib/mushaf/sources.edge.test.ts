import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../backend/config", () => ({
  backendConfig: {
    url: "https://example-project.supabase.co",
    publishableKey: "public-test-key",
  },
  isBackendConfigured: true,
}));

import { quranFoundationEdgeSource } from "./sources";

describe("Quran Foundation Mushaf Edge Function adapter", () => {
  afterEach(() => vi.restoreAllMocks());

  it("requests the selected page from the Supabase proxy with the publishable key", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          page: 42,
          verses: [
            {
              verse_key: "2:255",
              words: [
                { char_type_name: "word", text_uthmani: "اللَّهُ", line_number: 1 },
                { char_type_name: "end", text_uthmani: "۞", line_number: 1 },
              ],
            },
          ],
          basmala: ["بِسْمِ", "اللَّهِ"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const data = await quranFoundationEdgeSource().getPage(42);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example-project.supabase.co/functions/v1/mushaf-page?page=42",
      expect.objectContaining({
        headers: { apikey: "public-test-key" },
      }),
    );
    expect(data.page).toBe(42);
    expect(data.provenance?.label).toContain("Quran Foundation");
    expect(data.lines.some((line) => line.kind === "ayah")).toBe(true);
  });

  it("rejects a proxy response for a different page", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ page: 41, verses: [], basmala: [] }), { status: 200 }),
    );

    await expect(quranFoundationEdgeSource().getPage(42)).rejects.toThrow(
      "دریافت متن این صفحه از سرویس مصحف ناموفق بود.",
    );
  });
});
