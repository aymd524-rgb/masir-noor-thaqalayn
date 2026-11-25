# Stage 143 — Supabase Storage access review (read-only)

Date: 2026-11-23
Project: `pxwdfwozinxipvudupbl`
Scope: Storage catalog metadata and repository source search. No objects or file contents were read.

## Live catalog findings

- `storage.buckets` returned zero rows: no Storage buckets are currently configured in this project.
- `pg_policies` returned zero policies for `storage.objects`.
- `storage.objects` has RLS enabled.
- Effective table-level privileges for `anon` and `authenticated` include SELECT, INSERT, UPDATE, and DELETE on `storage.objects`; without applicable RLS policies, these grants do not authorize row/object access through normal RLS-enforced operations.
- The `storage.buckets` table also has broad table-level grants for client roles, but it is RLS-enabled. No bucket rows were found and no bucket-management policies were found in this query scope.
- No application source matches were found for `storage.objects`, `supabase.storage`, or `createSignedUrl` in the repository search. This is a search result, not proof that no indirect or dynamically constructed Storage usage exists.

## Assessment

Current evidence indicates Storage is not configured for app file uploads/downloads: there are no buckets and no object policies. This is a restrictive default for user-file access, not a finding of publicly exposed files. Because no buckets exist, public/private bucket exposure, MIME restrictions, file-size limits, folder ownership rules, signed URL patterns, and delete/update behavior cannot yet be assessed.

The SQL grants alone do not bypass RLS. Do not create a bucket or add broad `USING (true)` / `WITH CHECK (true)` policies as a shortcut.

## Recommendations before introducing Storage

1. Decide which app feature needs files (for example profile images, course materials, or student submissions).
2. Define a separate bucket per data sensitivity and intended audience; prefer private buckets for student/course records.
3. For private user uploads, constrain object paths to the authenticated user's UID and enforce bucket ID in every policy.
4. Define distinct SELECT/INSERT/UPDATE/DELETE policies; account for upsert requiring INSERT, SELECT, and UPDATE.
5. Set conservative file-size and MIME-type allowlists at bucket creation, and validate file type/content server-side where appropriate.
6. Test anonymous, student, teacher, and admin access, including cross-user and cross-class attempts, before production use.
7. Never put a service-role/secret key in the browser. Use signed URLs only where the app's authorization model permits them.

## Status

- Read-only catalog queries and repository search only.
- No Storage bucket, object, policy, grant, RLS setting, application code, or deployment was changed.
- No user files, object names, or file contents were read.
- This report does not authorize creating Storage resources or changing production access.
