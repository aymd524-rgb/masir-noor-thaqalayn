# Stage 163 — Course Catalog, Enrollment, Class Capacity, and Purchase Lifecycle
Date: 2026-11-24
Status: design/documentation only; no storefront, enrollment workflow, payment provider, schema, or production setting implemented.

## 1. Purpose and principles
Design a transparent course catalog and enrollment lifecycle for Qur'an and Islamic learning courses. Support free and paid courses while keeping educational access, payment state, and class placement separate. The system must be usable on mobile, support Persian/Arabic RTL, protect minors' information, and never imply that payment guarantees a particular learning outcome.

Initial principles:
- Publish clear course objectives, age/level suitability, prerequisites, schedule, teacher, duration, language, delivery mode, capacity and price.
- Show whether a course is free, paid, full, waitlisted, closed or upcoming.
- Do not collect card details in the app.
- Do not activate enrollment solely from a client-side success screen.
- Avoid manipulative countdowns, scarcity claims, pressure sales or public learner rankings.
- Provide a clear refund/cancellation policy before payment.
- Keep this document conceptual until current schema, provider support, legal requirements and product decisions are verified.

## 2. Course catalog
Course listing fields:
- course title and concise description
- subject: Qur'an reading, tajwid, hifz, revision, translation, tadabbur, hadith/ethics or other approved category
- age band / learning level, prerequisites and accessibility notes
- learning objectives and expected weekly workload
- teacher profile limited to approved public teaching information
- course format: in-person, live online, recorded or blended
- schedule, timezone, start/end dates and duration
- class capacity and availability state
- price, currency, payment frequency and included services
- cancellation/refund summary and support contact route
- publication status and last reviewed date

Catalog filters should be understandable and accessible. Do not infer or publicly expose a learner's age, location, enrollment history or personal progress.

## 3. Course and class distinction
A course is the educational offering and may contain one or more class cohorts. A class cohort is a scheduled group with its own teacher, dates, capacity and roster. A learner may enroll in a course and then be assigned to a cohort, but the product must define whether these are one transaction or two explicit steps.

Avoid using a single mutable course row to represent multiple cohorts with different schedules. Course content and commercial terms should be versioned; cohort schedule/capacity should be separately managed.

## 4. Enrollment lifecycle
Suggested states:
- draft: enrollment not submitted
- pending_review: placement or eligibility review is needed
- pending_payment: a paid course awaits verified payment
- confirmed: all required conditions are satisfied
- waitlisted: capacity is full and learner opted in
- rejected: eligibility/placement not approved, with a clear explanation and next step
- cancelled: enrollment cancelled under policy
- completed: course finished
- expired: enrollment window or offer expired

Transitions must be server-controlled and auditable. A client cannot set its own status to confirmed or completed.

Suggested flow:
1. Learner or authorized guardian reviews the course details and policy.
2. User signs in; minimum required profile information is collected.
3. Eligibility/placement questions are asked only when needed.
4. User reviews schedule, capacity, price and refund/cancellation terms.
5. Free course: submit enrollment and await confirmation/placement if required.
6. Paid course: create a server-side pending order and redirect to a trusted payment provider.
7. Provider callback/webhook is verified server-side.
8. Server reconciles payment and enrollment idempotently.
9. User receives a confirmation with course/cohort details and next steps.
10. If full, user may join a waitlist without being charged.

## 5. Capacity and waitlist
- Capacity is defined per cohort, not just per course.
- Reserve a seat atomically when the enrollment is confirmed according to the approved policy.
- Pending payment reservations must have a short, explicit expiry and must not permanently block capacity.
- Use database transaction/locking or another concurrency-safe server mechanism to prevent oversubscription.
- Define whether payment is collected before or after final cohort assignment.
- Waitlist order should be deterministic and explainable (e.g. timestamp order or approved placement priority).
- Offer a seat for a bounded period; if not accepted, move to the next eligible person and record the transition.
- Never promise a seat until server-side capacity is confirmed.
- Admin overrides require a reason and audit entry.

## 6. Pricing, orders and payment boundary
Commercial records should be separate from educational records:
- course price/offer version
- order and order items
- payment attempt
- verified provider transaction reference
- refund request and refund outcome
- invoice/receipt metadata where legally required

Payment security:
- Use a reputable provider with hosted checkout or tokenized payment fields.
- Never store PAN/card number, CVV, bank password, one-time code or payment credentials.
- Provider secret keys remain server-side in managed secrets.
- Verify webhook signatures and provider transaction state server-side.
- Do not trust client query parameters, browser redirects or screenshots as proof of payment.
- Enforce idempotency for checkout creation, webhook processing, confirmation and refunds.
- Reconcile delayed, duplicate, out-of-order and failed callbacks.
- Keep amount, currency, order ID and course/offer version consistent between order and provider transaction.
- Do not mark an order paid until provider verification succeeds.
- Do not store unnecessary payment data; define retention and access restrictions.

No provider is selected by this plan. Provider availability, supported countries/currencies, fees, age restrictions and legal obligations must be reviewed before implementation.

## 7. Refunds, cancellation and disputes
Before checkout, clearly display:
- refund eligibility and deadlines
- cancellation rules for learner and provider
- what happens if a class is cancelled or teacher becomes unavailable
- partial-course and missed-session treatment
- support/escalation process
- any applicable statutory consumer rights

Refund lifecycle should be explicit: requested, under_review, approved, rejected, processing, completed. Only authorized staff/server processes may approve or execute refunds. Record reason codes and minimal notes; do not expose staff-only dispute notes to learners. Never claim a refund is complete until provider confirmation is received.

## 8. Minors, guardian and consent safeguards
- Determine the minimum data needed for enrollment.
- Do not collect government ID, exact home address, personal phone or sensitive family details unless a documented legal/operational requirement exists.
- If guardian consent is required by the relevant jurisdiction or service model, design a verified guardian relationship and consent record before collecting payment or enabling the relevant service.
- Do not assume that a learner's account email or phone belongs to a guardian.
- Explain price, recurring charges (if any), cancellation and refund terms in age-appropriate language.
- Avoid direct marketing or behavioral profiling of minors.
- Do not use urgency, streaks, fear of missing out or public comparisons to drive purchases.
- Restrict teacher/learner communication to approved educational channels and existing safeguarding controls.
- Obtain legal/privacy review for jurisdictions where learners and the service operate.

## 9. Roles and authorization
- Public visitor: view published catalog and public course details only.
- Learner: manage own enrollment requests, orders and receipts; view own confirmed courses.
- Verified guardian (future scope): only explicitly authorized learner enrollment/payment actions within a documented consent model.
- Teacher: view rosters and course information for currently assigned cohorts; no access to payment instruments or unrelated order details.
- Course manager: manage course descriptions, offers and cohort setup within assigned scope.
- Finance/admin role: view payment reconciliation and process approved refunds; access is separate from teacher privileges.
- System worker: process verified provider callbacks and scheduled expiry using least privilege.

All reads/writes require server-side authorization and RLS. Client-side role labels and hidden buttons are not authorization. Role demotion and assignment removal must revoke access.

## 10. Conceptual data model
Design concepts only; inspect live schema and existing migrations before any schema proposal:
- courses: title, slug, description, category, level, age_band, objectives, publication_state.
- course_versions: course_id, version, content_snapshot, policy_version, published_at.
- course_offers: course_version_id, price_minor_units, currency, payment_terms, available_from, available_until, status.
- course_cohorts: course_id, teacher_assignment, starts_at, ends_at, timezone, capacity, status.
- enrollment_requests: learner_id, course_id, cohort_id, status, submitted_at, reviewed_by, decision_reason_code.
- cohort_enrollments: cohort_id, learner_id, status, confirmed_at, ended_at.
- waitlist_entries: cohort_id, learner_id, position_key, status, offered_until.
- orders: buyer_id, status, currency, total_minor_units, policy_version, idempotency_key.
- order_items: order_id, course_offer_id, quantity, unit_amount_minor_units.
- payment_attempts: order_id, provider, provider_reference, status, amount_minor_units, currency, verified_at.
- payment_events: provider_event_id, event_type, received_at, processing_status.
- refund_requests: order_id, requested_by, amount_minor_units, reason_code, status, reviewed_by.
- enrollment_audit_events: enrollment_id, actor_id, event_type, timestamp, minimal_change_summary.
- guardian_consents (future): guardian_user_id, learner_id, scope, status, verified_at, expires_at.

Use integer minor units for currency amounts and an explicit currency code. Do not store floating-point money values. Avoid duplicating course terms across orders; preserve the offer/policy snapshot accepted at checkout.

## 11. Reporting and operations
- Course managers: enrollment totals, capacity, waitlist and cohort status.
- Teachers: current cohort roster and relevant educational needs only; no card/payment data.
- Finance/admin: order totals, verified/failed payments, refund queue and reconciliation exceptions.
- Learners: own enrollment state, payment status, receipt and next step.
- Reports must be scoped, paginated and date-bounded.
- Exports are disabled by default and require a purpose, authorization and audit record.
- Aggregate reports should avoid identifying individual learners unless necessary.

## 12. Reliability and failure handling
- Prevent duplicate orders and enrollments from repeated taps.
- Handle payment success arriving after reservation expiry with a defined refund/reassignment path.
- Handle provider timeouts without assuming payment failure or success.
- Reconcile webhook delivery retries and out-of-order events.
- Prevent two simultaneous confirmations from consuming the same final seat.
- Make cancellation and refund operations idempotent.
- Show clear pending state while verification is underway.
- Provide a support path for payment received but enrollment not confirmed.
- Never ask a user to share card details or one-time codes with staff.

## 13. Acceptance and security tests
1. Anonymous users cannot access private enrollment, order or payment records.
2. Learner A cannot read or alter Learner B's enrollments, orders or receipts.
3. Teacher cannot access payment details or unrelated cohorts.
4. Client cannot self-promote an enrollment to confirmed or mark an order paid.
5. Invalid or unsigned provider callback cannot confirm payment.
6. Duplicate webhook events do not duplicate enrollment or refund.
7. Concurrent enrollment requests cannot exceed cohort capacity.
8. Expired pending-payment reservations release capacity safely.
9. Full cohorts cannot accept confirmed enrollments; waitlist flow works.
10. Role demotion and cohort reassignment revoke access.
11. Course/offer changes after checkout do not alter the accepted order snapshot.
12. Amount/currency mismatch prevents payment confirmation.
13. Refund status is not shown as complete before provider confirmation.
14. No card number, CVV, OTP or secret is stored or logged.
15. Guardian actions require verified relationship and scoped consent where applicable.
16. RTL, keyboard, screen-reader and mobile checkout handoff tests pass.
17. No manipulative countdown, false scarcity or public learner ranking is present.

## 14. Release sequence
1. Inventory existing course, class, enrollment, profile, role and payment-related objects.
2. Resolve current authorization gaps and define course/cohort ownership.
3. Approve course metadata, pricing, capacity and enrollment states.
4. Approve refund/cancellation policy and legal/privacy requirements.
5. Build catalog and free enrollment in a feature branch with synthetic data.
6. Add capacity-safe cohort assignment and waitlist.
7. Select and review a supported payment provider; implement hosted checkout and verified webhook handling only after explicit approval.
8. Add finance reconciliation and refund controls with audit.
9. Run security, privacy, accessibility, child-safety and payment sandbox tests.
10. Obtain explicit authorization before production migration, payment activation, deployment or release.

## 15. Decisions required
- Which course categories and delivery formats are in initial scope?
- Does enrollment require teacher placement review?
- Is payment made before cohort assignment or after a seat is reserved?
- What are the capacity and waitlist rules?
- Which currency, countries and payment provider are supported?
- Are prices one-time or recurring? Recurring billing is out of scope until explicitly approved.
- What refund/cancellation policy applies?
- Is guardian verification/consent required, and how will it be implemented?
- Which roles may publish courses, edit offers, assign cohorts and process refunds?
- What financial records must be retained, and for how long?

## 16. Status and safety
This is a proposal only. No storefront, checkout, payment provider, provider credentials, order, enrollment, waitlist, course UI, database schema, RLS, grants, RPCs, triggers, or live settings were changed. No real payment was initiated, and no learner data was accessed or modified. No migration, deployment, merge or release was performed.
