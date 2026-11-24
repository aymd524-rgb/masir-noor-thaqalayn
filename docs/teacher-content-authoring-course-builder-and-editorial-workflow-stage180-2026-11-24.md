# Stage 180 — Teacher content authoring, lesson builder, and editorial workflow

**Date:** 2026-11-24  
**Status:** Product, academic, UX, and security design proposal  
**Scope:** Authoring reusable lessons and courses from approved Quranic and educational resources.

## 1. Purpose

Enable authorized teachers and academic teams to assemble structured lessons and courses from trusted content: Quran text, translations, tafsir, hadith, ethics, stories, games, activities, worksheets, audio/video, and memorization plans. The system should make lesson preparation easier while preserving source integrity, licensing, scholarly review, age suitability, and tenant boundaries.

This design builds on the content library and ready-lesson concepts in Stages 156 and 173 and the course lifecycle in Stage 163. It is not an implementation.

## 2. Authoring roles and scope

- Platform content editor: maintains shared canonical resources and global editorial standards.
- Institution academic supervisor: approves institution-specific curriculum and teaching materials.
- Institution content manager: manages local library, categories, and publication workflow.
- Teacher: creates private drafts and publishes only within authorized classes/courses after required approval.
- Reviewer/scholar: reviews assigned religious or academic content and records decision.
- Learner: views only published materials assigned or made available to their enrollment.
- Guardian: sees only approved learning summaries or resources within verified, consented scope.

A teacher may author for currently assigned classes and courses only. Cross-institution reuse requires an explicit license and publication scope; membership in one institution does not grant editing rights in another.

## 3. Lesson and course structure

A lesson may contain ordered blocks:
1. Learning objectives and prerequisite level.
2. Quran passage with canonical Uthmani text and precise surah/ayah references.
3. Translation, clearly labeled by translator and edition.
4. Tafsir or explanatory notes, clearly separated from the Quran text.
5. Hadith with source, reference, narrator/source metadata where available, and reviewed authenticity grading.
6. Ethics and practical application.
7. Historical or educational story with references and age suitability.
8. Games, group activities, reflection prompts, and discussion questions.
9. Memorization and revision assignment.
10. Quiz, oral assessment rubric, worksheet, or homework.
11. Teacher notes, estimated duration, required materials, and accessibility alternatives.

A course groups lessons into modules, sequence, prerequisites, estimated workload, assessments, and completion rules. The same lesson may be reused in multiple courses only through versioned references, not by copying untracked text.

## 4. Visual lesson builder

Proposed authoring experience:
- Mobile-first, RTL editor for Persian and Arabic, with desktop-friendly expanded workspace.
- Add, remove, reorder, duplicate, and preview lesson blocks.
- Search the approved content library and insert references rather than copying canonical text.
- Preview learner view at supported age/level settings.
- Autosave draft with explicit save/error state and version history.
- Accessibility labels, keyboard navigation, and screen-reader support.
- Clear distinction between teacher-only notes and learner-visible content.
- Templates for hifz session, tajwid practice, translation/tadabbur, hadith/ethics, story/game session, and assessment preparation.

The editor must never display a false published or saved state when persistence failed. Conflicting edits should be surfaced for resolution rather than silently overwriting another editor's work.

## 5. Quran text and source integrity

- Canonical Quran text uses the approved Uthmani edition and must remain immutable through ordinary lesson editing.
- Store surah and ayah identifiers separately from presentation strings.
- Preserve verse order, orthography, diacritics, and verified text version.
- Never allow an AI rewrite, translation edit, formatting operation, or lesson copy to mutate canonical Quran text.
- Translation is a separate attributed work with translator, edition, language, license, and version.
- Tafsir is separate from translation and teacher commentary.
- Hadith includes source work, book/chapter/reference, edition, available grading and reviewer provenance; do not invent missing grading.
- Stories and historical claims require sources and editorial review status.
- Any correction to shared canonical content follows a separate controlled editorial process and creates a new version with an audit trail.

## 6. Lesson authoring workflow

Proposed lifecycle: draft → submitted_for_review → changes_requested or approved → scheduled → published → archived.

Rules:
- Drafts are private to their authorized author/editorial team.
- Submission freezes a reviewable version.
- Reviewer comments attach to a version and block publication until required issues are resolved.
- Religious-source claims, Quran text references, hadith metadata, and sensitive historical narratives receive appropriate subject-matter review.
- Institution-specific pedagogical notes may use a lighter review route if they do not alter canonical or scholarly claims.
- Publishing creates an immutable published version; edits create a new draft version.
- Archive removes future discovery but does not silently erase lesson history from completed learning records.

## 7. Age, level, and learning adaptation

Each lesson should declare:
- Intended age range and educational level.
- Reading fluency and prerequisite knowledge.
- Learning objectives and expected duration.
- Sensitive themes and safeguarding notes.
- Vocabulary complexity and accessibility alternatives.
- Whether the activity requires teacher supervision or group participation.

Adaptation may simplify explanations, examples, instructions, and activities, but must not distort Quran text, source quotations, or scholarly positions. Different age variants should be separately reviewed and versioned.

## 8. Reusable templates and curriculum planning

Provide optional templates:
- One-session lesson.
- Three-session weekly plan.
- Hifz and spaced revision cycle.
- Tajwid concept and practice.
- Quran translation and tadabbur.
- Hadith, ethics, and story.
- Quran game/activity.
- Assessment and review session.

Templates are starting points, not mandatory curricula. Teachers can adjust pace and workload to learner needs. Avoid competitive pressure or punitive streaks for missed sessions. Course-level plans should distinguish new memorization, near revision, cumulative revision, and rest days.

## 9. Assignments, assessment, and learner progress links

Lesson blocks may reference existing assignment and assessment designs:
- A hifz task references exact surah/ayah range and whether it is new memorization or revision.
- A quiz references a versioned question set and scoring policy.
- An oral assessment references a teacher rubric and assigned learner scope.
- A reflection prompt is not automatically graded as a single correct doctrinal answer.
- Completion of a lesson is distinct from verified mastery.
- Learner progress records distinguish self-reported practice, teacher assessment, and approved mastery evidence.

Changing a lesson after learners begin it must not retroactively change the version used for prior submissions or assessment.

## 10. Media, licensing, and accessibility

- Every image, audio, video, worksheet, and external resource requires source, license, attribution, permitted audience, and expiry metadata.
- Do not upload or distribute content without rights.
- Recitation assets retain reciter, riwaya, source, ayah alignment, and license metadata from Stage 178.
- Provide captions/transcripts for video/audio where available and authorized.
- Offer low-bandwidth alternatives and printable materials only when licensing permits.
- Validate file type, size, malware status, and private/public scope before storage.
- Private class materials use private storage and short-lived authorized access.
- Do not expose teacher draft attachments through public URLs.

## 11. AI-assisted authoring boundaries

AI may optionally help propose lesson outlines, age-appropriate activity ideas, vocabulary explanations, or draft questions from approved sources. It must not:
- Generate or modify canonical Quran text.
- Invent verses, hadith, sources, authenticity grades, scholarly consensus, or quotations.
- Present an unsourced explanation as tafsir or a fatwa.
- Publish content without authorized human review.
- Retrieve private class or learner information outside the author's authorization.
- Use learner recordings or personal data as authoring context without a separately approved lawful purpose and consent.

Every AI-suggested factual claim should be traceable to approved source records. Uncertainty must be visible, and disputed fiqh or theological matters require qualified human review.

## 12. Collaboration and version control

- Support co-author and reviewer roles with explicit permissions.
- Record author, reviewer, approval, publication, and archive events.
- Use immutable lesson versions and stable references from course modules.
- Show differences between versions, including source-reference changes.
- Preserve prior versions for audit and completed-course integrity.
- Resolve concurrent edits explicitly; no last-write-wins for scholarly text.
- Allow reviewer annotations without modifying the author's draft content.

## 13. Search, discovery, and reuse

Search by topic, surah/ayah, age band, skill, content type, duration, institution, approval status, and license. Results must respect tenant visibility and publication status. Shared canonical resources can be reused under their license; institution-private lessons remain private unless explicitly shared. Track reuse references and downstream course dependencies so a source withdrawal or correction can trigger a review of affected lessons.

## 14. Conceptual records (not migrations)

Potential entities:
- lesson_drafts: author, institution scope, status, and current draft version.
- lesson_versions: immutable content snapshot, author, reviewer, and publication metadata.
- lesson_blocks: ordered typed blocks with stable source references.
- lesson_reviews: reviewer, decision, comments, and reviewed version.
- course_modules: ordered lesson references and prerequisite rules.
- content_source_links: source, license, attribution, and version.
- lesson_templates: reusable block structure and intended audience.
- lesson_collaborators: scoped author/reviewer permissions.
- lesson_publication_events: submit, approve, publish, archive, and correction audit events.

These are conceptual only. Final schema, tenancy, constraints, RLS, RPCs, storage, and migration design require separate review.

## 15. Authorization and quality test matrix

Use synthetic users and content in isolated staging:
- Teacher can draft only within authorized institution/course/class scope.
- Teacher cannot publish into an unassigned class or another institution.
- Learner can read only published content assigned or available to their enrollment.
- Guardian sees only explicitly permitted learner resources and summaries.
- Reviewer can review only assigned versions and cannot silently rewrite canonical sources.
- Drafts and unpublished attachments are inaccessible to learners and public visitors.
- Quran text remains byte/version stable through lesson edits, copy, export, and AI assistance.
- Translation, tafsir, hadith, story, and teacher commentary remain visibly distinct.
- Missing/expired licenses block publication or distribution as policy requires.
- Concurrent edits create a conflict state rather than silent overwrite.
- Published course cohorts retain the version assigned at enrollment.
- Source correction/withdrawal identifies affected lessons for review.
- AI suggestions without traceable sources cannot be marked academically approved.
- Role demotion and membership revocation remove editing/publishing access on subsequent requests.
- Search and exports obey the same tenant and publication authorization.

## 16. Decisions required before implementation

- Which roles can approve religious content at platform and institution levels?
- Which content types require scholar review versus academic/editorial review?
- Which Quran text edition and translation catalog are approved?
- What source and licensing metadata are mandatory for each media/content type?
- Can teachers share lessons across institutions, and under what license/approval?
- What age bands and default lesson templates should ship first?
- Which AI-assisted authoring functions, if any, are permitted?
- How long should drafts, reviews, and historical versions be retained?

## 17. Explicit non-actions

This stage is documentation only. No lesson editor, content upload, course builder, template, AI authoring, publication workflow, approval UI, search index, database schema, RLS policy, SQL function, migration, storage bucket, media asset, notification, analytics, Supabase configuration, deployment, merge, or production setting was created or changed. No learner or institution data was accessed. All capabilities remain proposals pending academic, scholarly, licensing, privacy, safeguarding, product, and technical approval.
