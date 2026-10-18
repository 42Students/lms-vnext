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


## 19 October 2026 — second Super Admin course-content source audit

Scope expanded to all principal directory pages: `/admin/courses`,
`/admin/lessons`, `/admin/videos`, `/admin/resources`,
`/admin/live-classes`, `/admin/assignments`, `/admin/quizzes`,
`/admin/course-progress`, and
`/admin/course-progress/students`. Also examined shared directory,
query and authoring models; no browser or database testing was performed.

| Route / model | Defect and corrected trust/UX boundary | Regression / status |
|---|---|---|
| `/admin/courses` | Duplicate course query used a permissive 36-character hex/hyphen matcher; array/unknown URL inputs could be coerced or ignored. Replaced with strict `parseSuperAdminCourseQuery` and proper UUID validation. | `SA-COURSES-QUERY-18`, `tests/unit/chat7-admin-courses-content-hardening.test.ts`; source fix on branch, test not run |
| `/admin/assignments` | Added explicit Super Admin denial to mirror quiz route; reject duplicated, unknown or quiz-only URL parameters. Assignment directory now loads separately from assignment-creation options. | `SA-COURSES-ASSESSMENT-16`, `tests/unit/chat7-admin-courses-assessment-boundaries.test.ts`; source fix, test not run |
| `/admin/quizzes` | Re-audited quiz-specific result-publication filtering, role/no-college states and independently failed creation options. Existing `parseSuperAdminQuizQuery` remains unweakened. | Same test cross-check, DB role and result embargo still OPEN |
| `/admin/videos`, `/admin/resources`, `/admin/live-classes` | Shared `SuperAdminContentDirectoryPage` previously let either optional authoring list or Section picker failure replace healthy selected-college content with a directory error. All three loads settle independently; directory failures still fail visibly, optional failures preserve content. | `SA-COURSES-CONTENT-17`, `tests/unit/chat7-admin-courses-content-hardening.test.ts`; source fix, tests not run |
| `/admin/lessons` | Reject duplicated/bad browser page parameters with `parseSuperAdminLearningQuery`; separately settle lesson directory, course/cohort filter picker and available creation paths. Only a failed directory shows a list error; read results remain visible during picker outage. | `SA-COURSES-CONTENT-AUDIT-03`, `tests/unit/chat7-admin-learning-directory-resilience.test.ts`; source fix, tests not run |
| `/admin/course-progress` | Same typed filter URL and independent course/cohort picker failure handling; statistics continue to disclose that per-offering distinct learner counts cannot be added. | `SA-COURSES-CONTENT-AUDIT-03` test; authored, not run |
| `/admin/course-progress/students` | Rechecked duplicate offeringId rejection, selected-college scoped service read, authorization error state and unknown-denominator semantics; no changes. | Source reviewed, PostgreSQL two-college and 500-row sentinel still OPEN |
| `effectiveCourseContentVisibleToStudents` | Rechecked published ancestry gate for content, lesson, learning path, offering and course; an unpublished ancestor reports Students Hidden. | `SA-COURSES-CONTENT-AUDIT-02` model regression |
| `bulkSuperAdminCourseVisibility` | Batch only changes already-published/active content. It does **not** create a persisted, inherited course-level visibility policy, so newly authored content can still be published visible. | `SA-academics-people-53` remains PARTIAL / OPEN; do not call it complete |
| `/admin/courses/offerings/[offeringId]` | Existing scope-checked offering builder navigation and central manage permission; course imagery upload and standalone grading modals remain incomplete. | `SA-academics-people-50/64/65` remain PARTIAL / OPEN |

The `/admin` parent layout already redirects any non-Super-Admin actor;
a child route gate is additional protection, not a replacement for persisted
course/college authorization. In particular, preservation of already-authorized
directory data must not be interpreted as permission to fall back to an
unscoped tenant during any service outage.

**Outstanding release and product blockers:** SA-50 scanned binary course imagery;
SA-53 inherited per-course Show/Hide state; SA-60 private SSRF-resistant video
ingestion; SA-64 submission grading and Publish all graded modal; SA-65 full quiz
builder modal; admin 320/375px keyboard/browser walkthrough, stale acting-college
switches, expired session, genuine two-tenant PostgreSQL fixtures, and strict
TypeScript/Vitest execution. The owner has postponed execution until all lanes
finish. Therefore this remains **SOURCE FIXED, NOT RUNTIME VERIFIED** and is
not a sign-off of the whole section.
