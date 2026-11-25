# Stage 169 — Classroom Learning Resource Library and Teacher Materials
Date: 2026-11-24
Status: design/documentation only; no resource library UI, upload workflow, storage bucket, database object, access policy or production setting implemented.

## 1. Purpose
Design a class-scoped library where authorized teachers can share lesson notes, worksheets, audio recitations, videos, revision plans and other approved learning resources with currently enrolled learners. Resources should be organized around courses, classes, lessons and learning objectives, and remain accessible only to authorized users.

## 2. Core principles
- Teacher resources are scoped to a course/class and, where useful, a specific lesson or assignment.
- Learners see resources only for active enrollments and authorized historical access.
- Teachers manage resources only in currently assigned classes/courses.
- Separate public platform content from class-private materials.
- Preserve canonical Qur'an text in Uthmani script from a verified source; never silently normalize or alter the displayed canonical text.
- Track source, author, edition, license and review status for third-party materials.
- Do not assume that a file found online is free to copy or redistribute.
- Keep the interface mobile-first, RTL-friendly, accessible and usable on low bandwidth.
- Avoid collecting unnecessary learner data in uploaded files or analytics.

## 3. Resource categories
Possible resource types:
- lesson handouts and PDF notes
- worksheets, exercises and practice sheets
- audio recitation and pronunciation examples
- lesson videos and recorded explanations
- memorization targets and revision schedules
- vocabulary, translation and tadabbur materials
- tajwid diagrams and reference cards
- teacher announcements and supplementary links
- approved image resources and presentation slides

Each resource should have a clear category, language, age/level suitability, course/lesson association and description. Distinguish required material from optional enrichment.

## 4. Teacher authoring and organization
Authorized teachers may:
- upload a new resource or link an approved existing library item
- add title, description, category, language and intended age/level
- associate it with a class, course, lesson, week or assignment
- mark it required, optional or supplementary
- set publication and availability dates
- replace a draft before publication
- archive or withdraw material with a reason
- see basic delivery/access status without invasive learner tracking

Before publication, the teacher should preview the learner view and confirm that the file contains no unintended personal information. Shared institutional resources may require editor/admin approval.

## 5. Learner experience
Learners should be able to:
- browse resources for their own classes and courses
- filter by lesson, category, format and required/optional status
- open or download approved files
- view a short description and file size before download
- resume a lesson resource list without losing place
- bookmark resources privately
- report a broken, unsuitable or incorrect resource
- access permitted resources on a low-bandwidth connection

The interface should clearly label newly added, updated, archived and time-limited materials. Do not imply that opening a file proves learning or mastery.

## 6. File upload and storage security
- Use private object storage for class-restricted materials.
- Validate file type, size and content server-side; do not trust filename extensions or client MIME headers.
- Allowlist formats appropriate to the service, such as PDF, common image formats, approved audio/video codecs and office documents only where safe preview/scanning is supported.
- Reject executable files, scripts, macro-enabled documents and unsupported archives by default.
- Scan uploads for malware before making them available.
- Use random storage keys; do not expose raw bucket paths or permanent public URLs.
- Generate short-lived signed access only after checking current authorization.
- Apply upload quotas, per-file limits, rate limits and storage lifecycle rules.
- Strip or avoid unnecessary EXIF metadata from images where feasible.
- Do not permit HTML/SVG or other active content to execute in the app's origin; serve downloads safely.
- Record uploader, resource version, scan status and timestamps, not file contents in audit logs.

## 7. Qur'an and religious content integrity
- Canonical Arabic Qur'an text must come from a verified, versioned source and be displayed in the approved Uthmani script (including the selected Mushaf convention, such as the Uthman Taha style where licensed and available).
- Preserve surah/ayah identifiers and exact source references.
- Any search normalization must be separate from the canonical display text.
- Recitation audio should include reciter, riwaya, source, licensing, surah/ayah alignment and editorial review metadata.
- Translation, tafsir, tadabbur, hadith and teacher commentary must be clearly distinguished from Qur'an text.
- Hadith resources should include source references and a reviewed grading/authenticity note where available; do not invent attribution or grading.
- Age-appropriate religious content requires qualified editorial review and a correction process.
- Do not let user-uploaded content overwrite canonical scripture or approved source records.

## 8. Copyright, licensing and attribution
For each resource record:
- creator/author and publisher where known
- source URL or bibliographic reference
- license/permission basis
- permitted uses (view, download, print, classroom redistribution)
- attribution text
- territory or expiry restrictions where relevant
- reviewer and approval status

Do not allow broad download/redistribution when the license only permits streaming or in-class display. Provide a takedown/correction process for rights complaints. Teacher-created material should identify its creator and any third-party components.

## 9. Resource lifecycle and versioning
Suggested states:
- draft
- pending_review
- published
- scheduled
- archived
- withdrawn
- rejected

A published update creates a new version rather than silently replacing historical content. Preserve a snapshot of title, attribution, license and file checksum for each published version. Learners should be informed when a required resource materially changes. Archived materials may remain visible to learners who completed the course only if the license and retention policy permit.

## 10. Conceptual data model
Design only; reconcile with existing course, class, lesson, storage and content-library structures before implementation:
- class_resources: class_id, course_id, lesson_id, title, description, category, language, level_band, required_state, publication_state, created_by.
- resource_versions: resource_id, version_number, storage_key, checksum, byte_size, media_type, scan_state, source_metadata_id, published_at.
- resource_access_rules: resource_id, access_scope, available_from, available_until, download_allowed.
- resource_metadata: creator, source_reference, license_key, attribution, review_status, reviewer_id.
- resource_bookmarks: resource_id, learner_id, created_at.
- resource_reports: resource_id, reporter_id, category, description_minimized, status, resolved_by.
- resource_audit_events: resource_id, actor_id, action, reason_code, timestamp.

Do not duplicate existing canonical Qur'an content, course records or media-library entities if suitable structures already exist. Prefer references to approved shared resources over repeated file copies.

## 11. Authorization and privacy
- Learner reads only resources linked to active/authorized course or class membership.
- Teacher creates, updates and archives resources only in currently assigned classes/courses.
- Course managers/editors may approve shared materials within explicit scope.
- Admin actions are least-privilege and audited.
- Anonymous users see only resources explicitly published as public.
- Server derives uploader identity from authenticated context; never trust client-supplied owner, class, role or publication status.
- RLS protects resource metadata rows; server-side storage authorization checks the same membership and resource state before issuing a signed URL.
- Revoked enrollment or teacher assignment removes access promptly, including renewed download links.
- Search, previews, thumbnails, exports and cached copies must enforce the same access scope.
- Do not expose private file names, storage keys or class rosters through public metadata.

## 12. Accessibility and learning design
- Support RTL Persian and Arabic, readable fonts and screen readers.
- Provide captions/transcripts for video/audio where available and licensed.
- Include descriptive alt text for instructional images.
- Ensure PDFs are readable/searchable where possible; offer accessible HTML/text alternatives for essential instructions.
- Avoid color-only status indicators.
- Show file size and format before download.
- Provide low-bandwidth variants and resumable downloads where supported.
- Ensure required resources are not available only in one inaccessible format.

## 13. Reliability and operations
- Make upload completion and publication idempotent.
- Verify checksum and scan result before publication.
- Handle interrupted uploads and retries safely.
- Use pagination and filters for large class libraries.
- Monitor storage use and broken-resource reports without collecting unnecessary learner behavior.
- Define backup, retention, deletion and disaster-recovery procedures.
- Provide a review queue for reported incorrect, unsafe, outdated or rights-infringing content.

## 14. Acceptance and security tests
1. Learner A cannot view or download a resource restricted to Learner B's class.
2. Teacher cannot upload, edit or archive resources for a class outside current assignment.
3. Revoked learners and former teachers lose access to new signed URLs and protected previews.
4. Anonymous users cannot enumerate private resources or storage keys.
5. File type, byte size, malware scan and upload quotas are enforced server-side.
6. Executable, script, macro-enabled and unsupported active content is rejected.
7. A file cannot be published before scanning and required editorial approval.
8. Replacing a published file creates a new version and preserves its attribution/license snapshot.
9. Download is blocked when license permits view-only access.
10. Copyright/takedown reports enter a documented review process.
11. Canonical Uthmani Qur'an text remains unchanged by search normalization or teacher uploads.
12. Qur'an, translation, tafsir, hadith and teacher notes are visually and semantically distinguished.
13. Resource search, thumbnails and previews do not leak unauthorized metadata.
14. Bookmarks are private to the learner.
15. RTL, screen reader, keyboard, caption and low-bandwidth tests pass.
16. Required learning instructions have an accessible alternative where the source format is inaccessible.
17. Resource archive/deletion follows retention, legal hold and licensing requirements.
18. No learner personal data is embedded in public file paths or analytics.

## 15. Release sequence
1. Inventory existing media library, storage buckets, course/class relationships and RLS policies.
2. Confirm approved file formats, storage limits, scanning service and licensing rules.
3. Define resource categories, age/level metadata and editorial review ownership.
4. Prototype teacher upload and learner read-only library using synthetic accounts.
5. Implement membership-based metadata and storage authorization before exposing download UI.
6. Add malware scanning, versioning, reporting and audit events.
7. Pilot with a small set of licensed teacher-created PDFs and text resources.
8. Add audio/video only after consent, licensing, captioning and retention reviews.
9. Obtain explicit approval before production storage changes, migrations or release.

## 16. Decisions required
- Which formats are supported at launch?
- What are maximum file sizes and per-class storage quotas?
- Which resources require admin/editor review before publication?
- May teachers allow downloads, printing or view-only access per resource?
- What is the retention policy after course completion or teacher departure?
- Which Qur'an text, Mushaf convention, recitation sources and licenses are approved?
- What malware scanning and safe-preview capabilities are available?
- Are audio/video uploads enabled at launch or deferred?
- Who handles copyright complaints and editorial corrections?
- Which resources may be public versus class-private?

## 17. Status and safety
This is a design document only. No upload UI, resource record, storage bucket, file, scan service, database schema, RLS policy, RPC, trigger, signed URL, external service or live setting was created or changed. No learner files or personal data were accessed. No migration, deployment, merge or release was performed.
