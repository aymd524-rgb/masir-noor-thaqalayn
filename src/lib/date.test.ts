import { toLocalDateInputValue } from "./date";

describe("toLocalDateInputValue", () => {
  it("formats the local calendar date with zero padding", () => {
    const date = new Date(2026, 0, 5, 23, 30);
    expect(toLocalDateInputValue(date)).toBe("2026-01-05");
  });

  it("does not convert the date through UTC", () => {
    const date = new Date(2026, 10, 12, 0, 15);
    expect(toLocalDateInputValue(date)).toBe("2026-11-12");
  });
});
