# 2026-10-30 legacy-development UI surface delta (source evidence only)

> **Evidence, not another task tracker.** This is a dated additive source audit within the existing `docs/audit/legacy-dev-census/` evidence family. The canonical execution/phase tracker remains `docs/tracker.json`; detailed page closure remains in `docs/parity/*.md`. No checkbox or milestone is accepted by this report.

## Exact source heads inspected

| Source | Ref | SHA |
| --- | --- | --- |
| Legacy frontend | `42Students/lms2-fe@lms-dev-2026` | `08db1a76d9ed390bf7ce8706e5b9bb6ea18b815a` |
| Legacy backend | `42Students/lms@lms-dev-2026` | `94ea965c01f89e688851ead087bee81d4dc3173` |
| vNext frontend/router | `42Students/lms-vnext@main` | `aa24d2b3e347e2eaa9a50e849e9f706d47bbd935` |
| Prior dev-route census | `docs/audit/legacy-dev-census/2026-10-27-source-tree.json` | FE `c8b2a5e6779cdab58fdc0f1164f42440786a4154`; BE `4ef67db8f198205f11e1e6ca12718c38400dc7ca`; vNext `facf785de873fa15f6e4bd231d442d98562bd88f` |

Read-only inspection used GitHub recursive subtrees for legacy `src/pages` and vNext `src/app`, checked individual source files, and checked current legacy `prod-2026` directories. These SHAs are pinned *source observations*, not assertions that a browser or end-to-end workflow passed.

## Route-family screening — NOT a count of functional UI surfaces

Legacy source files were screened under the nine account prefixes below (293 `.js/.jsx` files); vNext has 594 `page.tsx` files in its current app subtree, including extra routes and redirects. Exact-path match alone is deliberately not parity: the screen below also tolerates dynamic parameter **name** changes and two *candidate* routing aliases (`/college-admin` → `/college`, `/superadmin` → `/admin`). Candidate aliases are not verified redirects or permission checks.

| Legacy prefix | Source files | Normalized structural destinations seen | Reconciliation needed |
| --- | ---: | ---: | ---: |
| `learn` | 24 | 24 | 0 at filename level; actions/states still require evidence |
| `teacher` | 14 | 14 | 0 at filename level; Faculty Today is a vNext improvement |
| `mentor` | 13 | 9 | 4 unmatched names include legacy redirect/stub routes; **not automatically gaps** |
| `tpo` | 27 | 25 | 2 renamed drive entry/detail paths; need canonical/deep-link mapping |
| `recruiter` | 10 | 10 | 0 at filename level; functional acceptance still distinct |
| `college-admin` | 60 | 40 | 20 path/consolidation candidates; investigate mappings rather than require one-to-one routes |
| `superadmin` | 118 | 50 | 68 candidates including 48 `sections/*` helper/source modules inside the Pages tree; classify reachability first |
| `course-coordinator` | 14 | 0 | **New legacy-dev account/workspace scope candidate** |
| `global-tpo` | 13 | 0 | **New legacy-dev multi-college staff workspace scope candidate** |

**False-positive controls:** `src/pages/mentor/contacts/index.js` and `[contactsTab].js` redirect to `/mentor/projects`, and the existing Mentor spec classifies Contacts and Courses stubs as retired. `src/pages/teacher/index.js` redirects to Courses while vNext `/teacher` renders its richer Faculty Today dashboard; record this as an enhancement, not a missing legacy screen. `superadmin/sections/*` are source/component filenames (48 observed), not evidence of 48 daily-use product destinations. A vNext route with a different name may implement the entire job, and an equal route name may miss modals, actions, states or security checks.

## New legacy development workspace: Course Coordinator (14 route source files)

The previously frozen 27 October census did **not** list the prefix. The current dev branch now exposes:

| Route | Source-backed candidate surfaces |
| --- | --- |
| `/course-coordinator` | Entry redirect to `/course-coordinator/courses` |
| `/course-coordinator/courses` | Assigned-course portfolio, search, clear, refresh, counts, last-visited resume, filtered-empty, loading, assignment-revoked/error/retry |
| `/course-coordinator/courses/[courseId]` | Course overview/readiness checklist, Edit details, Lessons & resources, Assessments, Delivery actions, unavailable/403 state |
| `/[courseId]/details` | Course metadata and edits |
| `/[courseId]/team` | Teaching team |
| `/[courseId]/lessons` | Lesson ordering/authoring |
| `/[courseId]/lessons/[lessonId]/resources` | Lesson resources |
| `/[courseId]/lessons/[lessonId]/videos` | Video controls |
| `/[courseId]/delivery` | Timetable and teaching delivery |
| `/[courseId]/learners` | Course-scoped learner list |
| `/[courseId]/attendance` | Attendance/adjustments |
| `/[courseId]/assessments` | Assignments/Quizzes switch, pagination, assignment draft editor, quiz draft editor, submission-status and attempt-status panels, error/retry/permission/unsaved-change flows |
| `/[courseId]/progress` | Course progress |
| `/[courseId]/announcements` | Course-scoped notices |

Routes abbreviated with `/[courseId]` in this table are all under `/course-coordinator/courses`. Actual code examined: `src/pages/course-coordinator/index.js`, `courses/index.js`, `courses/[courseId].js`, `courses/[courseId]/assessments.js`. The legacy backend independently includes `CourseCoordinator*Controller` and service families plus a `CourseCoordinatorFenceFilter`; treating this as just renamed Faculty pages would erase its assigned-course permission model. The vNext app subtree has **no `/course-coordinator/*` page files**, but whether these new dev-only capabilities are required for vNext needs a recorded scope decision.

## New legacy development workspace: Global TPO (13 route source files)

Current dev source paths: `/global-tpo`, `/login`, `/colleges`, `/colleges/[collegeId]`, `/students`, `/drives`, `/drives/new`, `/drives/[jobId]`, `/companies`, `/calendar`, `/reports`, `/team`, `/settings` (all under `/global-tpo`).

Example *child surfaces confirmed in source*:
- `/global-tpo`: current selected-college banner, scoped stats, college-switch context, shortcut cards, activity feed, loading/errors.
- `/global-tpo/colleges`: searchable/paginated loaded college network, selected-college state, select/open and empty state.
- `/global-tpo/students`: student/branch/batch/readiness/eligibility/placement columns, search/status and eligibility filters, student detail panel, verification queue, batch/class eligibility controls and bulk selection.
- `/global-tpo/drives/new`: selected-college preflight, draft form, save/cancel/error, creation of a **draft only** (does not publish/email).
- Separate company, drive detail, calendar, reports, team, settings and login journeys require deeper child-surface inventory.

Current legacy backend contains `GlobalTpo*Controller` and `GlobalTpoFenceFilter` families and staff-auth model. This is a multi-college staff permission contract, **not** the existing college TPO role. The vNext app subtree has **no `/global-tpo/*` page files**. Neither prefix exists as a directory in the legacy `lms2-fe@prod-2026` Pages Router at the inspected production head. The development-vs-production scope distinction must be preserved instead of silently declaring release parity failed or declaring the new capabilities retired.

## Smaller routing reconciliation candidates within the original seven roles

- **TPO legacy drive bookmarks.** Legacy `/tpo/drives/new` renders `DriveFormPage`; `/tpo/drives/[jobId]` is a multi-tab workspace (Applicants, Rounds, Offers, Discussion, About and aliases). In current vNext, likely functional destinations are `/tpo/placements/new` and `/tpo/placements/jobs/[jobId]`. Both exist as page files, but the old literal URLs have no same-path page files. **Test** runtime redirects/rewrites, query preservation (notably company prefill and `?tab=` aliases), authorization and Back/Forward before classifying a missing UI capability. Owner: L07/L08 by domain; no cross-lane source write in this audit.
- **College Admin.** `/college-admin/*` has many `/college/*` equivalents or consolidated `/college/placements/*` and catch-all workspaces. Map nav/deep-links and actual child states before labeling any of the 20 unmatched filenames gaps.
- **Super Admin.** `/superadmin/*` is substantially consolidated into `/admin/*`. First exclude the 48 `sections/*` source helpers, then trace reachable menus, dashboards, workspace sections and old links. Do not create 68 speculative pages.
- **Mentor.** Confirmed old Contacts redirects are intentional; vNext has `/mentor/contacts/[[...contactsTab]]` and `/mentor/courses/[courseId]/[[...courseTab]]` catch-all stubs. Path shape differences alone are not a regression.

## Acceptance / next safe implementation slices

1. **Scope decision (not an implicit authorization to build 27 pages):** reconcile the two new dev-only account workspaces against vNext product requirements, recording either required child families, approved scope exclusion, or dated deferral in existing parity specifications. If required, allocate their distinct role/auth/tenant/API/DB work before UI acceptance; do not re-label them as existing Faculty or college TPO.
2. **Independent UI-only pilot:** verify TPO create/detail legacy deep-link compatibility at desktop and mobile, including `?company=`, `?tab=`, permission denial and expired-session behavior. A genuine broken bookmark is a small targeted frontend repair owned by L07/L08; tests must demonstrate outcome, not source presence.
3. **Prioritize already-open detailed specs:** Faculty profile, Quiz shuffle and report states, Mentor meetings/notifications, then College Admin/SA consolidated workspace child surfaces. These are *existing unaccepted requirements*; consult fresh code before treating historical unchecked Markdown as a current defect.
4. **Refresh only affected census records:** the 2026-10-27 `legacy-dev-census` snapshot, source route inspections and overlay import frontier predate both new prefixes; add route→component→overlay/action/state→API owner mappings once the scope is resolved. Do not create a parallel tracker or rerun all verified old families.
5. **Acceptance wall:** no `docs/tracker.json` UI milestone, page `implementationGreen` receipt, or global phase transition was changed. This report has **source inspection only**, no executed browser, live PostgreSQL, provider, responsive or accessibility verification.

**Bottom line:** 27 concrete **unmapped legacy development route-source files** belong to two recently added account types; this is a scope-reconciliation finding, **not** a claim of 27 missing production pages. The currently actionable same-scope frontend pilot is the TPO legacy drive deep-link mapping. Both are independently testable without reopening completed DB tasks.

## Follow-up: source-census guard hardening on main

- `367a834b94d54e0be97a392d444e0af793543870`: `scripts/audit/legacy-census-status.mjs` now exposes `unmappedChangedRoutePaths` for dev-source page paths absent from the frozen route census. The strict `--assert-exhaustive` gate rejects these.
- `428048c129fd040466b9ee2749c89dfe191686e3`: the same checker now exposes `unmappedChangedComponentPaths` and `changedNavigationOrLayoutPaths` and includes both in strict completeness checks. The actual dated drift input already identifies two previously absent TPO interactive components: `BringInWindow.jsx` and `VerifyCompanyWindow.jsx`.
- `4a74220ff2851d68ab7c5b1b495cddd3fc4f59b5`, `399fc7b96bdc9e41c91bb8d0cf2451a4cdc59e14`, `4504528af6f73838131d730508547ee343d1cbc5`: focused regression fixtures in the existing `tests/legacy-census-status.test.mjs` (new routes, new overlay components, and shell/navigation drift). **6/6** fixtures passed against the exact committed pure `buildLegacyCensusStatus` function in an isolated V8 runner (source blob `83c97b865bdbf8b5374c64c88caf6360d8da0ed7`, test blob `d3e5584c3c02366de46195851749f344c85e991f`). **Node `node:test`, complete repository tests, browser and DB were not run in this audit session.**
- A *fresh* legacy-to-current source delta must still be supplied to the checker. The dated `oracle-drift-2026-10-27.json` file is historical and does not automatically know about changes landing on 30 October. The 27 newly seen dev-only workspace routes above were found by an independent live source-tree comparison, not by pretending the old drift input was current.

These are verification-tooling improvements only. They do not satisfy the UI inventory, functional, design or release gates for any page.
