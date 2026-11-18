import { describe, expect, it } from "vitest";
import { validateAttendanceInput, validateClassCapacityInput, validateGradeInput } from "./validation";

describe("validateAttendanceInput", () => {
  it("accepts a valid attendance record", () => {
    expect(() => validateAttendanceInput({ enrollmentId: "en-1", sessionDate: "2026-11-12", status: "present" })).not.toThrow();
  });
  it.each(["2026-02-30", "12-11-2026", "2026-1-02", ""])("rejects invalid date %s", (sessionDate) => {
    expect(() => validateAttendanceInput({ enrollmentId: "en-1", sessionDate, status: "present" })).toThrow("تاریخ جلسه معتبر نیست.");
  });
  it("rejects unknown attendance states", () => {
    expect(() => validateAttendanceInput({ enrollmentId: "en-1", sessionDate: "2026-11-12", status: "unknown" })).toThrow();
  });
  it("rejects a missing enrollment id", () => {
    expect(() => validateAttendanceInput({ enrollmentId: " ", sessionDate: "2026-11-12", status: "present" })).toThrow();
  });
});

describe("validateGradeInput", () => {
  it("accepts a non-negative finite score and title", () => {
    expect(() => validateGradeInput({ enrollmentId: "en-1", title: "آزمون حفظ", score: 18.5 })).not.toThrow();
  });
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid score %s", (score) => {
    expect(() => validateGradeInput({ enrollmentId: "en-1", title: "آزمون", score })).toThrow();
  });
  it("rejects blank titles and enrollment ids", () => {
    expect(() => validateGradeInput({ enrollmentId: "", title: "آزمون", score: 10 })).toThrow();
    expect(() => validateGradeInput({ enrollmentId: "en-1", title: " ", score: 10 })).toThrow();
  });
});

describe("validateClassCapacityInput", () => {
  it("accepts a capacity that covers confirmed enrollments", () => {
    expect(() => validateClassCapacityInput(20, 12)).not.toThrow();
  });
  it("accepts capacity equal to confirmed enrollments", () => {
    expect(() => validateClassCapacityInput(12, 12)).not.toThrow();
  });
  it.each([0, -1, 501, 2.5, Number.NaN])("rejects invalid capacity %s", (capacity) => {
    expect(() => validateClassCapacityInput(capacity, 0)).toThrow();
  });
  it("rejects a capacity below confirmed enrollments", () => {
    expect(() => validateClassCapacityInput(9, 10)).toThrow("ظرفیت جدید نمی‌تواند کمتر از تعداد ثبت‌نام‌های قطعی باشد.");
  });
  it("rejects an invalid enrollment count", () => {
    expect(() => validateClassCapacityInput(20, -1)).toThrow("تعداد ثبت‌نام‌های قطعی معتبر نیست.");
  });
});
