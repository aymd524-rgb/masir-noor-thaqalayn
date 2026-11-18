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
