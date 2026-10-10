# W04 — Placement Execution and Cross-Role Drives Closure Ledger

**Owner:** Chat 4 / [issue #24](https://github.com/42Students/lms-vnext/issues/24) under `docs/planning/six-chat-closure-plan.md`.
**Execution target:** `42Students/lms-vnext@main`, observed `e2410611c24a01e5ce8953f208de964a72e39757`.
**Legacy oracles:** `42Students/lms@prod-2026:21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, `42Students/lms2-fe@prod-2026:e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.
**Verification status:** SOURCE AUDIT / SOURCE FIXES; no successful lint, typecheck, unit, PG integration, build or browser run in this W04 chat. **Not functionally or UI complete.**

## Ownership boundaries

- W04: DB08 placement eligibility/registration, batch lifecycle and job targeting, learner placement jobs/applications/interviews/offers, TPO/HR Drive execution, College/Super Admin placement sections.
- W01 (#21): numbered Drizzle SQL/journal/snapshots, schema index, shared auth/tenant and CI. W04 authors isolated schema/SQL candidates only.
- W05 (#25): recruiter leads/companies/CRM, non-drive TPO/HR reports/settings/calendar/messages, recruiter invites.
- W06 (#26): shared notification/outbox implementation. W04 must call its verified public contract; no duplicate queue.

## A. Currently implemented by W04 and merged directly on main

| Slice | Owned source path | State | Evidence |
| --- | --- | --- | --- |
| Two-gate fail-closed learner authorization | `src/modules/placements/learner-participation-guard.ts` | SOURCE FIXED, PG UNVERIFIED | Paid college module, ACTIVE user+membership+LEARNER role, one same-college active academic enrollment/section, membership > section > cohort decision |
| Learner new application and job feed | `application-service.ts`, `learner-job-service.ts` | SOURCE FIXED, tests authored | Deny job-specific INCLUDE bypass when paid module OFF or learner excluded |
| Learner history/journey/results/offers/requests | `application-service.ts`, `learner-journey-service.ts`, `result-service.ts`, `offer-service.ts`, `request-service.ts` | SOURCE FIXED, tests not executed | Fail-closed direct service reads |
| API evidence/preferences/job eligibility | `src/app/api/placements/{academic-evidence/me,preferences,jobs/[jobId]/eligibility/me}/route.ts` | SOURCE FIXED, API tests not executed | Route-level two-gate check |
| Learner placements deep links | `src/app/(authenticated)/learn/my-placements/layout.tsx` | SOURCE FIXED, browser unverified | Ineligible/disabled learner receives no placement page content and no internal reason |
| Drive Day coordinator exception | `drive-day-coordinator-service.ts` | SOURCE FIXED, PG unverified | Coordinator does not gain general eligibility and paid college module OFF blocks roster/assignment |
| Academic ambiguity/inactive class safety | `batch-participation-service.ts` | SOURCE FIXED, PG unverified | Duplicate active cohort and archived active section fail closed |
| Seeded integration fixtures | `tests/support/w04-placement-access-fixture.ts` and W04 integration tests | AUTHORED NOT RUN | Explicit module ON, current enrolled cohort, member eligibility; OFF/INELIGIBLE/forged-user negative specs |
| Cohort-target schema and manager draft writer | `src/db/schema/placement-job-cohorts.ts`, `cohort-target-service.ts`, `cohort-target-policy.ts` | STAGED; unjournaled/not routed | Real academic cohorts, draft-only edit, tenant check, explicit targets; no implicit all |
| Draft cohort-target SQL and tests | `scripts/sql/db08-job-cohort-targets-staging.sql`, `tests/unit/placement-cohort-target-policy.test.ts` | AUTHORED NOT RUN | Tenant join SQL trigger and fail-closed targeting specs |

## B. Frozen baseline matrix — W04-owned rows only, NOT new closure claims

Rows below are inherited from `account-surface-parity.md`, without elevating any status merely because a source file was changed. Snapshot counts: PARTIAL=26, MISSING=13, DONE=1. Verify against latest FE and parity specs before closing.

| Legacy surface | Legacy route or detail | Current vNext mapping | Known gap | Baseline |
| --- | --- | --- | --- | --- |
| Placements dashboard | `/learn/my-placements` | `/learn/my-placements` | Core journey exists; legacy subnavigation and sections incomplete. | PARTIAL |
| Applications | `/learn/my-placements/applications` | same legacy route shell + journey data | Dedicated applications worklist missing. | MISSING |
| Assessments | `/learn/my-placements/assessments` | same legacy route shell | Dedicated assessment queue/status missing. | MISSING |
| Interviews | `/learn/my-placements/interviews` | same legacy route shell | Dedicated interview queue/status missing. | MISSING |
| Career Calendar | `/learn/my-placements/calendar` | same legacy route shell | Placement events calendar missing. | MISSING |
| Jobs list | `/learn/my-placements/jobs` | same legacy route + placements feed | Exact browse/filter surface incomplete. | PARTIAL |
| Job detail | `/learn/my-placements/jobs/[jobId]` | same legacy route shell | Dedicated opportunity/eligibility/detail surface missing. | MISSING |
| Placement Cell | `/learn/my-placements/placement` | same legacy route shell | Placement-cell information/support surface missing. | MISSING |
| Placement Rules | `/learn/my-placements/rules` | same legacy route shell | Learner-facing rules/policy surface missing. | MISSING |
| Drives landing | `/college-admin/jobs` + `/college-admin/jobs/all` | placements operations | Exact tabs/filters parity pending. | PARTIAL |
| Applications | `/college-admin/jobs/[jobId]/applications` | embedded job workspace | Dedicated workflow parity pending. | PARTIAL |
| Interviews | `/college-admin/jobs/[jobId]/interviews` | rounds | Dedicated interview surface pending. | PARTIAL |
| Shortlisted | `/college-admin/jobs/[jobId]/shortlisted` | screening state | Dedicated shortlist surface pending. | PARTIAL |
| Job Settings | `/college-admin/jobs/[jobId]/settings` | lifecycle/edit controls | Exact settings surface pending. | PARTIAL |
| Drives / all drives | `/superadmin/jobs` + `/superadmin/jobs/all` + `/superadmin/jobs/[jobId]` | PARTIAL |
| Drive Applications | `/superadmin/jobs/[jobId]/applications` | PARTIAL |
| Drive Interviews | `/superadmin/jobs/[jobId]/interviews` | PARTIAL |
| Drive Shortlisted | `/superadmin/jobs/[jobId]/shortlisted` | PARTIAL |
| Drive Settings | `/superadmin/jobs/[jobId]/settings` | PARTIAL |
| Drives list | `/tpo/drives` | placement operations | PARTIAL |
| New Drive | `/tpo/drives/new` | `/tpo/placements/new` | DONE |
| Edit Drive | `/tpo/drives/[jobId]/edit` | embedded controls | PARTIAL |
| Overview tab | drive detail | vNext job workspace | PARTIAL |
| Applicants tab | drive detail | vNext job workspace | PARTIAL |
| Rounds tab | drive detail | vNext job workspace | PARTIAL |
| Offers tab | drive detail | vNext job workspace | PARTIAL |
| Drive Day tab | drive detail | vNext job workspace | PARTIAL |
| Export applicants | drive action | none/verify | MISSING |
| Drives list | `/hr/drives` | `/hr/placements` | Portfolio exists; exact filter/action parity pending. | PARTIAL |
| New Drive / request | `/hr/drives/new` | none | Employer-side request/create flow missing. | MISSING |
| “Fix” existing drive request | `/hr/drives/new?fix=` | none | Missing. | MISSING |
| “Hire again” from prior drive | `/hr/drives/new?from=` | none | Missing. | MISSING |
| Drive Overview tab | drive detail | vNext recruiter job | PARTIAL |
| Applicants tab | drive detail | vNext recruiter job | PARTIAL |
| Rounds & Interviews tab | drive detail | vNext recruiter job | PARTIAL |
| Offers tab | drive detail | vNext recruiter job | PARTIAL |
| Messages tab | drive detail | none | MISSING |
| Applicant review drawer/notes | drive detail | result staging | PARTIAL |
| Add/change/remove rounds | drive detail | limited manager model | MISSING |
| Selection list / Offer / LOI workflow | offers | result/offer model | PARTIAL |

## C. Route inventory observed in frozen legacy manifest (not an exhaustive DOM/modal census)

30 matching legacy route-file entries. **Each individual drawer, modal, popover, filter, bulk action and responsive state must still be enumerated from actual components before closure.**

| Legacy source file | URL | Family | Audit mandate |
| --- | --- | --- | --- |
| `src/pages/college-admin/jobs/[jobId]/applications.js` | `/college-admin/jobs/[jobId]/applications` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/[jobId]/index.js` | `/college-admin/jobs/[jobId]` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/[jobId]/interviews.js` | `/college-admin/jobs/[jobId]/interviews` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/[jobId]/settings.js` | `/college-admin/jobs/[jobId]/settings` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/[jobId]/shortlisted.js` | `/college-admin/jobs/[jobId]/shortlisted` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/all.js` | `/college-admin/jobs/all` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/college-admin/jobs/index.js` | `/college-admin/jobs` | ACCOUNT_PRODUCT:COLLEGE_ADMIN | Must be represented by College Admin matrix. |
| `src/pages/hr/drives/[jobId].js` | `/hr/drives/[jobId]` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/hr/drives/index.js` | `/hr/drives` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/hr/drives/new.js` | `/hr/drives/new` | ACCOUNT_PRODUCT:HR | Must be represented by HR/Public matrix. |
| `src/pages/learn/my-placements/applications.js` | `/learn/my-placements/applications` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/assessments.js` | `/learn/my-placements/assessments` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/calendar.js` | `/learn/my-placements/calendar` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/index.js` | `/learn/my-placements` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/interviews.js` | `/learn/my-placements/interviews` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/jobs/[jobId].js` | `/learn/my-placements/jobs/[jobId]` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/jobs/index.js` | `/learn/my-placements/jobs` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/placement.js` | `/learn/my-placements/placement` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/learn/my-placements/rules.js` | `/learn/my-placements/rules` | ACCOUNT_PRODUCT:LEARNER | Must be represented by Learner matrix. |
| `src/pages/superadmin/jobs/[jobId]/applications.js` | `/superadmin/jobs/[jobId]/applications` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/[jobId]/index.js` | `/superadmin/jobs/[jobId]` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/[jobId]/interviews.js` | `/superadmin/jobs/[jobId]/interviews` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/[jobId]/settings.js` | `/superadmin/jobs/[jobId]/settings` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/[jobId]/shortlisted.js` | `/superadmin/jobs/[jobId]/shortlisted` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/all.js` | `/superadmin/jobs/all` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/superadmin/jobs/index.js` | `/superadmin/jobs` | ACCOUNT_PRODUCT:SUPER_ADMIN | Must be represented by Super Admin matrix. |
| `src/pages/tpo/drives/[jobId].js` | `/tpo/drives/[jobId]` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/drives/[jobId]/edit.js` | `/tpo/drives/[jobId]/edit` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/drives/index.js` | `/tpo/drives` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |
| `src/pages/tpo/drives/new.js` | `/tpo/drives/new` | ACCOUNT_PRODUCT:TPO | Must be represented by TPO matrix. |

## D. P0/P1 backend contracts that still block real parity

- [ ] **W01 migration integration:** register+replay DB08-A/B/C canonical models and `placement_job_cohort_targets`, with generation, schema barrel exports, audited triggers and tenant-negative tests. There is **no** approved DB08 migration yet; do not wire staged services/routes.
- [ ] **Remove required seasons:** `placement_jobs.season_id` remains NOT NULL and job creation/reports still rely on season selection. Latest legacy V188 removes season-driven participation and drives target academic cohorts. W01 must integrate DB change; W04 owns job service/API consumers and exact FE changes.
- [ ] **Completed batch cannot self apply:** after W01 migration, enforce finished cohort inside transactional application write and visibly disable action. Manager explicit drive inclusion is separate.
- [ ] **End-to-end invitations:** manager Invite/Remind must have notification outbox + transactional idempotency through W06; changing `invitedAt` alone is not a delivered invitation.
- [ ] **Active eligibility race:** college module toggle, eligibility/undo and new application must share a proven lock/write guard or independent serializable recheck; current W04 two-gate read occurs before the application transaction.
- [ ] **Cross-role flagged existing applications:** changing eligibility to INELIGIBLE must not withdraw existing applications, but must show manager-facing current eligibility warning without leaking private reason to learner.
- [ ] **Profile verification:** registration → verification → offer and joining route data through W01 DB04 producer; consumer cannot be VERIFIED until producer works.
- [ ] **Offer fidelity:** breakup (fixed/variable/bonus), job categories incl Internship+Full Time and Apprenticeship, dream/up-lift, counted-as-placed, expiry/dispute/revocation, joining verification and salary rounding vs latest legacy.
- [ ] **External placement:** independently verify outside offers without a fake job/application/offer chain; private storage and cross-college authorization, audit, salary inclusion only once VERIFIED; API/UI blocked on W01 and private-doc contract.
- [ ] **Round/application integrity:** each round, attendance, result and screening must belong to same job and college; sequential rounds, supersession, conflicting outcomes, concurrency and public sharing restrictions tested.
- [ ] **Learner offer, request, saved job, preference, academic evidence APIs:** audit every route including `/jobs/[jobId]`, deep links, browser caches, unavailable state and error code; no direct service bypass of W04 two-gate check.
- [ ] **Coordinate Drive Day:** incomplete role+college visibility, row-level recruiter/learner privacy, India-specific date override and manager/coordinator concurrent attendance transitions.
- [ ] **Student registration forms:** exact consent copy/version, deadline crossing, reopening, duplicate submits, backfill TPO registration, batch-specific worklist and privacy states.
- [ ] **Full DB08 field mapping:** canonical 18-table/280-field ledger currently has `UNVERIFIED` on all fields. Candidate model != semantic mapping != runtime proof; global release gate must stay open.

## E. Test evidence, explicitly separated

**Authored:** `tests/unit/placement-batch-eligibility-policy.test.ts`, `placement-batch-registration-policy.test.ts`, `placement-external-offer-policy.test.ts`, `placement-cohort-target-policy.test.ts`, integration specs `placements-db08-batches.test.ts`, `placements-db08-registration.test.ts`, updated existing W04 integration suites plus 3 new denied-path assertions.

**Executed and passing this batch:** None. GitHub Actions is repeatedly failing before runner steps; no repository checkout, credentials or disposable PostgreSQL runtime available here. W01 must supply runnable CI/PG proof before marking any unit or browser evidence PASS.

**Next W04 code item:** close remaining application/offer/coordinator guards and API privacy negatives, then wire cohort-target drive publication and register/offer workflow as soon as W01 supplies journalled DB08 migration SHA. Continue per-row UI parity only after durable persistence and service contracts are in place.
