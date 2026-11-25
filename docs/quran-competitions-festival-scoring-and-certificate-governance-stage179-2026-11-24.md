# Stage 179 — Quran competitions, festival scoring, and certificate governance

**Date:** 2026-11-24  
**Status:** Product, academic, operational, and security design proposal  
**Scope:** End-to-end governance for Quran learning competitions, festivals, fair assessment, appeals, awards, and certificate issuance.

## 1. Purpose and relationship to prior designs

This stage consolidates competition operations and clarifies the governance controls that connect registration, eligibility, assessment, judging, appeals, awards, and certificates. It complements the earlier assessment and certificate designs (Stages 166 and 174); it does not replace them or imply that any workflow is implemented.

The platform should support small classroom events, institution-level festivals, and multi-institution competitions without exposing learner data across organizations or encouraging harmful public comparison.

## 2. Competition types and scope

Potential event formats:
- Individual Quran recitation and fluency.
- Memorization and revision.
- Tajwid knowledge or applied assessment.
- Translation and Quran understanding.
- Tadabbur and age-appropriate reflection.
- Hadith, ethics, and Quran-learning knowledge.
- Team or classroom learning activities.

Each event must declare its educational purpose, eligible age/level bands, format, language, schedule, location or online mode, institution/branch scope, capacity, accessibility arrangements, and responsible organizer. A competition should not mix unlike assessment formats or compare learners across materially different age/level groups without a documented rationale.

## 3. Governance and role separation

Define scoped responsibilities:
- Platform operator: platform-wide configuration and safety oversight, not automatic access to all learner submissions.
- Institution owner/admin: approves events within the institution.
- Academic supervisor: approves rubric, judges, and result publication.
- Event organizer: manages schedule, registration, and logistics.
- Judge: assesses only assigned entries and sees only necessary participant information.
- Appeals reviewer: independent of the original decision where feasible.
- Teacher: supports learners and may submit eligible entries but cannot alter judge scores.
- Learner: views own registration, instructions, results, and own issued certificate.
- Guardian: receives only explicitly authorized information for a verified linked learner.

Separate event creation, judging, result approval, financial handling, and certificate issuance where practical. High-impact actions require an audit trail.

## 4. Eligibility, registration, and participation

Registration rules must be clear before a learner joins:
- Eligible age/grade/learning-level bands and any prerequisites.
- Institution membership or open-entry policy.
- Required guardian permission for minors where applicable.
- Submission format, deadlines, permitted materials, and accessibility accommodations.
- Withdrawal, absence, rescheduling, and disqualification rules.
- Whether participation is free, sponsored, or fee-based; any payment process is separately governed and must not pressure minors.

Collect the minimum information required to administer the event. Public participant lists should be off by default. Use participant codes for judging where practical to reduce bias, while retaining a restricted identity mapping for authorized organizers.

## 5. Rubric and assessment design

Every event must publish a versioned rubric before registration closes. A rubric should specify:
- Assessment dimensions and plain-language definitions.
- Scoring scale, weights, minimum/maximum values, and rounding.
- Required evidence for each score.
- Treatment of incomplete submissions, technical failures, and accommodations.
- Tie-break rules and whether ties are allowed.
- Disqualification criteria and who may apply them.
- Judge calibration and conflict-of-interest rules.

For recitation, possible dimensions include fluency, articulation, application of taught tajwid principles, and memorization accuracy. For knowledge events, use source-grounded answer keys and accept documented equivalent answers where academically appropriate. Tadabbur/reflection must be judged by a transparent educational rubric, not by claims that one personal reflection is the only valid religious interpretation.

Do not score personal piety, family background, disability, popularity, social engagement, or unrelated behavioral data. Never use automated speech analysis as the sole basis for a consequential result.

## 6. Judge assignment and calibration

- Verify judge qualifications appropriate to the event.
- Declare conflicts of interest before assignment.
- Assign judges to limited entry sets and prevent access to unrelated learner records.
- Provide rubric orientation and sample calibration cases.
- Use blind or coded review where feasible.
- For high-stakes awards, require multiple independent judges or a documented moderation step.
- Record score changes with author, timestamp, reason, and prior value.
- Prohibit organizers from editing judge assessments without an authorized review process.

## 7. Scoring, ties, and result approval

Scoring must be reproducible and server-authoritative if implemented. Client-submitted totals are not trusted. Preserve individual judge scores, rubric version, moderation adjustments, and final approved result as separate records.

Before publication:
1. Confirm all eligible entries are accounted for.
2. Check missing, duplicate, and out-of-range scores.
3. Apply published tie-break rules consistently.
4. Review unusual score variance and conflicts.
5. Obtain approval from the designated academic authority.
6. Freeze the approved result version and retain an audit record.

If a correction is required after publication, issue a new result version with a visible correction notice to affected participants; do not silently overwrite historical outcomes.

## 8. Appeals and complaints

Publish an accessible appeal window, allowed grounds, evidence requirements, and expected response timeline. Valid grounds may include arithmetic or data-entry error, inconsistent application of the published rubric, procedural irregularity, conflict of interest, or documented technical failure.

Appeals should:
- Be submitted privately by the learner or authorized guardian.
- Be reviewed by someone independent of the original judge where feasible.
- Avoid exposing another learner's scores or private information.
- Record outcome, rationale, reviewer, and date.
- Support correction of the result and dependent certificate when justified.
- Provide a safeguarding route for inappropriate conduct, separate from score appeals.

Do not promise a particular outcome or treat disagreement alone as proof of misconduct.

## 9. Awards and recognition

Recognition should emphasize learning, effort, participation, and progress without humiliating or stigmatizing participants. Avoid public leaderboards by default. If the organizer chooses to publish winners, require explicit policy approval and appropriate consent for minors, and publish only the minimum information needed.

Possible recognition categories include participation, completion, skill-specific achievement, teamwork, and improvement. Categories must be defined before the event and must not imply a formal qualification unless the institution has authority to issue it.

## 10. Certificate issuance governance

Certificate issuance reuses the configurable certificate design from Stages 166 and 174:
- Institution/event/course title and issuer text are configurable by authorized administrators; platform name must not be hard-coded into every certificate.
- The certificate template is versioned and records issuer identity, event, achievement category, issue date, and unique certificate identifier.
- Authorized teacher signature image is optional, private, and versioned; it is included only with explicit authorization for the relevant event/certificate.
- Multiple signatory slots may be defined (for example, teacher, academic supervisor, institution representative), each with role-based authorization and approval.
- A signature image must never be treated as proof of approval without a recorded issuance decision.
- Learners may download only their own finalized, issued certificate.
- Teachers may access certificates only for their currently assigned classes and only where their role permits.
- A print-ready unsigned preview must be visibly distinguished from an issued certificate and must not appear as verified.
- QR/public verification should disclose only minimal certificate facts and must not expose learner contact details, grades, private notes, or unrelated class information.
- Revocation or correction must preserve the certificate history and verification status.

## 11. Certificate lifecycle

Proposed states:
draft → pending_approval → approved → issued → corrected_or_revoked

A separate draft/print-preview state must never be confused with issued. Each transition should verify the actor's current authorization and record the event. Re-issuance after a corrected result must link to the prior certificate and clearly invalidate the superseded version.

## 12. Privacy, safeguarding, and accessibility

- Keep registration, identity mapping, scores, judge notes, appeals, and certificates private by default.
- Apply tenant, event, class, and resource-level authorization at the server/database boundary.
- Limit judges to assigned entries and hide unnecessary identity fields.
- Do not expose minors' full names, contact details, voice recordings, or personal learning history in public event pages.
- Provide reasonable accessibility accommodations without penalizing participants.
- Use age-appropriate instructions, safe adult supervision, clear reporting channels, and moderated communication.
- Do not use public shaming, coercive streaks, popularity votes, or social-media sharing as a condition of participation.
- Define retention and deletion rules for raw submissions, judge notes, appeals, and result records.

## 13. Conceptual records (not migrations)

Potential records include:
- competition_events: scope, organizer, dates, format, eligibility, and state.
- competition_categories: age/level bands and category rules.
- competition_registrations: participant, consent state, eligibility decision, and status.
- competition_rubric_versions: immutable published criteria and weights.
- competition_judge_assignments: judge, entry scope, conflict declaration, and status.
- competition_assessments: rubric version, dimension scores, evidence references, and judge.
- competition_result_versions: calculated, moderated, approved, and published result snapshots.
- competition_appeals: grounds, evidence reference, reviewer, decision, and timeline.
- certificate_templates: issuer branding, header, layout version, and signatory slots.
- certificate_issues: learner, event, result version, signatory approvals, artifact version, and lifecycle state.
- certificate_verification_events: minimal verification activity.

Names are illustrative only. Final schema, constraints, tenant ownership, RLS, storage rules, and RPC design require separate review.

## 14. Security and correctness test matrix

Use synthetic event entries and accounts in isolated staging:
- Learner can register and view only own private registration and result.
- Guardian can act only within verified, consented scope.
- Judge sees only assigned entries and cannot edit another judge's score.
- Organizer cannot silently alter assessments or approved results.
- Cross-institution and cross-event reads/writes are denied.
- Result calculations are server-side, deterministic, versioned, and reproducible.
- Duplicate submissions and repeated issuance requests are idempotent.
- Unpublished results and draft certificates are not publicly verifiable.
- Learner download is restricted to own issued certificate.
- Teacher download is restricted to assigned class and authorized role.
- Revoked or superseded certificates return correct verification status.
- Public verification reveals no private learner data.
- Appeal outcome updates the result/certificate lifecycle with a full audit trail.
- Role demotion and membership revocation immediately remove access on subsequent requests.

## 15. Decisions required before implementation

- Which event formats and age/level categories are supported initially?
- Who has final academic approval authority at each institution?
- Which judging credentials and calibration process are required?
- What appeal window and independent-review policy apply?
- Which award categories may be public, and what consent is required?
- Who may configure certificate branding and signatory slots?
- Which certificate fields are mandatory and what constitutes formal issuer authority?
- What retention periods apply to recordings, scores, appeals, and certificates?

## 16. Explicit non-actions

This stage is documentation only. No competition registration, judge assignment, scoring engine, result publication, certificate template, signature upload, certificate PDF, QR verifier, storage bucket, database schema, RLS policy, SQL function, migration, payment integration, notification, analytics, Supabase configuration, deployment, merge, or production setting was created or changed. No learner, judge, or institution data was accessed. All workflows remain proposals pending academic, legal, safeguarding, privacy, product, and technical approval.


## 17. Challenge and invitation system — learner, teacher, class, and institution

Add a formal challenge/invitation capability so competition can begin through an invitation between peers or authorized educational groups. A challenge is an invitation to join a defined event, not an automatic enrollment, public accusation, or permission to access the invited party's private data.

### 17.1 Supported challenge types

1. **Learner-to-learner:** a learner may invite a classmate to a friendly challenge, subject to the class and age-appropriate participation rules.
2. **Teacher-to-learners:** a teacher may invite learners in their currently assigned class or classes, individually or as a defined group.
3. **Class-to-class:** an authorized teacher may challenge another class. The sending teacher must be authorized for the source class, and the receiving class must be represented by its currently authorized teacher or institution coordinator.
4. **Institution-to-institution:** an institution owner/admin or explicitly delegated competition coordinator may invite another institution to an inter-institution competition. The receiving institution must accept through an authorized representative.

A teacher cannot challenge a class outside their assignment scope. A learner cannot create an official institution-level event or enroll classmates without their own acceptance. A teacher's invitation does not bypass guardian consent or other participation requirements.

### 17.2 Invitation lifecycle

Proposed states: draft, sent, pending_response, accepted, declined, expired, cancelled.

After acceptance, eligible participants may proceed through registration and event enrollment. Invitation acceptance must not itself mark attendance, submit an assessment, publish a result, or issue a certificate.

Every invitation should include:
- Sender identity and sender's verified role/scope.
- Target learner, class, or institution reference.
- Event/category, format, level/age band, and proposed schedule.
- Participation rules, rubric version, capacity, and closing date.
- Whether participation is individual, team, class aggregate, or institution aggregate.
- Guardian permission requirements and accessible event information.
- Response deadline and cancellation policy.

Use idempotency for repeated sends and acceptances; prevent duplicate active invitations for the same target/event where policy requires. Rate-limit invitations and provide mute/report/block controls to prevent repeated unwanted challenges. No public challenge board or pressure-based acceptance mechanic by default.

### 17.3 Eligibility and acceptance rules

- Validate the sender's current role and scope at send time and again at acceptance.
- Revalidate target class/institution membership and event eligibility at enrollment time.
- Class invitations are accepted by an authorized teacher or coordinator, not by any learner who happens to know the class identifier.
- Institution invitations are accepted by an authorized institution representative.
- A receiving party may decline without penalty; silence is not acceptance.
- Invitations expire at the stated deadline and can be withdrawn by authorized senders before acceptance.
- A challenge cannot silently move a learner or class into a different institution, expose private rosters, or change class membership.
- For minors, apply event-specific guardian consent and institution safeguarding rules before enrollment.

## 18. Live competition monitoring for teachers and institution administrators

Provide authorized staff with an event operations view during the competition and a results/review view afterward.

### 18.1 During the competition

Authorized teacher view:
- Current event and assigned class participation summary.
- Which invited learners accepted, declined, or have not responded.
- Registration/eligibility status and outstanding consent requirements.
- Submission progress and operational status (not private content beyond teaching scope).
- Assigned learner schedules, queue position, and event announcements.
- Learner-specific progress only for learners in currently assigned classes.

Institution admin/coordinator view:
- Institution-wide participation and class-level aggregates for the institution's own event entries.
- Status of invitations sent to or received from other institutions.
- Class participation, submission completion, judge assignment coverage, and unresolved operational issues.
- No access to another institution's private roster, learner identity mapping, or raw submissions unless explicitly authorized by event governance.

A real-time dashboard should distinguish pending, submitted, under review, assessed, and finalized states. It must not imply that a score is final while judging or moderation remains open. Avoid showing competitor-specific confidential scores to unauthorized viewers.

### 18.2 After the competition

Teachers may review:
- Their assigned learners' final scores and rubric dimensions.
- Feedback and recommended learning steps.
- Participation and completion records.
- Their class's authorized aggregate result and rank, where that ranking policy has been published.

Institution administrators may review:
- Their institution's aggregate score, rank, participating classes, and event outcomes.
- Breakdown by class/category where cohort size and privacy rules permit.
- Certificates issued to eligible learners within their institution scope.
- Appeals, corrections, and audit status that they are authorized to oversee.

Raw judge notes, private appeals, personal recordings, and another institution's learner-level results must not appear merely because a user is an institution administrator.

## 19. Inter-class and inter-institution ranking and visibility

The product should support friendly competitive standings at multiple scopes while keeping individual learner results appropriately private.

### 19.1 Ranking scopes

- Peer challenge: display the result to the participating learners and authorized teacher according to event policy.
- Class-versus-class: display participating class names or approved display labels, aggregate score, rank, and event status to accepted participating classes and their authorized teachers.
- Institution-versus-institution: display participating institution names or approved public labels, aggregate score, rank, and event status to accepted participants and authorized institution representatives.
- Institution internal standings: show class-level rankings only to authorized members of that institution and only for the relevant event.
- Public festival: publish only the explicitly approved winner/placement information, with consent and safeguarding review; private learner-level scores remain hidden by default.

### 19.2 Fair ranking rules

Before invitations open, publish:
- Ranking unit (individual, team, class, or institution).
- Category and level boundaries.
- Scoring aggregation formula and weights.
- Minimum number of eligible participants/submissions required for an aggregate.
- Treatment of absent, withdrawn, disqualified, incomplete, or late entries.
- Tie and tie-break rules.
- Whether rankings are provisional or final and when they are frozen.

For institution rankings, avoid letting a large institution win solely because it has more entrants. Choose and disclose a fair aggregation model before the event, such as normalized category points, average eligible score with a minimum sample threshold, or a fixed-size team format. Do not switch the formula after seeing results. Where cohort sizes are small, suppress granular breakdowns that could identify an individual learner.

### 19.3 Visibility and privacy matrix

- Learner: own registration, own assessment, own certificate, and permitted challenge/class standings; no private record of other learners.
- Teacher: own assigned learners' progress and scores; class aggregate and authorized opponent aggregate; no unrelated classes' learner-level records.
- Institution admin: own institution's learner/class records within assigned administrative scope; inter-institution aggregate standings; no other institution's private records.
- Judge: only assigned entries and scoring material; no unrestricted standings or identity mapping unless necessary and authorized.
- Public/guest: only approved event information and explicitly published aggregate standings or winners; no private rosters, detailed learner scores, raw recordings, or appeal files.

A participant-facing standings page must label provisional results clearly and must not expose private judge comments or another participant's personal data.

## 20. Additional conceptual records and authorization checks

Potential conceptual records (not migrations):
- competition_invitations: sender, sender scope, target type/reference, event, status, expiry, and response.
- competition_invitation_events: sent, accepted, declined, expired, cancelled, and actor audit events.
- competition_participation_groups: class/team/institution representation and authorized representative.
- competition_live_status: operational state snapshots with strictly scoped visibility.
- competition_ranking_snapshots: immutable formula/version, aggregation unit, category, rank, score, and publication state.
- competition_ranking_visibility: audience and scope for each published standings snapshot.

Required server-side checks:
- Sender role and current class/institution authority.
- Target type and authorized representative.
- Invitation status, expiry, duplicate prevention, and idempotency.
- Eligibility, age/level category, consent, and capacity at acceptance/enrollment.
- Event membership before exposing live status or standings.
- Institution and class scope for every row, aggregate, export, notification, and realtime subscription.
- Ranking formula version and source assessment set at finalization.
- Revocation of visibility after membership/role changes where applicable.

## 21. Additional challenge and ranking test cases

Use synthetic learners, classes, and at least two isolated institutions:
- Learner A can invite an eligible classmate but cannot invite an unrelated institution.
- Teacher A can invite learners in assigned Class A but cannot invite Class B without assignment.
- Teacher A can challenge Class B only through the authorized class-representative workflow.
- Institution A's authorized coordinator can invite Institution B; an ordinary teacher or learner cannot impersonate the institution.
- Only an authorized representative can accept class/institution invitations.
- Declined, expired, cancelled, and duplicate invitations cannot enroll participants.
- Repeated acceptance requests do not create duplicate registrations.
- A teacher removed from a class loses live monitoring and learner-level result access on subsequent requests.
- Institution A can see its own classes and approved institution-level opponent standings but cannot query Institution B's roster or learner records.
- Institution B cannot see Institution A's private judge notes, recordings, appeals, or individual scores.
- Provisional ranks are labeled and cannot be mistaken for final awards.
- Final rankings reproduce from the frozen formula/version and eligible score set.
- Small-cohort privacy thresholds prevent re-identification through granular breakdowns.
- Public views disclose only fields explicitly approved for publication.
- Realtime updates and exports enforce the same authorization as ordinary page requests.

## 22. Additional product decisions

- Should learner-to-learner invitations be limited to the same active class, and can a teacher disable them?
- Which role may represent a class in a class-to-class challenge?
- Which institution role may send and accept inter-institution challenges?
- Are institution names public in standings, or can participants choose approved display labels?
- Which aggregation formula and minimum cohort threshold should be used for institution rankings?
- Which live progress indicators may be visible to opposing teams, if any?
- Should the initial release support only aggregate standings, with no live opponent score feed?
- What moderation and invitation rate limits are appropriate for minors?



## 23. Explicit competition disciplines and platform-wide open competitions

This section makes the competition discipline catalogue and the four participation scopes explicit. Competitions may be created for a single discipline or a clearly defined combined event. A participant's institution or class membership must not be required for an open platform-wide event unless the published eligibility rules specifically require it.

### 23.1 Discipline catalogue

Initial configurable disciplines:
1. **Hifz (memorization):** full Quran, selected juz, surah, or specified passage; with declared scope and accuracy rubric.
2. **Muraja'ah (revision):** retention and accurate recall of previously memorized material.
3. **Qira'ah / recitation:** reading accuracy, fluency, articulation, and continuity.
4. **Raw-khani (reading fluency):** level-appropriate recognition and fluent reading of Quranic text.
5. **Tajwid:** theoretical knowledge and/or applied recitation, with separate rubrics.
6. **Tarjomeh (translation):** word/phrase meaning and passage comprehension using declared reference translations.
7. **Tafsir:** source-grounded understanding of selected passages, with declared approved references and level.
8. **Tadabbur:** age-appropriate reflection evaluated with a transparent educational rubric, without claiming a single personal reflection is the only valid interpretation.
9. **Quranic sciences and concepts:** vocabulary, themes, context, and introductory Quranic knowledge.
10. **Hadith and Seerah:** source-attributed knowledge and understanding, with references and level-appropriate content.
11. **Ethics and Islamic teachings:** scenario-based understanding of approved educational material.
12. **Combined/team disciplines:** multi-part events, clearly separating component scores and published weights.

Each event must identify one primary discipline, optional sub-discipline, source/edition, recitation riwaya where relevant, age/learning-level band, format (written, oral, practical, team), rubric version, and permitted accommodations. Do not combine unrelated disciplines into one rank unless a composite formula is published before registration.

### 23.2 Four competition scopes

A competition may operate at one or more explicitly selected scopes:

- **Class scope:** learners compete within one class, or two/more classes compete as class teams. Class representatives and teachers must be authorized for the relevant classes.
- **Institution scope:** classes or individuals represent their institution in an intra-institution event, or institutions compete against other institutions. Only authorized institutional representatives may accept institutional invitations.
- **Platform-wide open scope:** any eligible person with an active platform account may register, whether independent, class-enrolled, or institution-affiliated. Institution membership is optional and must not create an unfair advantage. A person may represent an institution only when that representation is explicitly verified and accepted.
- **Private/invited scope:** restricted to specifically invited learners, classes, or institutions, with explicit acceptance and applicable consent.

An event must state whether it is open, invitation-only, class-restricted, institution-restricted, or a defined combination. No event may silently change its scope after registration opens.

### 23.3 Platform-wide standings and fair categories

For platform-wide open competitions:
- Provide discipline-specific standings rather than one universal Quran ranking.
- Separate age and learning-level categories where needed; publish the category rules before entry.
- Permit independent learners to participate without joining an institution.
- Avoid allowing institution size or number of enrolled learners to determine individual awards.
- Distinguish individual standings from class and institution aggregate standings.
- Show each participant only the public/consented information permitted by the event; private scores and learner profiles remain private by default.
- Use participant display names or codes where appropriate, with public identity disclosure off by default for minors.
- Publish provisional/final status, rubric version, tie rules, and appeal route.
- Prevent duplicate entries in the same category where event policy requires; support legitimate participation in different disciplines.
- Make the same eligibility, scoring, judging, accessibility, and appeal rules apply regardless of institution affiliation.

### 23.4 Cross-scope event examples

Supported designs include:
- All registered learners compete in Quran reading, separated by declared age/level categories.
- All eligible platform learners compete in memorization of a specified juz.
- One class challenges another class in tajwid.
- Several classes within one institution compete in recitation.
- Institution A competes with Institution B in a multi-discipline festival.
- Independent learners and institution-affiliated learners join the same open tafsir knowledge event under identical rules.
- A festival runs separate hifz, recitation, tajwid, translation, tafsir, and hadith tracks, then optionally publishes a team/institution festival award using a pre-announced composite formula.

### 23.5 Additional authorization and acceptance rules

- Open platform events may be discoverable to all accounts, but registration and result access remain authenticated and eligibility-checked.
- Institution affiliation is optional in open events and must never be inferred solely from a user-editable profile field.
- Only verified institution representatives may submit or accept institution-level entries.
- Class and institution aggregate rankings require an explicitly defined roster snapshot and a published aggregation formula.
- A learner's participation in an individual open event does not grant their teacher or institution administrator access to unrelated private submissions.
- A platform operator may manage event configuration and safeguarding without unrestricted access to all raw learner submissions.
- Consent, guardian requirements, and age-appropriate safeguards apply to minors across every scope.

### 23.6 Additional acceptance tests

- An eligible independent account can register for an open platform-wide event without institution membership.
- An eligible institution-affiliated learner can enter the same event under identical rules.
- A user cannot claim institution representation without verified authorization.
- Platform-wide hifz, recitation, reading, tajwid, translation, tafsir, tadabbur, and hadith events each use their own declared rubric and category rules.
- A class cannot view another class's private learner records through cross-class standings.
- An institution cannot access another institution's private records through platform-wide aggregate reports.
- Scope, discipline, age/level bands, and scoring formula cannot be silently changed after registration begins.
- Independent learners are not excluded from open rankings because they lack class or institution membership.
