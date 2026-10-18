# Independent /college UX rollout cross-audit — chat-19

**Date:** 2026-10-18  
**Branch:** `chatgpt/chat-19-b`  
**Reference:** `docs/design-system/UX-PLAYBOOK.md`, `docs/design-system/UX-AUDIT-RUBRIC.md` (21 checks), `docs/orchestrator/briefs/ux-cross-audit-lane.md`, `docs/orchestrator/ui-ux/pages-college.md` (85 page entries).

## Method and coverage

Inspected the source for **all 85 /college route entry points** against the signed-off UX rubric: auth/permission entry, loading/error ownership, real empty states, legacy headings, primary actions, low-contrast/new-tab anti-patterns, raw tables, scroll and mobile affordances. Targeted tracing was done for five table-heavy surfaces and college Project listing, including relevant shared UI rendering and project query handling. The fixes below preserve original column text, action destinations and authorization checks.

This is a **source-level audit**, not evidence of a complete rendered-component deep walk. The route list contains page wrappers delegating to components, and their nested dialogs or backend effects require independent follow-up. No real device / browser testing at 320px, 360px or 390px, no actual focus-trap testing, no TypeScript compile and no Vitest run is claimed. An all-green static coverage matrix does not prove those acceptance criteria.

## Findings (before fixes)

| Page | ID | Severity | Source evidence (file:line) | Required fix | Status |
|---|---|---|---|---|---|
| `/college/batches/[cohortId]/students` | COL-XA-07 | MAJOR | `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx:91` | Replace horizontal 700px batch roster with responsive cards, preserve class move | FIXED, regression test authored |
| `/college/projects` | COL-XA-08 | BLOCKER | `src/app/(authenticated)/college/projects/page.tsx:41` | Reject malformed / malicious URL filters before calling project read; expose clear-filter recovery | FIXED, regression test authored |
| `/college/projects` | COL-XA-09 | MAJOR | `src/app/(authenticated)/college/projects/page.tsx:52` | Don't suppress entire workspace list if secondary template labels fail | FIXED, regression test authored |
| `/college/batches/[cohortId]/students` | COL-XA-10 | MAJOR | `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx:29` | Convert invalid cohort ID to not-found (rather than Zod crash) | FIXED, regression test authored |
| `/college/electives/[slotId]/allocate` | COL-XA-11 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx:186` | Make selection and learner fields available on phone; use truthful vertical scroll cue | FIXED, regression test authored |
| `/college/electives/[slotId]/allocate` | COL-XA-12 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx:108` | Reject invalid slot/offering identifiers gracefully | FIXED, regression test authored |
| `/college/faculty-assignment` | COL-XA-13 | MAJOR | `src/app/(authenticated)/college/faculty-assignment/page.tsx:127` | Move wide faculty roster into DataTable cards with reassignment/termination actions | FIXED, regression test authored |
| `/college/faculty/[membershipId]` | COL-XA-14 | MAJOR | `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx:75` | Expose faculty assignment history and destination links on small screens | FIXED, regression test authored |
| `/college/electives/[slotId]/offerings/[offeringId]/roster` | COL-XA-15 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:161` | Expose member states and Move/Remove controls on mobile with confirmation | FIXED, regression test authored |
| `/college/electives/[slotId]/offerings/[offeringId]/roster` | COL-XA-16 | MAJOR | `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx:28` | Fail closed on invalid deep links; handle invalid submitted membership ID in friendly catch | FIXED, regression test authored |

**Source findings:** 1 BLOCKER + 9 MAJOR; all 10 have committed code changes and test assertions in `tests/unit/chat19-college-cross-audit.test.ts`. These findings use the `COL-XA-*` audit identifier namespace rather than claiming an entry from `docs/audit/gap-register.md`.

## All entry-point routes sampled by functional group

Counts below are verified against the owner-maintained 85-entry route manifest. The `/college` index is counted under **dashboard**.

| Group after /college | Entry-point routes scanned |
|---|---:|
| `academics` | 2 |
| `activity` | 2 |
| `announcements` | 1 |
| `assignments` | 1 |
| `attendance` | 4 |
| `batch-promotion` | 1 |
| `batches` | 2 |
| `branding` | 1 |
| `classes` | 2 |
| `college-profile` | 1 |
| `companies` | 1 |
| `contacts` | 2 |
| `course-progress` | 1 |
| `courses` | 2 |
| `dashboard` | 1 |
| `departments` | 1 |
| `domains` | 1 |
| `electives` | 3 |
| `faculty` | 3 |
| `faculty-assignment` | 1 |
| `groups` | 4 |
| `hiring-dashboard` | 1 |
| `lecture-halls` | 2 |
| `lessons` | 1 |
| `live-classes` | 1 |
| `people` | 2 |
| `placements` | 14 |
| `profile` | 1 |
| `programs` | 1 |
| `projects` | 15 |
| `quizzes` | 1 |
| `resources` | 1 |
| `semester-courses` | 1 |
| `semesters` | 1 |
| `students` | 4 |
| `verification` | 1 |
| `videos` | 1 |
| **Total** | **85** |

Cross-checked `docs/audit/ux/COVERAGE-MATRIX.md` against tested paths where relevant; raw page-level tables on batch students, electives allocation, electives roster, faculty assignments and faculty detail were converted to shared responsive `DataTable`. Nested component-owned tables are tracked separately and are not silently marked complete by this page-only pass.

## Non-regression and acceptance requirements

- **Copy:** No legacy labels were intentionally renamed. All original table columns and associated actions are retained.
- **Mobile:** DataTable renders row cards on phones, retaining secondary values via a disclosure rather than requiring a 700px wide scroll. Interactive row actions remain present.
- **State handling:** Invalid project filters now produce an `ErrorState` and reset link. Lost template metadata does not masquerade as an empty project list. Invalid UUID deep links use `notFound()`.
- **Permissions:** Existing `requirePermission`, active membership and college-scoped database predicates were left intact. No new cross-tenant mutation ability was added.
- **Tests:** `tests/unit/chat19-college-cross-audit.test.ts` includes real query parser rejection cases (zero/negative/decimal/unbounded page, invalid status/view and overlong search) plus source regression assertions for the mobile and invalid-input fixes.
- **Scroll/motion:** A horizontal cue comes from the shared DataTable `ScrollCue`; the tall selectable elective roster now has an additional vertical ScrollCue with `overscroll-contain`. No new hard-coded animation durations were introduced.

## Verdict and unverified risks

**FAIL — release acceptance remains blocked by missing executable verification, not by a known unfixed entry-page BLOCKER/MAJOR.** Fixed findings: **1 BLOCKER, 9 MAJOR**; known unfixed among *these ten*: **0**. This verdict does not assert that all 85 pages are fully tested.

The three highest risks not verified here: (1) all 85 routes' nested dialogs/tables at 320/360/390px and VoiceOver/TalkBack, (2) real PostgreSQL state races / double submissions and expired sessions in college Project workflows, and (3) TypeScript/Vitest and full screenshot acceptance after multi-lane merges. Orchestrator should run the repository checks and real-device audit and reopen any regression before IIT Dharwad deployment.
