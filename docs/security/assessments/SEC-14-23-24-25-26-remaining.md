# SEC-14 LMS attack scenarios, SEC-23 automated testing, SEC-24 independent testing, SEC-25 governance, SEC-26 sensitive operations: assessment (2026-11-08)

Short, fact-only notes for the groups not covered by their own document. Nothing VERIFIED.

## SEC-14 LMS-specific scenarios

| Scenario | Evidence | State |
|---|---|---|
| 001 to 003 courses, lessons, assignments: unauthorized access, another learner's submissions | Quizzes outside a learner's courses answered `LEARNING_ACCESS_DENIED` (3 of 3, NSRIT learner); 144 same-college requests for other learners' ids refused; no assignments were seeded for the learner pair | PARTIAL |
| 004, 014, 015, 016 quizzes: unreleased questions, attempts, scoring | Attempt limit enforced under an advisory lock inside the transaction (`quiz-attempt-service.ts`); answer keys are server side (`quiz_options.is_correct`); response shape for an enrolled learner not inspected (dev seed has no enrolled quiz path) | PARTIAL |
| 005 exams | No proctored exam module found beyond quizzes | NOT APPLICABLE until exams exist |
| 006 projects | Cross-team and foreign-college project routes refused (cross-college probe: 120 routes, no leak) | PARTIAL |
| 007, 008, 020 to 022 placements and recruiters | Foreign-college job, round, application and offer ids refused for a college admin; recruiter reads are limited to grants (RLS policies on grants and the `users` visibility through grants); recruiter-as-attacker and grant-expiry timing not probed | PARTIAL |
| 009, 010 faculty and mentor scope | Role matrix shows distinct route sets; scope to assigned sections or projects is enforced in services and not re-probed | PARTIAL |
| 011 college admin changing another college | 120 foreign-id GET routes: no foreign data; mutating routes not probed with foreign ids; the database refuses cross-college writes (shown) | IMPLEMENTED_UNVERIFIED |
| 012 Super Admin | Scope is explicit, expiring (4 h), audited and ignored when a membership is selected; every Super Admin request is a normal `route()` request (denials and mutations audited) | IMPLEMENTED_UNVERIFIED |
| 013, 017 publication times, grade changes | Not reviewed | UNASSESSED |
| 018, 019 certificates | The platform does not issue certificates (the code that matches the word handles uploaded education certificates and identity evidence) | NOT APPLICABLE |
| 023 fraudulent attendance and placement records | Not reviewed | UNASSESSED |
| 024 bulk, import, approval and export paths | Every export and import route has step-up (`sensitive-without-step-up` guard is 0), exports are audited and counted; no per-path test | PARTIAL |

## SEC-23 automated security testing

29 `security-*` workflows (credential artifacts and history, governance files, API method coverage, bounded form bodies, machine workers, membership reauth, control progress and others), the `security:central` ratchet (route wrapper, server actions, tenant tables, dynamic SQL, table classification), the RLS acceptance script, the API gates and the authz critical-boundary workflow. Added 2026-11-08, run by hand on dev: unauthenticated sweeps (533 GET, 782 mutating), role-by-route matrix with a committed baseline, cross-college and same-college probes, isolation sweep, performance and principal probes. Gaps: no DAST in CI, no SAST engine beyond ESLint and the ratchets, the dev sweeps are not scheduled, and CI on `main` is red (Gate 0).

## SEC-24 independent testing

None done. Preparation: the audit brief (`audit-brief-2026-11-07.md`), the assessments index and the evidence files are the hand-over pack. Owner decision on timing and scope (item 13).

## SEC-25 governance

Present: `SECURITY.md`/CODEOWNERS/PR template/dependabot (governance files workflow), accepted-risk register (`accepted-risks.md`), incident response draft, owner actions list. Missing: security policy set (access, data, vendor), named security owner and deputy, risk register review cadence, training, vendor reviews for Exotel, ZeptoMail, Cloudflare and Google. Owner.

## SEC-26 sensitive operations

Step-up (login within 15 minutes) for role and permission changes, user disable and delete, bulk export and import, secret and integration settings, tenant settings; Super Admin scope expiry and audit; append-only audit trail; no dual approval (see SEC-13-010).
