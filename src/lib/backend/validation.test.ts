import { describe, expect, it } from "vitest";
import { isValidDateOnly, validateAttendanceInput, validateClassCapacityInput, validateClassScheduleInput, validateGradeInput } from "./validation";

describe("isValidDateOnly", () => {
  it("accepts valid leap days and ordinary dates", () => {
    expect(isValidDateOnly("2024-02-29")).toBe(true);
    expect(isValidDateOnly("2026-11-18")).toBe(true);
  });
  it.each(["2026-02-29", "2026-04-31", "2026-13-01", "2026-1-01", "not-a-date", ""])(
    "rejects invalid calendar date %s", (value) => {
      expect(isValidDateOnly(value)).toBe(false);
    },
  );
});

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
  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects a non-integer or non-finite enrollment count %s", (count) => {
    expect(() => validateClassCapacityInput(20, count)).toThrow("تعداد ثبت‌نام‌های قطعی معتبر نیست.");
  });
  it("rejects a negative enrollment count", () => {
    expect(() => validateClassCapacityInput(20, -1)).toThrow("تعداد ثبت‌نام‌های قطعی معتبر نیست.");
  });
  it.each([Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])("rejects a non-finite capacity %s", (capacity) => {
    expect(() => validateClassCapacityInput(capacity, 0)).toThrow("ظرفیت کلاس باید عددی صحیح بین ۱ تا ۵۰۰ باشد.");
  });
});

describe("validateClassScheduleInput", () => {
  it("accepts optional or ordered class schedule values", () => {
    expect(() => validateClassScheduleInput("", "")).not.toThrow();
    expect(() => validateClassScheduleInput("2026-11-18T09:00", "")).not.toThrow();
    expect(() => validateClassScheduleInput("", "2026-11-18T10:00")).not.toThrow();
    expect(() => validateClassScheduleInput("2026-11-18T09:00", "2026-11-18T10:00")).not.toThrow();
  });
  it("rejects invalid start or end values", () => {
    expect(() => validateClassScheduleInput("not-a-date", "")).toThrow("زمان شروع کلاس معتبر نیست.");
    expect(() => validateClassScheduleInput("", "not-a-date")).toThrow("زمان پایان کلاس معتبر نیست.");
  });
  it("rejects an end that is equal to or earlier than the start", () => {
    expect(() => validateClassScheduleInput("2026-11-18T10:00", "2026-11-18T10:00")).toThrow("زمان پایان باید بعد از زمان شروع باشد.");
    expect(() => validateClassScheduleInput("2026-11-18T11:00", "2026-11-18T10:00")).toThrow("زمان پایان باید بعد از زمان شروع باشد.");
  });
});
