import { describe, expect, it } from "vitest";
import { assertClassHasAvailableSeat } from "./student";

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
