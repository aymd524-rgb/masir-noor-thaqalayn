# Read-only Supabase audit — 2026-11-27

Project ref: `pxwdfwozinxipvudupbl`

This audit used read-only project, advisor, and SQL inspection. No production schema, auth settings, function deployments, or data were changed.

## Confirmed security observations

- Project status: `ACTIVE_HEALTHY`.
- Supabase Security Advisor reports two `SECURITY DEFINER` RPCs callable by the `authenticated` role:
  - `public.admin_get_profile_contacts(uuid[])`
  - `public.admin_list_profile_contacts(integer, integer)`
- Source inspection shows both functions call `private.is_admin()` before returning phone values. The helper checks the caller's own `profiles.role = 'admin'`. The phone table `profile_contacts` has RLS policies for users to select/insert/update only their own row. This is a conservative advisor warning; the inspected function logic does not show a direct non-admin bypass. Still, keep these RPCs restricted to intended admin workflows and test with a non-admin JWT before launch.
- Auth advisor reports leaked-password protection disabled. Enable it in Supabase Auth settings before public launch.
- Edge Functions list is empty; `mushaf-page` is not deployed.

## Performance observations

- Two foreign keys lack covering indexes: `content_entries.created_by` and `game_questions.created_by`. Review query patterns before adding indexes.
- Advisor reports multiple permissive policies on several tables. These are performance lint warnings, not by themselves evidence of an access-control bypass; inspect policy predicates and consolidate only when semantics remain identical.
- 22 indexes were reported unused. Do not drop them based on this snapshot alone; usage may be low because the project is new. Re-check after real workload.

## Release blockers / next checks

1. Enable leaked-password protection in Auth settings.
2. Exercise both admin RPCs with an admin and a regular authenticated account; confirm the regular account gets permission denied.
3. Re-check RLS and policies after the institute migration is tested in a separate database.
4. Configure Quran Foundation credentials as Edge Function secrets, deploy `mushaf-page` only after authorization, and verify fixed-line pages 1, 2, a mid-Qur'an page, and 604.
5. No production migration, function deployment, or release was performed during this audit.
