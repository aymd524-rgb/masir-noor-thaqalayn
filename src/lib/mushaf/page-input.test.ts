import { describe, expect, it } from "vitest";
import { normalizePageDigits, parsePageInput, sanitizePageInput } from "./page-input";

describe("Mushaf page input digits", () => {
  it("normalizes Persian and Arabic-Indic numerals", () => {
    expect(normalizePageDigits("۱۲۳")).toBe("123");
    expect(normalizePageDigits("١٢٣")).toBe("123");
    expect(normalizePageDigits("۱۲٣")).toBe("123");
  });

  it("removes non-numeric characters after normalization", () => {
    expect(sanitizePageInput("صفحه ۱۲۳")).toBe("123");
    expect(sanitizePageInput("٤۰٤")).toBe("404");
  });
});

describe("Mushaf page number bounds", () => {
  it("accepts page numbers within 1–604", () => {
    expect(parsePageInput("۱")).toBe(1);
    expect(parsePageInput("٦٠٤")).toBe(604);
  });

  it("rejects empty, zero, and out-of-range values", () => {
    expect(parsePageInput("")).toBeNull();
    expect(parsePageInput("۰")).toBeNull();
    expect(parsePageInput("۶۰۵")).toBeNull();
  });

  it("rejects mixed text and decimal page numbers", () => {
    expect(parsePageInput("صفحه ۱۲")).toBeNull();
    expect(parsePageInput("12.5")).toBeNull();
    expect(parsePageInput("1e2")).toBeNull();
  });

  it("accepts surrounding whitespace and honors a supplied page limit", () => {
    expect(parsePageInput(" ۱۲ ")).toBe(12);
    expect(parsePageInput("۱۲", 10)).toBeNull();
    expect(parsePageInput("۱۰", 10)).toBe(10);
  });
});
