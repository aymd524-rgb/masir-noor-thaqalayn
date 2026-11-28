# Certificate issuance and teacher signature — implementation plan

## Status
Database migrations, authenticated issuance/revocation RPCs, teacher controls, and student print-to-PDF view have been added on this branch. The PDF is currently generated through the browser print dialog; embedded-font PDF rendering and staging integration tests are still pending. No migration has been applied to a database or live app.

## Existing behavior confirmed at the institute feature branch
- The demo/local data model already has a `Certificate` record with `id`, `courseId`, `studentId`, `issuedAt`, and `code`.
- The student dashboard displays a certificate count from demo state.
- The Supabase student and teacher backend panels do not currently load, issue, or download certificates.
- No certificate/signature migration or backend implementation was present in the institute feature branch when inspected.

## Required behavior
1. Certificates belong to a specific institute and completed class/enrollment; institute context must never be inferred from a student's other memberships.
2. Only an authorized institute owner/manager or the assigned active teacher can issue or revoke a certificate for that class.
3. Issuance must validate the student's active enrollment and completion eligibility on the server/database side; the client cannot self-award a certificate.
4. Certificate heading and course/program title are configurable by authorized institute staff, not hard-coded globally.
5. Teachers can upload/change their own signature image. Signature is optional on each certificate and must not be editable by another teacher.
6. Students can view/download only their own final issued certificate. A revoked certificate must be visibly marked invalid and must not be presented as current.
7. Certificate identifiers must be unique and not expose personal information.
8. RLS must protect certificate rows and signature files; no service-role key may be shipped to the browser.
9. Generated document must support Persian/Arabic text and a suitable font; do not promise PDF output until font embedding and rendering are tested on mobile.

## Suggested implementation sequence
- Add database tables for institute certificate settings and issued certificates, with constraints and indexes.
- Add RLS policies and database-side issuance authorization; include cross-institute, inactive membership, and wrong-teacher negative tests.
- Add private storage for signature images with owner-only upload/update and narrowly scoped display access.
- Add teacher controls for template heading and signature upload, plus issue/revoke workflow.
- Add student certificate list and authenticated download/view route.
- Add PDF generation only after verifying Persian/Arabic shaping, embedded fonts, mobile rendering, and safe file access.
- Add tests for authorization, duplicate issuance, revoked certificates, multiple institute memberships, and students enrolled in two institutes.

## Rollout
This feature should be reviewed and tested on a disposable/staging Supabase project first. Do not apply migrations to production or publish the app as part of this branch.