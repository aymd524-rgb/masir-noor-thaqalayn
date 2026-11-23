# Stage 140 — Live RLS, column grants, and role-change guard review

Date: 2026-11-23
Supabase project: `pxwdfwozinxipvudupbl`
Repository: `aymd524-rgb/masir-noor-thaqalayn`
Branch: `docs/live-schema-security-inventory-2026-11-23`

## Scope and method

Read-only catalog inspection of live PostgreSQL policies, effective column privileges, selected helper function definitions, and triggers on `public.profiles`. No application rows, profile values, contact values, or credentials were queried. No test sessions or role changes were performed.

## Key result — profile role update

The authenticated role has effective column-level UPDATE privilege on `public.profiles.role`. The `profiles_self_update` RLS policy permits updating a row whose `id = auth.uid()`, and its `WITH CHECK` repeats the same ownership condition. On its own, that policy does not constrain which columns of the owned row may be updated.

However, the live table has **two enabled BEFORE UPDATE triggers** that independently guard role changes:

1. `profiles_prevent_role_escalation` calls `private.prevent_profile_role_escalation()`.
2. `protect_profile_role_before_update` calls `public.protect_profile_role()`.

Both trigger functions reject a changed `role` unless `private.is_admin()` returns true, raising SQLSTATE `42501`. Both triggers are enabled (`tgenabled = 'O'`). The helper `private.is_admin()` is SECURITY DEFINER, has an empty search_path, and determines admin status from the caller's own `profiles.role` row using `auth.uid()`.

**Conclusion:** The broad column UPDATE grant and self-row RLS policy are a noteworthy defense-in-depth concern, but the enabled trigger guards currently block non-admin role changes at the database layer. This static inspection does not prove runtime behavior under all contexts; safe negative/positive role tests remain outstanding. The two overlapping triggers are redundant and create maintenance complexity, but no change is recommended without a tested migration and rollback plan.

## Other inspected policies

All selected tables had RLS enabled:
- `profiles`, `profile_contacts`, `classes`, `enrollments`, `attendance`, `grades`, `hifz_records`, `hifz_assignments`.

Observed policy design:
- Profiles: self/admin SELECT, related-class-member SELECT for teacher/student relationship, admin ALL, self UPDATE constrained by row identity.
- Profile contacts: authenticated own-row SELECT/INSERT/UPDATE with `user_id = auth.uid()` in the relevant predicates.
- Classes: admin ALL; authenticated SELECT for active classes, assigned teacher, enrolled user, or admin.
- Enrollments: student own-row SELECT, assigned teacher via `private.can_manage_enrollment`, admin access; separate admin ALL policy.
- Attendance and grades: student-own-enrollment / assigned-teacher / admin SELECT; teacher/admin INSERT and UPDATE constrained by enrollment; admin DELETE.
- Hifz records and assignments: analogous ownership/assigned-teacher/admin SELECT and teacher/admin writes, with recorded/assigned-by identity checks on insert and relevant update checks.

Selected helper definitions:
- `private.can_manage_enrollment(p_id)` checks an enrollment joined to a class whose `teacher_id = auth.uid()`.
- `private.owns_enrollment(p_id)` checks enrollment `student_id = auth.uid()`.
- `private.is_enrolled_in_class(p_class_id)` checks class enrollment for `auth.uid()`.
- These are SECURITY DEFINER helpers with empty search_path and fixed, schema-qualified table references in the inspected definitions.

## Security Advisor

Current Security Advisor findings remain:
- Two warnings for authenticated execution of the public SECURITY DEFINER admin contact RPCs. Their explicit admin guard still requires positive/negative runtime testing.
- One warning that leaked-password protection is disabled.

## Recommended next steps (not performed)

1. Add controlled integration tests proving a student and teacher cannot change their own role, while an admin can change another user's role.
2. Test teacher access to assigned versus unassigned class enrollments and associated attendance, grades, and hifz records; test student access only to own records.
3. Consider reducing authenticated column UPDATE privileges on `profiles` to only the fields users actually need to edit, while preserving the intended admin role-management path. This is a proposed hardening measure only; no grants were changed.
4. Review whether both role-protection triggers are needed; if one is removed, first establish a migration, test coverage, and rollback plan.
5. Keep the two admin contact RPCs behind explicit admin checks and verify anon/student/teacher denial and admin success in a safe test environment.

## Non-actions

No SQL/DDL/DML changes, grants/revokes, RLS changes, trigger/function changes, Auth settings, test-user creation, production row reads, migrations, deployments, or PR merges were performed.
