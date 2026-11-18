const attendanceStatuses = new Set(["present", "absent", "late", "excused"]);

/** Validate a real calendar date in YYYY-MM-DD format (not just its shape). */
export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  // setUTCFullYear avoids Date.UTC's special handling of years 0–99.
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Reject invalid dates before they reach the attendance table. */
export function validateAttendanceInput(input: { enrollmentId: string; sessionDate: string; status: string }): void {
  if (!input.enrollmentId.trim()) throw new Error("شناسه ثبت‌نام معتبر نیست.");
  if (!isValidDateOnly(input.sessionDate)) throw new Error("تاریخ جلسه معتبر نیست.");
  if (!attendanceStatuses.has(input.status)) throw new Error("وضعیت حضور و غیاب معتبر نیست.");
}

export function validateGradeInput(input: { enrollmentId: string; title: string; score: number }): void {
  if (!input.enrollmentId.trim()) throw new Error("شناسه ثبت‌نام معتبر نیست.");
  if (!input.title.trim() || input.title.trim().length > 120) throw new Error("عنوان ارزشیابی باید بین ۱ تا ۱۲۰ نویسه باشد.");
  if (!Number.isFinite(input.score) || input.score < 0 || Math.abs(input.score * 4 - Math.round(input.score * 4)) > 1e-8) {
    throw new Error("نمره باید عددی نامنفی و با گام‌های ۰٫۲۵ باشد.");
  }
}

/** Validate class capacity against the number of already confirmed enrollments. */
export function validateClassCapacityInput(capacity: number, confirmedEnrollmentCount: number): void {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
    throw new Error("ظرفیت کلاس باید عددی صحیح بین ۱ تا ۵۰۰ باشد.");
  }
  if (!Number.isInteger(confirmedEnrollmentCount) || confirmedEnrollmentCount < 0) {
    throw new Error("تعداد ثبت‌نام‌های قطعی معتبر نیست.");
  }
  if (capacity < confirmedEnrollmentCount) {
    throw new Error("ظرفیت جدید نمی‌تواند کمتر از تعداد ثبت‌نام‌های قطعی باشد.");
  }
}

/** Validate optional class start/end values before converting them to ISO timestamps. */
export function validateClassScheduleInput(startsAt: string, endsAt: string): void {
  const startDate = startsAt ? startsAt.slice(0, 10) : "";
  const endDate = endsAt ? endsAt.slice(0, 10) : "";
  const start = startsAt ? new Date(startsAt).getTime() : null;
  const end = endsAt ? new Date(endsAt).getTime() : null;
  if (startsAt && (!isValidDateOnly(startDate) || start === null || !Number.isFinite(start))) {
    throw new Error("زمان شروع کلاس معتبر نیست.");
  }
  if (endsAt && (!isValidDateOnly(endDate) || end === null || !Number.isFinite(end))) {
    throw new Error("زمان پایان کلاس معتبر نیست.");
  }
  if (start !== null && end !== null && end <= start) {
    throw new Error("زمان پایان باید بعد از زمان شروع باشد.");
  }
}
