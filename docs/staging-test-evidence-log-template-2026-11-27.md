# Staging test evidence log — template
Project: مسیر نور ثقلین
Environment: disposable Supabase staging only
Status: NOT EXECUTED — fill this log only after running the checks.

## Test session metadata
- Date/time (UTC):
- Staging project reference (not a key/secret):
- Migration baseline:
- Tested release branch / commit:
- Backup or restore point:
- Operator:
- Test accounts created (role labels only; do not record passwords or real phone numbers):

## Evidence entry template
Copy one block per checklist item.

### Check ID:
- Scenario:
- Actor role:
- Target institute: A / B / none
- Expected result:
- Actual result:
- Pass / fail / blocked:
- Evidence link or screenshot filename:
- Error code/message (remove personal data):
- Follow-up issue:
- Retested commit/date:

## High-priority isolation tests
| ID | Scenario | Expected | Result |
|---|---|---|---|
| RLS-01 | Student A reads Institute B course | No row / denied | NOT RUN |
| RLS-02 | Pending member reads institute class | No row / denied | NOT RUN |
| RLS-03 | Suspended member reads institute class | No row / denied | NOT RUN |
| RLS-04 | Student inserts enrollment directly | Denied | NOT RUN |
| RLS-05 | Teacher approves enrollment request | Denied | NOT RUN |
| RLS-06 | Manager promotes a user to owner | Denied | NOT RUN |
| RLS-07 | Owner demotes/deletes last active owner | Denied | NOT RUN |
| RLS-08 | Active student in institute A reads A course | Allowed | NOT RUN |
| RLS-09 | Same account active in A and B | Allowed within each membership only | NOT RUN |
| OTP-01 | Phone signup with valid SMS code | Verified; role student | NOT RUN |
| OTP-02 | Invalid/expired OTP | Rejected | NOT RUN |
| OTP-03 | Signup without email | Allowed | NOT RUN |
| CERT-01 | Issue certificate for pending enrollment | Denied | NOT RUN |
| CERT-02 | Student reads another student's certificate | Denied | NOT RUN |
| CERT-03 | Anonymous user reads private signature object | Denied | NOT RUN |
| QUIZ-01 | Membership suspended before resume | Denied | NOT RUN |
| QUIZ-02 | Membership suspended before submit | Denied and transaction rolled back | NOT RUN |

## Migration execution record
Record each migration separately:
- Migration filename:
- Started at:
- Completed at:
- Result:
- Error / rollback:
- Post-migration verification query:
- Verified by:

## Release decision
- [ ] All critical RLS checks passed
- [ ] No migration errors
- [ ] OTP verified with provider
- [ ] Certificate and private storage checks passed
- [ ] Fixed-line Mushaf source tested against pages 1, 2, middle page, and 604
- [ ] Android print test passed
- [ ] Project owner reviewed evidence and authorized release

Until every required release gate is signed off, keep PRs Draft and do not deploy production.
