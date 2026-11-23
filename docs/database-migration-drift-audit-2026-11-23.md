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


## Stage 131 — historical branch recovery and live-object cross-check (2026-11-23)

### Verified migration ledger

A fresh read of the Supabase migration ledger confirmed 19 rows, with the exact versions and names listed above. The read-only catalog query also confirmed the same count and ledger contents.

### Additional historical SQL found

The repository branch `feature/shared-content-supabase` contains five SQL files absent from `main`:

| Historical branch file | Ledger relationship | Live catalog cross-check |
|---|---|---|
| `20261118152457_add_secure_game_question_authoring.sql` | Exact version/name match for ledger row 17 | Public/admin game-question function family exists |
| `20261118152531_harden_game_authoring_rpcs.sql` | Exact version/name match for ledger row 18 | Private game-answer implementation and public wrappers exist |
| `20261118161000_move_legacy_definer_rpcs_private.sql` | No matching ledger version/name | Private class-availability and quiz-submit implementations exist; public wrapper functions were observed in prior audit |
| `20261118162500_validate_unique_game_options.sql` | No matching ledger version/name | Current private game-authoring function body contains the duplicate-option rejection check |
| `20261118190000_create_private_profile_contacts.sql` | No matching ledger version/name; concept overlaps later `isolate_profile_contacts` ledger row | `public.profile_contacts` and admin contact RPCs exist |

The first two files provide verified historical source candidates for two previously missing ledger entries. They are present on the old branch, not on `main`. The three other files are useful forensic evidence but must not be treated as applied migrations merely because related live objects or logic exist.

### Updated reconciliation count

- **19** migration ledger rows confirmed.
- **7** ledger entries have a same-name SQL source recoverable from repository refs: five files on `main` whose migration names match but whose filename timestamps differ from the ledger, plus two historical files on `feature/shared-content-supabase` whose filename versions and names exactly match their ledger rows. More precisely, the five `main` files with ledger-name correspondence are `add_profile_phone`, `secure_class_capacity_summary`, `create_secure_hifz_records`, `create_secure_hifz_weekly_assignments`, and `isolate_profile_contacts`; the two recovered exact-version files are the game-authoring migrations.
- **12** ledger entries still have no corresponding SQL migration file in any of the 11 currently listed repository branches inspected.
- `20261112143000_add_secure_quizzes.sql` remains an unmatched repository migration file: the live quiz objects exist, but no ledger row has the same migration name/version.
- Three further SQL files exist only on the old feature branch without a matching ledger row. Their related live objects/logic do not establish that those exact files were applied.

The 12 ledger entries still missing source are:
1. `secure_internal_rls_helpers`
2. `add_foreign_key_indexes`
3. `add_enrollment_requests`
4. `expand_class_catalog`
5. `restrict_requests_to_active_classes`
6. `refine_active_class_visibility`
7. `allow_safe_profile_name_updates`
8. `add_missing_foreign_key_indexes`
9. `add_authenticated_admin_status_rpc`
10. `protect_profile_role_changes`
11. `shared_learning_content_and_games`
12. `secure_game_answer_payloads`

### Branch safety assessment

The historical branch `feature/shared-content-supabase` is **diverged** from `main`: 115 commits ahead and 28 behind at the comparison time. Its diff contains numerous unrelated frontend, auth, content, quiz, and game changes in addition to SQL files. It is not a safe candidate for wholesale merge, cherry-pick, or reset. Only individual migration files may be used as historical evidence after exact content and live definitions are compared.

### Read-only live catalog checks

The following were confirmed without reading application rows or contact values:
- 19 migration ledger records.
- The quiz tables, game-question table, and profile-contact table exist.
- The private implementation functions for class availability, quiz submission, game-question authoring, and game-answer checking exist.
- The current private game-question authoring function contains the duplicate-option rejection logic found in the historical candidate file.
- The Data API runtime settings `pgrst.db_schemas` and `pgrst.db_extra_search_path` were not exposed by the catalog query (returned NULL). This is **not** evidence that no schemas are exposed; the setting must be verified in the Supabase Dashboard before designing new public RPCs.

These checks confirm object presence and selected behavior markers only. They do not prove byte-for-byte equivalence between the live database and any historical SQL file.

### Stage 131 decision

Do not merge or cherry-pick the old feature branch. Do not run, replay, rename, or manually ledger any recovered candidate SQL. The next safe step is to recover the 12 missing migration definitions from authoritative Git history/backup/export sources, then compare all candidate definitions with the live catalog. If original SQL cannot be recovered, prepare a separately labelled **current-schema baseline snapshot**, not a fabricated historical migration chain.

### Explicit non-actions

No migration was applied. No database schema, function, policy, grant, RLS setting, data, deployment, or Data API setting was changed. No branch was merged or cherry-picked. PR #8 and PR #9 remain open and unmerged.


## Stage 132 — pull-request and commit-history recovery check (2026-11-23)

### Pull-request review

The repository's available PR history (#1–#9) was inspected with PR diffs. This provides an additional recovery route beyond the 11 branch trees checked in Stage 131.

- PR #1 targets the divergent `feature/shared-content-supabase` base and changes only the public-auth/demo-mode frontend files; it contains no migration SQL.
- PR #2 changes only the auth/config/login frontend files; it contains no migration SQL.
- PRs #3, #4, and #5 each include `supabase/migrations/20261119103000_isolate_profile_contacts.sql`, which is already counted among the six files on `main`; these PR copies do not recover any of the 12 missing ledger migrations.
- PRs #6–#9 contain no additional migration SQL. PR #8 and #9 are documentation/audit PRs; PR #7 is the profile-query fix.

### Recovery conclusion

The inspected PR diffs do not supply authoritative SQL for any of the 12 missing ledger entries. The repeated profile-contact migration is a duplicate source for an already-known migration, not a new recovered migration. The PR history therefore does not change the Stage 131 reconciliation count:

- 19 applied ledger entries.
- 7 entries with a same-name SQL source somewhere in the inspected repository refs (5 name matches with timestamp mismatch, 2 exact historical matches).
- 12 entries without an authoritative SQL file found in the inspected branches and PR diffs.
- 1 unmatched repository SQL file for secure quizzes, with live quiz objects but no matching ledger entry.

The PR history review is bounded to the repository's currently available PRs and returned diffs; it is not proof that no backup, local clone, deleted remote ref, or external artifact exists.

### Next safe recovery step

Because the PR/branch recovery path did not locate the missing definitions, build a separately labelled current-schema baseline from read-only PostgreSQL catalogs. It must be treated as a snapshot of current state, not as the original 19 migrations and not as a replayable migration chain. Continue to avoid production DDL/DML, grants, migration ledger edits, and deployments.

### Explicit non-actions

No migration SQL was applied or replayed. No database objects, grants, RLS policies, data, settings, branches, or deployments were changed. No PR was merged or closed.


## Stage 133 — current-schema baseline captured (2026-11-23)

A point-in-time, read-only catalog baseline was captured and committed separately as:

- `docs/current-schema-baseline-readonly-2026-11-23.md`

### Snapshot totals

- 18 public base tables and 1 private base table.
- All 19 base tables have RLS enabled.
- 2 public views; both report `security_invoker=true`.
- 51 policies total: 50 in `public`, 1 in `private`.
- 51 indexes.
- 88 constraints.
- 3 non-internal table triggers in the inspected schemas (event triggers are not included in this table-trigger count).
- 24 routines across `public` and `private`.

The baseline records table columns/types/nullability/defaults, primary keys, foreign-key names, policy definitions, index count, function signatures and SECURITY DEFINER flags, view security-invoker options, trigger names, and default ACL records. It deliberately omits application row contents, phone values, auth credentials, and secrets.

### Interpretation and limits

- The new 51-policy count includes 50 public policies plus one private policy; the earlier Stage 124 count of 50 was scoped to public policies. This is a scope clarification, not evidence of a policy change.
- The baseline is a point-in-time catalog snapshot, not a reconstruction of the original 19 migration files and not a replayable migration.
- It does not certify role behavior or application flows and does not replace a complete grant-by-grant backup before any future security remediation.
- Existing observations remain: legacy `profiles.phone` still requires a separately reviewed privacy remediation, and selected broad table/default privileges remain outstanding. No changes were made in this stage.

### Explicit non-actions

Only read-only catalog metadata and the table-list metadata endpoint were used. No application rows were selected. No DDL, DML, GRANT/REVOKE, RLS/policy changes, triggers, functions, views, migration ledger edits, project settings, deployments, or branch merges were performed.
