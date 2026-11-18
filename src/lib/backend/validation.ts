const attendanceStatuses = new Set(["present", "absent", "late", "excused"]);

/** Reject invalid dates before they reach the attendance table. */
export function validateAttendanceInput(input: { enrollmentId: string; sessionDate: string; status: string }): void {
  if (!input.enrollmentId.trim()) throw new Error("شناسه ثبت‌نام معتبر نیست.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.sessionDate)) throw new Error("تاریخ جلسه معتبر نیست.");
  const [year, month, day] = input.sessionDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("تاریخ جلسه معتبر نیست.");
  }
  if (!attendanceStatuses.has(input.status)) throw new Error("وضعیت حضور و غیاب معتبر نیست.");
}

export function validateGradeInput(input: { enrollmentId: string; title: string; score: number }): void {
  if (!input.enrollmentId.trim()) throw new Error("شناسه ثبت‌نام معتبر نیست.");
  if (!input.title.trim()) throw new Error("عنوان ارزشیابی الزامی است.");
  if (!Number.isFinite(input.score) || input.score < 0) throw new Error("نمره باید عددی و نامنفی باشد.");
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
