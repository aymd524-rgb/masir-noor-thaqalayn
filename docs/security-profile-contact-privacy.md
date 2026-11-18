# Profile contact privacy review

Status: findings and implementation plan only. No live database change is included.

## Confirmed findings

- `public.profiles` contains `id`, `full_name`, `role`, `created_at`, and `phone`.
- Row-level security is enabled on `profiles`.
- The `profiles_select_related_class_members` SELECT policy permits a teacher to read profile rows for enrolled students and the students' teacher. PostgreSQL RLS filters rows, not individual columns; therefore the policy does not hide `phone` from a caller who can read one of those rows.
- `profiles_self_update` permits a user to update their own profile row. Two existing triggers protect role changes, but they do not provide column-level privacy for phone.
- The admin panel currently reads `phone` from `profiles` for its user-management screen. Keep the admin workflow working when the field is moved.

## Required design

1. Keep only non-contact, class-directory fields in the teacher-readable profile surface: `id`, `full_name`, and the minimum role metadata actually needed by the UI.
2. Move phone numbers to a private table such as `public.profile_contacts`, keyed by `user_id` referencing `auth.users(id)` or `profiles(id)`. Enable RLS.
3. Permit authenticated users to SELECT and UPDATE only their own contact row. Permit administrator access only through an explicitly checked admin policy or a narrowly scoped admin RPC. Do not grant teachers access to this table.
4. If the admin panel needs a cross-user phone directory, provide a paginated `SECURITY DEFINER` RPC with an empty `search_path`, explicit `private.is_admin()` check, a fixed return shape, and execute permission only for `authenticated`. Do not expose a general-purpose contact lookup RPC.
5. Update profile signup, account editing, and admin user-management code to use the new contact store/RPC. Preserve existing role-escalation protections.
6. Backfill existing phone values before removing the old column. Verify counts and representative ownership without printing phone values into logs. Only drop `profiles.phone` after every application read/write has migrated.

## Required authorization tests

- Anonymous user cannot read any contact row.
- Student A cannot SELECT, UPDATE, or infer Student B's phone.
- A teacher cannot read phone numbers of their students or other class members.
- A student can read/update only their own phone.
- An administrator can list contacts only through the admin-only paginated interface.
- Non-admin calls to the admin RPC fail, including direct RPC invocation.
- Existing teacher class roster, student account edit, and admin user-management screens still work.
- Role escalation remains blocked for ordinary users.

## Rollout constraints

- Database schema and migration changes must be made by Lovable for this project; do not hand-edit `supabase/migrations/` or apply SQL directly.
- At the time of this review, Lovable reports the workspace is out of credits. Until that is resolved, this document is a plan, not a deployed security fix.
- Recheck policies, grants, RPC definitions, and the Supabase security advisor after implementation.

## Verified application code touchpoints

The feature branch was inspected after the database privilege check:

- `src/lib/auth.tsx` updates both `full_name` and `phone` directly on `public.profiles` in `updateProfile`. This must be split so the name remains in `profiles` and the phone is written to the private contact store.
- `src/components/admin/AdminBackendPanel.tsx` selects `phone` from `profiles` in its initial paginated profile load, its load-more path, and its fallback profile lookup for older enrollment rows. The admin user list also renders the phone field. These reads must be replaced with the restricted admin contact interface.
- `src/lib/backend/teacher.ts` selects only `id,full_name` for student roster names; no phone field is needed in the teacher roster query.
- The profile data type in `AdminBackendPanel.tsx` currently includes `phone`; remove it from the general profile shape after the admin contact interface is added.

## Safe implementation sequence

1. Create and secure the private contact table and the narrowly scoped admin-only contact listing/update interface.
2. Backfill existing values from `profiles.phone` without writing phone values to logs.
3. Update signup/profile editing and all three admin read paths to use the new contact interface.
4. Verify the teacher roster continues to work and does not receive phone values.
5. Run the authorization test matrix above using separate student, teacher, and admin accounts.
6. Only then remove `phone` from `profiles`, and verify the final grants and RLS policies.

The live check confirmed `authenticated` has table SELECT and column SELECT privileges for both `profiles.phone` and `profiles.full_name`. This is a privilege check, not proof that every user can see every row; row visibility remains subject to RLS.

## Latest live policy and Auth advisor recheck

- The live `profiles` SELECT policies are `profiles_admin`, `profiles_select`, and `profiles_select_related_class_members`. The related-class policy is the reason teacher-readable profile rows include class students and the teacher's own profile. This is row-level access, not phone-column isolation.
- `profiles_self_update` uses both `USING (id = auth.uid())` and `WITH CHECK (id = auth.uid())`. Separate role-protection triggers remain present.
- Supabase Security Advisor currently reports one Auth warning: `auth_leaked_password_protection` (Leaked Password Protection Disabled). No new database warning was returned in this check.
- Current Supabase documentation says leaked-password protection checks passwords against HaveIBeenPwned and is available on Pro plan and above. The current dashboard location is Authentication → Sign In / Providers → Email. If the project is on the Free plan, the toggle may be unavailable; do not keep searching for a hidden setting or attempt to work around plan restrictions.
- The app already enforces an eight-character minimum in its signup and password-reset UI, but that is not a replacement for the server-side leaked-password check. Stronger password requirements can be configured in the Email provider settings if available.

Reference: https://supabase.com/docs/guides/auth/password-security
