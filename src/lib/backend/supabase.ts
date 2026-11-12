import { createClient, type SupabaseClient, type User as AuthUser } from "@supabase/supabase-js";
import { backendConfig, isBackendConfigured } from "./config";
import type { Role, User } from "../domain/types";

let client: SupabaseClient | null = null;

/** Browser-only client using the publishable key. Returns null in demo mode. */
export function getSupabase(): SupabaseClient | null {
  if (!isBackendConfigured || typeof window === "undefined") return null;
  if (!client) {
    client = createClient(backendConfig.url!, backendConfig.publishableKey!, {
      auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage },
    });
  }
  return client;
}

type ProfileRow = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  role?: string | null;
  phone?: string | null;
  created_at?: string | null;
};

/**
 * Build the app user from the existing `profiles` row. Admin status is decided
 * by the server-side `is_admin()` function — never by client data — so a user
 * cannot promote themselves by editing their own profile.
 */
export async function resolveBackendUser(sb: SupabaseClient, authUser: AuthUser): Promise<User> {
  const [{ data: profile }, { data: isAdmin }] = await Promise.all([
    sb.from("profiles").select("*").eq("id", authUser.id).maybeSingle<ProfileRow>(),
    sb.rpc("is_admin"),
  ]);

  let role: Role = "student";
  if (isAdmin === true) role = "admin";
  else if (profile?.role === "teacher") role = "teacher";

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    fullName:
      profile?.full_name ||
      profile?.name ||
      (authUser.user_metadata?.full_name as string | undefined) ||
      authUser.email ||
      "کاربر",
    role,
    phone: profile?.phone ?? undefined,
    active: true,
    joinedAt: profile?.created_at ?? authUser.created_at,
  };
}