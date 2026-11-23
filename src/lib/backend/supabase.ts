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
  role?: string | null;
  created_at?: string | null;
};

/**
 * Build the app user from the authenticated user's own profile and contact rows.
 * RLS restricts these reads to auth.uid(); database-side role protections remain
 * authoritative for every privileged operation.
 */
export async function resolveBackendUser(sb: SupabaseClient, authUser: AuthUser): Promise<User> {
  const { data: profile } = await sb
    .from("profiles")
    .select("id,full_name,role,created_at")
    .eq("id", authUser.id)
    .maybeSingle<ProfileRow>();

  const { data: contact } = await sb
    .from("profile_contacts")
    .select("phone")
    .eq("user_id", authUser.id)
    .maybeSingle<{ phone: string | null }>();

  const role: Role =
    profile?.role === "admin" || profile?.role === "teacher" ? profile.role : "student";

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    fullName:
      profile?.full_name ||
      (authUser.user_metadata?.full_name as string | undefined) ||
      authUser.email ||
      "کاربر",
    role,
    phone: contact?.phone ?? undefined,
    active: true,
    joinedAt: profile?.created_at ?? authUser.created_at,
  };
}
