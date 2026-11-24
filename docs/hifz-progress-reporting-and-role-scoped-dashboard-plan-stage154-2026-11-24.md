# Stage 154 — Hifz progress reporting and role-scoped dashboard plan

Date: 2026-11-24  
Repository: `aymd524-rgb/masir-noor-thaqalayn`  
Related pull request: #9

## Scope and evidence boundary

This document proposes how the app could summarize Qur'an memorization progress for students, teachers, and administrators. It builds on the source-level workflow review in Stage 151, the privacy/data-minimization review in Stage 152, and the audit-trail proposal in Stage 153.

This is a product and technical design, not a claim that these dashboards or calculations are implemented. No live database was queried, no user or student rows were read, and no SQL, migration, policy, grant, function, trigger, Auth/Data API setting, deployment, or production configuration was changed. The current source review identified student self-reported assignment completion and teacher-entered hifz assessments as distinct signals; the dashboard must not conflate them.

## 1. Reporting principles

1. **Show learning evidence, not unsupported certainty.** Distinguish assigned, in-progress, student-reported complete, submitted for review, and teacher-verified states if the product adopts a verification workflow.
2. **Keep each view role-scoped at the database/server boundary.** Client-side filters are presentation only and never authorization.
3. **Prefer personal progress over public ranking.** Do not create public leaderboards or compare children's memorization rates. Use private goals and supportive feedback.
4. **Explain every metric.** Show the date range, numerator, denominator, exclusions, and whether a value is self-reported or teacher-assessed.
5. **Minimize student data.** Do not expose contact details, private notes, unrelated records, or another student's identity in a progress summary.
6. **Make missing data visible.** No recorded activity is not the same as zero learning or failure.
7. **Support correction and traceability.** Where an underlying record is corrected, the report should reflect the current authorized record and link to an appropriately restricted history, consistent with the future audit-trail design in Stage 153.

## 2. Student dashboard

The student should see only their own enrolled learning activity and progress.

### Suggested sections

- **My current plan:** active weekly assignments, due dates, surah and ayah ranges, and the status of each assignment.
- **Memorization and review activity:** records entered by an authorized teacher, clearly labeled by record type and session date.
- **My submissions:** completion statuses the student submitted, clearly labeled as self-reported until reviewed if the product chooses teacher verification.
- **Personal trend:** a simple weekly or monthly count of recorded sessions/assignments and reviewed milestones. Avoid implying that counts alone measure mastery.
- **Next step:** the next active assignment or a teacher-approved revision target.
- **Data freshness:** last recorded activity date and an explanation when no recent data exists.

### Student metric definitions

| Metric | Proposed definition | Important label |
|---|---|---|
| Active assignments | Count of assignments currently assigned and not cancelled | Current workload, not achievement |
| Student-reported completions | Count of assignments the student marked completed in the selected period | Self-reported |
| Teacher-reviewed records | Count of hifz/review records entered by an authorized teacher in the period | Teacher-recorded; assessment meaning must be defined |
| Recorded learning sessions | Count of distinct session dates with at least one qualifying record | Recorded activity, not total study time |
| Personal goal progress | Completed qualifying milestones divided by milestones in the student's approved personal goal | Show goal and period; never compare across students |

Do not estimate memorized juz or pages from arbitrary row counts. If a canonical Quran mapping is introduced, define the exact mushaf edition and mapping rules first. The app's requested Uthmani text presentation is separate from the calculation model and must not be used as an unreviewed proxy for page/juz totals.

## 3. Teacher dashboard

Teachers should see only students and records in classes/enrollments they are currently authorized to manage, and only while the account has the required current teacher role.

### Suggested sections

- **My assigned classes:** class name, active enrollment count, and date of most recent recorded activity.
- **Class activity summary:** counts of assignments due, submissions awaiting review, and teacher-recorded sessions during a selected period.
- **Review queue:** student-reported completions or items explicitly submitted for review, if that workflow is approved.
- **Individual learner view:** one selected learner's assignments and teacher-visible educational history, limited to the teacher's currently assigned class scope.
- **Data gaps:** learners with no recent record in the chosen period, described neutrally as “no activity recorded” rather than “not progressing”.
- **Correction workflow:** links to edit/correct records only where the teacher has the appropriate write permission; correction reasons should be handled according to Stage 153's privacy and audit policy.

### Teacher metric definitions

| Metric | Proposed definition | Safeguard |
|---|---|---|
| Active learners | Distinct active enrollments in classes currently assigned to this teacher | Recompute from current authorization |
| Awaiting review | Count of student submissions in a distinct review-pending state | Do not infer pending review from a generic completed flag |
| Sessions recorded | Distinct class/session dates with teacher-entered educational records | Exclude duplicate rows for the same session where appropriate |
| Assignments due | Active assignments whose due date falls within the selected period and are not cancelled | State date range and timezone |
| Learners with no recent record | Enrollments with no qualifying record in the selected window | Label as missing recorded data, not lack of effort |

Do not expose all historical notes and assessment details in the initial dashboard query. Load a bounded summary first; retrieve a learner's detailed history only after an authorized teacher selects that learner and the server rechecks access.

## 4. Administrator dashboard

Administrators may need institution-wide operational summaries, but broad visibility should not imply unrestricted access to every personal detail.

### Suggested sections

- **Program overview:** active classes, active enrollments, teachers with current assignments, and activity totals for a selected period.
- **Learning workflow health:** assignments created, submissions awaiting review, teacher-recorded sessions, and records requiring correction.
- **Class-level comparisons:** operational completeness and workload summaries only where useful; avoid ranking individual children or teachers by simplistic memorization counts.
- **Data quality:** missing class links, invalid or incomplete record states, duplicate session entries, and stale assignments.
- **Security/audit overview:** counts of authorized correction events and access-denial signals where available; detailed audit records remain separately permissioned.
- **Export controls:** disabled by default until the product defines a legitimate purpose, approved roles, fields, date limits, and audit logging.

Administrative dashboard summaries should aggregate by default. Student names and detailed educational records should require a deliberate, permission-checked drill-down.

## 5. Shared calculation and data rules

Before implementing metrics, define a single server-side reporting contract:

- Date windows use an explicitly selected timezone and inclusive/exclusive boundaries documented in the UI.
- Distinguish calendar days from teaching sessions; multiple records in one session must not inflate session counts.
- Cancelled assignments and voided/corrected records must follow explicit inclusion rules.
- Self-reported completion must not be counted as teacher-verified mastery.
- A teacher-entered assessment must not automatically mean a full surah or juz is mastered unless the assessment rubric explicitly says so.
- Store raw source records as the source of truth; derive summaries from them. Do not let the browser submit its own authoritative totals.
- If cached/materialized summaries are later used, define invalidation, refresh timing, and a safe fallback to source records.
- Return explicit empty states and data freshness metadata; do not silently turn missing records into zero achievement.
- Avoid arbitrary percentage scores until the product defines a meaningful denominator and assessment rubric.

## 6. Authorization and privacy model

| Role | Allowed reporting scope | Must not receive |
|---|---|---|
| Student | Own enrollment, own assignments, own submissions, and teacher-visible feedback released to that student | Other students' records, staff-only notes, admin metadata |
| Teacher | Current assigned classes and enrolled learners within those classes, subject to current teacher role | Unassigned classes, unrelated student records, contact data without a separate approved need |
| Admin | Institution-level aggregates; authorized detail drill-down for an approved operational purpose | Secrets, credentials, unnecessary contact details, unrestricted bulk export |
| Anonymous | No student or class reporting data | All private reporting data |

Security requirements:
- Enforce authorization in RLS or trusted server-side reporting functions; do not trust supplied `student_id`, `class_id`, `teacher_id`, or role values from the client.
- Teacher scope must require both current teacher role and current class assignment. This addresses the role-demotion concern carried from Stages 148 and 151.
- Student scope must bind to `auth.uid()` and the student's own enrollment.
- Admin functions must check admin status inside the trusted function body; a hidden UI control is not an access control.
- Any SECURITY DEFINER reporting function must use a fixed/empty search path, schema-qualified references, narrowly scoped EXECUTE grants, bounded inputs, and explicit role/scope checks.
- Do not return broad JSON rows from reporting RPCs. Return typed, minimal aggregates and bounded detail projections.
- No report endpoint should return phone numbers, credentials, raw private notes, or quiz answer keys.

## 7. Performance and accessibility

- Start with bounded date ranges and pagination for detailed history.
- Aggregate in the database for class/institution summaries rather than downloading all student histories into the browser.
- Index only after reviewing actual query plans and workload; avoid speculative indexes.
- Keep dashboard queries independent where possible so a slow detail panel does not block the whole page.
- Provide readable labels, keyboard navigation, screen-reader-friendly chart summaries, and a text/table alternative to every chart.
- Use simple trend lines or progress bars only when their denominator is meaningful. Always show the exact period and a short definition.
- On small screens, prioritize current assignments and the next action over dense charts.

## 8. Staging verification matrix

Use synthetic accounts and fixtures in a disposable staging project only.

| Scenario | Expected result |
|---|---|
| Student A opens dashboard | Only A's own authorized summary and assignments appear |
| Student A changes a client-supplied student ID to Student B | Server returns no B data / denies request |
| Teacher with active role and current class assignment opens dashboard | Only currently assigned classes and their enrollments are included |
| Teacher loses class assignment | Subsequent summary and detail requests exclude that class |
| Teacher role is demoted but class assignment remains | Teacher reporting access is denied unless a separately approved role model says otherwise |
| Teacher opens an unrelated learner by guessed ID | No data returned |
| Admin opens overview | Institution-level aggregates are returned within the approved scope |
| Anonymous user requests any report | Denied |
| Assignment is cancelled | It is excluded from active/due metrics according to the documented rule |
| Student marks an assignment completed | It appears as self-reported, not verified mastery |
| Teacher records a review | It appears as teacher-recorded/reviewed only according to the approved rubric |
| Multiple records exist in one session | Session count does not inflate unexpectedly |
| No records exist in the selected period | UI displays “no activity recorded” and does not imply zero learning |
| Date range crosses timezone boundary | Results match the selected timezone and documented boundary rules |
| A record is corrected/voided | Summary recalculates consistently and authorized history remains available |

For each test, record the role, synthetic identity, class assignment state, date window, request outcome, and expected aggregate. Do not use real students or production data.

## 9. Product decisions required

1. Which exact hifz assessment labels and rubric should be shown to students (for example, practice, reviewed, needs revision, or teacher-approved mastery)?
2. Is student “completed” currently intended to mean self-reported completion, or should it enter a teacher review queue?
3. Which reporting periods are needed by default: current week, month, term, or a custom date range?
4. Which timezone should class/session reporting use: institution timezone or class-specific timezone?
5. Should administrators see student-level detail by default, or only after an explicit drill-down for an approved purpose?
6. Are downloadable reports required? If yes, which roles, fields, date limits, and audit events are required?
7. What canonical Quran edition and mapping should be used if the product later displays pages, hizb, or juz progress?
8. Which records are considered voided/corrected and how should they affect historical aggregates?

## 10. Recommended implementation sequence

1. Approve metric definitions and the distinction between self-reported completion and teacher assessment.
2. Complete the current mutation/read-path inventory and resolve teacher role-demotion behavior.
3. Design minimal server-side reporting contracts and role-scoped RLS/RPC authorization.
4. Build student dashboard first, using own-data-only queries and explicit labels.
5. Add teacher review queue and bounded class summaries after synthetic staging authorization tests pass.
6. Add admin aggregate view with controlled detail drill-down and no default bulk export.
7. Validate performance, accessibility, timezone behavior, and data freshness with synthetic fixtures.
8. Obtain explicit review before any production migration or deployment.

## Conclusion

The dashboard should help each learner understand their own next step, help teachers manage authorized review work, and help administrators monitor program operations without exposing unnecessary student details. The most important correctness rule is to keep student self-reports, teacher assessments, and verified mastery distinct. Implement only after product definitions and server-side authorization are agreed and staging tests pass.

**Stage status:** design/documentation only. No live database access or mutation, no migration execution, no deployment, and no PR merge.
