# Stage 162 — Notifications, Hifz Reminders, and Qur'an Learning Activity Calendar
Date: 2026-11-24
Status: design/documentation only; no application, database, notification provider, or scheduling feature implemented.

## 1. Purpose and product boundaries
Define a calm, reliable notification and calendar model for Qur'an learning activities: class announcements, upcoming sessions, assignment due dates, memorization/revision reminders, and approved community learning events. Notifications should support learning without creating pressure, exposing private information, or interrupting learners excessively.

This is not authorization to send messages to real users. No notification provider, push credential, email/SMS integration, background worker, or production schedule is configured by this document.

## 2. Notification categories
Use a small allowlist of event types:
- Class schedule: upcoming session, approved reschedule, cancellation.
- Class announcement: a teacher/admin publishes an announcement to an authorized class.
- Learning task: a new assignment, due-date change, or teacher feedback available.
- Hifz plan: learner-requested reminder for a memorization or revision task.
- Calendar event: an approved Qur'an class, workshop, recitation gathering or learning event.
- Account/security: essential sign-in or account security notices, handled separately from educational reminders.

Do not create notifications for every minor database change. Do not notify peers about another learner's attendance, scores, memorization status, or teacher feedback.

## 3. Delivery channels and content rules
Preferred order:
1. In-app notification center.
2. Optional device push, only after platform permission and user preference.
3. Email only for account-related or explicitly approved guardian/administrative notices.
4. SMS is out of initial scope.

Push and email previews must be generic. Example: “A learning update is available” rather than naming a learner's class, Qur'an passage, grade, attendance status, or private feedback on a locked screen. Sensitive details remain behind authenticated access checks in the app.

Never include passwords, access tokens, private notes, answer keys, personal phone numbers, absence reasons, or detailed learner profiles in notification payloads.

## 4. Preferences, consent and quiet hours
- Educational reminders are opt-in and can be paused or disabled without penalty.
- Essential security notices are distinct from optional learning reminders.
- Allow category-level preferences and channel-level preferences.
- Respect device notification permission; do not repeatedly prompt after denial.
- Store a user-selected timezone and quiet-hours window; do not infer a minor's availability.
- Do not send optional reminders during configured quiet hours, weekends/holidays if the learner has disabled them, or outside approved local sending windows.
- Provide a clear “pause reminders” control and an easy way to change preferences.
- Never use guilt, streak loss, countdown pressure, shame, public comparisons, or manipulative urgency.
- Guardian notifications, if later supported, require a verified relationship and an explicit policy; do not silently copy all learner activity to guardians.

## 5. Hifz and revision reminder model
Reminders are prompts, not proof of completion or an assessment.
- Learner or authorized teacher selects a reasonable reminder time and frequency.
- A reminder points to the learner's own assigned task or personal plan after authentication.
- Distinguish new memorization from revision.
- Support flexible targets and rest days; no punitive streaks or escalating reminders.
- Do not automatically increase workload when a learner misses a reminder.
- A learner may mark a reminder complete, snooze it, or dismiss it; completion status must remain distinct from teacher-verified mastery.
- Teacher-assigned reminders should be visible only to the relevant learner and authorized class staff.
- Avoid reminders for tasks that are cancelled, completed, superseded, or no longer authorized.

## 6. Calendar model and visibility
Calendar views may include:
- Personal learner calendar: own upcoming classes, assignments, personal hifz/revision reminders and published events.
- Teacher calendar: sessions and tasks for currently assigned classes only.
- Public calendar: only events explicitly approved for public visibility; never include class rosters, learner names, attendance or private schedules.
- Admin calendar: operational events needed for the admin's role.

Each event should have a visibility scope (public, class, individual, staff-only), start/end timestamps, timezone, publication state, cancellation state, organizer and source record. The server must enforce visibility; client-side calendar filtering is not a security boundary.

Recurring events need an explicit recurrence rule and exception handling for holidays, cancellations and rescheduling. Preserve the original event reference and record changes so reminders can be recalculated safely.

## 7. Delivery lifecycle and reliability
Conceptual lifecycle:
1. A trusted server-side event is created (e.g. announcement published or session rescheduled).
2. Authorization determines the eligible recipients from current enrollment/assignment and preferences.
3. A minimal notification job is placed in an outbox transactionally with the source event.
4. A worker claims the job and checks current recipient eligibility again before delivery.
5. Delivery provider response and retry state are recorded without storing secrets in logs.
6. User opens the app and the notification center fetches current content through normal authorization.

Reliability requirements:
- Use a stable idempotency key per event, recipient and channel.
- Prevent duplicate sends on worker retries.
- Use bounded exponential backoff and a dead-letter/review state after repeated failure.
- Expire obsolete reminders and cancelled-session notifications.
- Recheck class membership, teacher assignment, account status and notification preferences immediately before sending.
- Do not treat provider delivery as proof that a learner read or understood content.
- Keep provider credentials server-side only; never expose them in browser code or client logs.

## 8. Conceptual data model
Design concepts only; inspect the current live schema and existing notification tables before any migration.
- notification_preferences: user_id, category, channel, enabled, timezone, quiet_hours, updated_at.
- notification_outbox: event_type, source_id, recipient_id, channel, idempotency_key, minimal_payload, scheduled_at, expires_at, status, attempt_count.
- notification_deliveries: outbox_id, provider_message_id (if safe), result_code, attempted_at, delivered_at.
- in_app_notifications: recipient_id, event_type, source_id, created_at, read_at, expires_at.
- calendar_events: title, description, starts_at, ends_at, timezone, visibility, publication_state, organizer_id, source_type, source_id.
- calendar_event_exceptions: event_id, occurrence_key, exception_type, replacement_times, reason_code.
- reminder_rules: learner_id, task_id, category, local_time, timezone, recurrence, enabled, next_due_at.
- reminder_actions: reminder_id, actor_id, action (complete/snooze/dismiss), acted_at.

Avoid duplicate source-of-truth fields. For example, class-session dates should remain in the session record; the calendar should reference that record rather than independently editing a second copy.

## 9. Authorization and privacy
- Derive recipient identity from trusted server-side records, not client-supplied user IDs.
- Learner can read and manage only their own optional reminder preferences and personal reminder rules.
- Teacher can create class notifications only for currently assigned classes and authorized learners.
- Admin access is least-privilege and auditable.
- Public users can read only approved public calendar events.
- Anonymous users cannot access personal notifications, class calendars, or private reminders.
- Revoke eligibility when enrollment ends, class assignment changes, teacher role is removed, or account access is disabled.
- Revalidate before delivery; queued jobs must not preserve stale access.
- Apply RLS to direct table access and server-side checks to RPC/worker paths.
- Minimize retention of delivery metadata; define retention and deletion rules before release.

## 10. User experience and accessibility
- Notification center grouped by date and category, with clear read/unread state.
- Separate urgent account/security notices from optional educational reminders.
- Clear controls: mark read, dismiss, pause reminders, adjust preferences.
- Calendar list view as an accessible alternative to a visual month grid.
- Use readable local date/time and show timezone when ambiguity is possible.
- RTL-safe Persian/Arabic text, keyboard navigation, screen-reader labels and non-color status indicators.
- Empty, loading, offline, permission-denied, expired and failed-delivery states.
- Do not show a notification badge count that creates unnecessary pressure.

## 11. Abuse prevention and operational controls
- Rate-limit notification creation per user, class and event type.
- Restrict who can publish to a class or public calendar.
- Require review/approval for public events and broad audience notices.
- Provide report and moderation workflow for inappropriate announcement content.
- Prevent notification endpoints from being used as arbitrary bulk messaging.
- Audit publisher, audience, source event, schedule changes and moderation actions.
- Redact payloads and provider credentials from logs.
- Document incident response for misdirected or duplicate notifications.

## 12. Acceptance and security tests
1. Learner A cannot list or read Learner B's notifications or reminder rules.
2. A teacher without current class assignment cannot notify that class.
3. Teacher role demotion or class reassignment invalidates queued recipients.
4. Cancelled/rescheduled sessions invalidate or update stale reminders.
5. Duplicate worker retries produce at most one logical delivery per idempotency key.
6. Quiet hours and disabled preferences suppress optional reminders.
7. Device push denial does not block in-app learning access.
8. Push previews reveal no sensitive learner, class, score, attendance or Qur'an progress details.
9. Public calendar responses contain no private class or learner data.
10. Anonymous requests cannot retrieve personal calendars or notifications.
11. A learner marking a reminder complete does not create teacher-verified mastery.
12. Rate limits prevent arbitrary bulk notification or announcement abuse.
13. Timezone changes and daylight-saving transitions do not cause duplicate or unexpectedly timed reminders.
14. Accessibility and RTL tests pass for notification center and calendar list/grid.

## 13. Release sequence
1. Inventory existing notification, calendar, session, assignment, enrollment and auth objects.
2. Approve notification categories, preferences, retention and quiet-hour defaults.
3. Implement in-app notifications only in a feature branch with synthetic accounts.
4. Add server-side recipient calculation, RLS, outbox and idempotency tests.
5. Add personal hifz reminders with opt-in controls and flexible schedules.
6. Add calendar views using existing session/event sources.
7. Consider device push only after privacy review, permission UX and provider-secret handling are complete.
8. Run staging security, child-safety, accessibility and delivery reliability tests.
9. Obtain explicit authorization before production migration, provider setup, deployment or release.

## 14. Decisions required
- Which notification categories are essential versus optional?
- Which timezone and default quiet-hour policy should apply?
- Are learner reminders self-managed, teacher-assigned, or both?
- What are the allowed reminder frequencies and pause controls?
- Which event types may appear on a public calendar?
- Are guardian notifications in scope, and what verified consent model applies?
- What retention periods apply to notification and delivery metadata?
- Is push needed at launch, or is in-app notification sufficient?

## 15. Status and safety
This is a design document only. No UI, notification center, calendar, reminder scheduler, worker, provider integration, credentials, database schema, RLS, grants, RPCs, triggers, or live settings were changed. No real notifications were sent and no learner data was accessed or modified. No migration, deployment, merge or release was performed.
