# Stage 164 — Media Library, Qur'an Audio/Video, and Offline Learning Access
Date: 2026-11-24
Status: design/documentation only; no media storage, player, CDN, offline cache, database, or production setting implemented.

## 1. Purpose and scope
Define a safe and maintainable media layer for the Qur'an learning app: Uthmani Qur'an text references, licensed recitations, educational audio/video, lesson attachments and optional offline access. This complements the editorial content model from Stage 156; it does not replace canonical text, translation, tafsir, hadith or editorial approval workflows.

Core principles:
- Separate content metadata from binary media files.
- Preserve provenance, edition, reciter, riwaya, language, source and license.
- Keep canonical Qur'an text versioned and independently verified; never infer or reconstruct text from audio.
- Use rights-cleared media only and record permitted use, download and redistribution.
- Default to streaming or in-app access; offline download is an explicit product and rights decision.
- Protect minors from unmoderated uploads, public comments and external contact links.
- Do not expose storage credentials or unrestricted bucket access.

## 2. Media types and metadata
Supported conceptual types:
- Qur'an recitation audio: reciter, riwaya, recording, surah/ayah range, source, edition, language, duration and license.
- Lesson audio: course/class reference, teacher/producer, topic, duration, transcript/caption and approval state.
- Educational video: title, course/lesson, producer, language, duration, captions, transcript, thumbnail and license.
- Downloadable learning material: PDF or approved document, version, language, accessibility metadata and license.
- Supporting image: cover, diagram or approved illustration with alt text, creator, source and rights.
- Interactive media (future): only after separate security, accessibility and moderation review.

Metadata should include stable IDs, media type, title, description, language, content references, file format, byte size, duration/dimensions, checksum, storage object key, processing state, publication state, source attribution, license identifier, rights scope, created/updated timestamps and reviewer.

Do not put user names, phone numbers, private class notes or student progress into public file names or object keys.

## 3. Qur'an audio alignment
- Use stable surah and ayah identifiers as the canonical alignment keys.
- Record riwaya and reciter as explicit metadata; do not label an audio file with a riwaya unless verified.
- Store segment boundaries only when the source provides reliable timestamps; label approximate alignment clearly.
- Support full-surah and ayah-range recordings without assuming every recording is segmented.
- Distinguish recitation from translation, tafsir, commentary and teacher explanation.
- Keep playback speed controls from changing or rewriting the source asset.
- Do not use generated audio as a substitute for verified Qur'an recitation.
- Any displayed Arabic text must come from the approved Uthmani text source/version and be independently checked.

## 4. Media ingestion and editorial workflow
Proposed workflow:
1. Authorized editor creates a media metadata record.
2. Upload is accepted only through a short-lived, scoped upload authorization.
3. Server validates declared and detected file type, size and checksum.
4. Quarantine unreviewed uploads; scan for malware and unsafe content.
5. Verify rights, source attribution, language, reciter/teacher metadata and content accuracy.
6. Generate approved derivatives (e.g. thumbnails or adaptive streaming variants) in an isolated processing pipeline.
7. Reviewer previews output, checks captions/transcript and approves publication.
8. Publish only the approved asset and create a versioned content reference.
9. Revoke or replace an asset through an auditable editorial action.

Never trust client-provided MIME type, file extension or metadata. Reject executable formats and unexpected content. Limit upload size, duration, dimensions and rate. Do not permit learners to publish arbitrary media in the initial release.

## 5. Storage, access and delivery
- Keep original and derived objects in separate logical namespaces.
- Use private storage by default.
- Public assets require explicit rights and publication approval.
- Private course/class assets require authenticated, server-authorized access.
- Use short-lived signed URLs or authenticated streaming tokens for private objects.
- Do not expose service-role keys, storage secrets or permanent private URLs in client code.
- Ensure authorization is rechecked when issuing a URL; URL expiry limits exposure but does not replace access control.
- Apply cache headers according to visibility and rights. Do not publicly cache private student/class media.
- Use a CDN only after cache invalidation, access-control behavior and data-region implications are reviewed.
- Avoid predictable object keys and directory listings.

## 6. Playback experience
- Responsive audio/video player with play, pause, seek, volume and accessible controls.
- Show verified reciter, riwaya, source and surah/ayah range where available.
- Offer playback speed only where appropriate and clearly distinguish speed from original recording.
- Support repeat ayah/range and bounded repeat counts for memorization, with user-controlled stop.
- Provide transcript/captions for educational speech where available and licensed.
- Show loading, buffering, unavailable, rights-restricted and offline states.
- Avoid autoplay by default, especially for minors and in quiet settings.
- Do not use manipulative streaks, leaderboards or pressure prompts around listening time.
- RTL-safe titles and text; keyboard and screen-reader operation.
- Respect device accessibility settings and reduced motion.

## 7. Offline access and downloads
Offline access is optional and must be scoped by rights, user choice and device capability.
- Start with explicit “save for offline” action for eligible assets.
- Show estimated file size and required storage before download.
- Download only approved media; never cache private assets beyond the authorized user's scope.
- Encrypt or otherwise protect locally stored private content where platform capabilities allow; do not claim strong protection without a verified implementation.
- Store minimal offline metadata and avoid caching profile, attendance, grades, messages or payment data.
- Define license expiry and access revocation behavior; an offline copy cannot be remotely erased reliably while a device is disconnected, so rights must explicitly permit the chosen model.
- Allow users to remove downloads and clear cached media.
- Handle interrupted downloads, checksum mismatch, insufficient storage and app logout safely.
- Do not download automatically over mobile data unless the user explicitly enables it.
- Provide Wi-Fi-only and storage-limit preferences if offline media is approved.

## 8. Accessibility, transcripts and localization
- Provide captions for spoken educational video where available.
- Provide transcripts for lesson audio when approved; mark machine-generated transcripts as unverified until reviewed.
- Do not present automated Arabic speech recognition as authoritative Qur'an text.
- Ensure captions and transcripts identify speaker/reciter when known.
- Provide meaningful alt text for images and diagrams.
- Support Persian and Arabic RTL plus mixed-direction text and numerals.
- Ensure player controls have accessible names, focus order and keyboard operation.
- Do not encode meaning solely by color or sound.
- Review font rendering and Uthmani glyph shaping across supported Android browsers/devices.

## 9. Rights, licensing and takedown
Maintain a rights record for every published asset:
- rights holder / creator
- source and acquisition date
- license name/version and evidence reference
- allowed territories, audience and channels
- streaming, offline download, derivative and redistribution permissions
- attribution text and required notices
- expiration/review date
- takedown contact and dispute state

A file being publicly reachable does not mean it is free to reuse. Do not bundle copyrighted recitations, translations, books, lectures or videos without permission. Support rapid unpublishing while preserving a minimal audit record. Establish a review process for rights complaints and mistaken takedowns.

## 10. Conceptual data model
Design concepts only; reconcile with current schema and storage configuration before migration:
- media_assets: media_type, title, language, source_id, rights_record_id, publication_state, current_version_id.
- media_asset_versions: asset_id, version, object_key, checksum, mime_detected, byte_size, duration_ms, width, height, processing_state.
- media_sources: source_name, creator_or_reciter, riwaya, edition, source_reference, attribution.
- media_rights: rights_holder, license_name, evidence_reference, allowed_uses, territory_scope, expires_at, review_status.
- media_content_links: asset_version_id, content_type, content_id, surah_number, ayah_start, ayah_end, alignment_quality.
- media_transcripts: asset_version_id, language, transcript_text, verification_state, reviewer_id.
- media_derivatives: source_version_id, derivative_type, object_key, checksum, processing_status.
- media_access_grants (if required): asset_id, principal_scope, related_course_or_class, expires_at.
- media_download_entitlements: user_id, asset_version_id, granted_at, expires_at, license_scope.
- media_audit_events: actor_id, asset_id, event_type, timestamp, minimal_change_summary.

Use immutable version records for published assets. Do not overwrite a file in place when the content or rights materially change.

## 11. Security and privacy
- RLS protects metadata rows; private object access is separately enforced by storage policies or server-issued signed access.
- Public catalog queries return only approved public metadata.
- Learner media access is scoped to published public content and their own active course/class entitlements.
- Teacher access is scoped to currently assigned classes and approved content workflows.
- Admin/editor privileges are separated from finance and ordinary teacher roles.
- Upload, replace, approve, publish and takedown actions require server-side authorization and audit.
- Prevent IDOR by checking both asset identity and entitlement on every private access path.
- Rate-limit uploads and media token issuance.
- Avoid logging signed URLs, tokens or private transcripts.
- Revoke access after enrollment expiry, class reassignment or role demotion.
- Do not allow cross-user access through predictable storage paths.

## 12. Reliability and performance
- Verify checksum after upload, processing and download.
- Use resumable uploads/downloads where supported.
- Use bounded retries and idempotent processing jobs.
- Track processing states: uploaded, quarantined, scanning, processing, review_required, approved, published, rejected, revoked.
- Keep original masters and derivatives versioned with documented retention.
- Provide low-bandwidth playback options only where the source and rights permit.
- Avoid preloading large files on mobile networks.
- Monitor availability and processing failures without collecting unnecessary user behavior.
- Establish backup, restore and disaster recovery objectives before storing irreplaceable masters.

## 13. Acceptance and security tests
1. Unauthenticated users cannot access private media objects or metadata.
2. Learner A cannot retrieve a private asset entitled only to Learner B.
3. Teacher without current class assignment cannot issue media access for that class.
4. Role demotion or enrollment expiry blocks new signed access.
5. Expired signed URLs cannot be reused beyond their expiry.
6. Unreviewed/quarantined assets are never publicly visible.
7. Spoofed MIME type, oversized file and disallowed formats are rejected.
8. Checksum mismatch prevents publication or successful offline completion.
9. Rights-restricted assets cannot be downloaded when license disallows offline use.
10. Public CDN/cache behavior never leaks private class content.
11. Takedown removes public availability within the defined operational target.
12. Arabic text is sourced from approved Uthmani text and is not generated from audio.
13. Machine-generated transcripts remain visibly unverified until reviewed.
14. Offline cache contains no attendance, grades, private messages or payment information.
15. Logout and entitlement revocation follow the documented local-cache policy.
16. RTL, keyboard, screen-reader, captions and low-bandwidth tests pass.

## 14. Release sequence
1. Inventory existing storage buckets, policies, content tables, uploaded files and current rights evidence.
2. Approve media types, file limits, editorial roles and rights policy.
3. Build metadata catalog and private upload pipeline in a feature branch using synthetic files.
4. Add scanning, processing, versioning and editorial approval.
5. Add audio player using one verified, licensed test recording.
6. Add video only after caption, moderation and bandwidth review.
7. Pilot offline access only for assets with explicit offline rights and a tested revocation/expiry model.
8. Run storage authorization, privacy, accessibility, performance and rights tests in staging.
9. Obtain explicit approval before production bucket changes, bulk uploads, CDN/provider setup, migration or release.

## 15. Decisions required
- Which reciters, riwayat and audio sources are approved?
- Which media licenses permit streaming, offline use and derivatives?
- Are lesson video uploads required at launch, or is audio sufficient?
- Who may upload, review, approve, publish and take down assets?
- What file formats, size limits and processing service are supported?
- Is offline access required at launch, and what content is eligible?
- What retention and backup policy applies to source masters and derivatives?
- Which devices/browsers are officially supported?
- Which transcript languages are required and who verifies them?

## 16. Status and safety
This is a design document only. No storage bucket, object, media file, audio/video player, CDN, offline cache, upload pipeline, provider, credential, database schema, RLS, grants, RPC, trigger or live setting was changed. No copyrighted asset was copied or uploaded. No learner data was accessed or modified. No migration, deployment, merge or release was performed.
