# Stage 218 — Personal Reading Program, Book Clubs, and Reading Challenges Architecture
Date: 2026-11-24
Status: product, editorial, and technical design only; no application or database implementation.

## 1. Purpose and relationship to existing modules
Design a complete reading experience that helps learners discover suitable books, build a voluntary reading habit, record progress, reflect on what they read, and participate in moderated reading activities.

This stage complements, but does not duplicate:
- Stage 192: library catalog, physical copies, lending, reservations, and licensed digital resources.
- Stage 202: age-adaptive reading, school curriculum, books, and creative skills.
- Stage 181: curated and reviewed Quran/hadith educational content packs.
- Stage 208: bookstore, purchases, delivery, and digital product entitlements.
- Stage 217: unified weekly timetable, where a learner may schedule optional reading time.
- Stage 185/179/210: honours, competitions, and educational festivals.

The library remains the source of truth for catalog and loan status; the bookstore remains the source of truth for orders and purchase rights. This stage owns reading plans, personal progress, reflections, book clubs, and reading challenges.

## 2. Reading goals and learner choice
Learners may choose goals such as:
- explore a topic or author;
- read for enjoyment;
- understand a school subject;
- study Qur'an, hadith, seerah, ethics, or Islamic thought;
- improve vocabulary, comprehension, or critical reading;
- prepare for a moderated book discussion;
- complete a teacher-assigned reading selection.

Goals should be flexible and revisable. A learner may pause, change a book, choose a shorter text, or stop a plan without losing access to other learning activities. Avoid universal page quotas, guilt messaging, or public comparison of reading speed.

## 3. Age- and level-appropriate discovery
Discovery filters may include:
- broad age band and reading level;
- language and script;
- subject, theme, genre, and format;
- estimated reading complexity and length;
- accessible formats and reading support;
- source/edition and publication metadata;
- content notes written in neutral, age-appropriate language;
- whether the resource is available, on loan, licensed digitally, or purchasable.

Suggested age bands should be treated as guidance, not rigid judgments. Educators and guardians may recommend alternatives, while learners retain appropriate choice. Do not infer maturity, beliefs, family circumstances, or personal traits from reading history.

Examples of curated collections may include:
- works by شهید آیت‌الله مرتضی مطهری, with age-appropriate introductions and educator-reviewed selections;
- works and speeches by آیت‌الله سید علی خامنه‌ای, clearly identifying the exact work, edition, and source;
- Qur'an learning and educational works by حجت‌الاسلام محسن قرائتی;
- stories of prophets, Ahl al-Bayt, and Islamic history;
- school-support books, language learning, science, biographies, literature, and creative skills.

Catalog records must distinguish original works, abridgements, adaptations, excerpts, teacher-created guides, and summaries. Do not imply an adaptation is the full original book.

## 4. Rights, editions, and access model
A catalog entry is not permission to display, download, reproduce, or distribute a book.
- Store bibliographic metadata separately from the content file.
- Record author, translator, publisher, edition, publication year, ISBN or other identifier when available, language, rights holder, license basis, territory, permitted audience, and access conditions.
- Digital full text is available only where the platform has a valid license, public-domain basis, or other documented legal permission.
- For copyrighted books without digital distribution rights, provide metadata, lawful purchase/library links, teacher-authored original study guides where permitted, and short quotations within applicable limits.
- Never bypass DRM, scan or upload unauthorized copies, or reproduce an entire book through summaries or generated content.
- Track license expiry, territory restrictions, seat/concurrent-user limits, download/print permissions, and attribution requirements.
- Keep a takedown, rights-complaint, and correction workflow with an auditable decision.

## 5. Personal reading shelf
Each learner may have a private shelf with:
- want-to-read;
- currently reading;
- paused;
- finished;
- stopped/not for me;
- recommended by teacher;
- assigned reading;
- saved notes and questions.

The learner can add a catalog item without claiming ownership or digital access. The shelf should show availability separately from personal reading status. A borrowed copy, purchased copy, licensed digital access, and personal progress are different records.

## 6. Reading plans and pacing
A plan may include:
- selected book or approved reading selection;
- learner goal and preferred pace;
- optional weekly target in pages, chapters, or time ranges;
- suggested reading sessions;
- milestones and reflection prompts;
- teacher/guardian support where authorized;
- pause, restart, or change-book options.

Plans can be linked to Stage 217 as suggested calendar blocks, but scheduling remains optional and learner-confirmed. Do not treat a due date as a compulsory reading session. If a learner misses a target, offer gentle alternatives such as reducing scope, moving a session, asking for help, or pausing.

## 7. Progress tracking and evidence quality
Possible progress evidence:
- learner-entered page/chapter marker;
- optional reading-session duration;
- completed milestone;
- teacher-verified discussion or assignment;
- library loan return event, which is not proof that a book was read;
- quiz or reflection result, which measures only the assessed skill.

Clearly label self-reported versus teacher-reviewed progress. Do not claim verified comprehension from page counts or time spent. Avoid invasive reading telemetry, screenshots, keystroke tracking, or continuous monitoring. Learners should be able to correct accidental progress entries.

## 8. Notes, highlights, summaries, and reflection
Support private learning artifacts:
- personal notes and questions;
- vocabulary list;
- short learner-written summary;
- character, argument, or theme map;
- reflection prompts;
- source citations and page references.

Safeguards:
- Keep private notes private by default.
- Sharing a note with a teacher or group requires a clear user action and scope.
- Do not present AI-generated summaries as the author's text or as a replacement for reading.
- If AI assistance is later approved, identify generated content, cite the exact licensed/authorized source context, and require verification.
- Do not generate long substitutes for copyrighted books or reproduce extensive passages.
- Preserve attribution and edition/page references where the learner supplies them.

## 9. Book clubs and moderated reading circles
Book clubs may be organized at:
- a class;
- a branch or institution;
- a joint institution event;
- a platform-wide moderated event;
- a private invitation-only group.

Features may include:
- selected reading and meeting schedule;
- teacher/host and age band;
- discussion prompts and vocabulary activities;
- moderated questions and responses;
- optional learner presentations, artwork, or reviews;
- attendance and participation records with clear purpose;
- end-of-circle reflection and optional certificate.

For minors, avoid unrestricted private messaging and unmoderated public groups. Use teacher-moderated, topic-bound discussion spaces. Provide report/block/escalation routes and clear community rules. Do not publish a learner's reading history or private comments without explicit permission and policy approval.

## 10. Reading challenges and competitions
Challenge formats:
- personal milestone challenge;
- class reading circle;
- institution reading festival;
- inter-institution reading challenge;
- platform-wide theme or book discussion;
- independent learner participation without fabricated institutional affiliation.

Fairness principles:
- Offer categories by age band, reading level, language, genre, and participation format.
- Reward thoughtful reflection, discussion, source use, and consistency rather than raw page totals alone.
- Publish criteria, judging rubric, dates, eligibility, and appeal route before registration.
- Provide non-competitive participation options.
- Do not reward excessive reading time or pressure learners to sacrifice sleep, schoolwork, or recreation.
- Use teacher-reviewed work for judged awards; AI may not be the sole judge.
- Public results should use privacy-preserving display names and require approved visibility settings.
- Prevent duplicate entries and copied submissions through fair review, not invasive surveillance.

Reading challenges should integrate with the existing competition and honours systems rather than create a separate incompatible points currency.

## 11. Teacher and guardian tools
### Teacher
- Create a class reading list from licensed catalog entries.
- Recommend a book with a clear educational rationale and age/level fit.
- Set optional or required reading only within approved course policy.
- Provide discussion prompts, vocabulary support, and original worksheets.
- Review submissions from currently assigned learners.
- See class-level progress summaries without unnecessary private notes.
- Offer alternative texts and accessible formats.

### Guardian
- View approved reading recommendations and selected progress for verified linked learners.
- Support book selection and reading time without unrestricted access to private reflections.
- Manage consent for applicable group activities and digital access.
- Avoid coercive quotas or comparisons among siblings/learners.

## 12. Accessibility and reading support
- Support RTL Arabic and Persian layouts and mixed-script text.
- Provide scalable typography, adjustable line spacing, dyslexia-friendly display options where available, screen-reader semantics, and keyboard navigation.
- Support lawful audio editions and accessible formats where licensed.
- Offer vocabulary explanations, glossaries, and teacher-approved reading aids.
- Provide low-bandwidth catalog access and clear offline rights.
- Do not assume that reading speed, font preference, or assistive technology reveals a diagnosis.

## 13. Privacy, authorization, and child safety
- Personal shelves, notes, and reading history are private by default.
- Teachers access only assigned learners and only data necessary for the educational purpose.
- Guardians require verified relationship and purpose-specific scope.
- Institution administrators receive aggregate operational information, not unrestricted learner notes.
- Book club membership and discussion visibility are limited to the relevant group.
- Public profiles and leaderboards must not expose detailed reading history.
- Apply tenant scoping to catalog annotations, groups, reports, exports, search, and notifications.
- Minimize retained session data; provide correction, export, and deletion controls.
- Safeguarding reports must use the restricted safeguarding workflow, not ordinary book-club chat.

## 14. Conceptual data model
Logical concepts only; map to existing catalog, lending, commerce, identity, and competition structures before proposing migrations:
- reading_goals: learner_id, goal_type, status, created_at.
- reading_shelves: learner_id, catalog_item_id, shelf_status, updated_at.
- reading_plans: learner_id, catalog_item_id, goal, pace, status, version.
- reading_plan_milestones: plan_id, milestone_type, target_reference, target_date, status.
- reading_progress_events: plan_id, actor_id, progress_type, value, evidence_level, timestamp.
- reading_notes: learner_id, catalog_item_id, content, visibility, source_reference.
- reading_clubs: tenant_id, scope, age_band, host_id, status.
- reading_club_memberships: club_id, learner_id, consent_status, membership_status.
- reading_discussions: club_id, prompt_id, moderation_state.
- reading_challenges: scope, category, rubric_version, schedule, visibility.
- reading_challenge_entries: challenge_id, learner_id, submission_reference, status.
- reading_rights_records: catalog_item_id, rights_basis, territory, permitted_use, expiry, evidence_reference.

These concepts are not a migration specification. Reuse canonical catalog identifiers and existing competition, enrollment, guardian, and audit sources where appropriate.

## 15. Acceptance and abuse-case tests
1. A catalog entry without digital rights cannot expose a downloadable full-text file.
2. A learner can maintain a private shelf without purchasing or borrowing the book.
3. Borrowed, purchased, licensed, and self-reported reading states remain distinct.
4. A learner can pause or change a reading plan without penalty.
5. A teacher cannot read notes of learners outside current assigned classes.
6. A guardian cannot access a learner's private reflection unless an explicit approved scope permits it.
7. A learner cannot join a restricted book club without required consent and eligibility.
8. Unmoderated learner-to-learner private messaging is not enabled by the reading club.
9. Challenge criteria and rubric versions are visible before participation.
10. AI-generated content is labeled and cannot impersonate a book excerpt or author.
11. Reading progress cannot be inferred solely from page count, app time, or loan return.
12. Public results do not disclose private reading histories or sensitive learner data.
13. Rights expiry disables the affected digital access according to license terms.
14. RTL, accessibility, low-bandwidth, and assistive technology tests pass.
15. Cross-tenant tests prevent one institution from accessing another institution's private reading groups and records.
16. Rights complaints and content corrections have a traceable review process.

## 16. Rollout sequence
1. Audit existing catalog and content records; identify canonical book/resource IDs.
2. Define metadata and rights evidence required before digital access.
3. Approve age/level discovery labels and curated reading collections.
4. Design private shelf and progress tracking without duplicating library or commerce state.
5. Add reading plans and optional Stage 217 calendar suggestions.
6. Pilot moderated book clubs using synthetic/test accounts and approved original prompts.
7. Integrate reading challenges with existing competition and honours systems.
8. Complete licensing, privacy, child-safety, accessibility, and tenant-isolation reviews before release.

## 17. Decisions required
- Which reading categories and age bands are in the first release?
- Which catalog sources and publishers have documented digital rights?
- Are learner notes private-only initially, or may selected notes be shared with teachers?
- Which book clubs are permitted for minors and what moderation coverage is required?
- Which reading challenge criteria avoid rewarding speed or excessive time?
- What guardian visibility and consent rules apply by age and activity?
- What retention period applies to reading history, notes, and challenge submissions?

## 18. Explicit non-actions and implementation status
This stage adds a design document only. It does not upload or distribute books, scan copyrighted works, activate digital lending, create a reader UI, create book clubs, launch competitions, generate summaries, add database tables or policies, or configure notifications. No live Supabase data or settings were changed. No migration, deployment, merge, or release was performed. Digital content access remains conditional on documented rights and approved product implementation.
