import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";
import { resolveBackendUser } from "./supabase";

const authUser = {
  id: "auth-user-1",
  email: "student@example.test",
  created_at: "2026-01-01T00:00:00.000Z",
  user_metadata: { full_name: "نام نمایشی", role: "admin" },
} as AuthUser;

function makeClient(
  profileResult: { data: unknown; error: unknown },
  contactResult: { data: unknown; error: unknown } = { data: null, error: null },
) {
  const from = vi.fn((table: string) => {
    const result = table === "profiles" ? profileResult : contactResult;
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue(result),
        })),
      })),
    };
  });
  return { from } as unknown as SupabaseClient;
}

describe("resolveBackendUser", () => {
  it.each(["student", "teacher", "admin"] as const)("accepts the explicit %s profile role", async (role) => {
    const sb = makeClient({
      data: { id: authUser.id, full_name: "نام پروفایل", role, created_at: "2026-02-01T00:00:00.000Z" },
      error: null,
    }, { data: { phone: "09120000000" }, error: null });

    const user = await resolveBackendUser(sb, authUser);

    expect(user.role).toBe(role);
    expect(user.id).toBe(authUser.id);
    expect(user.fullName).toBe("نام پروفایل");
    expect(user.phone).toBe("09120000000");
    expect(sb.from).toHaveBeenNthCalledWith(1, "profiles");
    expect(sb.from).toHaveBeenNthCalledWith(2, "profile_contacts");
  });

  it("does not infer an admin role from auth metadata", async () => {
    const sb = makeClient({
      data: { id: authUser.id, full_name: null, role: "student", created_at: null },
      error: null,
    });

    await expect(resolveBackendUser(sb, authUser)).resolves.toMatchObject({ role: "student" });
  });

  it("rejects a profile query error instead of defaulting to student", async () => {
    const sb = makeClient({ data: null, error: new Error("permission denied") });

    await expect(resolveBackendUser(sb, authUser)).rejects.toThrow("Unable to verify the account profile.");
  });

  it("rejects a missing profile row", async () => {
    const sb = makeClient({ data: null, error: null });

    await expect(resolveBackendUser(sb, authUser)).rejects.toThrow("Unable to verify the account profile.");
  });

  it.each([null, "owner", "ADMIN", ""])("rejects an unknown role (%s)", async (role) => {
    const sb = makeClient({
      data: { id: authUser.id, full_name: "نام", role, created_at: null },
      error: null,
    });

    await expect(resolveBackendUser(sb, authUser)).rejects.toThrow("The account has an unsupported role.");
  });

  it("rejects a profile row belonging to a different auth user", async () => {
    const sb = makeClient({
      data: { id: "another-user", full_name: "نام", role: "student", created_at: null },
      error: null,
    });

    await expect(resolveBackendUser(sb, authUser)).rejects.toThrow("Unable to verify the account profile.");
  });

  it("rejects contact query errors but permits a missing optional contact row", async () => {
    const profileResult = {
      data: { id: authUser.id, full_name: "نام", role: "student", created_at: null },
      error: null,
    };
    const failingContactClient = makeClient(profileResult, { data: null, error: new Error("contact query failed") });
    await expect(resolveBackendUser(failingContactClient, authUser)).rejects.toThrow(
      "Unable to verify account contact details.",
    );

    const noContactClient = makeClient(profileResult, { data: null, error: null });
    await expect(resolveBackendUser(noContactClient, authUser)).resolves.toMatchObject({ phone: undefined });
  });

  it("uses a safe display-name fallback without weakening role validation", async () => {
    const sb = makeClient({
      data: { id: authUser.id, full_name: null, role: "teacher", created_at: null },
      error: null,
    });

    await expect(resolveBackendUser(sb, authUser)).resolves.toMatchObject({
      fullName: "نام نمایشی",
      role: "teacher",
    });
  });
});
