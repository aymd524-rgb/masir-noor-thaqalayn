# Stage 173 — Qur'an and Ahl al-Bayt Learning Content Library and Ready-Lesson Authoring
Date: 2026-11-24
Status: design/documentation only. No content records, lesson editor, media asset, database object, migration, storage bucket or production setting implemented.

## 1. Purpose
Design an editorially governed library of ready-to-teach learning material for Qur'an and Ahl al-Bayt education. The library should help teachers prepare lessons for different ages and learning levels while preserving source accuracy, clear attribution, age-appropriate presentation and licensing.

## 2. Content domains
The library may organize:
- Qur'an text, surah/ayah references and approved recitation
- translations with translator and edition attribution
- tafsir and tadabbur prompts, clearly distinguished from the Qur'an text
- hadith with source, chain/collection details where available, grading and scholarly review metadata
- ethics and character education
- seerah and stories of prophets, Ahl al-Bayt and exemplary figures
- vocabulary, Arabic language and tajwid lessons
- memorization and revision activities
- quizzes, worksheets, classroom games and group activities
- teacher guides, lesson plans and presentation resources
- age-appropriate reflection and discussion prompts

A content category is a navigation aid, not proof of religious authenticity.

## 3. Content-type separation and source integrity
Every item must have a declared content type. At minimum distinguish:
- canonical Qur'an text
- translation
- tafsir
- hadith
- historical report/story
- teacher-authored explanation
- learner activity or question
- AI-assisted draft awaiting review

Do not merge translation, tafsir, commentary or generated text into the canonical Arabic Qur'an field. Qur'an text must use the approved Uthmani source and stable surah/ayah identifiers. Preserve diacritics and orthography. Search normalization may be stored separately and must never modify displayed canonical text.

Hadith records should include the original wording where licensed, collection/source, book/chapter or reference, narrator metadata where verified, authenticity grading with the grading authority, edition, reviewer and notes on differences. Do not invent a grading or imply consensus when sources differ.

Historical narratives should identify whether the account is Qur'anic, hadith-based, sourced historical material or an educational retelling. Distinguish established facts from disputed reports and creative transitions.

## 4. Editorial metadata
Each content item may include:
- stable content identifier and content type
- title and short description
- language and script
- author, translator, editor or reciter
- source title, edition, volume/page or hadith reference
- publisher/source URL where appropriate
- licensing and permitted use
- age band and learning level
- subject, skill and curriculum tags
- estimated duration and required materials
- learning objectives and prerequisites
- reviewer identity and review date
- publication status and version
- correction history and withdrawal reason
- accessibility metadata, transcript and captions

Do not publish an item with unresolved source, rights or review status.

## 5. Age and learning-level adaptation
Support age bands and learning levels as editorial guidance, not rigid assumptions. Example groupings may include early learners, primary learners, younger teens, older teens and adult learners, with course-configurable boundaries.

For each lesson, define:
- intended audience and reading level
- prerequisite knowledge
- core learning objective
- teacher preparation notes
- estimated time and activity sequence
- discussion questions
- optional extension or simplified version
- safeguarding considerations
- vocabulary and explanation notes

Avoid frightening, graphic or humiliating presentation. Sensitive historical or religious topics should be handled with factual, age-appropriate context and teacher guidance.

## 6. Ready-to-teach lesson structure
A reusable lesson may contain:
1. Lesson title and intended age/level.
2. Learning objectives.
3. Opening question or short warm-up.
4. Qur'an passage or approved source material.
5. Vocabulary and translation.
6. Reviewed explanation or tadabbur prompts.
7. Hadith or ethical connection with source details.
8. Story or historical context with source classification.
9. Activity, game, worksheet or group discussion.
10. Reflection and practical application.
11. Short formative assessment.
12. Teacher notes, adaptations and follow-up assignment.
13. References, licensing and reviewer details.

Teachers may adapt lesson delivery, but source attribution and canonical text remain protected.

## 7. Games and interactive activities
The library may include:
- verse/meaning matching
- vocabulary cards
- sequencing of a story using sourced events
- tajwid recognition exercises
- memorization review prompts
- team-based question rounds
- reflection cards and ethical scenarios
- age-appropriate group discussion activities

Each activity should specify age range, learning objective, group size, duration, materials, instructions, answer key and accessibility alternatives. Games must not turn religious learning into humiliation, exclusion or public ranking. Do not use elimination mechanics that shame learners.

## 8. Search, browse and discovery
Provide filters for:
- content type
- topic and curriculum unit
- age band and learning level
- skill dimension
- language
- duration
- source/reviewer status
- license and allowed use
- teacher-created versus centrally reviewed

Search results must show content type and source status so users do not confuse a story or commentary with Qur'an or hadith. Search indexing may normalize Arabic for discovery while preserving original display content.

## 9. Teacher authoring and reuse
Authorized educators may:
- assemble lesson plans from approved library items
- create private class notes and worksheets
- save draft lessons
- request editorial review
- duplicate a lesson into a new version without altering its source items
- schedule a lesson for an assigned class
- report an error or suggest a correction

Teacher-created material should be labeled as such and must not appear as centrally verified religious content unless it passes review. Editing a published shared item creates a new version and review cycle.

## 10. Editorial workflow
Suggested states:
- draft
- submitted_for_review
- source_check
- religious_review
- age_suitability_review
- rights_review
- approved
- published
- correction_required
- withdrawn
- archived

Sensitive or disputed material may require more than one qualified reviewer. Record reviewer scope and approval date. A reviewer must be able to reject or request correction with a reason. Emergency withdrawal should remove public access while preserving audit history.

## 11. AI-assisted content safeguards
AI may assist with brainstorming, lesson formatting, vocabulary drafts or age-level simplification, but:
- AI output is always labeled draft until human review.
- Never generate or reconstruct canonical Qur'an text from model output.
- Never invent Qur'an references, hadith wording, narrators, source citations or authenticity grades.
- Retrieve only from approved, rights-cleared sources for grounded summaries.
- Preserve direct citations and distinguish quotations from paraphrase.
- Flag uncertainty and disputed reports for qualified review.
- Do not provide automated fatwa or authoritative religious rulings.
- Do not publish generated material directly to learners without the required editorial approval.
- Prevent user-provided content from overriding editorial or system safeguards.

## 12. Media and licensing
For audio, video, images and downloadable documents:
- store creator, source, license, allowed audience and allowed reuse
- track reciter, riwaya and verse alignment for Qur'an audio
- distinguish recitation from translation audio and teacher commentary
- use private storage for class-only or restricted assets
- validate file type and size; scan uploads before access
- provide captions/transcripts and low-bandwidth alternatives
- preserve attribution when material is embedded in lessons
- record takedown and license-expiry actions
- do not assume that online availability grants reuse rights

## 13. Conceptual data model
Design only; reconcile with existing content and media structures before implementation:
- learning_content_items: content_type, title, description, language, age_band, level, status, current_version_id.
- learning_content_versions: content_item_id, version_number, body_reference, source_metadata, license_metadata, created_by, created_at.
- quran_verse_references: content_version_id, surah_number, ayah_start, ayah_end, canonical_source_id.
- hadith_source_references: content_version_id, collection, reference, grading, grading_authority, edition.
- content_review_events: content_version_id, reviewer_id, review_type, decision, reason, reviewed_at.
- lesson_templates: title, age_band, level, objectives, estimated_duration, status, owner_id.
- lesson_sections: lesson_version_id, order_index, section_type, content_reference, teacher_instruction.
- lesson_activities: lesson_version_id, activity_type, instructions, answer_key_reference, accessibility_alternative.
- content_tags: content_id, tag_type, tag_value.
- content_rights: content_version_id, rights_holder, license, permitted_use, expiry_date.
- content_reports: content_version_id, reporter_id, issue_type, description, status.

Prefer references to existing canonical Quran, media and class-resource entities over duplicate copies. Do not store learner personal data in shared content records.

## 14. Access control and privacy
- Public users may read only approved public content.
- Learners access course/class restricted content only through valid enrollment.
- Teachers create and manage their own drafts and assigned-class lesson plans.
- Editors/reviewers access only their authorized editorial scope.
- Admin actions are least-privilege and audited.
- Drafts, answer keys and restricted assets are not exposed through public queries.
- Enforce permissions server-side and through RLS; client-side filtering is not sufficient.
- Signed media access must verify current entitlement and expire promptly.
- Teacher reassignment and role demotion revoke access.
- Avoid learner tracking in shared content analytics; use aggregated, privacy-preserving metrics where appropriate.

## 15. Accessibility and learner safety
- Mobile-first RTL layouts with readable Arabic typography.
- Provide text alternatives for audio/video and captions for spoken material.
- Support keyboard and screen-reader navigation.
- Use clear language, manageable lesson duration and flexible activity choices.
- Keep age-appropriate safeguards for stories and sensitive topics.
- Do not enable unrestricted public comments or direct messaging in content pages.
- Provide a way to report incorrect, unsuitable or rights-infringing material.
- Avoid public leaderboards and pressure-based completion mechanics.

## 16. Quality assurance and acceptance tests
1. Canonical Uthmani Qur'an text is never overwritten by translations, tafsir or AI output.
2. Every published Qur'an excerpt resolves to a valid canonical surah/ayah range.
3. Every published hadith item has a verifiable source reference and grading provenance where a grade is shown.
4. Disputed historical reports are labeled and not presented as undisputed fact.
5. Draft or unreviewed AI content is not visible as approved learner content.
6. Unlicensed media cannot be published or downloaded for reuse.
7. Public users cannot access class-restricted materials or answer keys.
8. Learners cannot access resources for classes in which they are not enrolled.
9. Teachers cannot edit another teacher's private drafts without authorization.
10. Reviewer decisions and published versions are auditable.
11. Corrections create a new version and preserve the prior review history.
12. Emergency withdrawal blocks access without erasing the audit trail.
13. Search normalization does not alter displayed Arabic text.
14. Age filters and accessibility alternatives work as specified.
15. Uploaded media is validated and scanned before learner access.
16. Signed URLs expire and are not reusable after entitlement revocation.
17. Lesson activities do not expose learner data in shared content records.
18. RTL, low-bandwidth and screen-reader paths are tested.

## 17. Rollout sequence
1. Inventory existing Quran, media, content and lesson structures.
2. Approve taxonomy, source metadata and licensing rules.
3. Select a small set of rights-cleared, verified pilot lessons.
4. Define editorial reviewer roles and correction/withdrawal workflow.
5. Prototype teacher lesson assembly using existing approved content.
6. Test Uthmani rendering, search normalization and media access.
7. Pilot with a supervised class and collect teacher feedback.
8. Expand the library only after source, rights and age review.
9. Obtain explicit approval before any schema migration, production setting or release.

## 18. Decisions required
- Which content domains should be included in the first release?
- Which age bands and learning-level taxonomy should be adopted?
- Who qualifies as a reviewer for Qur'an, hadith, history and age suitability?
- Which source editions and translations are approved?
- Which licenses permit display, download, classroom reuse or redistribution?
- Can teachers publish class-only material without central review, and what labels apply?
- Which AI-assisted authoring tasks are permitted?
- What is the correction and emergency-withdrawal response target?
- Which lesson templates should be included in the initial pilot?

## 19. Status and safety
This is a design document only. No lesson, content item, hadith record, media asset, editorial account, database table, migration, RLS policy, RPC, trigger, storage bucket, UI or production setting was created or changed. No learner data was accessed or modified. No merge, deployment or release was performed.
