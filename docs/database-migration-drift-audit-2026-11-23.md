# Supabase migration drift inventory

**Checked:** 2026-11-23  
**Project:** `pxwdfwozinxipvudupbl`  
**Repository branch inspected:** `main` at `4f59c2205b70f30466dc30644fce02e9e021f8b5`

## Summary

- The Supabase migration ledger contains 19 applied entries.
- The repository currently contains 6 SQL migration files.
- Five repository files have corresponding ledger entries by migration name, but their filename timestamps do not match the applied ledger versions.
- The repository contains `20261112143000_add_secure_quizzes.sql`, but there is no ledger entry named `add_secure_quizzes`. Quiz tables and related objects do exist in the live schema.
- The ledger contains 14 entries that do not have a one-to-one SQL file in the current repository tree.
- The GitHub commit history for `supabase/migrations` contains earlier quiz hardening commits, but does not provide a complete, authoritative SQL snapshot for all 19 applied entries.

## Applied Supabase migration ledger

| Version | Name |
|---|---|
| 20261110080351 | secure_internal_rls_helpers |
| 20261110080506 | add_foreign_key_indexes |
| 20261110080751 | add_enrollment_requests |
| 20261110080827 | expand_class_catalog |
| 20261110080835 | restrict_requests_to_active_classes |
| 20261110080853 | refine_active_class_visibility |
| 20261110080908 | allow_safe_profile_name_updates |
| 20261112081506 | add_profile_phone |
| 20261112093348 | secure_class_capacity_summary |
| 20261112094614 | create_secure_hifz_records |
| 20261112095323 | create_secure_hifz_weekly_assignments |
| 20261113153103 | add_missing_foreign_key_indexes |
| 20261113184528 | add_authenticated_admin_status_rpc |
| 20261113203158 | protect_profile_role_changes |
| 20261118083857 | shared_learning_content_and_games |
| 20261118083921 | secure_game_answer_payloads |
| 20261118152457 | add_secure_game_question_authoring |
| 20261118152531 | harden_game_authoring_rpcs |
| 20261119161804 | isolate_profile_contacts |

## SQL files currently in the repository

| File | Ledger correspondence |
|---|---|
| `20261112114500_add_profile_phone.sql` | Name exists; timestamp differs |
| `20261112133000_secure_class_capacity_summary.sql` | Name exists; timestamp differs |
| `20261112134500_create_secure_hifz_records.sql` | Name exists; timestamp differs |
| `20261112143000_add_secure_quizzes.sql` | No same-name ledger entry; quiz schema objects exist |
| `20261112150000_create_secure_hifz_weekly_assignments.sql` | Name exists; timestamp differs |
| `20261119103000_isolate_profile_contacts.sql` | Name exists; timestamp differs |

## Safety findings

1. Do not run `supabase db push`, replay these files, or manually insert migration ledger rows to try to reconcile this drift.
2. Timestamp differences mean the current files cannot safely be assumed to be the exact migration artifacts represented by the production ledger.
3. The live database contains quiz, hifz, game/content, and profile-contact objects, but object existence alone does not prove that a checked-in migration reproduces their exact definitions and grants.
4. The current profile privacy issue remains: authenticated users have column-level SELECT on legacy `profiles.phone`; RLS allows related-class profile rows. The app now reads phone values from `profile_contacts`, and admin RPC bodies explicitly check `private.is_admin()`.
5. No production SQL, grants, RLS policies, migration ledger rows, or deployment settings were changed during this audit.

## Recommended recovery sequence

1. Capture a read-only schema inventory of tables, columns, constraints, indexes, policies, grants, triggers, and function definitions.
2. Compare each live object against the SQL files and the 19 ledger entries; retrieve historical SQL from repository commits where available.
3. Reconstruct missing migration source files only from verified historical SQL or the live schema, clearly marking any reconstructed baseline as a snapshot rather than pretending it was the original migration.
4. Validate the reconstructed migration chain against a disposable free/test database before considering production use.
5. Prepare a separate, reviewed migration to remove authenticated SELECT access to legacy `profiles.phone`, after verifying every application and database dependency.
6. Do not modify production until a backup/restore path and an explicit deployment approval are available.

This document records the observed drift only. It is not an executable migration.
