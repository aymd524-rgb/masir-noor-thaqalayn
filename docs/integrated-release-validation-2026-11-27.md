# Integrated release validation — 2026-11-27

This is a read-only validation record for draft PR #19. No production writes were performed.

## Auth flow checks against the connected Supabase project

- The live Auth user trigger `on_auth_user_created` exists and invokes `public.handle_new_user()`.
- The live `handle_new_user()` function creates a `public.profiles` row with the Auth user's ID, full name from `raw_user_meta_data.full_name`, and the default role `student`. This matches the phone-OTP signup metadata.
- The live `profile_contacts` table currently has `user_id`, `phone`, and `updated_at`; it does **not** yet have the optional `email` column.
- PR #19 includes migration `20261127100000_add_optional_contact_email.sql`. That migration must be applied before deploying code that selects or writes `profile_contacts.email`.
- Existing restrictive RLS policies require a contact row to belong to `auth.uid()`; the OTP flow writes the signed-in user's own row. Admin contact access remains through guarded RPCs.

## Release blockers / not yet verified

1. Combined GitHub Actions Build Check for PR #19 head `18b7def69ffa252dbe60fdd2e93d19aaa2625b8c` has not produced a recorded run.
2. Actual SMS delivery and OTP verification have not been tested with a configured SMS provider.
3. The email-column migration has not been applied to a disposable database or production.
4. The 604-page fixed 15-line hifz mushaf and its Edge Function remain unverified for release.

## Safety boundary

PR #19 remains Draft. No PR was merged, no production migration was applied, and the public site was not deployed.
