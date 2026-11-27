import { describe, expect, it } from "vitest";
import { assertClassHasAvailableSeat, resolveActiveInstituteId } from "./student";

describe("assertClassHasAvailableSeat", () => {
  it("allows unlimited capacity", () => {
    expect(() => assertClassHasAvailableSeat(null)).not.toThrow();
  });
  it("allows a positive number of remaining seats", () => {
    expect(() => assertClassHasAvailableSeat(1)).not.toThrow();
  });
  it.each([0, -1])("rejects a full class with %s seats remaining", (remaining) => {
    expect(() => assertClassHasAvailableSeat(remaining)).toThrow("ظرفیت این کلاس تکمیل شده است.");
  });
  it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY])("fails closed for invalid capacity data %s", (remaining) => {
    expect(() => assertClassHasAvailableSeat(remaining)).toThrow("ظرفیت کلاس در حال حاضر قابل بررسی نیست؛ دوباره تلاش کنید.");
  });
});


describe("resolveActiveInstituteId", () => {
  const memberships = [
    { id: "inst-a", active: true },
    { id: "inst-b", active: true },
    { id: "inst-c", active: false },
  ];

  it("keeps the user's valid preferred active institute", () => {
    expect(resolveActiveInstituteId(memberships, "inst-b")).toBe("inst-b");
  });

  it("falls back to the first active institute when no preference exists", () => {
    expect(resolveActiveInstituteId(memberships, null)).toBe("inst-a");
  });

  it("falls back when the saved preference is inactive or no longer a membership", () => {
    expect(resolveActiveInstituteId(memberships, "inst-c")).toBe("inst-a");
    expect(resolveActiveInstituteId(memberships, "missing")).toBe("inst-a");
  });

  it("returns an empty selection when no active institute exists", () => {
    expect(resolveActiveInstituteId([{ id: "inst-c", active: false }], "inst-c")).toBe("");
  });
});
