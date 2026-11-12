# UX-G072 — Mentor project review and risk/readiness (atomic scope)

**Canonical board:** `docs/tracker.json#uxReview.groups[UX-G072]`.  
**Scope:** The six page/error/loading files for the authorized Mentor
`/mentor/projects/[projectId]/review-overview` and
`/mentor/projects/[projectId]/risk-readiness` journeys.
This is only part 1 of the original November 9 split; sibling UX-G261
and UX-G262 are independently tracked.

## 12 November 2026 implementation

- [`e7727e0`](https://github.com/42Students/lms-vnext/commit/e7727e01dd62910886e2c0d25be164e76e870b05) fixes a misleading review empty state:
  a valid status, feedback or version filter returning zero rows now says
  **no registered delivery versions match the filters**, rather than
  falsely asserting no registered project delivery exists. The results
  count is announced with `role=status` and `aria-live=polite`.
- [`75411ae`](https://github.com/42Students/lms-vnext/commit/75411aef8f2b4b36b7156e13e0f37334262edb36)
  adds a truthful, accessible risk/readiness filtered-count announcement
  and distinguishes no matching signals from an unfiltered empty register.
- Authenticated [desktop/mobile acceptance tests](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/ux-g072-mentor-filter-recovery.spec.ts)
  exercise the real seeded Mentor project, invalid and duplicate filter
  recovery, correct URL clearing, valid version filters with no matches,
  risk focus and priority filter submission, visible export link, responsive
  FilterBar modal, feedback privacy, normal/read-only pages and Learner denial.
- The first expanded browser run
  [43194230863](https://github.com/42Students/lms-vnext/actions/runs/43194230863)
  failed on an **ambiguous test selector**: both the new count paragraph and
  `EmptyState` intentionally expose `role=status`. The test selector
  was narrowed to the specific live count paragraph at
  [`e611d64`](https://github.com/42Students/lms-vnext/commit/e611d64aa352af4f64c3fcdd721b5539400b5b14).
  This does not hide a status or weaken application/access checks.
  [Latest exact-SHA workflow 43195308945](https://github.com/42Students/lms-vnext/actions/runs/43195308945)
  must be checked for full pass and screenshot artifacts before closure.

## Scope and safety

Both pages are read-only. Mutations are intentionally delegated to the existing
authorized project workspace. Existing role and exact-project access gates in
`getMentorDeliveryReviewOverview` and `getMentorRiskReadiness` remain
unchanged; invalid-link recovery asserts the same access before exposing
project context. No raw review feedback or private authorship was exposed.

## 12 November 2026 — acceptance completed

- Exact-SHA [workflow 43195308945](https://github.com/42Students/lms-vnext/actions/runs/43195308945)
  **succeeded** on `e611d64aa352af4f64c3fcdd721b5539400b5b14`.
  Source checks, scoped ESLint, full TypeScript, isolated PostgreSQL seed,
  browser dependency installation, and **3/3 authenticated Chromium**
  scenarios all passed, with no skipped or flaky cases.
- [Artifact 13931973882](https://github.com/42Students/lms-vnext/actions/runs/43195308945/artifacts/13931973882)
  contains **eight actual screenshots** inspected independently at desktop
  1280×800 and mobile 390×844. They show working project review filters,
  filtered empty-state recovery, risk/readiness filter results, and persisted
  reviewer feedback with redacted conversation content.
- Positive filter submission and clearing, invalid-URL recovery, learner
  denial, mobile filter modal behavior, working export URL parameters,
  no horizontal page overflow and scoped project-only navigation all pass.
  Existing CSV response service and step-up policy are unchanged and outside
  this read-only page/error/loading slice.
- All **six current scoped source blob SHAs** under `main` matched the six
  source blob SHAs at the exact successful tested commit. No unrelated branch
  changes were used as proof.

**Security and regression:** The Learner denial checks confirm unauthorized
actors cannot browse the current project's routes, feedback or reset links.
Project-read and tenant scopes were unchanged in
`getMentorDeliveryReviewOverview` and `getMentorRiskReadiness`.
Both pages are intentionally read-only. Error/loading boundaries preserve
truthful retry and no private exception content; user-visible empty states
no longer infer that an entire project's records are absent when a valid
filter matches zero. Existing service/export authorization was not relaxed.

**Closure:** UX-G072 **DONE** for the six-file atomic read-only slice.
Previously assigned UX-G261/G262 are **not** included in this acceptance.
