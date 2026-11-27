import { describe, expect, it } from "vitest";
import { normalizePageDigits, sanitizePageInput } from "./page-input";

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
