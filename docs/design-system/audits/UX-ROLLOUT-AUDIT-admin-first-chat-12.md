# UX rollout cross-audit: /admin first third (chat-12)

Date: 2026-10-18. Reviewer: chat-12, independent of original /admin author. Scope: first **37 of 111** documented `/admin` routes, in the order of `docs/orchestrator/ui-ux/pages-admin.md`. This is a route-source cross-review, **not** an end-to-end UX certification.

## Findings

| Page no. | Page | Finding ID / status | Severity | Evidence (route source) | Required further check |
|---:|---|---|---|---|---|
| 1 | `/admin/academics` | — / source-only | — | `src/app/(authenticated)/admin/academics/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 2 | `/admin/academics/sections/[sectionId]` | — / source-only | — | `src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx:1` | Deep link protected by scoped resolver plus redirect/notFound; verify descendant component states |
| 3 | `/admin/announcements` | — / source-only | — | `src/app/(authenticated)/admin/announcements/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 4 | `/admin/assignments` | — / source-only | — | `src/app/(authenticated)/admin/assignments/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 5 | `/admin/attendance` | UX-ADMIN12-04 / fixed | MAJOR | `src/app/(authenticated)/admin/attendance/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 6 | `/admin/audit` | — / source-only | — | `src/app/(authenticated)/admin/audit/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 7 | `/admin/batch-promotion` | — / source-only | — | `src/app/(authenticated)/admin/batch-promotion/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 8 | `/admin/batches` | — / source-only | — | `src/app/(authenticated)/admin/batches/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 9 | `/admin/batches/[batchId]/students` | — / source-only | — | `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 10 | `/admin/classes` | — / source-only | — | `src/app/(authenticated)/admin/classes/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 11 | `/admin/colleges` | — / source-only | — | `src/app/(authenticated)/admin/colleges/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 12 | `/admin/colleges/[collegeId]` | — / source-only | — | `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 13 | `/admin/colleges/[collegeId]/admins` | — / source-only | — | `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 14 | `/admin/colleges/[collegeId]/admins/[userId]` | — / source-only | — | `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 15 | `/admin/colleges/[collegeId]/admins/[userId]/history` | — / source-only | — | `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx:1` | Invalid page uses ErrorState; check focus and return navigation |
| 16 | `/admin/colleges/[collegeId]/branding` | — / source-only | — | `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 17 | `/admin/colleges/[collegeId]/readiness` | — / source-only | — | `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 18 | `/admin/colleges/[collegeId]/signin` | — / source-only | — | `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 19 | `/admin/colleges/[collegeId]/subdomain` | — / source-only | — | `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 20 | `/admin/colleges/[collegeId]/verification` | — / source-only | — | `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 21 | `/admin/companies` | — / source-only | — | `src/app/(authenticated)/admin/companies/page.tsx:1` | Search uses ErrorState and PageHeader; confirm company actions avoid duplicate writes |
| 22 | `/admin/companies/[companyId]/drives` | — / source-only | — | `src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 23 | `/admin/course-progress` | — / source-only | — | `src/app/(authenticated)/admin/course-progress/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 24 | `/admin/courses` | — / source-only | — | `src/app/(authenticated)/admin/courses/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 25 | `/admin/courses/offerings/[offeringId]` | — / source-only | — | `src/app/(authenticated)/admin/courses/offerings/[offeringId]/page.tsx:1` | Deep link protected by scoped resolver plus redirect/notFound; verify descendant component states |
| 26 | `/admin/departments` | — / source-only | — | `src/app/(authenticated)/admin/departments/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 27 | `/admin/domains` | — / source-only | — | `src/app/(authenticated)/admin/domains/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 28 | `/admin/electives` | — / source-only | — | `src/app/(authenticated)/admin/electives/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 29 | `/admin/faculty` | — / source-only | — | `src/app/(authenticated)/admin/faculty/page.tsx:1` | Delegates directory and actions to AdminScopedReadPage; inspect delegated component on browser |
| 30 | `/admin/faculty-assignment` | — / source-only | — | `src/app/(authenticated)/admin/faculty-assignment/page.tsx:1` | Delegates directory and actions to AdminScopedReadPage; inspect delegated component on browser |
| 31 | `/admin/features` | — / source-only | — | `src/app/(authenticated)/admin/features/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 32 | `/admin/features/[collegeId]` | — / source-only | — | `src/app/(authenticated)/admin/features/[collegeId]/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 33 | `/admin/features/[collegeId]/history` | — / source-only | — | `src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 34 | `/admin/features/[collegeId]/students/[membershipId]` | — / source-only | — | `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 35 | `/admin/features/[collegeId]/students/[membershipId]/history` | — / source-only | — | `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |
| 36 | `/admin/features/[collegeId]/trace` | — / source-only | — | `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:1` | Large trace uses DataTable; verify mobile column reachability and keyboard |
| 37 | `/admin/hr` | — / source-only | — | `src/app/(authenticated)/admin/hr/page.tsx:1` | Page source opened and checked for shared UI, route-level scope and explicit states; child controls remain to inspect |

The four route-level wrappers for Faculty, Faculty Assignments, section detail and course offering detail intentionally delegate UI to `AdminScopedReadPage`, `AcademicsSectionPage` and `AdminOfferingLearningPage`; absence of a direct `@/components/ui/` import at the page boundary is **not** itself a shared-kit violation. The sampled scoped detail routes redirect without college scope and use a scope resolver before rendering; this is a positive source finding, not proof of an authenticated browser session.

## Second-pass source findings and changes

| Finding | Severity | Reproduction from source | Repair | Evidence |
|---|---|---|---|---|
| UX-ADMIN12-04 | MAJOR, fixed | `/admin/attendance?month=not-a-month` reaches `indiaAttendanceMonthWindow`, which throws a raw `Error`. The page formerly forwarded `query.month` unvalidated whenever a delivery was selected; invalid repeated/search-derived input could crash the server render instead of showing a recovery path. | Validate YYYY-MM at the page boundary after tenant-scope check and before the admin attendance query. Show an accessible `ErrorState` with a safe reset link. Does not touch the service's authoritative IST window. | `588f0542`, `tests/unit/chat12-admin-first-third-cross-audit.test.ts` (source-order regression only). |
| UX-ADMIN12-05 | PASS, source-only | `/admin/academics` checks the selected-college scope before fetching `getAcademicsWorkspace`; no-scope path is an explicit `EmptyState` with a next step. | None. | `chat12-admin-first-third-cross-audit.test.ts` |
| UX-ADMIN12-06 | PASS, source-only | `/admin/colleges` validates query state before collecting tenant directories and derives per-row access with `canManageCollegeDirectoryRow`; mobile table actions retain Tenant setup, Branding and Readiness links. | None. | Same test |
| UX-ADMIN12-07 | PASS, source-only | `/admin/companies` returns `ErrorState` for unsupported query values, warns when a college safety scope restricts apparently global results. | None. | Same test |
| UX-ADMIN12-08 | PASS, source-only | `/admin/features/[collegeId]` checks college UUID and repeated-scope parameters, relies on scoped read service before tracing learner access. | None. | Same test |
| UX-ADMIN12-09 | PASS, source-only | `/admin/colleges/[collegeId]/admins/[userId]/history` handles invalid page filters without querying, shows empty-state copy and labels history IST. | None. | Same test |

This second pass verifies six key page boundaries **in source only**; it does not fill remaining 37-route browser, descendant and input-state coverage. No viewport, keyboard, PostgreSQL or full test runner was available through the connected GitHub checkout.

## Cross-cutting verification gaps

| Finding ID | Severity | Evidence | Required fix or check |
|---|---|---|---|
| UX-ADMIN12-01 | MINOR / assurance gap | Route-source checks cannot establish no page overflow at 320/360/390px, proper focus trap/return, screen-reader announcements, on-screen keyboard geometry, reduced-motion and hidden-scroll cues. | Run full viewport, keyboard, screen-reader and offline tests on every relevant interactive descendant before sign-off. |
| UX-ADMIN12-02 | MINOR / assurance gap | Dynamic child dialogs, cards and row actions were not exhaustively traversed from every first-third route; no browser session or authenticated database was available. | Trace every rendered child against the 21-point UX rubric, verify legacy wording, behavior of loading/partial/error/denied/stale states, and double-submit/CSRF paths. |
| UX-ADMIN12-03 | RELEASE GATE, not attributed code fault | This pass could inspect only repository sources through GitHub; no browser, local `next` build or PostgreSQL harness was available. | Require independent runtime proof and CI before marking all 37 routes PASS. |

### Correctness and evidence limitations

The first source scan found no demonstrated blocker or major; the follow-up inspection found and fixed the malformed attendance-month major (UX-ADMIN12-04), and does not invent defects in a component that has not been executed. The original author and the parent /admin team must still verify UI primitives and nested dialog content; a route shell alone cannot prove the accessibility, scroll-motion, legacy copy or permission matrix end-to-end. All paths above were sourced from the route manifest; no live behavior was observed. The audit's 21 checks plus the excellence checklist remain **partially verified**, not complete.

**Verdict: FAIL / browser and nested-component acceptance pending.** Confirmed code findings: BLOCKER **0**, MAJOR **1 fixed**, MINOR **0**, NIT **0**. Three assurance items are explicitly listed above rather than being misrepresented as code defects. Fixed blocker/major from this /admin slice: **1** (malformed attendance month). The three riskiest unverified areas are live tenant isolation on admin mutations, keyboard/dialog behavior, and mobile DataTable overflow under large results.

TPO-specific proven blockers found during this review are tracked separately in `docs/audit/defects-chat-12.md`. The TPO component directive fixes are on branch `chatgpt/chat-12-b`; no edits to /admin-owned components were attempted without a proven finding.
