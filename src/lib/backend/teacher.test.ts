import { describe, expect, it } from "vitest";
import { loadTeacherWorkspace } from "./teacher";

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
