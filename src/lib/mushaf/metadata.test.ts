import {
  TOTAL_PAGES,
  ayahCount,
  clampPage,
  isValidVerse,
  juzOfPage,
  pageOfVerse,
  parseVerseQuery,
  surahName,
  surahStartPage,
} from "./metadata";

describe("Qur'an mushaf metadata", () => {
  it("contains the expected Madani mushaf dimensions", () => {
    expect(TOTAL_PAGES).toBe(604);
    expect(ayahCount(1)).toBe(7);
    expect(ayahCount(114)).toBe(6);
  });

  it("maps the opening pages and final verse to valid pages", () => {
    expect(pageOfVerse(1, 1)).toBe(1);
    expect(pageOfVerse(2, 1)).toBe(2);
    expect(pageOfVerse(114, 6)).toBe(604);
    expect(surahStartPage(2)).toBe(2);
  });

  it("validates verse references without accepting invalid numbers", () => {
    expect(isValidVerse(2, 255)).toBe(true);
    expect(isValidVerse(0, 1)).toBe(false);
    expect(isValidVerse(114, 7)).toBe(false);
    expect(isValidVerse(115, 1)).toBe(false);
  });

  it("clamps page navigation to the 604-page range", () => {
    expect(clampPage(0)).toBe(1);
    expect(clampPage(605)).toBe(604);
    expect(clampPage(42.4)).toBe(42);
  });

  it("parses Arabic and Persian verse references", () => {
    expect(parseVerseQuery("2:255")).toMatchObject({ kind: "verse", surah: 2, ayah: 255 });
    expect(parseVerseQuery("۲:۲۵۵")).toMatchObject({ kind: "verse", surah: 2, ayah: 255 });
  });

  it("parses page numbers and rejects out-of-range pages", () => {
    expect(parseVerseQuery("صفحه ۴۲")).toEqual({ kind: "page", page: 42 });
    expect(parseVerseQuery("605")).toMatchObject({ kind: "error" });
  });

  it("finds surahs by name and maps the first verse", () => {
    const result = parseVerseQuery("بقره");
    expect(result).toMatchObject({ kind: "verse", surah: 2, ayah: 1, page: 2 });
    expect(surahName(2)).toBe("البقرة");
  });

  it("returns an error for an invalid verse reference", () => {
    expect(parseVerseQuery("114:7")).toMatchObject({ kind: "error" });
  });

  it("assigns the first page to the first juz", () => {
    expect(juzOfPage(1)).toBe(1);
  });
});
