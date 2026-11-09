# 2026-11-09 — Ten College Admin UX atomic groups: applied recovery pass and outstanding acceptance

**Canonical statuses** are in `docs/tracker.json#uxReview.groups`. This is an evidence / next-gates register, not a second status tracker. Do not promote to DONE from this document alone.

## Scope and implementation

The ten pre-existing DOING groups below were independently reduced by the 2026-11-09 atomic repartition. Their current, exact `sourceFiles` total **56 files**. The previous shared G030–G040 recovery fixture was not sufficient for atomic closure, because several imported fallback components outside the new first-slice scope.

- [62b2ad3](https://github.com/42Students/lms-vnext/commit/62b2ad3b186fdac0d268d7117c4f92da970f155a) restored explicit route identity (PageHeader) in the first-slice failure screens for batch promotion, companies, course offerings, elective roster, group import preview, lecture hall schedule, applications, department readiness and project audit; kept safe retry/back navigation; made project section retry and back navigation full-width on narrow viewports.
- [de9cba5](https://github.com/42Students/lms-vnext/commit/de9cba5645982b3bdc15f45d9526848bb23dec68) added a **development-only** fixture that imports the actual ten atomic route error boundaries, not their pre-split siblings, with keyboard retry counts, private-error redaction, safe internal links, three viewport widths (320/390/1280), and narrow-mobile overflow assertions. The existing seeded Learner denial test is retained. Real production error routing, not synthetic component rendering, remains a separate acceptance gate.
- [7ed09d1](https://github.com/42Students/lms-vnext/commit/7ed09d1d05ef93d35820a870041d0e61a494f699) raised the mobile touch targets for operational Batch Promotion retry and page navigation and Companies clear-search, added source regression checks, expanded scoped ESLint and disabled cancellation of an in-flight evidence run. This also fixed an **unrelated blocking Tracker TypeScript error** without altering the Tracker uncertain-write security policy.

## Group-specific business acceptance still required

| Group | First-slice route family | Done in this pass | Missing evidence before DONE |
| --- | --- | --- | --- |
| UX-G030 | Batch promotion; cohort student roster | Contextual failure recovery, on-page touch targets | Real eligible/ineligible promotion preview/confirmation and persisted cohort outcomes; roster filters, permissions, role/tenant negatives |
| UX-G031 | College profile; company directory | Contextual Companies failure, touch-sized search reset | Real profile edit/retry and company create/edit/archive/export transitions; search/pagination, tenant boundaries |
| UX-G032 | Course catalogue/offering details | Offering-detail recovery and safe catalogue return | Authorized offering/section navigation, legacy-link ambiguity, not-found, loading and malformed-filter flows on both viewports |
| UX-G033 | Elective allocation and roster | Offering-roster recovery and safe elective return | Real membership allocation/move/faculty assignment, eligibility/capacity, cross-college denial, filtered roster and export |
| UX-G034 | Group detail and import preview | Import-preview failure identity and safe return | Group lifecycle and CSV preflight/import confirmations, invalid/duplicate files, feature flag and membership-permission negatives |
| UX-G035 | Lecture hall and lessons | Lecture-hall error identity, retry/back route | Hall booking/cancel/overlap and authorized lesson list/refresh with empty/error/fallback states |
| UX-G037 | Job applications and placement detail | Applications recovery identity | Persisted applicant actions/status/filters/export, drive permissions, denied-role and cross-college access |
| UX-G038 | New placement drive and department readiness | Department-readiness failure identity and recovery | Saved drive create/draft/validation, readiness data truthfulness and role/tenant negatives |
| UX-G039 | Programs and project workspace | Responsive project-section Retry/All projects | Programs search/actions, workspace jobs, loading/error, project- and college-bound access |
| UX-G040 | Project audit and project creation | Non-duplicated audit header, safe retry/back | Actual audit records/filter/export/access and persisted project creation, validation and negative cases |

## Proof requirements and safety boundaries

- **Exact-SHA route acceptance:** [GitHub workflow](https://github.com/42Students/lms-vnext/actions/workflows/ux-ten-college-route-acceptance.yml). This runs lint, full TypeScript, focused Vitest, disposable PostgreSQL role seed and authenticated/fixture Chromium tests. Do not infer its result from queued or running status.
- **Functional closure:** each six-/four-/five-file atomic group requires checks for its real `page.tsx`, `loading.tsx`, `error.tsx` and `not-found.tsx` where assigned, including persisted success, forbidden/foreign-college and malformed inputs, keyboard/focus, mobile/desktop screenshots, cross-role regressions, and review of actual source ownership after the split.
- **Do not weaken guards or claim UI fixture data is a live tenant workflow.** All ten were already owned by an existing chat; owners were left unchanged, and this document is a shared continuation aid.

## Executed acceptance receipt — 2026-11-09

The exact-SHA [College route recovery workflow 42645807389](https://github.com/42Students/lms-vnext/actions/runs/42645807389) **PASSED** at `7ed09d1d05ef93d35820a870041d0e61a494f699`.

- `npm ci`, explicit `git rev-parse HEAD == GITHUB_SHA`, all scoped ESLint and full TypeScript: **PASS**.
- `npx vitest run tests/unit/ux-ten-college-route-recovery.test.ts tests/unit/ux-ten-college-atomic-recovery.test.ts`: **34/34 tests in 2 files passed**.
- Isolated PostgreSQL 17 service setup, schema/seed preparation and College Admin + Learner membership seeding: **PASS**.
- `npx playwright test tests/e2e/ux-ten-college-route-recovery.spec.ts tests/e2e/ux-ten-college-atomic-recovery.spec.ts --project=chromium`: **9/9 browser tests passed; 0 skipped, 0 flaky, 0 failures**. The three newly added tests iterate all ten *current first-slice atomic boundaries* at 320x640, 390x844 and 1280x800. Existing six scenarios retain pre-split recovery checks and seeded denied-role behavior. Screenshots/traces were requested for upload by the workflow.

This evidence demonstrates that the *recovery improvements* are verified, not that the full business journeys in all 56 tracked source files are verified. **All ten canonical records remain DOING**, and each now carries this passing partial evidence with explicit outstanding acceptance. No source evidence was reused to claim a DONE group or an adjacent new sibling.
