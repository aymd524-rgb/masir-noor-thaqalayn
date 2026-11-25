import { describe, expect, it } from "vitest";
import { loadTeacherWorkspace, saveTeacherAttendance, saveTeacherGrade, saveTeacherHifzAssignment, saveTeacherHifzRecord } from "./teacher";

describe("loadTeacherWorkspace identity guard", () => {
  it("rejects an unauthenticated session before querying workspace data", async () => {
    const sb = {
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    } as any;

    await expect(loadTeacherWorkspace(sb, "student-id", false))
      .rejects.toThrow("برای مشاهدهٔ پنل استاد باید با حساب خود وارد شوید.");
  });

  it("rejects a requested teacher identity that differs from the session", async () => {
    const sb = {
      auth: { getUser: async () => ({ data: { user: { id: "signed-in-id" } }, error: null }) },
    } as any;

    await expect(loadTeacherWorkspace(sb, "another-user-id", true))
      .rejects.toThrow("برای مشاهدهٔ پنل استاد باید با حساب خود وارد شوید.");
  });
});


describe("teacher write session guard", () => {
  it("rejects attendance, grades, and hifz records when signed out", async () => {
    const sb = { auth: { getUser: async () => ({ data: { user: null }, error: null }) } } as any;
    await expect(saveTeacherAttendance(sb, { enrollmentId: "e1", sessionDate: "2026-11-25", status: "present" }))
      .rejects.toThrow("برای ثبت اطلاعات باید وارد حساب خود شوید.");
    await expect(saveTeacherGrade(sb, { enrollmentId: "e1", title: "آزمون", score: 18 }))
      .rejects.toThrow("برای ثبت اطلاعات باید وارد حساب خود شوید.");
    await expect(saveTeacherHifzRecord(sb, { enrollmentId: "e1", surahNumber: 1, ayahStart: 1, ayahEnd: 1, recordType: "memorization", assessment: "good", sessionDate: "2026-11-25", notes: "" }))
      .rejects.toThrow("برای ثبت اطلاعات باید وارد حساب خود شوید.");
  });

  it("does not allow assigning a hifz task under another user's identity", async () => {
    const sb = { auth: { getUser: async () => ({ data: { user: { id: "current-user" } }, error: null }) } } as any;
    await expect(saveTeacherHifzAssignment(sb, { enrollmentId: "e1", surahNumber: 1, ayahStart: 1, ayahEnd: 1, assignmentType: "memorization", dueDate: "2026-11-30", instructions: "", assignedBy: "other-user" }))
      .rejects.toThrow("فقط استاد واردشده می‌تواند برنامهٔ حفظ را به نام خود ثبت کند.");
  });
});
