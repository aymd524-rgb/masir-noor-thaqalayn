import { describe, expect, it } from "vitest";
import { summarizeQuizResults } from "./results-summary";

describe("summarizeQuizResults", () => {
  it("calculates count, rounded average, and best percentage", () => {
    expect(summarizeQuizResults([
      { score: 2, total: 4 },
      { score: 3, total: 4 },
      { score: 5, total: 5 },
    ])).toEqual({ count: 3, average: 75, best: 100 });
  });

  it("returns null statistics for an empty set", () => {
    expect(summarizeQuizResults([])).toEqual({ count: 0, average: null, best: null });
  });

  it("does not divide by zero for malformed legacy totals", () => {
    expect(summarizeQuizResults([{ score: 0, total: 0 }])).toEqual({ count: 1, average: 0, best: 0 });
  });
});
