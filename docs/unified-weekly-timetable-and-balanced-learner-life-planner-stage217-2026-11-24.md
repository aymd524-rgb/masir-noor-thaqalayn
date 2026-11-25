# Stage 217 — Unified Weekly Timetable and Balanced Learner Life Planner
Date: 2026-11-24
Status: product and technical design only; no application, calendar, scheduler, or database implementation.

## 1. Purpose and relationship to earlier stages
Design one coordinated weekly planner for the learner's educational and personal commitments. It brings together Qur'an learning, school, homework, reading, language study, arts, technical skills, sports, family commitments, travel, and rest without treating every minute as a productivity target.

Related prior work:
- Stage 200: adaptive learning goals and personalized learning journey.
- Stage 161: class schedules, attendance, and teacher operations.
- Stage 162: learning calendar, reminders, and notifications.
- Stage 170: daily/weekly assignments and teacher feedback.
- Stage 214: healthy motivation, flexible habits, and positive recognition.
This stage focuses on the unified timetable, conflict resolution, realistic workload, and coordinated changes across those modules. It must not create a second source of truth for class sessions or assignments.

## 2. Learner and family outcomes
A learner should be able to:
- See today's plan and the full week in a simple calendar.
- Understand which activities are fixed, flexible, optional, or suggested.
- Combine school, Qur'an, religious studies, reading, creative skills, exercise, family time, and rest.
- Choose realistic study windows and preferred days.
- Move or pause flexible activities without losing their history.
- Receive a manageable next step rather than a long intimidating task list.
- Review workload with an authorized teacher or guardian where appropriate.
The planner supports the learner's choices; it does not monitor, discipline, or judge the learner.

## 3. Activity categories and source ownership
Suggested categories:
1. School timetable and school homework.
2. Qur'an class, hifz, muraja'ah, recitation, tajwid, translation, tafsir, tadabbur.
3. Arabic, hadith, seerah, ethics, aqidah, fiqh, and other religious studies.
4. General reading and age-appropriate book plans.
5. Language learning and school subject practice.
6. Calligraphy, drawing, crafts, music-free creative activities, media/design and other approved arts.
7. Programming, digital literacy, research, and supervised technical projects.
8. Sports, movement, recreation, and outdoor activities.
9. Family, community, mosque, travel, and personal commitments.
10. Meals, sleep, breaks, unstructured time, and rest.

Each item must retain its source and ownership:
- Official class sessions come from the class scheduling module.
- Assignments and due dates come from the assignment module.
- Learner-created personal blocks belong to the learner.
- Guardian-entered family commitments are clearly identified and scoped.
- Suggested learning blocks are generated as proposals and require learner acceptance.
Do not duplicate or independently edit authoritative source records from this planner.

## 4. Activity properties
Each calendar item may include:
- title and category;
- source module and source record ID;
- date, start/end time, and timezone;
- duration or estimated duration range;
- fixed/flexible/optional status;
- location or online modality only when needed;
- responsible teacher/class for official sessions;
- priority class (mandatory, learner-chosen, suggested);
- recurrence rule and exception dates;
- due date distinct from preferred work time;
- completion state, if relevant;
- privacy/visibility scope;
- accessibility or preparation notes with data minimization.

A due date is not automatically a scheduled work block. An assignment can be due Friday while the learner chooses two shorter study periods earlier in the week.

## 5. Weekly planning journey
1. Start with fixed commitments already authorized for the learner: school timetable, enrolled class sessions, and approved family commitments.
2. Add known due dates from school and platform assignments.
3. Ask the learner to select goals and available study windows; do not require every category.
4. Offer flexible blocks for hifz/revision, reading, homework, language, or creative practice based on chosen goals.
5. Show the total proposed workload by day and category, including estimated time ranges.
6. Identify overlaps, travel buffers, and days with unusually high workload.
7. Let the learner accept, move, shorten, skip, or remove suggested blocks.
8. Where an assigned teacher or guardian has an authorized role, allow review or support without silently taking over the learner's calendar.
9. Publish the personal weekly plan only after the learner confirms it.
10. At week's end, offer a gentle review: what helped, what was too much, and what should change next week.

## 6. Workload balance and healthy scheduling
- Do not fill all available time. Preserve unstructured time, meals, sleep, breaks, recreation, and family life.
- Never assume that a missed task should be added to the next day.
- Avoid stacking multiple demanding activities without a reasonable break.
- Offer short and long session options rather than a universal daily quota.
- Provide flexible catch-up choices: reschedule, reduce scope, defer, ask for help, or mark not applicable.
- A learner can mark a day as rest, travel, exam week, or unavailable without shame or penalty.
- Do not score worth, discipline, or intelligence based on calendar completion.
- Avoid streak loss, countdown pressure, guilt messaging, and rewards tied to excessive screen time.
- Recommendations should explain their rationale and show uncertainty in estimated duration.
- Do not infer sleep, health, family conditions, or emotional state from device activity.

The planner may warn that a day looks crowded, but it must not make medical or psychological claims or impose a schedule.

## 7. Conflict detection and resolution
Detect:
- overlapping fixed events;
- suggested study block overlapping a class;
- insufficient travel/changeover time where travel details are explicitly supplied;
- multiple deadlines clustered on the same day;
- recurring schedule exceptions and timezone changes;
- a teacher moving a class session after the learner has planned around it.

Resolution order:
1. Preserve authoritative fixed sessions unless an authorized source changes them.
2. Never silently move a class, exam, appointment, or guardian commitment.
3. Offer alternative times for flexible learner-created blocks.
4. Ask the learner to choose when multiple reasonable options exist.
5. If a class change creates a conflict, show the conflict and notify the learner through approved channels.
6. Record the reason and source for material changes.
7. Do not automatically contact a teacher, guardian, or classmate without an explicit permitted action.

## 8. Views and user experiences
### Learner
- Today view: next activity, due tasks, and a small number of useful actions.
- Week view: day columns or accessible agenda list; RTL and mobile-first.
- Month overview: important classes, exams, events, and deadlines without dense task detail.
- Category filters and privacy controls.
- Quick actions: complete, reschedule, pause, ask teacher, mark unavailable.
- Clear distinction between fixed event, personal block, assignment deadline, and AI/system suggestion.

### Teacher
- View schedules for currently assigned classes and class sessions.
- See only the minimum learner availability information explicitly shared for educational coordination.
- Suggest class-related study blocks or assignment timing; learner acceptance rules apply.
- Avoid access to unrelated family, health, or personal calendar details.
- Detect class-level workload collisions and avoid assigning excessive overlapping deadlines.

### Guardian
- View the learner's schedule only through a verified relationship and approved scope.
- Add or propose family commitments where product policy permits.
- Support planning and consent without automatically seeing private learner notes or every personal block.
- Provide age-appropriate learner autonomy and clear visibility indicators.

### Institution administrator
- Manage official class calendars, holidays, exam windows, and institution events within tenant scope.
- View aggregate scheduling conflicts and class workload indicators.
- No unrestricted access to private personal calendar items.

## 9. Coordination with assignments, exams, and events
- Assignment due dates remain owned by Stage 170; planner may propose study blocks around them.
- Exam dates remain owned by the assessment module; planner may suggest preparation sessions.
- Class sessions remain owned by Stage 161; calendar changes flow from the source module.
- Institution and religious events remain owned by the events module.
- Notifications follow Stage 162 preferences, quiet hours, and rate limits.
- Adaptive recommendations follow Stage 200 but are proposals until accepted.
- If source data is deleted, cancelled, or changed, the planner updates its display while preserving an appropriate audit/history reference.
- Avoid duplicate notifications when the same source event appears in multiple views.

## 10. Time, recurrence, travel, and offline behavior
- Store timestamps consistently and retain the event's intended timezone.
- Handle daylight-saving changes and timezone travel without silently changing the intended local schedule.
- Support weekly recurrence with explicit exceptions, holidays, and one-off changes.
- Use travel buffers only when a learner or guardian provides relevant travel information; do not infer location continuously.
- For online/offline periods, show last sync time and queue only safe personal edits.
- Resolve concurrent edits with clear conflict handling; never silently overwrite an official class schedule.
- Keep offline cache limited to the learner's permitted data and clear private cached data on logout/shared-device account switch.

## 11. Notifications and reminders
Possible opt-in reminders:
- upcoming fixed class or exam;
- chosen personal study block;
- assignment due date;
- teacher-approved schedule change;
- weekly planning review.
Controls:
- per-category opt-in;
- quiet hours and maximum frequency;
- no repeated escalation for missed optional blocks;
- no sensitive detail in lock-screen text;
- learner and guardian preferences kept distinct;
- notification delivery status does not prove that a learner saw or completed an activity.

## 12. Accessibility and age-appropriate design
- Fully support Persian RTL and Arabic text rendering.
- Provide agenda/list alternative to drag-and-drop calendar.
- Keyboard and screen-reader support, scalable text, sufficient contrast, and clear focus order.
- Use age-appropriate language and avoid dense scheduling interfaces for younger learners.
- Allow flexible durations, reminders, and visual density.
- Do not require a smartphone notification to access core schedule information.
- Provide printable weekly view where privacy settings permit.

## 13. Privacy, authorization, and safety
- Personal calendar blocks are private by default.
- Teachers see official class sessions and only learner-shared availability needed for coordination.
- Guardians see only approved schedule information for verified linked learners.
- Institution administrators see tenant-scoped official schedules and aggregate data, not personal notes.
- Do not expose exact home locations, private family events, or travel details in public calendars.
- No continuous location tracking, device surveillance, or automatic attendance inference from calendar presence.
- Enforce permissions server-side across API, database, storage, exports, search, and notifications.
- Derive actor identity from authenticated context and audit official schedule changes.
- Provide correction, deletion, and export rules for personal blocks.

## 14. Conceptual data model
Design concepts only; map to existing source tables before any migration:
- learner_planner_preferences: learner_id, timezone, preferred_days, reminder_preferences, updated_at.
- planner_personal_blocks: learner_id, title, category, start_at, end_at, recurrence_rule, visibility, status.
- planner_source_links: planner_item_id, source_module, source_record_id, source_version.
- planner_suggestions: learner_id, activity_type, proposed_window, duration_range, rationale, status.
- planner_conflicts: learner_id, item_a, item_b, conflict_type, detected_at, resolution_status.
- planner_weekly_reviews: learner_id, week_start, learner_feedback, next_week_preferences.
- planner_change_events: item_id, actor_id, source, change_type, reason_category, timestamp.
- planner_sharing_grants: learner_id, recipient_id, scope, expires_at, revoked_at.

Do not create duplicate class-session, assignment, exam, event, or notification records. Prefer references to authoritative records and a derived calendar projection.

## 15. Acceptance and abuse-case tests
1. A learner can create and edit only permitted personal blocks.
2. A learner cannot change an official class session through a personal calendar action.
3. A teacher sees only assigned-class schedules and explicitly shared learner availability.
4. A guardian cannot access an unlinked learner or unapproved personal details.
5. An institution administrator cannot read private family blocks or notes.
6. A class reschedule updates linked calendar views without duplicate source records.
7. A due date is not mistaken for a scheduled study session.
8. Overlapping fixed events are surfaced; neither is silently moved.
9. A missed optional activity does not create automatic punitive catch-up workload.
10. Timezone and daylight-saving transitions preserve intended local event times.
11. Concurrent edits do not silently overwrite official schedule data.
12. Notifications respect quiet hours, category preferences, and rate limits.
13. Shared-device logout clears private cached calendar content.
14. Search, exports, logs, and notifications do not leak private calendar details.
15. RTL, keyboard, screen-reader, and agenda-list alternatives pass accessibility review.
16. Synthetic multi-tenant tests confirm institution and branch isolation.

## 16. Rollout sequence
1. Agree on category names, source ownership, and the distinction between deadlines and scheduled work.
2. Define age-appropriate defaults and workload guidance with educators and families.
3. Map class, assignment, exam, event, and notification sources to existing schema.
4. Design a read-only unified calendar projection before allowing personal edits.
5. Add personal blocks and conflict detection in a feature branch with synthetic data.
6. Add learner-controlled suggestions and explicit sharing scopes.
7. Test role boundaries, timezone behavior, accessibility, offline cache, and overload scenarios in staging.
8. Obtain explicit approval before any production migration, notifications, or release.

## 17. Decisions required
- Which age bands receive learner-only planning versus guardian-supported planning?
- Which categories are enabled by default, and which are optional?
- Should teachers be able to suggest study blocks, and must learners accept each one?
- What is the default visibility of personal blocks and shared availability?
- Which calendar integrations, if any, are in scope and what permissions do they require?
- What are the retention and deletion rules for personal calendar history?
- Which workload warnings are pedagogically useful without becoming pressure?

## 18. Explicit non-actions and implementation status
This stage adds a design document only. It does not create a calendar UI, timetable editor, scheduler, conflict engine, notification job, integration, database table, column, RLS policy, RPC, trigger, storage object, or background worker. No live Supabase data or settings were changed. No migration, deployment, merge, or release was performed. All proposed planner behavior remains unimplemented and requires product, educator, privacy, and accessibility review.
