# chat-7 independent Super Admin Courses & Content audit

**18 October 2026 · Partial source audit, not deployment sign-off.** Audited the current `/admin/courses`, `/admin/courses/offerings/[offeringId]`, `/admin/assignments`, `/admin/quizzes` routes, `super-admin-course-bulk-visibility.tsx`, `super-admin-content-authoring.tsx`, the course bulk visibility service, and the exported `superAdminCourseBulkSchema`. Evidence limited to GitHub source review + authored regression: no real browser, database, or CI run.

| Surface | Verified source invariant | Adversarial test / current risk | Status |
|---|---|---|---|
| `/admin/courses` no acting college | Offers an explicit select-college state rather than querying another college's course workspace | Real account switch through CSRF and expired session | Code reviewed; **OPEN** integration |
| `/admin/courses` invalid filters | Strict `collegeCourseCatalogueQuerySchema.safeParse` and Clear filters recovery | Query parameter arrays, 1000+ page, injection payload, duplicate ID formatting | Reviewed; **OPEN** behavioural |
| `/admin/courses/offerings/[offeringId]` | Redirect on no acting scope, `resolveSuperAdminOfferingDetail` denies wrong-college offering before rendering authoring | Run wrong-college IDOR and stale acting-college session | Reviewed; **OPEN** integration |
| `/admin/assignments` | Invalid query and no-scope states explicit; uses `listCollegeAssessmentAggregate` rather than global summary | Verify authoring picker bound to acting college, POST and export tenant enforcement | Reviewed; **OPEN** DB |
| `/admin/quizzes` | Invalid/no-scope states explicit, results flag on listing; `listCollegeAssessmentAggregate` | Attempt to release results from another college and leak answer keys while open | Reviewed; **OPEN** DB |
| `SuperAdminContentAuthoring` | Lesson ID resolved from current acting-college list; `FacultyLessonAuthoring` keyed by lesson; private binary upload explicitly not available to admin without actual active membership | Swap college during upload/authoring and assert no stale private object or selection | Reviewed; **OPEN** interactive |
| `SuperAdminCourseBulkVisibility` | Newly keyed by college + current page’s visible course IDs; selected IDs filtered to current prop list on click, counts and checkbox | `SA-courses-visibility-01` · `tests/unit/chat7-superadmin-course-bulk-page-isolation.test.ts` | **Code fixed**, authored tests need CI |
| `bulkSuperAdminCourseVisibility` | Strict 1..25 UUID payload, confirmed=true; `resolveActingCollege(context,"courses.manage")`, tenant joins, only ACTIVE courses, bounded 500 lessons, scoped delegated lesson mutations | PG concurrent college switch/lesson deletion, mixed tenant IDs, bulk partial commit and notices | Existing code and schema reviewed; **OPEN** integration |

### Defect SA-courses-visibility-01

Bulk selection was kept in client state across acting-college, search/pagination, and course list changes. That could submit stale selected IDs from a prior page or selected college; backend prevented wrong-tenant writes, but the client could display misleading selection counts and fail operations after a valid college switch. Fixed by keyed instance remount in `AdminCourseOverview` and by filtering selection to the current visible course IDs before displaying or sending the bulk command. Commits `2ea0875`, `fc3c9e6`; behavioural/schema contract `chat7-superadmin-course-bulk-page-isolation.test.ts`.

### Critical remaining gates

- Live account matrix: Super Admin acting college A → college B during stale form/queued request; wrong-tenant course/lesson ID, deleted actor membership, expired session.
- No client call should use untrusted IDs without central `courses.manage` and exact acting-college predicates; compare SQL and API handlers with real two-tenant PostgreSQL fixtures.
- The 5 core views above do **not** constitute every Super Admin content/authoring page. Continue `/admin/lessons`, `/admin/videos`, `/admin/resources`, `/admin/live-classes`, `/admin/course-progress`, all sidebar and error/loading shells.
- Keyboard focus, overlay scroll, 320/375px responsive navigation, reduced motion, slow/retry states, and storage upload security await browser testing.

**Disposition: FAIL CLOSED for release until independent CI and DB review.**
