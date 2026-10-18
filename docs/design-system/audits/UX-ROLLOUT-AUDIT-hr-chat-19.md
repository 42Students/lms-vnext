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
