# Integrated release validation — 2026-11-27

This is a read-only validation record for draft PR #19. No production writes were performed.

## Auth flow checks against the connected Supabase project

- The live Auth user trigger `on_auth_user_created` exists and invokes `public.handle_new_user()`.
- The live `handle_new_user()` function creates a `public.profiles` row with the Auth user's ID, full name from `raw_user_meta_data.full_name`, and the default role `student`. This matches the phone-OTP signup metadata.
- The live `profile_contacts` table currently has `user_id`, `phone`, and `updated_at`; it does **not** yet have the optional `email` column.
- PR #19 includes migration `20261127100000_add_optional_contact_email.sql`. That migration must be applied before deploying code that selects or writes `profile_contacts.email`.
- Existing restrictive RLS policies require a contact row to belong to `auth.uid()`; the OTP flow writes the signed-in user's own row. Admin contact access remains through guarded RPCs.

## Release blockers / not yet verified

1. GitHub Actions Build Check for PR #19 latest head `a461f7e007952702540316580582edc7f2c2cdca` passed run 46033411384 (#592), including application tests and build.
2. PR #20 stacked on the integration branch passed run 46033448170 (#593), including application tests and build.
3. Actual SMS delivery and OTP verification have not been tested with a configured SMS provider.
4. The email-column and institute migrations have not been applied to a disposable database or production.
5. The 604-page fixed 15-line hifz mushaf and its Edge Function remain unverified for release.

## Safety boundary

PR #19 remains Draft. No PR was merged, no production migration was applied, and the public site was not deployed.


## CI status update (2026-11-27)
The latest source-level CI checks are green:
- PR #19 head `a461f7e007952702540316580582edc7f2c2cdca`: run 46033411384.
- PR #20 head `e985381666fe6979f81d54a0dd0a8af91c68f931`: run 46033448170.

These runs execute dependency installation, `bun run test`, and `bun run build`. They do not execute SQL migrations against a staging database or verify live SMS delivery, fixed-line Quran page data, or mobile print output. PRs remain Draft; no merge or deployment was performed.
