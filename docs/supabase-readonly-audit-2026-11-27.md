# Supabase security audit — 2026-11-27

Project ref: `pxwdfwozinxipvudupbl`

The live Supabase review used read-only project, advisor, and SQL inspection. No production schema, auth settings, function deployments, or data were changed. A mitigation was prepared in the repository branch only.

## Profile-role authorization review

- The live `public.profiles` table grants `authenticated` UPDATE privileges on `role`, and the self-row RLS policy alone would not restrict column changes.
- Further read-only inspection found two live BEFORE UPDATE triggers: `private.prevent_profile_role_escalation()` and `public.protect_profile_role()`. Both reject role changes unless `private.is_admin()` is true. Therefore the direct role-escalation path is already blocked by these triggers; the earlier report's wording that this was a confirmed critical vulnerability was too strong. The broader table grant is still unnecessarily permissive and should be tightened as defense in depth.
- The branch contains migration `20261127010000_protect_profile_role_updates.sql`, which revokes broad INSERT/UPDATE grants, grants only intended profile fields, and adds admin-only `public.admin_set_profile_role(uuid,text)`.
- `src/components/admin/AdminBackendPanel.tsx` now calls the guarded RPC instead of directly updating `profiles.role`.
- **Not applied to production.** Test the migration and RPC in a disposable database, including signup/profile creation, profile edits, and role changes by admin and non-admin. GitHub Actions Build Check run `46025647346` on head `1c3d3f8ff91b69d255d0c77694aba97a691c02a2` completed successfully (tests and build passed). This CI run does not execute the migration against PostgreSQL.

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
