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
 * Build the app user from the existing profiles row. The profile role is
 * accepted only when it is an explicit, known database value. Missing rows,
 * query failures and unknown roles fail closed instead of becoming students.
 */
export async function resolveBackendUser(sb: SupabaseClient, authUser: AuthUser): Promise<User> {
  const { data: profile, error: profileError } = await sb
    .from("profiles")
    .select("id,full_name,role,created_at")
    .eq("id", authUser.id)
    .maybeSingle<ProfileRow>();

  if (profileError || !profile || profile.id !== authUser.id) {
    throw new Error("Unable to verify the account profile.");
  }

  const role = profile.role;
  if (role !== "student" && role !== "teacher" && role !== "admin") {
    throw new Error("The account has an unsupported role.");
  }

  const { data: contact, error: contactError } = await sb
    .from("profile_contacts")
    .select("phone")
    .eq("user_id", authUser.id)
    .maybeSingle<{ phone: string | null }>();

  if (contactError) {
    throw new Error("Unable to verify account contact details.");
  }

  const metadataName =
    typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : undefined;

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    fullName: profile.full_name || metadataName || authUser.email || "کاربر",
    role: role as Role,
    phone: contact?.phone ?? undefined,
    // The live profile contract inspected so far has no verified active flag.
    // Do not infer disabled-account state from client metadata.
    active: true,
    joinedAt: profile.created_at ?? authUser.created_at,
  };
}
