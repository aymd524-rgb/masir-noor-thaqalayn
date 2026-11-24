# Stage 156 — Qur'an learning content library and editorial governance

Date: 2026-11-24  
Repository: `aymd524-rgb/masir-noor-thaqalayn`  
Related pull request: #9

## Scope and evidence boundary

This stage proposes a structured content library for Qur'an learning across age groups. It covers Uthmani Qur'an text, translations, recitation audio, tafsir and tadabbur, hadith, verified stories, activities, and learning games.

This is a design and governance document only. It does not claim that these content modules or datasets have been implemented, licensed, imported, or published. No live database was queried, no personal/student rows were read, and no SQL, DDL, DML, migration, RLS policy, grant, function, trigger, Auth/Data API setting, deployment, or production configuration was changed.

## 1. Product goals and learning experience

The content library should support:
- Memorization and recitation practice.
- Reading comprehension through translation and vocabulary.
- Age-appropriate reflection (tadabbur) and guided questions.
- Reliable hadith and ethical lessons.
- Carefully sourced Qur'anic and Islamic history stories.
- Interactive games that reinforce learning rather than replace recitation and understanding.
- Teacher-led lesson plans and independent student learning.

Content should be organized around a surah/ayah reference where applicable, and also be discoverable by topic, age band, learning objective, and difficulty. A lesson may combine multiple content types but each source item must retain its own provenance and review status.

## 2. Core content modules

### A. Qur'an text

Requirements:
- Store or reference the Arabic text using an approved Uthmani script edition consistent with the user's requested Hafs/Uthmani reading presentation.
- Preserve exact orthography, diacritics, verse boundaries, sajdah markers, and any edition-specific symbols.
- Use stable identifiers such as surah number and ayah number; never use displayed text as the primary key.
- Record the exact edition, riwayah, source provider, import date, version/hash, and applicable license/terms.
- Keep text separate from page/line layout. Page and line positions depend on the selected mushaf edition and must not be inferred from ayah counts.
- Provide a verified fallback if a glyph or font is unsupported; do not silently normalize or strip Quranic marks.
- Ensure copy, search, audio highlighting, and memorization ranges preserve correct verse boundaries.

Acceptance checks:
- Compare imported text against the named authoritative edition using a reproducible validation process.
- Test representative cases with hamza forms, alif variants, madd signs, small letters, sajdah symbols, and verse endings.
- Validate all 114 surah names, verse counts, and canonical surah/ayah references.
- Test right-to-left rendering, font fallback, Android small screens, and accessibility.

### B. Translation

Requirements:
- Support multiple translations as separate, attributed editions.
- Record translator, language, publisher/provider, edition/version, source URL or identifier, license/permission, and publication metadata.
- Keep translation text linked to the same canonical surah/ayah reference without merging it into the Arabic text.
- Make clear that a translation is a rendering of meaning and not the Arabic Qur'an itself.
- Do not import copyrighted translations for public display unless permission or a compatible license is verified.
- Allow editorial corrections only through a reviewed version update, preserving provenance.

### C. Recitation audio

Requirements:
- Each recitation item must identify reciter, riwayah, recording/source, audio quality/format, license, and permitted uses (streaming, caching, download, classroom use).
- Link audio to surah/ayah ranges with verified timestamps only where reliable timing metadata exists.
- Distinguish full-surah audio from verse-by-verse clips.
- Provide playback speed and repeat controls only if the source and player support them reliably.
- Do not generate or claim precise word-level highlighting without verified alignment data.
- Avoid storing audio files in a way that bypasses source licensing or creates uncontrolled public redistribution.

### D. Tafsir and tadabbur

Separate explanatory tafsir from learner reflection prompts:
- Tafsir entries must identify the work, author, edition, volume/page or stable locator, translator if applicable, and license/permission.
- Short summaries must be editorially reviewed and clearly labeled as summaries rather than direct quotations.
- Tadabbur prompts should invite observation, vocabulary reflection, ethical application, and questions; they must not be presented as authoritative tafsir.
- Distinguish established interpretive claims from pedagogical prompts and contemporary applications.
- For disputed or school-specific matters, label the perspective and provide appropriate context instead of presenting one view as universally agreed.
- Avoid unsupported claims about reasons for revelation, abrogation, or historical events.

### E. Hadith and ethical lessons

Every hadith item should include:
- Arabic matn and/or a clearly attributed translation.
- Source collection, book/chapter, hadith number or stable locator.
- Edition/source provider and rights metadata.
- Grading/authenticity assessment with the scholar or institution responsible, where available.
- Any relevant differences in numbering or wording between editions.
- A short, age-appropriate explanation that is separately authored and reviewed.

Do not publish a narration as an established Prophetic hadith if its source or attribution is unknown. If grading is disputed or unavailable, disclose that fact and route it for qualified review. Do not fabricate chains, references, or authenticity labels.

### F. Stories and historical material

Stories drawn from Qur'anic narratives, prophetic biography, Ahl al-Bayt history, or Islamic history should include:
- Topic/person/event and relevant ayah or primary-source references.
- Source bibliography and confidence/review notes.
- Clear distinction between Qur'anic text, reliably sourced historical report, later narrative, and creative connective storytelling.
- Age-appropriate language and non-graphic presentation.
- A reviewer decision before publication, especially for contested historical reports or attributed quotations.

Creative dramatization may be used only when clearly labeled and must not invent quotations or present imagined dialogue as historical fact. Respect the product's religious-content policy for depictions of revered figures.

### G. Activities and games

Game types may include:
- Match an ayah reference to its surah.
- Arrange verse segments in the correct order using approved text.
- Vocabulary matching between Arabic and an approved translation.
- Identify a tajwid rule from a short, reviewed example.
- Recall/revision challenges based on a learner's own assigned range.
- Story sequencing using source-checked events.
- Reflection cards and classroom group activities.

Game safeguards:
- Do not make speed the only measure of success.
- Avoid public rankings, shaming, or comparison of children.
- Keep questions within the content the learner has been taught.
- Store answer keys separately from student-facing payloads and enforce server-side access.
- Validate scoring on the server for graded activities; ungraded practice may remain client-side if it exposes no private data or answer keys.
- Provide hints and explanations after an attempt where pedagogically appropriate.
- Include teacher controls for age band, topic, difficulty, and class assignment.

## 3. Age and difficulty taxonomy

Use flexible age/learning bands rather than assuming all learners in one age group have identical ability:

| Band | Content presentation | Activity design |
|---|---|---|
| Early learners | Short text, audio-first support, simple vocabulary, brief stories | Matching, listening, sequencing, guided recall |
| Developing readers | Short explanations, selected translation, simple tadabbur prompts | Verse order, vocabulary, basic tajwid recognition |
| Teen learners | More detailed translation and source notes, structured reflection, ethical case questions | Thematic quizzes, guided research, memorization/review activities |
| Adult learners | Full source metadata, deeper tafsir references, comparative topics where reviewed | Study pathways, source analysis, self-assessment |

Allow teacher adjustment and accessibility accommodations. Age band should guide defaults, not block appropriate learning content.

## 4. Content item metadata model

A future content catalog should use a common envelope with typed detail records:

- `content_id`: stable UUID or immutable identifier.
- `content_type`: quran_text, translation, audio, tafsir, tadabbur, hadith, story, lesson, game, activity.
- `title`, `language`, `summary`, `topic_tags`.
- `surah_number`, `ayah_start`, `ayah_end` where relevant.
- `age_band`, `difficulty`, `learning_objectives`.
- `source_title`, `author_or_reciter`, `publisher_or_provider`, `source_locator`.
- `license_name`, `license_url_or_reference`, `permission_status`, `allowed_use`.
- `editorial_status`: draft, in_review, approved, rejected, retired.
- `reviewer_id`, `reviewed_at`, `review_notes_reference` (restricted).
- `version`, `created_at`, `updated_at`, `published_at`.
- `content_hash` or equivalent integrity marker for imported source artifacts where appropriate.

Do not place all content in an untyped JSON blob. Use typed tables or validated typed payloads so source, license, verse references, and editorial state can be checked consistently.

## 5. Source, copyright, and licensing governance

Before importing or publishing any content:
1. Identify the exact source and rights holder/provider.
2. Confirm whether public display, commercial use, classroom use, caching, offline use, modification, and redistribution are permitted.
3. Record the license/permission evidence and any attribution wording.
4. Track version and source changes.
5. Prevent publication when permission is missing, ambiguous, or incompatible with the intended use.
6. Provide a correction/takedown path for rights-holder requests.

Public-domain status must be assessed for the specific edition, translation, recording, typesetting, and digital database—not assumed from the age or religious nature of the underlying work. A freely accessible website does not automatically grant reuse rights. Do not scrape or bulk-import content without verifying terms.

## 6. Editorial and scholarly review workflow

Recommended workflow:
1. Contributor creates a draft and records complete provenance.
2. Automated validation checks required metadata, references, allowed content types, and license status.
3. A subject reviewer checks Qur'an text accuracy, hadith attribution, historical sourcing, or tafsir fidelity as relevant.
4. An age-appropriateness/editorial reviewer checks clarity and suitability.
5. An authorized publisher approves and versions the item.
6. Published changes create a new version; prior approved versions remain traceable.
7. A correction or takedown request can temporarily unpublish an item pending review.

No single generic “approved” checkbox should replace domain-specific review. Qur'an text, hadith, tafsir, translations, historical stories, and games need different validation criteria.

## 7. Access control and data protection

- Publicly licensed content may be readable without login if product policy allows; paid course entitlements must be enforced server-side.
- Drafts, reviewer notes, answer keys, and unpublished materials must not be exposed to ordinary students.
- Teachers may assign approved content only within currently authorized classes.
- Students may see content assigned to them or public catalog items; they must not access other learners' activity or private course data.
- Admin/editor roles must be checked by trusted server-side authorization, not hidden UI controls.
- Every paid-content entitlement and course access decision must be validated on the server.
- Avoid collecting unnecessary child profile information in content interactions.
- Keep analytics aggregated and avoid public learner rankings.
- Apply RLS and table grants together; do not treat client-side filtering as authorization.

## 8. Search, discovery, and lesson composition

Discovery filters should include:
- Surah/ayah range.
- Topic and learning objective.
- Content type.
- Age/learning band and difficulty.
- Language and translation edition.
- Availability/license status.
- Course/class assignment.

A lesson composer may combine:
1. Selected ayahs.
2. Translation and vocabulary.
3. Recitation audio.
4. Short tafsir excerpt or reviewed summary.
5. Tadabbur prompt.
6. Hadith/ethics item with source details.
7. Story or activity.
8. Memorization and review assignment.
9. A short quiz or game with protected answer key.

The composer should display provenance to teachers/editors and provide a learner-friendly presentation to students.

## 9. Staging acceptance and verification matrix

Use synthetic content and test accounts only.

| Test | Expected result |
|---|---|
| Qur'an text import | All surah/ayah references and text checks match the named edition |
| Uthmani rendering on Android | Diacritics and special marks render correctly without silent normalization |
| Unknown or invalid ayah reference | Import/publish is blocked |
| Translation with missing permission | Cannot be published |
| Audio source permits streaming but not download | Download/cache controls remain disabled |
| Hadith with missing source locator | Cannot be marked as verified/published |
| Disputed grading | Disagreement is disclosed and qualified review is required |
| Historical story includes invented dialogue | Dialogue is labeled creative or removed from factual narrative |
| Student requests draft content | Denied |
| Student requests answer key | Denied until the activity's approved reveal rule |
| Teacher accesses assigned class content | Allowed within current role and assignment |
| Teacher loses role but retains class assignment | Teacher-only content management denied |
| Paid lesson entitlement is forged client-side | Server denies access |
| Content version is updated | Prior version and provenance remain traceable |
| Takedown is approved | Item is unpublished and no longer appears in discovery |
| Screen reader / RTL / small-screen test | Content remains navigable and readable |

## 10. Initial release recommendation

Build the library in controlled increments:
1. Canonical surah/ayah metadata and verified Uthmani text source.
2. One translation with documented permission.
3. Recitation audio from a source whose streaming rights are clear.
4. Teacher-authored vocabulary and tadabbur prompts.
5. A small set of source-verified hadith and ethical lessons.
6. Reviewed stories with clear source labels.
7. Simple non-ranked games with server-protected answers where needed.
8. Multi-source tafsir and additional translations only after rights and editorial workflows are established.

Do not start by bulk-importing large libraries or scraping websites. The first milestone should be a small, accurate, properly licensed content collection with traceable provenance.

## 11. Product and editorial decisions required

1. Which exact Uthmani/Hafs text edition and provider will be the canonical source?
2. Which translation(s) are approved, and what permissions cover public/commercial use?
3. Which reciters/audio providers permit streaming, caching, and classroom playback?
4. Which tafsir works and scholarly reviewers are approved for the initial release?
5. What hadith grading authority or review policy should be used when sources disagree?
6. Who approves historical stories and attributed quotations?
7. Which age bands and accessibility accommodations should be configurable by teachers?
8. Which content is public, included in free courses, or reserved for paid courses?
9. What correction/takedown response process and responsible editor are assigned?

## Conclusion

A trustworthy Qur'an learning library depends on more than collecting text and media. Every item needs accurate references, clear source and licensing metadata, domain-appropriate review, age-aware presentation, and server-enforced access. The recommended first release is deliberately small: verified Uthmani text, one permitted translation, properly licensed recitation, teacher-reviewed reflection prompts, and a limited set of sourced lessons and games.

**Stage status:** design/documentation only. No live database access or mutation, no content import, no migration execution, no deployment, and no PR merge.
