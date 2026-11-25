# Stage 165 — Qur'an and Hadith Search, Topic Discovery, and Grounded Learning Assistant
Date: 2026-11-24
Status: design/documentation only; no search engine, AI model, embeddings, assistant, API integration, database, or production setting implemented.

## 1. Purpose and boundaries
Design a trustworthy discovery experience for Qur'an verses, approved translations, tafsir, hadith, learning stories and course materials, plus a bounded educational assistant that explains and helps learners navigate approved content.

The assistant is an educational aid, not a mufti, religious authority, source of independent rulings, or replacement for a qualified teacher. It must not invent verse wording, hadith attribution, authenticity grades, tafsir quotations, page references or scholarly consensus. Questions requiring a binding religious ruling, disputed jurisprudential analysis or personal religious/legal advice must be routed to a qualified human scholar/teacher with relevant context.

## 2. Search experience
Provide distinct search modes:
- Exact Qur'an text: exact phrase and normalized Arabic search, with surah/ayah reference.
- Qur'an meaning: search approved translations, with translator and edition shown.
- Topic search: curated tags and editorially reviewed topic mappings to verses.
- Hadith search: exact text, topic, source book and verified attribution metadata.
- Tafsir search: approved tafsir collection, author, edition and volume/page reference where verified.
- Learning library: lessons, stories, activities, audio/video and courses.
- Cross-collection search: results grouped by source type rather than blended without labels.

Search results should show a short, rights-compliant excerpt, source identity, edition/version, location reference and a route to the full authorized item. Clearly label exact text versus translated meaning, editorial summary and AI-generated explanation.

## 3. Arabic and Uthmani text handling
- Preserve canonical Uthmani text exactly as stored in the approved edition.
- Maintain stable surah/ayah identifiers independent of display formatting.
- Use separate normalized search fields for matching; never overwrite canonical text with normalized text.
- Normalization may account for optional diacritics, tatweel, common orthographic variants and Unicode composition, but the UI must display the verified canonical text.
- Search behavior for hamza, alif variants, ya/alif maqsura, ta marbuta and diacritics must be documented and tested.
- Return exact verse boundaries and never silently concatenate fragments as if they were one verse.
- Display basmala and verse numbering according to the selected verified edition's rules.
- If an exact match cannot be confirmed, say so rather than fabricating an Arabic quotation.
- Support Persian/Arabic RTL, mixed numerals and accessible copy/share behavior subject to content rights.

## 4. Source registry and provenance
Every searchable content item must have:
- content type and stable identifier
- canonical title and language
- author, translator, reciter or compiler where applicable
- source work, edition and publication metadata
- precise reference (surah/ayah, hadith collection/number, volume/page, lesson ID)
- verification state and reviewer
- license/rights status and permitted excerpt/use scope
- version, publication state and last-reviewed timestamp

Keep source classes separate:
1. Qur'an canonical text.
2. Translation of meaning.
3. Tafsir and scholarly commentary.
4. Hadith source text and grading/attribution.
5. Editorial lesson or educator-authored reflection.
6. AI-generated answer or summary.

An editorial reflection must never be presented as tafsir. A translation must never be presented as the Arabic Qur'an. Hadith authenticity must only be displayed when supported by an identified source and competent review.

## 5. Topic taxonomy and curated mappings
Use an editorially managed taxonomy such as:
- worship and prayer
- ethics and character
- family and social relations
- knowledge and learning
- stories and lessons
- patience, gratitude and hope
- Qur'an memorization and revision
- youth learning and daily practice

Topic tags are discovery aids, not claims that a verse has only one meaning or that a verse proves a legal ruling. Allow multiple tags, explain editorial criteria and provide reviewer/source notes for mappings. Avoid reducing complex verses to slogans or decontextualized quotations.

## 6. Grounded educational assistant
The assistant should use retrieval from approved, versioned content and answer only within its configured scope.

Response requirements:
- Identify the source class used (Qur'an, translation, tafsir, hadith, course lesson).
- Cite precise references inline, with edition/author where available.
- Quote only the amount permitted by rights and copyright policy; prefer concise paraphrase with attribution.
- Separate source quotation, translation, summary and assistant explanation visually and linguistically.
- State when sources disagree or the retrieved material is insufficient.
- Ask one clarifying question when a question is ambiguous and the answer depends on context.
- Never invent a citation or fill a missing reference from model memory.
- Never claim scholarly consensus unless the approved sources explicitly establish it.
- Do not issue a definitive fatwa or personalized legal/religious ruling.
- For complex, disputed or high-impact questions, provide a neutral summary of sourced material and recommend review by a qualified scholar or the user's teacher.
- Keep the learner's age and reading level in mind without distorting the source.

Suggested answer structure:
1. Direct, age-appropriate explanation.
2. Relevant verse/hadith or approved lesson reference.
3. Brief context and distinction between source text and explanation.
4. What remains uncertain or disputed, if applicable.
5. A suitable follow-up learning question or teacher-review route.

## 7. Retrieval and ranking design
Potential retrieval pipeline:
1. Validate and normalize query without altering source text.
2. Detect language and likely search mode.
3. Apply user authorization and content publication filters before retrieval.
4. Retrieve exact text matches and lexical candidates.
5. Retrieve semantic candidates only from approved indexed content.
6. Rank by exactness, source quality, relevance, edition and editorial verification.
7. Deduplicate related results while preserving distinct source editions.
8. Pass only authorized, relevant excerpts and source metadata to the answer generator.
9. Require every factual source-dependent claim to map to retrieved references.
10. Validate citations and output boundaries before display.

Do not let semantic similarity override exact verse identity or source authenticity. Embeddings are an index aid, not evidence. Search results must be reproducible against a known content/index version.

## 8. Safety and age-appropriate behavior
- Keep assistant use educational, respectful and suitable for the learner's age band.
- Do not create private unsupervised channels between minors and unknown adults.
- Provide a route to ask a teacher for clarification.
- Do not infer sensitive traits or create personal religious profiles from search history.
- Avoid shame, coercion, sectarian hostility or demeaning language.
- Present differences of interpretation carefully and proportionately.
- For personal distress or safeguarding concerns, follow a separate approved safety protocol rather than improvising religious judgment.
- Do not ask children for personal contact information, precise location or unnecessary family details.
- Make clear when content is automated and when a human educator has reviewed it.

## 9. Privacy and personalization
- Search should work without collecting more profile information than necessary.
- Keep search history off by default or provide a clear, age-appropriate opt-in and deletion policy.
- Do not use private queries to target course sales or behavioral advertising.
- Personalize reading level or course context only from explicit, appropriate settings.
- Never expose another learner's queries, bookmarks, progress or annotations.
- If using conversation context, minimize what is sent to an external model and document retention, training and processing terms.
- Do not send private class data, attendance, grades, contact details or payment records to a model provider.
- Define retention, access, export and deletion behavior before launch.

## 10. Conceptual data model
Design concepts only; inspect existing content tables and Stage 156 library design before any schema proposal:
- content_sources: source_type, title, author_or_translator, edition, language, rights_record_id, verification_state.
- searchable_content_items: source_id, content_type, canonical_reference, language, publication_state, version.
- content_text_versions: item_id, version, canonical_text, normalized_search_text, checksum, reviewed_by, reviewed_at.
- content_topic_tags: item_id, topic_id, mapping_note, reviewer_id, review_state.
- topic_taxonomy: parent_id, slug, display_name, description, taxonomy_version.
- search_index_versions: source_version, index_type, built_at, status.
- assistant_answer_audits (minimal): request_id, model/config version, retrieval version, source references, safety outcome, timestamp.
- source_corrections: item_id, reported_issue, status, reviewer_id, resolution_note, timestamps.

Avoid storing full user prompts or answer bodies in audit logs unless a documented need, consent model and retention policy exist. Do not duplicate canonical content across search-specific tables without version linkage.

## 11. Security and access control
- Apply publication and entitlement filters before search retrieval and before model context construction.
- Public users can search only approved public content.
- Enrolled learners can access only course/class materials they are entitled to.
- Teachers can access only assigned class resources and authorized review tools.
- Editors/reviewers can modify content only within assigned editorial scope.
- Admin access is least-privilege and audited.
- Search endpoints must not reveal private titles, snippets, counts or existence of restricted records.
- Protect embeddings and index metadata with the same visibility rules as source content.
- Rate-limit search and assistant endpoints; protect against prompt injection in retrieved documents.
- Treat retrieved content as data, never as executable instructions or policy.
- Do not expose API keys or service-role credentials in client code.
- Provide abuse monitoring without retaining unnecessary personal data.

## 12. Editorial quality and correction workflow
- Every canonical Qur'an text version requires source provenance and independent verification before publication.
- Translation and tafsir editions require attribution, rights review and editorial approval.
- Hadith text, source reference and grading are separate fields; missing grading remains unknown, not guessed.
- Topic mappings and educational summaries require named reviewer roles and version history.
- Users and teachers can report a suspected text/reference error.
- Reported errors enter a review queue; do not silently edit published canonical text.
- Corrections should preserve prior versions and record what changed, who reviewed it and why.
- Disable or flag affected assistant answers/index versions while a critical source error is investigated.
- Rebuild affected indexes after approved content changes and retain index provenance.

## 13. Observability and evaluation
Measure quality using synthetic or consented test queries:
- exact verse retrieval precision
- correct surah/ayah references
- source attribution accuracy
- translation/tafsir distinction
- hadith source and grading accuracy
- unsupported-claim rate
- citation validity
- age-appropriate reading level
- latency and availability
- privacy leakage and cross-tenant access failures

Create a reviewed test set covering spelling variants, diacritics, Persian queries, ambiguous topics, disputed questions, missing sources, adversarial prompts and private content boundaries. Human subject-matter reviewers must evaluate religious accuracy before public release. Do not optimize solely for engagement or time spent.

## 14. Acceptance and security tests
1. Exact Arabic search returns the verified canonical text and exact surah/ayah identifiers.
2. Normalization affects matching only and never mutates displayed Uthmani text.
3. Similar semantic results are not misrepresented as exact verse matches.
4. Every assistant source-dependent claim has a valid retrieved citation.
5. Assistant does not invent hadith grading, attribution, tafsir quotation or scholarly consensus.
6. Translation, tafsir, hadith and educator-authored content remain visibly distinct.
7. Unpublished or private course content is absent from unauthorized results and model context.
8. Learner A cannot retrieve Learner B's private annotations, queries or course materials.
9. Teacher without current class assignment cannot search restricted class resources.
10. Prompt injection embedded in a retrieved lesson cannot override system safety or access policy.
11. Insufficient evidence produces an explicit uncertainty response or teacher referral.
12. Complex jurisprudential requests are not answered as binding fatwas.
13. Search history and assistant logs follow the approved retention and opt-in policy.
14. Arabic/Persian RTL, keyboard, screen-reader and mobile tests pass.
15. Index rebuilds preserve source/version provenance and do not publish unreviewed edits.

## 15. Release sequence
1. Inventory the current content library, source metadata, rights and publication workflow.
2. Approve taxonomy, source registry and editorial review responsibilities.
3. Implement exact Qur'an search first using a verified text edition and deterministic references.
4. Add approved translation and tafsir search with source/version labels.
5. Add hadith search only after source and grading metadata are reviewed.
6. Add semantic retrieval over approved content with access filters and evaluation.
7. Pilot a citation-grounded educational assistant with human review and strict scope.
8. Complete privacy, child-safety, religious accuracy, rights and security review.
9. Obtain explicit approval before external model integration, production indexing, data transfer, migration or release.

## 16. Decisions required
- Which Qur'an text edition and verification authority will be canonical?
- Which translations, tafsir works and hadith collections are approved?
- Who is responsible for religious/editorial review and corrections?
- Which topic taxonomy and age bands are required?
- Is semantic search needed at launch, or is exact/lexical search sufficient?
- Will the assistant use an external model, and what are its privacy/retention terms?
- Which questions must always be routed to a qualified teacher/scholar?
- Is search history stored, and what opt-in and retention policy applies?
- What rights permit excerpts, indexing, embeddings and assistant-generated summaries?

## 17. Status and safety
This is a design document only. No search interface, index, embeddings, AI assistant, model/API integration, prompt, database schema, RLS, grants, RPCs, triggers, external data transfer or live setting was changed. No Qur'an/hadith corpus was copied or uploaded. No learner data was accessed or modified. No migration, deployment, merge or release was performed.
