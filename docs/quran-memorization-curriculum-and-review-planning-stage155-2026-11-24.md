# Stage 155 — Qur'an memorization curriculum and review-planning design

Date: 2026-11-24  
Repository: `aymd524-rgb/masir-noor-thaqalayn`  
Related pull request: #9

## Scope and evidence boundary

This stage defines a configurable learning-plan model for daily, weekly, and monthly memorization goals, review cycles, and teacher/student follow-up. It is grounded in the current source/migration shape reviewed in Stage 151 and the reporting/privacy designs in Stages 152–154.

Current source evidence:
- `hifz_assignments` stores an enrollment, surah/ayah range, assignment type (`memorization` or `review`), due date, instructions, and creator.
- `hifz_assignment_completions` stores one student-reported status per assignment (`in_progress`, `completed`, or `needs_help`), a client-supplied submission timestamp, and an optional note.
- `hifz_records` stores teacher-entered memorization/review records with assessment labels (`excellent`, `good`, `fair`, `needs_practice`) and session date.
- Existing student/teacher helpers load assignments and records; they do not yet establish a full curriculum calendar, daily target model, spaced-repetition scheduler, teacher approval state, or verified mastery model.

This is a design document only. It does not claim that a planner or scheduler has been implemented. No live database was queried, no student rows or personal notes were read, and no SQL, DDL, DML, migration, policy, grant, function, trigger, Auth/Data API setting, deployment, or production configuration was changed.

## 1. Learning-plan principles

1. **Flexible targets:** allow each learner/class to set a sustainable target. Do not force one universal daily amount or assume every learner progresses at the same rate.
2. **Small actionable units:** a target may be expressed in ayahs or a reviewed passage range. A teacher may choose a line-based target only when the selected mushaf edition and line mapping are explicit.
3. **New memorization and review are separate:** never count review repetition as new memorization.
4. **Review is continuous:** every new passage should enter a review plan; completing a new assignment does not mean the passage is permanently mastered.
5. **Assessment is distinct from completion:** student-reported completion, teacher assessment, and approved mastery must remain separate concepts.
6. **No shame-based indicators:** overdue or missed targets should be presented as a planning signal, not a judgment about the learner.
7. **Age- and ability-appropriate pacing:** the teacher/guardian and learner should be able to adjust workload, rest days, and review volume.
8. **Use a canonical Quran source:** surah and ayah boundaries must be validated against an approved metadata source. Do not infer page, line, hizb, or juz totals from ayah counts.
9. **Keep learning records private:** student sees own plan; teacher sees only currently authorized class/enrollment scope; admin receives only approved operational summaries.

## 2. Plan hierarchy

### Personal or class plan

A plan should define:
- Plan name and purpose (memorization, revision, or mixed).
- Learner/enrollment or class scope.
- Start date and optional end date.
- Active teaching days and rest days.
- Target unit (ayah range, passage, or a verified mushaf-line unit).
- Default new-memorization target per teaching day.
- Review workload limit per day.
- Review intervals or review rules.
- Assessment rubric and who may verify completion.
- Timezone used for due dates and daily boundaries.
- Status: draft, active, paused, completed, or archived.

A class template may be copied into individual learner plans, but each learner's workload and adjustments must be stored separately so the template does not override individual pacing.

### Daily plan item

Each daily item should identify:
- Date and plan.
- New memorization target, if any.
- Review targets drawn from earlier memorized passages.
- Optional recitation/listening/tadabbur activity as a separate learning activity.
- Expected effort or session duration only if the product defines a meaningful and non-coercive unit.
- Student-reported status.
- Teacher review status, if the product adopts teacher verification.
- A short, optional learner reflection; avoid collecting sensitive personal details.

### Weekly plan

A weekly plan should:
- Allocate new memorization across selected teaching days.
- Reserve dedicated review days or review blocks.
- Include a catch-up/rest buffer rather than filling every day.
- Summarize the total new target and review target separately.
- Let the teacher rebalance the plan after absences or difficulty.
- Show completed, pending-review, and needs-adjustment items separately.

### Monthly plan

A monthly plan should:
- Set one or more realistic learning outcomes.
- Show weekly checkpoints and planned review coverage.
- Reserve time for cumulative review of earlier passages.
- Include a teacher check-in and learner reflection.
- Allow the target to be revised without rewriting historical records.
- Avoid estimating mastered pages/juz unless a canonical edition mapping and explicit verification rule exist.

## 3. Review scheduling model

Use a transparent, teacher-adjustable review schedule rather than an opaque “AI mastery” score.

Suggested initial review checkpoints after a passage is first taught:
- Same session: immediate consolidation.
- Next teaching day: short recall.
- About one week later: spaced review.
- About two weeks later: follow-up review.
- About one month later: cumulative review.

These are starting defaults for a configurable plan, not universal pedagogical rules. The teacher may shorten or lengthen intervals based on the learner's age, pace, attendance, and assessment.

A future scheduler should:
1. Create review candidates only after a new passage has been assigned or recorded according to the approved workflow.
2. Avoid scheduling a review before the passage has actually been introduced.
3. Respect class teaching days, holidays, rest days, and the learner's daily review cap.
4. Prioritize overdue review items without allowing the queue to grow without limit.
5. Reschedule missed reviews with teacher/learner visibility; do not silently mark them complete.
6. Preserve the original due date and record a reschedule event if the audit-trail design is implemented.
7. Allow teacher override with a reason when the schedule is materially changed.
8. Distinguish “review attempted” from “review passed” and from “mastery verified”.

Do not automatically label a passage “mastered” merely because it passed a calendar interval or a student checked “completed”.

## 4. Assessment and progression states

The current source uses assessment labels `excellent`, `good`, `fair`, and `needs_practice`. Before building progression rules, define the rubric in learner-friendly language and agree how each label affects the next review date.

Suggested conceptual states (requires product approval):
- `planned`: scheduled, not yet attempted.
- `in_progress`: learner has started the assignment.
- `student_reported_complete`: learner says the assignment is complete.
- `submitted_for_review`: learner has submitted work for teacher review.
- `reviewed`: an authorized teacher has assessed the recitation.
- `needs_revision`: teacher requests another practice/review.
- `verified`: teacher has confirmed the specific defined learning outcome.
- `cancelled`: assignment was cancelled with a reason/category.

Do not retrofit these labels into the existing completion table without a migration and transition design. The present completion status is self-reported; it is not teacher approval. A future schema may separate student submission from teacher review rather than overloading one status column.

## 5. Goal and progress calculations

Every displayed metric needs a written definition and denominator.

| Metric | Proposed calculation | Interpretation |
|---|---|---|
| Daily target completion | qualifying completed new-memorization units / planned new units for that day | Planning adherence, not mastery |
| Weekly new target | sum of new-memorization units assigned during the week | Planned workload |
| Weekly new completion | teacher-reviewed or explicitly defined completion units / planned new units | Label the evidence type |
| Review coverage | review items attempted / review items due in the selected period | Coverage, not correctness |
| Review quality | distribution of teacher assessment labels for reviewed items | Requires a stable rubric |
| Cumulative review freshness | count of due review items not yet attempted, grouped by age | Helps manage backlog |
| Verified passage count | distinct passage ranges with an approved teacher verification state | Only if that state is implemented |
| Attendance context | teaching sessions attended / scheduled sessions | Context only; not a proxy for effort or ability |

Rules:
- Count distinct passage/session items where appropriate; avoid double-counting multiple records for one session.
- Keep ayah counts and page/line counts separate.
- Do not sum overlapping ranges as if they were unique passages.
- Exclude cancelled items from target denominators according to a documented rule.
- Preserve corrected/voided records in history but exclude them from current totals.
- Show the period, timezone, units, and data freshness next to each metric.
- If there are no records, show “no activity recorded” rather than 0% achievement.
- Never use public rankings or comparisons between children as a default motivation mechanism.

## 6. Teacher workflow

A teacher should be able to:
1. Choose an authorized class and learner.
2. Select or create an approved plan template.
3. Set a daily/weekly target and review cap.
4. Assign a passage using surah and ayah boundaries validated against canonical metadata.
5. Schedule review items and due dates.
6. View student-reported completion separately from teacher-reviewed work.
7. Record an assessment using a documented rubric.
8. Set the next review date or accept a suggested date.
9. Adjust workload after absence, difficulty, or a learner request.
10. See a bounded history of changes and corrections where the audit trail is available.

The teacher's current role and class assignment must both be checked server-side on every read/write. The earlier role-demotion finding remains an implementation blocker: a class assignment alone must not preserve teacher access after the account loses the required teacher role.

## 7. Student workflow

A student should be able to:
1. View today's new target and review items.
2. Open the passage in the app's selected Uthmani mushaf display, if the relevant text is available and licensed for the intended use.
3. Mark an item as started or submit a self-reported completion.
4. Ask for help or indicate that more practice is needed.
5. View teacher feedback once released to the student.
6. See the next review date and a simple explanation of why it is scheduled.
7. Request a workload adjustment through an appropriate teacher-facing workflow.

The student must not be able to set teacher assessment, verified mastery, another student's progress, or server-authoritative timestamps.

## 8. Admin and program oversight

Administrators should see aggregate program operations:
- Active plans and classes.
- Planned new-memorization and review workload by week.
- Items awaiting teacher review.
- Classes with stale or incomplete plan data.
- Teacher assignment coverage and program-level activity.

Detailed student history should require a deliberate, permission-checked drill-down for an approved purpose. Do not expose phone numbers, private notes, or full individual histories in an aggregate dashboard.

## 9. Data model concepts for a future implementation

Do not create these tables in this stage. A future implementation may need the following conceptual entities:

- `hifz_plans`: owner/scope, date range, timezone, target settings, status, created/updated metadata.
- `hifz_plan_days`: plan, local date, teaching/rest designation, planned new target and review cap.
- `hifz_plan_items`: passage range, item type (new/review), due date, source passage, status.
- `hifz_review_events`: attempted/reviewed date, assessment, next due date, reviewer when applicable.
- `hifz_submission_reviews`: teacher review outcome separated from student self-report, if approved.
- Existing `hifz_assignments` may remain the assignment transport layer or be linked to plan items after schema review.

Data integrity:
- Derive actor identity from authenticated server context.
- Use server timestamps for authoritative events.
- Validate surah/ayah bounds server-side using a canonical metadata source.
- Prevent overlapping/duplicate plan items where the product rules require uniqueness.
- Use transactions for creating plan items and linked assignments.
- Apply RLS and table grants together; RLS does not replace table privileges.
- Enforce current teacher role plus current class assignment for teacher scope.
- Bind student access to `auth.uid()` and the student's own enrollment.
- Keep audit events append-only as proposed in Stage 153.
- Do not accept client-provided aggregate totals as authoritative.

## 10. Staging test matrix

Use synthetic accounts and a disposable staging project only.

| Scenario | Expected result |
|---|---|
| Teacher creates a plan for an assigned learner | Allowed only with current teacher role and assignment |
| Teacher creates plan for unrelated class | Denied |
| Teacher is demoted but class assignment remains | New plan reads/writes denied |
| Student opens own daily plan | Only own authorized plan items appear |
| Student changes supplied student/enrollment ID | No other learner data returned |
| Student marks a task complete | Only self-reported state changes; teacher assessment remains unchanged |
| Student attempts to set verified/mastery state | Rejected |
| Invalid surah/ayah range is submitted directly to API | Server/database rejects it |
| Review item is scheduled before passage introduction | Rejected or held until introduction state exists |
| Rest day is configured | No ordinary new target is generated for that day |
| A missed review is rescheduled | Original due date remains traceable; no automatic completion |
| Same passage appears in multiple overlapping records | Unique progress calculations do not double-count it |
| Teacher changes an assessment | Authorized audit event is created if Stage 153 is implemented |
| Student A requests Student B's plan | Denied/no visible rows |
| Anonymous user requests a plan | Denied |
| Empty month has no records | UI shows “no activity recorded,” not a misleading zero achievement |

Capture the synthetic role, enrollment/class assignment, plan configuration, date/timezone, request result, and persisted state. Do not use production student records.

## 11. Product decisions required

1. Which target units should be supported initially: ayah range only, passage, or a verified mushaf-line unit?
2. Should the default plan be daily, three teaching days per week, or selected by each class? No schedule should be imposed without the class/learner configuration.
3. What review intervals should be offered as defaults, and who may override them?
4. Does “completed” mean student-reported completion, submitted for review, or teacher-approved completion? These should remain distinct.
5. Which teacher assessment labels and rubric definitions should be visible to students?
6. Should a teacher be allowed to set a learner's daily target individually even when the class uses a common template?
7. Which canonical Quran text and metadata source (including mushaf edition/page/line mapping, if needed) is approved?
8. What is the policy for holidays, missed days, rest days, and catch-up work?
9. How long should plan history, review events, and assessment records be retained?

## 12. Implementation sequence

1. Approve the learning-state vocabulary, assessment rubric, and target units.
2. Confirm the canonical Quran metadata source and validation strategy.
3. Resolve teacher role-demotion and class-scope authorization before adding planner writes.
4. Design plan tables and migrations in a separate feature branch; do not alter the existing assignment model without compatibility review.
5. Implement a read-only student daily plan view against synthetic fixtures first.
6. Add teacher plan creation and review scheduling only after server-side authorization and validation are tested.
7. Add progress metrics using the definitions in this document.
8. Verify timezone, rest-day, missed-review, overlap, and correction behavior in staging.
9. Obtain explicit review and approval before any production migration or deployment.

## Conclusion

The recommended planner is a flexible, teacher-guided system that separates new memorization from review, student self-report from teacher assessment, and planned progress from verified mastery. Its first release should favor clear daily tasks, manageable weekly goals, and a transparent review queue over complex scoring or automatic claims of mastery.

**Stage status:** design/documentation only. No live database access or mutation, no migration execution, no deployment, and no PR merge.
