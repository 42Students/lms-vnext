# Work packet: edit src/modules/placements/application-service.ts (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u021-apply-to-job-request.md, docs/audit/gap2/lane-12/job-application.md, docs/audit/gap2/lane-14/u010-job-application-source-validator.md, docs/audit/gap2/lane-17/placement-job-service.md, docs/audit/gap2/lane-18/job-service-impl.md

## G2-19-021-003  [P1] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:377-405 — learner submits with resume URL; server chooses profile fallback
- vNext now: src/modules/placements/application-service.ts:570-618 — select role option/channel and eligibility; no resume reference
- Fix: Surface secure resume attachment selection or snapshot

## G2-19-021-020  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:651-659 — resume URL saved from request or profile
- vNext now: src/modules/placements/application-service.ts:856-869 — application insert no resume URL column
- Fix: Add per-application resume reference/snapshot with privacy checks

## G2-19-021-023  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:377-388 — visibility target and job/deadline, not eligibility grade gate in intro
- vNext now: src/modules/placements/application-service.ts:647-654,699-751 — hard eligibility and batch/debarment gate
- Fix: Document more restrictive eligibility and user-visible reason categories

## G2-19-021-027  [P1] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:651-659 — resume persisted as URL on job_application
- vNext now: src/modules/placements/application-service.ts:856-869 — role option and eligibility snapshot, no resume
- Fix: Support private signed resume snapshot or explicit design exception

## G2-19-021-039  [P1] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:401-420 — allowlist own HTTPS storage segments
- vNext now: src/modules/placements/application-service.ts:570-585 — membership verified; no resume
- Fix: Preserve ownership verification if receipt flow added

## G2-19-021-041  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:651-659 — application.resumeUrl and profile fallback
- vNext now: src/modules/placements/application-service.ts:856-869 — no resume field stored, snapshot eligibility
- Fix: Resolve application resume data retention policy

## G2-12-019-026  [P1] GAP  facet F06  effort L
- Legacy: Legacy resume upload distinct from profile resume, revision history `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:62-82`
- vNext now: New application submission service records membership and role, no core resume snapshot `src/modules/placements/application-service.ts:840-879` `src/db/schema/placements.ts:973-1020`
- Fix: Allow signed upload/selection per application with history, validate URL origin.

## G2-12-019-035  [P1] MISSING  facet F10  effort S
- Legacy: Old @PrePersist publicRef on both self and staff applications `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:177-188`
- vNext now: New insert role application with generated UUID, no publicRef `src/modules/placements/application-service.ts:853-879`
- Fix: Generate company-facing publicRef for every creation path.

## G2-12-019-036  [P1] GAP  facet F10  effort S
- Legacy: Old reapply after withdrawal overwrites same row and stores resume history `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:76-82,98-102`
- vNext now: New restores same row, updates submittedAt but no resume history `src/modules/placements/application-service.ts:816-850`
- Fix: Capture first apply and resume revision when restoring.

## G2-12-019-040  [P1] GAP  facet F12  effort S
- Legacy: Legacy withdrawal keeps statusBeforeWithdrawal `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:98-102`
- vNext now: New WITHDRAWN stores withdrawnAt only; eligibility gate decides reapply using screening/offer facts `src/db/schema/placements.ts:993-1020` `src/modules/placements/application-service.ts:819-847`
- Fix: Persist prior application stage and review reapply behavior after advanced stage.

## G2-14-010-007  [P1] GAP  facet F04  effort M
- Legacy: Unknown and empty input converted EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:32-47`
- vNext now: Input enum rejects unknown and mode determines omitted channel `src/modules/placements/validation.ts:659-672` `src/modules/placements/application-service.ts:408-452`
- Fix: Define explicit historical-value normalization adapter

## G2-14-010-013  [P1] GAP  facet F07  effort S
- Legacy: isValidSource returns false for null or whitespace `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:55-59`
- vNext now: Optional field can pass Zod but HYBRID throws CHANNEL_REQUIRED `src/modules/placements/validation.ts:664-666` `src/modules/placements/application-service.ts:430-435`
- Fix: Differentiate allowed-source predicate and omitted channel handling

## G2-14-010-023  [P1] GAP  facet F12  effort M
- Legacy: Null source defaults EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:32-35` `docs/legacy-source/backend/src/test/java/com/_42students/lms/util/JobApplicationSourceValidatorRegressionTest.java:30-33`
- vNext now: Omitted channel for INTERNAL job becomes INTERNAL `src/modules/placements/application-service.ts:416-422`
- Fix: Protect historical null-source import from silently switching channel

## G2-17-012-050  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:126-130 — Org-wide applications paged to avoid unbounded listings.
- vNext now: src/modules/placements/application-service.ts:1011-1058 — Per-job applications listing; no org-wide listing in this service.
- Fix: Offer bounded org-wide applications view and cursor/page.

## G2-18-011-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy calendar includes visible + already-applied jobs even after deadline (`JobServiceImpl.java:1505-1539`).
- vNext now: New learner jobs listing only currently PUBLISHED/unarchived, regardless application history (`learner-job-service.ts:130-148`); own applications listed separately (`application-service.ts:955-1010`).
- Fix: Union authorized own-application dates into learner career calendar independently of live job listing.

## G2-18-011-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy external-only job returns `This job only accepts applications through the external application process` (`JobServiceImpl.java:296-300,468-474`).
- vNext now: New applicationMode selects EXTERNAL or INTERNAL application channel with external URL required (`application-service.ts:611-622,779-783`).
- Fix: Ensure external-only never creates internal application, but authorized external application route works.

## G2-18-011-020  [P1] GAP  facet F06  effort L
- Legacy: Legacy apply has optional resumeUrl field, profile resume fallback (`JobServiceImpl.java:389-422,651-660`).
- vNext now: New create application input requires chosen roleOption, channel and eligibility snapshot, no resume URL in placement_applications schema (`application-service.ts:570-616`; `placements.ts:973-1020`).
- Fix: Restore optional owned resume reference and profile fallback, with secure signed access.

## G2-18-011-026  [P1] GAP  facet F07  effort L
- Legacy: Legacy resume must HTTPS, allowed content URL/storage key and own org/college/resumes/user path (`JobServiceImpl.java:406-421`).
- vNext now: New no applicant resume ref in app write path, only eligibility evidence (`application-service.ts:570-654`).
- Fix: Use owned upload receipt not arbitrary URL; preserve HTTPS and tenant/learner isolation.

## G2-18-011-027  [P1] GAP  facet F07  effort M
- Legacy: Legacy rate limit 5 applies per learner per minute (global setting override), 429 text (`JobServiceImpl.java:137-167,424-438`).
- vNext now: New application write no matching per-learner apply rate limit visible, guarded by DB transaction/idempotency (`application-service.ts:570-654,656-669`).
- Fix: Implement distributed tenant-safe rate limit with exact 429 copy and configurable platform threshold.

## G2-18-011-037  [P1] GAP  facet F10  effort L
- Legacy: Legacy job application create sets status APPLIED, source INTERNAL, screens after save (`JobServiceImpl.java:640-725`).
- vNext now: New create status SUBMITTED, channel INTERNAL/EXTERNAL, eligibility snapshot, screening separate (`application-service.ts:856-870`; `placements.ts:992-1008`).
- Fix: Map APPLIED→SUBMITTED and screening transition without losing decisions.
