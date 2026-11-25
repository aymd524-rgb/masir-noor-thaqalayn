# Stage 190 — Institution Finance, Fees, Scholarships, Donations, and Reconciliation Architecture

**Date:** 2026-11-24  
**Status:** Design specification only  
**Related stages:** 163, 175, 176, 183, 188, and 189.

## 1. Purpose

Define a safe, auditable financial operations model for the platform and its institutions. The design covers course fees, discounts, scholarships, sponsored seats, donations, payment receipts, refunds, expenses, settlement reconciliation, and role-scoped financial reporting.

This is a proposal, not an implementation. It does not select a payment provider, create a ledger, or authorize access to live financial data.

## 2. Core principles

- Keep financial records institution- and branch-scoped; platform-level reporting is a separate permission.
- Separate course pricing, learner obligations, payment attempts, confirmed receipts, refunds, donations, expenses, and accounting entries.
- A browser redirect or client-submitted success flag is never proof of payment.
- Only a verified provider notification or an authorized, auditable offline-payment confirmation may settle an obligation.
- Use an append-only financial journal; correct mistakes with reversal/adjustment entries rather than silently rewriting history.
- Never store full card numbers, security codes, banking passwords, or payment credentials.
- Do not expose one learner's financial details to another learner, teacher, or unrelated institution.
- Make free access, scholarships, sponsored places, and approved waivers first-class options; do not pressure minors to purchase.
- Every report must state its date range, institution/branch scope, currency, and whether figures are gross, net, pending, refunded, or settled.

## 3. Financial actors and permission boundaries

### 3.1 Roles

- **Platform finance administrator:** platform-wide reconciliation and provider-level operations, only where explicitly authorized.
- **Institution owner/administrator:** institution-level financial overview, pricing approval, budgets, and authorized finance assignments.
- **Finance officer:** invoices, payment confirmation, refunds, receipts, expenses, reconciliation, and institution-scoped reports.
- **Branch finance officer:** only assigned branch records and permitted branch transactions.
- **Course manager:** may propose course prices and view enrollment counts; financial detail requires an explicit additional grant.
- **Teacher:** sees only educational enrollment status needed for teaching (for example, active, sponsored, or access granted). No default access to amounts, donor identity, bank references, or family financial circumstances.
- **Learner:** sees their own payable items, scholarship/discount status, payment history, receipts, and refund status.
- **Guardian:** sees only linked learner financial items within verified relationship, consent, and applicable policy.
- **Auditor:** read-only access to explicitly assigned scope, with access logged.
- **Donor:** sees their own donation receipts and any expressly authorized impact updates; never receives learner personal data.

### 3.2 Permission rules

- A global profile role alone must not grant finance access in a multi-institution environment.
- Validate active institution membership, branch assignment, finance permission, record ownership, and current scope server-side.
- Separate permission to view reports from permission to issue refunds, confirm offline payments, edit pricing, or post expenses.
- High-impact actions require step-up confirmation and, above configurable thresholds, a second authorized approver.
- Platform support staff have no default ability to browse institution financial details.

## 4. Course pricing and learner charges

A course may be free, fixed-price, installment-based, sponsored by a donor or institution, scholarship-funded, discount-eligible, subject to an approved waiver, or invitation-only with no payment requirement.

A published price version must record currency, amount, effective period, tax/fee treatment where applicable, refund terms, installment schedule, and approver. Changing a price must not silently rewrite an existing learner order.

Create a distinct learner charge/order for each enrollment obligation. Record the price snapshot and policy version used at purchase time. Do not infer that enrollment is paid merely because a learner has joined a class.

### 4.1 Discounts

Support fixed-amount, percentage, time-limited promotion, institution-approved code, and formally approved family/staff benefits where policy permits. Each discount has eligibility, validity dates, usage limit, scope, stacking rules, funding source, and approval history. Codes must be unguessable or rate-limited where appropriate. Do not reveal a learner's private discount reason to teachers or classmates.

### 4.2 Scholarships and sponsored seats

Scholarship records should capture application and decision state, eligible course/period, full or partial coverage, funding source and budget allocation, authorized reviewer and decision date, renewal/expiry criteria, learner-visible status, and appeal route.

A scholarship decision must not be based solely on an automated score. Sensitive supporting documents require restricted storage and retention limits. Teachers see access eligibility, not financial hardship details. Donor-funded seats must not disclose the learner's identity to the donor without explicit, appropriate authorization.

## 5. Donations and restricted funds

Support one-time and recurring donations only if a compliant provider and applicable legal review are approved. Record donor reference and minimal contact details when necessary, amount/currency/date/payment state/receipt, designated fund or unrestricted status, restrictions or campaign purpose, refund/chargeback state, and donor consent for acknowledgment or impact updates.

Restricted donations must be allocated only to their stated purpose. A donation is not course revenue unless accounting policy explicitly classifies it that way. Do not promise tax deductibility or issue tax statements unless the institution's legal status and local requirements have been verified.

Public fundraising pages must not expose donor details by default. Avoid publishing named scholarship recipients or identifiable beneficiary stories without appropriate consent.

## 6. Payments and confirmation

### 6.1 Online payment lifecycle

Suggested states: created, pending, provider-confirmed, settled, failed, cancelled, expired, refunded, partially-refunded, disputed, and chargeback.

The server must create an internal payment attempt linked to a specific order; request a provider checkout session using server-held credentials; verify signed provider callbacks/webhooks and expected merchant, amount, currency, order reference, and event freshness; enforce idempotency for duplicate and out-of-order events; record provider event identifiers and verification outcome; post a financial journal entry only after trusted confirmation; and update enrollment access through a separate policy-controlled transaction or outbox workflow.

Never trust a client redirect, query parameter, screenshot, or user-uploaded receipt as conclusive online payment evidence.

### 6.2 Offline payments

Cash, bank transfer, or other offline methods require a pending payment claim, limited reference information (never credentials), authorized finance review, evidence stored privately only where necessary, explicit confirmation/rejection with reason, and an audit event. The person who submits a payment claim should not be able to confirm it. For higher-value transactions, require dual approval.

### 6.3 Provider selection

No payment provider is selected in this design. Before choosing one, assess supported operating countries, institution eligibility, minor/guardian flows, settlement reports, refunds, webhook security, fees, accessibility, data processing terms, and whether a no-cost/manual option is viable.

## 7. Invoices, receipts, and learner statements

Provide an order/invoice view before payment; a clear breakdown of course price, discount, scholarship, tax/fee where applicable, amount paid, and remaining balance; receipt only after verified settlement or authorized offline confirmation; refund receipt or credit note where applicable; and learner statement with date, description, amount, currency, status, and balance.

Receipt numbering must be unique within its issuer scope and resistant to guessing. Receipts should identify the issuing institution, issue date, currency, transaction reference, and whether the document is a payment receipt, donation acknowledgment, or invoice. Do not label an unverified payment claim as a paid receipt.

A learner can download only their own receipts. A guardian can download only receipts within their verified permitted relationship. Teachers do not receive receipt-download access by default.

## 8. Refunds, disputes, and chargebacks

Define refund eligibility by course policy and applicable law. Support full and partial refunds, cancellation before course start, duplicate payment correction, provider dispute, and authorized goodwill adjustment.

Workflow: request opened with reason and affected order/payment; eligibility and remaining refundable amount checked server-side; authorized finance reviewer approves or rejects; second approver required above configured thresholds; provider refund initiated server-side where applicable; provider confirmation reconciled; reversal/credit entries posted and learner notified.

Do not mark a refund complete merely because a request was approved. Keep requested, approved, submitted-to-provider, confirmed, failed, and rejected distinct. Chargebacks and disputes require a separate restricted workflow and evidence retention policy.

## 9. Expenses, budgets, and institution funds

Allow authorized finance users to record expenses with institution and branch, expense category, vendor/payee reference, amount and currency, transaction and posting dates, payment method/reference, invoice or supporting document stored privately, budget line/fund allocation, submitter, approver, and status.

Suggested categories include educational materials, venue, utilities, teacher compensation, event costs, accessibility, technology, and administration. Categories are configurable and should not imply accounting or tax compliance by themselves.

Use a submit/approve/post workflow. A submitter must not approve their own expense when segregation of duties is required. Budget views should distinguish approved commitments from paid expenses and available balances.

## 10. Financial journal and reconciliation

Use an append-only, double-entry-capable journal design with journal entry header, one or more debit/credit lines, account code and fund, institution/branch scope, currency and amount, source transaction reference, posting timestamp and actor, reversal/correction link, accounting period, and close state.

Each posted journal entry must balance within its currency. Do not net unlike currencies without a recorded exchange-rate source, timestamp, and conversion policy. Draft or pending transactions are not posted balances.

Reconciliation should compare internal payment attempts and confirmed receipts, provider transaction and settlement reports, bank deposits where available, refunds and chargebacks, donation campaigns and restricted-fund allocations, and offline payment confirmations.

Provide unmatched, duplicate, amount-mismatch, currency-mismatch, delayed-settlement, and reversed-event queues. A reconciliation operator can propose a match; posting adjustments requires explicit authorization and audit. Never silently alter source payment events to force a match.

## 11. Financial dashboards and reports

### 11.1 Institution dashboard

Show scoped summaries for course charges created, confirmed collections, pending payment claims, outstanding balances, scholarships and sponsored seats, discounts granted, donations by fund, refunds and chargebacks, approved and paid expenses, net cash movement and journal balance, and reconciliation exceptions.

Every metric must have a definition. “Collected” means confirmed receipts, not pending checkout attempts. Separate cash movement from earned revenue and restricted donations.

### 11.2 Reports

Provide course revenue by course/period/branch/currency; collection and outstanding-balance aging; scholarship/discount allocation and remaining budget; donation receipts and restricted-fund usage; expense summary by category and budget; refunds/disputes/chargebacks; provider settlement reconciliation; and monthly/period close and audit export.

Exports must respect the same scope as the dashboard and exclude unnecessary personal details. Small-group reports should avoid exposing individual financial circumstances.

### 11.3 Teacher view

Teacher workspace may show only whether a learner has valid access to a course or sponsored seat when needed for class operations. It must not show payment amount, donor identity, overdue balance, discount reason, scholarship application, or family financial details.

## 12. Notifications and communication

Send minimal, private notifications for order creation, payment confirmation/failure, receipt availability, installment reminders where opted in and permitted, scholarship decisions, refund status, donation acknowledgment, and finance support responses.

Respect quiet hours and notification preferences. Avoid public or classroom notifications about unpaid balances, scholarships, donations, or financial hardship. Do not use countdown pressure or manipulative prompts, especially for minors.

## 13. Privacy, security, and retention

- Keep payment-provider secrets server-side and out of source control, client bundles, logs, and support tickets.
- Store provider tokens only if essential, encrypted, scoped, and subject to rotation.
- Never store card security codes or full payment credentials.
- Use private storage and short-lived signed links for receipts and supporting documents.
- Apply strict tenant, branch, learner, guardian, and finance-role checks to APIs, search, exports, storage, realtime, and notifications.
- Rate-limit payment, discount-code, receipt-verification, and refund endpoints.
- Protect against replay, duplicate webhook delivery, forged callbacks, amount tampering, cross-tenant order references, and unauthorized refund attempts.
- Log financial reads/exports and all create, approve, post, reverse, refund, and reconciliation actions.
- Define retention and deletion schedules for financial records, provider events, identity/contact data, and supporting documents according to applicable law and institutional obligations.
- Provide a clear process for privacy requests without deleting records that must lawfully be retained.

## 14. Conceptual data model (not migrations)

Potential records, subject to schema review: institution finance settings; course price versions; learner orders; order line items; discount rules and redemptions; scholarship applications and awards; sponsorship allocations; donation campaigns and donation records; payment attempts and provider events; offline payment claims; invoices and issued receipts; refund requests and events; expense claims and approvals; chart of accounts and funds; journal entries and lines; settlement batches and reconciliation items; and finance audit events.

These are conceptual only. Prefer references to existing canonical institution, course, enrollment, membership, and audit records. Do not create duplicate learner or institution identities.

## 15. Acceptance and security test plan

Use synthetic learners, two institutions, multiple branches, and separate finance/teacher/admin accounts:
1. Institution A finance cannot view Institution B invoices, receipts, donations, or expenses.
2. Branch finance cannot access another branch without explicit scope.
3. Teacher sees course access status only and cannot read amounts or scholarship reasons.
4. Learner A cannot access Learner B order or receipt by guessing an identifier.
5. Guardian access requires verified relationship and permitted scope.
6. Client redirect or forged success parameter cannot settle an order.
7. Invalid webhook signature, wrong amount/currency, wrong merchant, stale event, and replay are rejected or safely quarantined.
8. Duplicate webhook delivery creates no duplicate journal posting.
9. Out-of-order provider events do not incorrectly reopen or settle a transaction.
10. Offline payment submitter cannot approve their own claim.
11. Receipt is unavailable as paid until trusted confirmation.
12. Partial refund cannot exceed the remaining refundable amount.
13. Approval alone does not mark a provider refund as confirmed.
14. Expense submitter cannot self-approve where dual control applies.
15. Journal entries balance and corrections use reversal/adjustment entries.
16. Restricted donation funds cannot be spent outside their approved purpose.
17. Discount eligibility, stacking, expiry, and redemption limits are enforced server-side.
18. Concurrent enrollment/payment attempts do not double-charge or double-allocate a scholarship seat.
19. CSV/PDF exports cannot cross institution or branch scope.
20. Financial notifications do not reveal balances or hardship details in public/class channels.
21. Audit events capture actor, scope, reason, and source reference without secrets.
22. Period close prevents unauthorized backdated edits; corrections remain possible through controlled adjustments.
23. Multi-currency reports never silently add unlike currencies.
24. Deleted/expired signed links no longer grant access to private receipts or documents.

## 16. Decisions required before implementation

- Which institution currencies and operating jurisdictions are supported initially?
- Which payment provider, if any, meets institutional eligibility and cost constraints?
- Will the first release support online payment, offline confirmation, or both?
- Which fee, refund, tax, and receipt rules apply to each institution?
- Who may approve scholarships, discounts, refunds, and expenses, and at what thresholds?
- Which accounting basis and chart of accounts will be adopted?
- How are restricted donations governed and reported?
- What are the legal retention periods for invoices, receipts, provider events, and donor records?
- Which reports may platform operators see, and under what approval?
- Which financial exports and audit formats are required?

## 17. Explicit non-actions

This document is a design proposal only. No payment provider was selected or connected. No live financial records, donor details, learner balances, bank information, or provider secrets were accessed. No payment, refund, donation, invoice, receipt, expense, journal, reconciliation, database table, SQL function, RLS policy, migration, storage object, API, webhook, dashboard, or production behavior was created or changed. No merge, deployment, or publication was performed. All implementation requires explicit product, finance, legal, privacy, safeguarding, and technical approval.
