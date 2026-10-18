# Independent HR UX cross-audit — chat-19 (second pair of eyes)

**Date:** 2026-10-18  
**Branch:** `chatgpt/chat-19-b`  
**Upstream authors:** chat-15 / chat-16.  
**Source:** `docs/orchestrator/ui-ux/pages-hr.md`, `docs/design-system/UX-PLAYBOOK.md`, 21-point rubric.

## Method

All **22** HR route page sources were independently inspected for current recruiter authorization, legacy copy, raw tables, scroll surfaces, route errors, empty states, access/tenant gates, and sensitive candidate/project details. Earlier rollout `tests/ux-hr-rollout-01.test.mjs` and `tests/ux-hr-rollout-02.test.mjs` principally assert source wording, focus classes and contrast; this cross-audit adds explicit page access, partial-failure and responsive-table contracts. The two redirect/alias pages are accounted for separately.

Only a subset of nested HR components, drawer behavior, server permissions and write service operations was inspected. There was **no runtime/browser/dev-site session**, test execution or PostgreSQL integration harness in this GitHub connector workflow. These limits are not waived.

## Findings

| Route | Finding ID | Before-fix severity | Evidence (file:line) | Corrective action | Outcome |
|---|---|---|---|---|---|
| /hr/placements/jobs/[jobId] | HR-XA-01 | MAJOR | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:671` | Selection history + issued offers required horizontally scrolling 34/56rem tables; render DataTable mobile cards preserving every field | FIXED |
| /hr/drives + /hr/placements/jobs/[jobId] | HR-XA-02 | MAJOR | `src/app/(authenticated)/hr/drives/loading.tsx:1` | Indefinite local skeletons had no timeout/retry message; use GracefulPageLoading | FIXED |
| /hr/drives | HR-XA-03 | MAJOR | `src/app/(authenticated)/hr/drives/error.tsx:8` | Small error retry touch target; shared 44px Button | FIXED |
| /hr/placements/jobs/[jobId] | HR-XA-04 | MAJOR | `src/app/(authenticated)/hr/placements/jobs/[jobId]/error.tsx:15` | Back link lacked readable focus affordance; apply deep-teal focus styles | FIXED |

**Counts:** 0 BLOCKER, 6 MAJOR, 0 MINOR, 0 NIT found and addressed in this review. Code commits `86d4e58a`, `2c21cb71`, `8f859ed4`, `f150fa86`, `56742618`, `8a8df46e`, `c9ead3e5`, `1eaae5e9`, `3de439aa`. Test file: `tests/unit/chat19-hr-page-contracts.test.ts`.

### 2026-10-18 follow-on cross-audit of chat-15/16 recruiter work

| Route | Finding ID | Severity before fix | Source evidence | Verified source fix | Regression |
|---|---|---|---|---|---|
| `/hr/drives/new` / copied job drafts | HR-XA-07 | MAJOR | `src/modules/placements/hr-drive-draft-model.ts` external HTTPS URL refinement and copied-job projection | Reject loopback/private-network/local-host application links using the same fail-closed recruiter browser-link policy (`e8267309`) | `tests/unit/HR-BREAK-drive-payload-01.test.ts` (`1fc0b092`) |
| `/hr/drives/new` form double submit | HR-XA-08 | MAJOR | `src/components/hr/hr-drive-draft-form.tsx` asynchronous `submitting` state | Add immediate synchronous in-flight guard, terminal saved state and preserve same idempotency submission ID for ambiguous retries (`c2c46d25`) | `tests/unit/HR-BREAK-double-submit-01.test.ts` (`9c20e646`) |
| `/hr/profile` save action | HR-BREAK-profile-02 | MAJOR | `src/components/hr/recruiter-profile-details-editor.tsx` error-path response branch | Distinguish expired session, removed grant, stale edit and rate limit without discarding entered values; test pure feedback model (`30a76a40`, `55426556`, `b0cb8597`) | `tests/unit/HR-BREAK-profile-01.test.ts` (`96dc1f82`) |
| All recruiter pages under `/hr` | HR-BREAK-session-layout-01 | COVERAGE | `src/app/(authenticated)/hr/layout.tsx` | Live test of active, expired, missing-profile, suspended and zero-grant recruiter entry, without loosening role gate | `tests/unit/HR-BREAK-session-layout-01.test.ts` (`d2da705b`) |

**Revised source-level count:** 0 confirmed outstanding BLOCKER, **9 MAJOR discovered and source-fixed**, plus one session-layout coverage improvement. Earlier source-level 6/6 has been retained. **Verdict remains FAIL** until TypeScript, all affected Vitest suites, PostgreSQL race tests, real browser/keyboard and 320/360/390px verification are executed. The API-only review cannot certify the race and session behaviour end-to-end.

## HR pages reviewed

| Route | Cross-audit check | Test evidence |
|---|---|---|
| `/hr/activity` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-01.test.mjs` |
| `/hr/calendar` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-01.test.mjs` |
| `/hr/colleges` | Redirect only; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-01.test.mjs` |
| `/hr/company` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-01.test.mjs` |
| `/hr/company/reports` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-01.test.mjs` |
| `/hr/conversations` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-01.test.mjs` |
| `/hr/conversations/[threadId]` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-01.test.mjs` |
| `/hr/drives` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-01.test.mjs` |
| `/hr/drives/[jobId]/interview-slots` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-01.test.mjs` |
| `/hr/drives/[jobId]/messages` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-01.test.mjs` |
| `/hr/drives/[jobId]/rounds/editor` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/drives/[jobId]/rounds/editor/remove/[roundId]` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/drives/new` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/drives/proposals` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/drives/recorded-outside` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/home` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/messages` | Alias to scoped conversations; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/notifications` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/placements` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/placements/jobs/[jobId]` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/profile` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |
| `/hr/round-results` | Scoped page entry; source-level scanned | `tests/unit/chat19-hr-page-contracts.test.ts`, existing `tests/ux-hr-rollout-02.test.mjs` |

## Account and Projects privacy notes

Employer-facing project data is surfaced inside shortlisted applicant reviews, not via an unrestricted Projects directory. `getHrJobRead` resolves `getRecruiterPlacementWorkspace` first, constrains to the current college and active shortlisted applications, requires both relationship-column share and college visibility policy for project links, and passes only validated project URLs into the HR view. Pure policy/adversarial regression checks are in `tests/unit/chat19-projects-recruiter-role-journey.test.ts` (`PROJ-HR-01` to `PROJ-HR-05`). Adversarial tests identified and fixed a separate **PROJ-HR-07 BLOCKER**: previously shortlisted but subsequently withdrawn applicants could retain contacts/project URL/resume visibility through stale deep links. A fresh read now returns only withdrawal status without those private fields, and the drawer requires SUBMITTED. **PROJ-HR-08 MAJOR** also closes terminal-dot local-host link bypass. Changes are recorded in `docs/audit/defects-chat-19.md` and `tests/unit/chat19-projects-recruiter-role-journey.test.ts`. Asynchronous grant removal during an open browser tab and writes racing stale revisions still need actual integration tests.

## Acceptance decision

**FAIL pending executable and device validation; source-level MAJOR findings fixed (6/6).** No claim that prior authors' HR workflow integration is exhaustive. Before release, run Vitest/tsc, browser flows at 320/360/390px, keyboard focus/return on drawers, employer cross-college URL tampering, expired session read, stale tabs and double-submit behavior against PostgreSQL. Missing checked artifacts must be filed back to the responsible HR service owner. Do not treat an unexecuted source assertion as authorization proof.

## chat-19 independent revisit after rolling cloud CI

Source inspection of `/hr/conversations/[threadId]` found two more concrete issues beyond the original six UX findings.

| Page | ID | Severity | Evidence | Fix | Test |
|---|---|---|---|---|---|
| `/hr/conversations/[threadId]` | HR-BREAK-CONVO-02 | MAJOR | `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx`, matchingDrive lookup | Cross-check recruiter company ID against selected job/college before deriving employer-facing drive title or link | `tests/unit/HR-BREAK-chat19-conversation-page.test.ts` |
| `/hr/conversations/[threadId]` | HR-BREAK-CONVO-03 | MAJOR | Same page, optional `getDriveChangeRequests` await | Fail-soft change requests; keep authorized message history and reply UI available; show recoverable warning without exposing raw server exception | `tests/unit/HR-BREAK-chat19-conversation-page.test.ts` |

The HR page ledger `docs/audit/coverage/hr-pages-chat19-ledger.md` enumerates all 22 `/hr` routes, distinguishes source assertions from directly invoked server-page tests, and records outstanding integration/device gates. The new tests directly invoke async `/hr/conversations/[threadId]`, `/hr/notifications`, and `/hr/profile` entry points with deliberately hostile/expired contexts and mocked service dependencies; they do not claim real browser or DB verification.

**Revised source-audit findings:** 12 MAJOR found and source-fixed across the two HR passes (original six, subsequent three, and these two). **Acceptance verdict: FAIL pending the orchestrator's cloud green verification and browser/PostgreSQL acceptance**, not a reason for the builder lane to halt implementation.

## 2026-10-18 complete second-pair-of-eyes revisit

The second HR page pass now has an explicit 22-entry route ledger at `docs/audit/coverage/hr-pages-chat19-ledger.md`. Tests directly invoke all 20 non-alias/non-retired server-page boundaries (with mocked services) or invoke and assert the two legacy redirect/alias boundaries. This is **page-entry/role-state test coverage**, not a declaration of complete nested dialogs, screens or real DB flows.

| Page | Finding | Severity | Source evidence | Source correction and test |
|---|---|---|---|---|
| `/hr/conversations` | HR-BREAK-CONVO-04 | MAJOR | The `generalHistory` and `decisionNotices` awaits in `src/app/(authenticated)/hr/conversations/page.tsx` | Failed optional history/decision lookup no longer crashes entire authenticated inbox; stale general preview and inline reply are suppressed after second grant-check failure. `tests/unit/HR-BREAK-chat19-conversation-inbox-page.test.ts` asserts no raw server text is rendered. |
| `/hr/drives/[jobId]/rounds/editor`, `/hr/drives/[jobId]/interview-slots`, `/hr/drives/[jobId]/rounds/editor/remove/[roundId]` | HR-BREAK-ROUNDS-01/02 | COVERAGE | Route-level validation, can-edit decisions, optimistic expectedUpdatedAt hidden field | `tests/unit/HR-BREAK-chat19-drive-pages.test.ts` directly asserts unauthorized/invalid/empty state and form-bound version. |
| `/hr/drives/proposals`, `/hr/home`, `/hr/placements`, `/hr/placements/jobs/[jobId]` | HR-BREAK-HOME-01/JOB-01 | COVERAGE | Cross-company URL and legacy routing needs gate before redirect, no inferred tenant | `tests/unit/HR-BREAK-chat19-home-portfolio-proposals.test.ts` and `tests/unit/HR-BREAK-chat19-legacy-job-aliases.test.ts` invoke service-mocked pages with forged/expired identities, and verify authorized URL routing. |

**Cross-audit final source finding count:** 12 previously existing or newly found MAJOR findings source-corrected across the HR passes, with `HR-BREAK-CONVO-04` accounting for the final addition; 0 newly documented unfixed source-level BLOCKER in this lane. Distinguish this from release acceptance. Cloud CI diagnostics and full PostgreSQL/device workflows are not executed by chat-19; orchestrator owns that gate, and any emitted chat-19 failures should be fixed from the rolling reports without stopping on absent local runtime.
