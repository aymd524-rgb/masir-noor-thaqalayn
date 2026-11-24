# Stage 181 — Curated ready-to-teach Quran and Hadith content bank

**Date:** 2026-11-24  
**Status:** Product, editorial, academic, licensing, and security design proposal  
**Scope:** A governed catalog of reviewed, reusable educational content packs for teachers and learners.

## 1. Purpose and boundary

Define how the platform can offer a searchable bank of ready-to-teach educational packs so teachers do not need to prepare every lesson from scratch. This stage focuses on the catalog, editorial curation, content-pack quality, discovery, reuse, and lifecycle governance. It complements the content-library architecture (Stage 156), lesson-authoring plan (Stage 180), and ready-lesson concepts (Stage 173); it does not replace them.

A content pack is a curated collection of independently sourced and versioned learning resources, such as a short lesson sequence, verse study, hadith-and-ethics unit, story with references, activity set, or memorization/revision aid. A pack is not automatically a course, and adding it to a teacher's workspace does not grant rights to republish every included asset.

## 2. Content-bank audiences

- Teachers: discover suitable materials, preview them, and add authorized resources to a class or lesson plan.
- Academic supervisors: review suitability, learning outcomes, source quality, and alignment with institutional curriculum.
- Scholars and subject reviewers: verify Quran references, hadith sourcing, tafsir attribution, historical claims, and sensitive religious content within their expertise.
- Content editors: curate metadata, quality, accessibility, and version lifecycle.
- Institution administrators: select approved shared or institution-specific packs for their programs.
- Learners: access only the published resources assigned to them or made available through an authorized course.
- Guardians: receive only the permitted learning summaries or resources within verified, consented scope.

## 3. Content pack categories

Initial catalog categories may include:
- Quran reading and fluency.
- Hifz and spaced revision.
- Tajwid concepts and practice.
- Translation and vocabulary.
- Tadabbur and reflection.
- Hadith study and ethics.
- Prophetic biography and Ahl al-Bayt history.
- Quranic stories and verified historical narratives.
- Games, group activities, and classroom engagement.
- Worksheets and printable activities.
- Assessment and review resources.
- Teacher preparation guides.

Categories are navigation aids, not evidence of scholarly authority. A pack can have multiple tags while retaining one stable identity and version history.

## 4. Standard pack contents

Each pack should declare, as applicable:
- Title, short description, language, category, topic tags, and intended audience.
- Age range, educational level, prerequisites, and estimated teaching time.
- Learning objectives and suggested session sequence.
- Included resources and their individual source references.
- Quran surah/ayah references and canonical text edition, where relevant.
- Translation author/edition, tafsir author/work/edition, and attribution.
- Hadith source, exact reference, edition, and reviewed grading metadata where available.
- Historical/story references and reviewer notes.
- Suggested activities, discussion prompts, and assessment approach.
- Required teacher supervision, sensitive-content notices, and accessibility alternatives.
- License, attribution, allowed uses, geographic or time limits if any, and expiry/review date.
- Academic review status, reviewers' subject areas, and current published version.

A missing source, license, or scholarly detail must be represented as unknown or not supplied; the system must not fill gaps with invented metadata.

## 5. Editorial curation and approval

Proposed workflow:
proposed → source_check → subject_review → pedagogical_review → accessibility_and_rights_check → approved → published → review_due / withdrawn / archived

- A pack may contain resources with different review requirements; the pack-level status cannot exceed the weakest required approval for learner-facing publication.
- Quran text integrity, hadith attribution, tafsir representation, and historical claims require suitable subject review.
- Age suitability, learning outcomes, clarity, and activity safety require pedagogical review.
- Media and third-party text require rights and attribution review.
- Review decisions are attached to a precise version and record reviewer scope, date, outcome, and rationale.
- Reviewers may request changes; publication is blocked until required changes are resolved.
- A published pack is immutable. Updates create a new version and preserve prior versions for course history.
- Emergency withdrawal can block new use while retaining audit evidence and already-issued learner records.

## 6. Source hierarchy and religious accuracy

- Quran text is sourced from the approved canonical Uthmani edition and remains separate from translation, tafsir, and teacher explanation.
- Translation is an attributed interpretation and must not be presented as the Quran's Arabic text.
- Tafsir quotations and summaries identify their author/work and edition; editorial paraphrases are labeled as such.
- Hadith entries preserve exact source references and any available grading with named provenance. No grade or authenticity judgment is inferred when not documented.
- Historical narratives distinguish established source material, scholarly disagreement, and pedagogical retelling.
- Teacher-created reflections and AI-assisted drafts are labeled as educational commentary, not primary religious sources.
- Disputed fiqh/theological questions are routed to qualified review and show uncertainty where appropriate.
- Corrections to a source create a traceable correction record and identify all dependent packs.

## 7. Discovery and filtering

The catalog should support search and filters for:
- Topic, keyword, surah/ayah, hadith source, and learning objective.
- Age range, education level, prerequisite skill, and estimated duration.
- Content type, language, category, and teaching format.
- Review status, reviewer scope, publication date, and next review date.
- License and permitted usage, including class-only or institution-wide use.
- Institution scope, shared-platform scope, and teacher's authorized collections.
- Accessibility features such as captions, transcripts, readable worksheets, and low-bandwidth alternatives.

Search results must not reveal private drafts, restricted packs, private class resources, reviewer-only notes, or tenant metadata to unauthorized users. Search snippets must preserve the distinction between Quran, translation, tafsir, hadith, and commentary.

## 8. Teacher preview and adoption

Before adding a pack, teachers should be able to inspect:
- Objectives, audience, duration, and prerequisites.
- A learner-facing preview and teacher-only guidance.
- Sources, review status, version date, and licensing summary.
- Required materials, accessibility alternatives, and safeguarding notes.
- Which assets may be printed, downloaded, modified, or shared.

Adding a pack to a class creates a reference to a specific approved version and records the adopting teacher, class/course scope, and adoption date. It does not silently copy restricted media or grant broader publication rights. The teacher may create a local adaptation as a separate derivative draft, subject to license and review requirements.

## 9. Curated learning pathways

The bank may offer optional sequences, such as:
- Beginner Quran reading pathway.
- First steps in memorization and revision.
- Introductory tajwid sequence.
- Short surah translation and reflection.
- Hadith and everyday ethics.
- Prophetic biography and verified historical learning.
- Quran games and family learning activities.

Pathways should state prerequisites, flexible pacing, and optional enrichment. They must not imply that all learners progress at the same speed or penalize breaks. Teachers may reorder or omit units while preserving source attribution and required prerequisites.

## 10. Personalization and recommendation safeguards

Recommendations may use teacher-selected age band, level, course objectives, and declared learning needs. They should:
- Explain why a pack is suggested (for example, topic, level, or prerequisite match).
- Allow teachers to dismiss or override suggestions.
- Avoid sensitive profiling and unnecessary learner data collection.
- Avoid public popularity rankings as a proxy for religious or academic quality.
- Never recommend withdrawn, expired-license, or unreviewed content for learner publication.
- Keep institution-specific recommendations within the institution's authorized scope.

Any future AI recommendation feature must use approved metadata and access-controlled content, and must not infer a learner's religious belief, family circumstances, or other sensitive traits.

## 11. Licensing and permitted reuse

Every included asset has its own rights record. Pack-level licensing must not override a more restrictive asset license.
- Distinguish view, classroom display, print, download, adaptation, and redistribution permissions.
- Show attribution at the point of use and in exports.
- Track license version, source URL/reference, rights holder where known, and review date.
- Expired or disputed rights block new distribution according to policy.
- Do not assume online availability means permission to reproduce.
- Provide a removal and correction process for rights-holder claims.
- Public-domain status and jurisdiction must be verified rather than assumed.

## 12. Accessibility, age suitability, and child safeguarding

- Use clear language appropriate to declared age and educational level.
- Provide readable RTL layouts and correct Arabic shaping/diacritics.
- Offer text alternatives for essential audio/video content where available.
- Ensure activities are inclusive and do not require disclosure of private family or personal information.
- Mark activities requiring teacher supervision.
- Avoid humiliating, coercive, or high-pressure competition mechanics.
- Do not expose learner submissions, voice recordings, or personal details as public examples without explicit authorization and appropriate consent.
- Review sensitive historical and religious topics for age suitability and respectful presentation.

## 13. Versioning, dependencies, and correction propagation

- Assign each pack and each included resource a stable identifier and immutable version.
- Record the exact versions adopted by each class/course.
- Display when a newer approved version exists without silently replacing the adopted version.
- Maintain dependency links from packs to source assets and from courses to adopted packs.
- When a source is corrected, withdrawn, or its license expires, identify affected packs and courses for review.
- Provide a controlled notice to affected teachers and administrators without exposing learner data.
- Preserve historical assessment context and learner completion records against the version actually used.

## 14. Conceptual data records (not migrations)

Potential entities:
- content_packs: stable pack identity, category, scope, and lifecycle.
- content_pack_versions: immutable version, objectives, audience, duration, and publication metadata.
- content_pack_items: ordered references to versioned content assets.
- content_reviews: reviewer, subject scope, decision, rationale, and reviewed version.
- content_rights_records: asset-level license, attribution, permitted use, and expiry.
- content_pack_tags: controlled topic, skill, age, and format taxonomy.
- content_pack_adoptions: teacher/class/course reference to a specific approved version.
- content_dependencies: source-to-pack and pack-to-course dependency graph.
- content_corrections: source correction, withdrawal, impact analysis, and resolution.
- content_pathways: optional ordered sequence of pack-version references.

These are conceptual records only. Final schema, constraints, indexes, RLS, RPCs, storage policies, and migration strategy require separate engineering review.

## 15. Authorization and quality test matrix

Use synthetic accounts and content in isolated staging:
- Teacher can discover and adopt only packs allowed for their institution and class/course scope.
- Teacher cannot access reviewer notes or private drafts without explicit collaborator permission.
- Learner sees only published packs assigned or available through an authorized enrollment.
- Guardian sees only explicitly permitted learner resources and summaries.
- Institution A cannot enumerate or fetch institution B's private packs, assets, reviews, or adoption records.
- Public users see only intentionally public, approved, rights-cleared catalog entries.
- Search, filters, previews, exports, and media downloads enforce identical access rules.
- Expired or withdrawn assets cannot be newly adopted or distributed.
- Quran text remains canonical and separate from translations, tafsir, and commentary.
- Every hadith or historical claim displayed as sourced has a traceable reference.
- Pack publication is blocked when required review or rights checks are incomplete.
- Published versions remain immutable and class adoptions retain their chosen version.
- Source corrections identify dependent packs and courses.
- Accessibility metadata and age suitability are visible before adoption.
- Role demotion or membership revocation removes subsequent access to restricted catalog operations.

## 16. Initial rollout proposal

A cautious first release, after separate approval and implementation planning, could start with a small, manually curated catalog:
1. A limited set of short, source-verified Quran learning packs.
2. A small number of age-banded hifz and revision resources.
3. Selected tajwid and reading-fluency activities.
4. A limited hadith-and-ethics set with reviewed source metadata.
5. Teacher guides and printable activities with confirmed reuse rights.

Expand only after editorial throughput, source quality, licensing, accessibility, and teacher feedback are measured. Do not import a large unreviewed corpus merely to make the catalog appear full.

## 17. Decisions required before implementation

- Who owns platform-wide curation and who can approve institution-specific packs?
- Which scholarly review standards and source editions are mandatory?
- What licenses and reuse permissions are accepted?
- Which age bands and initial categories should be prioritized?
- Can teachers create derivative packs, and what review/attribution rules apply?
- What is the process and response time for rights-holder claims and urgent corrections?
- How long are withdrawn versions and review records retained?
- Which limited pilot catalog can be assembled with verified rights and qualified reviewers?

## 18. Explicit non-actions

This stage is documentation only. No content pack, lesson, Quran/hadith corpus, translation, tafsir, media asset, content upload, catalog UI, search index, recommendation engine, review workflow, database table, RLS policy, SQL function, migration, storage bucket, notification, analytics, Supabase configuration, deployment, merge, or production setting was created or changed. No learner, teacher, or institution data was accessed. All capabilities remain proposals pending scholarly, academic, licensing, privacy, safeguarding, product, and technical approval.
