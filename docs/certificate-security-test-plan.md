# Certificate feature security test plan

Run these checks only against a disposable/staging Supabase project after applying the institute foundation and certificate migrations in order. Do not use production learner data.

## Authorization and isolation
1. Student A can select their own issued certificate; Student B cannot select it even when they know its UUID or certificate number.
2. Student cannot call `issue_course_certificate` successfully.
3. A teacher assigned to the class and holding active teacher membership can issue after confirming completion.
4. An unrelated teacher, inactive teacher, suspended member, and non-member cannot issue or revoke.
5. An active institute owner/manager can issue/revoke only for classes in their institute.
6. A student enrolled in two institutes sees only their own certificate rows; no institute-wide certificate list is exposed to them.
7. Enrollment/class/institute mismatch is rejected; inactive class or institute is rejected.
8. Student membership suspension after enrollment prevents new certificate issuance.

## Integrity
9. Duplicate certificate issuance for the same enrollment is rejected by the unique constraint.
10. Direct authenticated INSERT/UPDATE/DELETE on `issued_certificates` is denied; only the RPCs can change records.
11. Issued student name, class title, heading, body, certificate number, issuer, issue date and signature snapshot cannot be changed.
12. A certificate can be revoked once; the database stamps the current actor and time. A second revoke or restore-to-issued attempt fails.
13. A wrong teacher's signature or a signature without an active teacher membership is rejected.
14. Signature pointer must refer to an uploaded object owned by that teacher.

## Storage
15. Signature upload accepts only the private bucket and versioned path `<teacher-id>/signature/<uuid>.(png|jpg|webp)`.
16. Uploading a signature as another user, uploading an invalid path, or using unsupported MIME/oversized files is rejected.
17. Signature objects cannot be overwritten or deleted by authenticated clients.
18. A student can create a signed URL only for the exact signature snapshot attached to their own currently issued certificate.
19. A student cannot read another student's signature object; a revoked certificate no longer grants signature access.

## UI / output
20. Teacher panel saves institute heading/body, uploads a personal signature, issues a certificate, and revokes it.
21. Student panel displays issued/revoked state and opens a print view. Test Save as PDF on Android and desktop.
22. Verify Persian/Arabic shaping, date, long names, page margins, signature image, and revoked status watermark/label.

## Completion attestation and print readiness
23. The issue button stays disabled until an authorized staff member explicitly confirms completion after reviewing the course criteria; unchecking confirmation prevents issuance.
24. Confirm the interface clearly states that completion is manually attested and not automatically calculated from attendance, grades, quizzes, or hifz progress.
25. On a slow connection, the print dialog waits for the signature image to load before opening; if the image fails, printing still opens without a permanently blocked window.
26. A revoked certificate prints with a visible revoked/invalid status and does not request an issued-only signature URL.
27. On Android mobile, verify browser Save as PDF, Persian/Arabic shaping, date and page margins; record any browser-specific limitations.
