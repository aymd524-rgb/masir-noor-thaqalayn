import { describe, expect, it } from "vitest";
import { enrollmentRequestErrorMessage } from "./student";

describe("enrollmentRequestErrorMessage", () => {
  it("returns a clear message for unique-index conflicts", () => {
    expect(enrollmentRequestErrorMessage({ code: "23505" })).toContain("قبلاً درخواست ثبت شده");
  });

  it("preserves a database error message for other failures", () => {
    expect(enrollmentRequestErrorMessage({ code: "42501", message: "permission denied" })).toBe("permission denied");
  });

  it("provides a fallback when the database supplies no message", () => {
    expect(enrollmentRequestErrorMessage({ code: "XX000" })).toBe("ثبت درخواست عضویت ناموفق بود.");
  });
});
