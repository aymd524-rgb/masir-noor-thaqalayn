import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { resolveBackendUser } from "@/lib/backend/supabase";

describe("resolveBackendUser", () => {
  it("selects only existing profile columns and reads phone from profile_contacts", async () => {
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "user-1",
          full_name: "استاد نمونه",
          role: "teacher",
          created_at: "2026-11-01T10:00:00.000Z",
        },
        error: null,
      }),
    };
    const contactQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { phone: "0000000000" },
        error: null,
      }),
    };
    const sb = {
      from: vi.fn()
        .mockReturnValueOnce(profileQuery)
        .mockReturnValueOnce(contactQuery),
    } as unknown as SupabaseClient;
    const authUser = {
      id: "user-1",
      email: "teacher@example.test",
      created_at: "2026-11-01T10:00:00.000Z",
      user_metadata: {},
    } as AuthUser;

    const user = await resolveBackendUser(sb, authUser);

    expect(profileQuery.select).toHaveBeenCalledWith("id,full_name,role,created_at");
    expect(contactQuery.select).toHaveBeenCalledWith("phone");
    expect(user).toMatchObject({
      id: "user-1",
      fullName: "استاد نمونه",
      role: "teacher",
      phone: "0000000000",
    });
  });
});
