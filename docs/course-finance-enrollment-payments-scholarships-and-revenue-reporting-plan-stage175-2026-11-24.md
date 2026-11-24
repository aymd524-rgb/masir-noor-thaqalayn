# Stage 175 — Course Finance, Enrollment Payments, Scholarships, and Revenue Reporting

**Date:** 2026-11-24  
**Status:** Design proposal only. No payment provider, code, database, or production setting is changed.

## 1. Purpose and boundaries

Define a transparent financial workflow for free and paid Quran and religious-learning courses: published pricing, enrollment, payment status, discounts, scholarships, refunds, receipts, and institution-level reporting. This plan complements Stage 163 (course catalog, capacity, enrollment, and purchase lifecycle) and must be reconciled with that design before implementation.

This document is not a selection of a payment processor, legal/tax policy, or authorization to collect real payments. Provider availability, supported countries/currencies, fees, age requirements, and compliance obligations must be verified by the institution before a provider is selected.

## 2. Course pricing and enrollment options

Each course/cohort may be configured as:
- Free: price is explicitly zero; no payment method or payment-provider checkout is required.
- Fixed fee: one published amount and currency.
- Installments: defined schedule, due dates, and consequences of missed installments disclosed before enrollment.
- Sponsored seat: a sponsor or institution covers the fee; learner-facing amount is zero.
- Scholarship/fee waiver: full or partial reduction with an approval record and validity period.
- Discount: time-limited, eligibility-limited, or invitation code with clear terms.

Price, currency, refund policy, enrollment capacity, payment schedule, and what the fee includes must be visible before a learner or guardian confirms enrollment. Do not silently change the price of an already accepted order. Changes apply to new orders unless an explicit, documented agreement says otherwise.

## 3. Order and payment lifecycle

Suggested order states: draft → awaiting_confirmation → pending_payment → paid → fulfilled/enrolled; alternate terminal or exception states include cancelled, expired, partially_refunded, refunded, disputed, and payment_failed.

Keep separate concepts distinct:
- Enrollment status describes access to a course/cohort.
- Order status describes the commercial request.
- Payment status describes settlement with the provider.
- Scholarship/discount status describes the approved price adjustment.

A provider redirect or client success screen is not proof of payment. Only a verified server-to-server provider notification or a trusted server-side status confirmation may mark an order paid. Verify webhook signatures, event authenticity, expected amount/currency, order reference, and provider account. Process events idempotently and tolerate duplicate, delayed, and out-of-order notifications. Never trust client-supplied payment status or amount.

## 4. Checkout and payment-provider integration

Provider selection remains an explicit product and institution decision. Before selection, compare supported legal entity/country, currencies, payment methods, settlement, fees, refunds, dispute handling, accessibility, webhook reliability, documentation, data processing, and no-cost development/testing options.

Security requirements:
- Create checkout sessions only through trusted server code after validating course availability, current price, discounts, and learner eligibility.
- Use provider-hosted checkout or tokenized provider components where possible; do not store card numbers, security codes, bank credentials, or payment passwords in the application.
- Keep API secrets in server-side secret storage only; never put secrets in frontend bundles, repository files, logs, or client-visible configuration.
- Verify webhook signatures and replay protections; store provider event identifiers for idempotency.
- Reconcile local order records against provider settlement reports; surface mismatches for authorized review.
- Do not treat a browser return URL as payment confirmation.
- Use synthetic/test transactions in staging. No live charge or provider connection is authorized by this document.

## 5. Discounts, scholarships, and sponsored seats

Define eligibility, amount or percentage, course scope, start/end dates, maximum uses, combination rules, funding source, and approval authority for each offer. Prevent negative totals and validate rounding/currency precision server-side.

Scholarship workflow: application or referral (if enabled) → restricted review → approve/decline → apply to eligible order → record funding allocation → expire or renew. Collect only the minimum information needed; avoid asking for sensitive personal details unless there is a clear, approved need. A learner should not be publicly labeled as a scholarship recipient.

Require separation of duties for high-value or institution-funded awards where practical. Teachers may recommend support but should not automatically gain finance-admin access. Record decision maker, reason category, amount, dates, and any override in an audit trail. Provide an appeal or correction route.

## 6. Refunds, cancellations, and disputes

Publish a plain-language refund and cancellation policy before checkout, including course start, partial attendance, installment, duplicate payment, and institution-cancellation scenarios. Actual policy must be approved by the institution and comply with applicable law and provider terms.

Refund workflow: request → eligibility review → approval/decline with reason → provider refund request → verified provider result → order/payment ledger update → receipt/notification. A locally recorded refund request is not a completed provider refund. Partial refunds must retain original amount and cumulative refunded amount; prevent total refunds from exceeding settled funds. Disputes and chargebacks are separately tracked and access-restricted.

Do not automatically remove a learner's access solely because a webhook is delayed or a payment is under review. Define a fair grace period and manual review process. For institution-cancelled courses, document learner choice of refund, transfer, or other approved remedy.

## 7. Receipts and learner/guardian experience

Provide a downloadable receipt or payment confirmation containing only necessary information: institution/issuer, order reference, course, date, amount, currency, discount/scholarship adjustment where appropriate, payment state, and refund state. Do not expose provider secrets, full payment instrument data, or unnecessary learner profile details.

Learners see their own orders, receipts, payment schedule, and course enrollment state. For minors, guardian payment access must follow verified relationship and explicit purpose-specific permissions; do not assume every guardian relationship grants access to all educational records. Avoid exposing scholarship review notes or internal financial discussions to other learners or teachers.

Offer an offline/manual assistance path for families who cannot use online checkout, without asking them to send card or banking credentials through chat or uploads.

## 8. Financial reporting and reconciliation

Authorized finance administrators may view:
- gross order value, discounts, scholarships/sponsorships, settled receipts, refunds, disputes, and net collected amounts;
- totals by course/cohort and reporting period;
- outstanding installments and pending payment confirmations;
- provider reconciliation exceptions and manual adjustments.

Reports must label cash basis/provider settlement versus order/booked value clearly; do not conflate them. Exclude cancelled/unpaid orders from collected revenue. Distinguish gross, fees, refunds, and net settlement where provider data supports it. Export access is restricted, logged, and minimized; ordinary teachers see only course enrollment information needed for teaching, not institution-wide revenue or other families' payment records.

Use append-only financial events or ledger entries for payment, discount, scholarship allocation, refund, dispute, and manual correction. Do not overwrite historic amounts. Corrections create reversing/adjustment entries linked to the original transaction. Reconciliation should identify duplicates, missing webhooks, amount/currency mismatches, and refunds not reflected locally.

## 9. Conceptual data model

Illustrative entities to reconcile with Stage 163 and the existing schema before any migration:
- course_price_versions and cohort_price_overrides
- orders, order_lines, order_adjustments
- payment_intents, payment_events, provider_reconciliation_items
- installment_schedules and installment_events
- discount_definitions, discount_redemptions
- scholarship_applications, scholarship_decisions, sponsorship_allocations
- refund_requests, refund_events, dispute_events
- receipts and financial_ledger_entries
- finance_audit_events and notification_outbox

Store amounts as integer minor units or an exact decimal representation with an explicit currency; never use floating-point arithmetic for money. Preserve price snapshots on order lines so later course price edits do not rewrite historical orders. Keep provider identifiers minimal and do not store payment credentials.

## 10. Authorization, privacy, and audit

- Learner: view own order/payment/receipt and own enrollment status; initiate an allowed checkout or refund request.
- Guardian/payer: view or pay only where verified relationship and explicit payment permission authorize it; do not automatically grant educational-record access.
- Teacher: view class enrollment eligibility/status only to the extent needed for instruction; no global finance reports, payment instrument details, scholarship notes, or refund controls by default.
- Finance operator: process permitted payments/refunds/reconciliation within assigned institution scope; sensitive actions are audited.
- Finance approver/admin: configure prices, approve scholarships, refunds, write-offs, and provider settings according to separation-of-duty rules.
- Anonymous visitor: view public course price and terms only; no order or payment records.

Enforce access server-side and through database policies; UI hiding is not authorization. Re-check current role, institution scope, course scope, and guardian permission on every sensitive action. Role demotion and revoked assignment must remove future access. Audit actor, action, target, timestamp, reason category, and before/after financial values without logging secrets or unnecessary personal data.

## 11. Child safety, accessibility, and fairness

Do not use manipulative countdowns, shame, public debt labels, or public scholarship lists. Explain costs and recurring obligations in clear language. Where required, obtain guardian confirmation before a minor enters a paid enrollment agreement. Provide accessible, mobile-first RTL checkout and a clear way to request human help. Do not make a paid upgrade necessary to access a course explicitly advertised as free. Do not penalize learners for provider outages or delayed reconciliation.

## 12. Acceptance and security test matrix

Staging-only tests with synthetic data:
- Free course enrollment succeeds without creating a payment-provider charge.
- Price/currency are read from trusted server configuration, not client input.
- Client cannot mark an order paid, alter amount, or forge a discount/scholarship.
- Invalid, duplicated, replayed, or out-of-order webhooks cannot double-credit an order.
- Webhook amount, currency, provider account, and order reference mismatches are quarantined.
- A learner cannot read or alter another learner's orders, receipts, or payment events.
- Teacher cannot access global finance dashboards or scholarship review notes.
- Guardian without verified relationship and explicit payment scope cannot access or pay another learner's order.
- Expired or ineligible discount codes cannot reduce an order; totals cannot become negative.
- Scholarship approvals respect role, scope, validity, and audit requirements.
- Refund requests do not appear as completed refunds until provider confirmation; cumulative refund cannot exceed settled amount.
- Reconciliation detects missing/duplicate events and preserves adjustment history.
- Price changes do not alter historic order snapshots.
- Provider secrets and payment credentials are absent from frontend, repository, logs, and learner-readable storage.
- Revoked finance role or institution assignment blocks subsequent access.
- Exports are restricted, minimized, and audited.
- Minor/guardian confirmation, accessibility, offline assistance, and provider-outage paths are usable.

## 13. Decisions required before implementation

Institution owners must decide: provider and supported jurisdictions/currencies; course pricing model; installment rules; scholarship funding and approval; discount combination/limits; refund/cancellation policy; guardian/payer permission model; finance role separation; reporting definitions; receipt issuer details; retention schedule; and manual/offline payment procedure.

Recommended sequence: policy approval → provider due diligence → synthetic staging prototype → threat model and RLS review → finance/educator usability review → limited pilot → explicit authorization for production integration. Each step requires its own approval.

## 14. Explicit non-actions

This stage adds design documentation only. No payment provider was connected or selected; no live payment was taken; no code, SQL, schema, RLS policy, storage bucket, Auth setting, secret, migration, webhook, deployment, merge, or live Supabase configuration was changed. No learner financial records were accessed.
