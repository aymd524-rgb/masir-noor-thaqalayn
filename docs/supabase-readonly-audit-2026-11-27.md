# Supabase security audit — 2026-11-27

Project ref: `pxwdfwozinxipvudupbl`

The live Supabase review used read-only project, advisor, and SQL inspection. No production schema, auth settings, function deployments, or data were changed. A mitigation was prepared in the repository branch only.

## Critical profile-role finding

- The live `public.profiles` table granted the `authenticated` role UPDATE privileges on `role`, and the `profiles_self_update` RLS policy allowed users to update their own row. RLS row ownership alone does not restrict which columns a user can change.
- This creates a potential self-role-escalation path unless another control prevents it. Treat this as a critical release blocker.
- The branch now contains migration `20261127010000_protect_profile_role_updates.sql`: it revokes broad INSERT/UPDATE grants, grants only safe profile fields, and adds admin-only `public.admin_set_profile_role(uuid,text)` with a `private.is_admin()` check.
- `src/components/admin/AdminBackendPanel.tsx` now calls the guarded RPC instead of directly updating `profiles.role`.
- **Not applied to production.** This migration and RPC must be tested in a disposable Supabase branch/database. Confirm signup/profile creation and profile editing still work, and test role-change calls as admin and non-admin. Build/CI for the new head has not yet been confirmed.

## Other security observations

- Project status: `ACTIVE_HEALTHY`.
- Supabase Security Advisor reports two `SECURITY DEFINER` RPCs callable by the `authenticated` role: `admin_get_profile_contacts(uuid[])` and `admin_list_profile_contacts(integer, integer)`.
- Both inspected functions call `private.is_admin()` before returning phone values. The phone table `profile_contacts` has own-row RLS policies. Non-admin runtime testing is still required.
- Auth advisor reports leaked-password protection disabled. Enable it in Auth settings before public launch.
- Edge Functions list is empty; `mushaf-page` is not deployed.

## Performance observations

- Two foreign keys lack covering indexes: `content_entries.created_by` and `game_questions.created_by`. Review query patterns before adding indexes.
- Advisor reports multiple permissive policies on several tables. These are performance lint warnings, not by themselves evidence of an access-control bypass; inspect policy predicates and consolidate only when semantics remain identical.
- 22 indexes were reported unused. Do not drop them based on this snapshot alone; usage may be low because the project is new. Re-check after real workload.

## Release blockers / next checks

1. Test the profile-role migration and admin RPC in a disposable database; confirm ordinary users cannot change role and admins can assign allowed roles.
2. Confirm profile creation, phone/name editing, and admin user management still work after column-grant changes.
3. Enable leaked-password protection in Auth settings.
4. Exercise both phone-contact admin RPCs with admin and regular accounts; confirm non-admin permission denied.
5. Re-check RLS after institute migrations are tested separately.
6. Configure Quran Foundation credentials as Edge Function secrets, deploy `mushaf-page` only after authorization, and verify fixed-line pages 1, 2, a mid-Qur'an page, and 604.
7. No production migration, function deployment, auth setting change, or release was performed during this audit.
