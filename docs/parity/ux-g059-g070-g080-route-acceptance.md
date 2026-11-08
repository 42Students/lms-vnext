# UX-G059, UX-G070, UX-G080 — cross-account route UX acceptance

8 November 2026. Main only. This document records scoped source audit and acceptance proof; **the only status and ownership authority is `docs/tracker.json#uxReview.groups`**. No changes are marked DONE until exact-SHA lint, unit, responsive browser and TypeScript checks succeed. These tests do not certify live tenant authorization or whole-app release readiness.

## UX-G080 — Recruiter Today, calendar, company and drives

Canonical group: `UX-G080` (16 source files, 0 additional route-only surfaces). Implementation: `c6cab25c7662c05ce841a559077414bf68a7015d`.

Audited the Realtor/recruiter alias structure: the recruiter root and colleges selector intentionally redirect to `/recruiter/home`; calendar, company, and drives re-export their authenticated HR equivalents. The compatibility pages retain the same actual service authorization, not duplicated business logic. Examined route-specific error/loading and not-found fallback for each of these paths.

Fixes:
- Updated all five recruiter error boundaries to recover to the canonical recruiter Today `/recruiter/home` rather than `/hr/home` or the indirect `/recruiter` alias.
- Updated the Recruiter not-found Back link to Today and gave it a useful accessible label.
- Clarified that `/recruiter/colleges` is an alias *opening Today* rather than loading a separate college directory; recruiter drives now names its loading status explicitly.
- Preserved the protected HR-route exports, redirects and role resolution, without simulating an alternative login or bypass.

Acceptance in `.github/workflows/ux-g080-recruiter-acceptance.yml`: source lint; SSR render assertions in `tests/unit/ux-g080-recruiter-recovery.test.tsx` over all five error boundaries, five loaders and not-found; actual rendered fallback, retry and navigation in `tests/e2e/ux-g080-recruiter-recovery.spec.ts` at 1280×800 and 390×844; full TypeScript. Fixture `/e2e/ux-recruiter-recovery` is only available with `NODE_ENV=development` and `E2E_AUTH_ENABLED=true`, never via production login. Run: <https://github.com/42Students/lms-vnext/actions/runs/42462573312>.

## UX-G059 — Learner assignments and quizzes

Canonical group: `UX-G059` (16 route source files). Implementation: `3f7da02cfa48a24545cc5d1d82969061ef4c03df`.

Audited learner assessment lists, per-assignment detail, quiz history, nested error/loading states and root/alias protections. Existing assessment service enforces the membership and delivery scope, published-grade visibility, safe submission/download URLs and private quiz attempts; those safeguards were not changed.

Fixes:
- When a course-filtered assignment list shrinks and an old pagination deep link points beyond the last authorized result, redirect to its valid last page using the **already authorized** selected course ID. Retain invalid raw-page rejection and existing authorization errors.
- Added reciprocal `View quizzes` and `View assignments` navigation while preserving the selected authorized course, rather than forcing a new all-course search.
- Fixed the assignment detail due/points grid to stack on phones rather than forcing two narrow columns.
- Gave repeated quiz attempt action links distinct accessible names containing the attempt number; published result visibility and attempt authorization remain unchanged.

A pure `learnerAssignmentListRecoveryPage` decision is tested with positive and negative values, including zero records, negative/NaN, bounds, and a stale page. Route recovery and loading components are SSR tested without leaking exceptions. Browser fixture `/e2e/ux-learner-assessments` exercises actual learner error/loading UI, preserves an authorized course in the generated recovery link and checks the desktop/mobile layout for horizontal overflow. Run: <https://github.com/42Students/lms-vnext/actions/runs/42462946348>. Test files: `tests/unit/ux-g059-learner-assessments.test.tsx`, `tests/e2e/ux-g059-learner-assessments.spec.ts`; workflow `.github/workflows/ux-g059-learner-assessments-acceptance.yml`.

## UX-G070 — Mentor notifications and scoped project recovery

Canonical group: `UX-G070` (16 route source files). Implementation: `af137b7d4db2eda063e157a00f899865ec2b7623`.

Audited notifications, mentor profile compatibility redirect, assigned project directory, per-project main workspace, task-board summary, activity history and route errors/loaders. Read and write permission checks remain server-owned. Audit and board pages retain existing saved URL query validation and project-scope services.

Fixes:
- Invalid board-review and activity-history filters now present an actionable `Clear filters and retry` link to the **same project**, instead of ejecting users to the generic Projects directory. A second `Back to this project` link preserves project context.
- Extracted the two consistent safe states into `MentorProjectFilterError`; the project ID is URL-encoded and the clean route still revalidates current actor permissions on the server.
- Mentor notifications errors no longer log the raw exception from a client fallback. They explain that a failed read is not an empty inbox, expose retry and provide `My projects` exit.
- Board and activity-history error boundaries have independent retry plus a reachable mentor Projects exit; loading notices use a single accessible announcement.

Focused SSR route tests check same-project URLs, punctuation encoding, private error suppression and loading announcements; desktop/mobile Chromium exercises the exact shared component used by the real pages, notification retry and board error, accessible links and no page overflow. The fixture does not query real learner/mentor data. Tests: `tests/unit/ux-g070-mentor-route-recovery.test.tsx`, `tests/e2e/ux-g070-mentor-route-recovery.spec.ts`. Workflow `.github/workflows/ux-g070-mentor-recovery-acceptance.yml`; run <https://github.com/42Students/lms-vnext/actions/runs/42463187143>.

## Shared acceptance boundaries and closure rule

All code is pushed on `main`, each group independently claimed by `chat-gpt6-ux-multirole-20261108`. We have made **no intended change** to database schema, tenant membership filters, authentication, RBAC, server authorization, file access or credentials. Recovery links only navigate to same-origin known routes; server services must still authorize every request. The three fixture pages are development+explicit-E2E gated, do not simulate signed-in or production users, and only exercise rendered UI/URL semantics.

**Do not mark `DONE` on source changes or passing unit tests alone.** Require the run's exact SHA check, scoped lint, unit, desktop/mobile Chromium, full project TypeScript and screenshot artifacts; record the exact run, test counts, artifacts and a regression/security boundary review as separate evidence for each canonical group. Real tenant-authenticated integration, full parity and release checks remain separate gates.
