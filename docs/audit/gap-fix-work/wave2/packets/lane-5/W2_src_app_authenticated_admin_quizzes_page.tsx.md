# Work packet (wave 2): edit src/app/(authenticated)/admin/quizzes/page.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-quiz-controller.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-3/superadmin-quizzes.md

## G2-2-022-001  [P2] GAP  facet F01  effort M
- Legacy: AdminQuizController.java:38-43 GET /api/v1/admin/quizzes
- vNext now: src/app/(authenticated)/admin/quizzes/page.tsx:15-62 server-rendered directory, no /api/admin/quizzes/route.ts
- Fix: Map old oversight endpoint or expose equivalent documented API.

## G2-2-022-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy Quizzes.js:85-121 side-by-side course, lesson selector, create builder modal
- vNext now: src/app/(authenticated)/admin/quizzes/page.tsx:51-59 create control followed by list
- Fix: Clone original toolbar/create modal integration and course/lesson layout.

## G2-3-005-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:493-522`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:51-59`
- Fix: Restore legacy course-filter / divider / creation / table order rather than header-inline-creator-FilterBar-record list.

## G2-3-005-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:604-625`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:43-60`
- Fix: Render builder and submissions as centered overlay siblings, not inline expanding content.

## G2-3-005-006  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:564-574`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:51-53`
- Fix: Restore DownloadOutlined and text Export CSV (page) plus loading/empty disabling.

## G2-3-005-034  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-260`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:62-65`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:39-42`; `src/modules/courses/college-assessment-aggregate-service.ts:128-178`
- Fix: Check selected-college draft/faculty-owner coverage and legacy 20/page API response vs aggregate JOIN.

## G2-3-005-043  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:576-605`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:36-59`
- Fix: Restore ListSkeleton/TableSkeleton same count and stale-data on reload, with Retry.

## G2-3-004-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:1-32`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:1-61`
- Fix: Legacy embeds Quizzes inside `ln-module admin-list-page` with PageShell title/tabs; vNext page has broader top header, introduction, and export link. Match wrapper/gutter/heading placement.

## G2-3-004-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:10-22`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:32-35`
- Fix: With no selected college, legacy shows warning Alert (icon/margin-bottom 16), vNext shows EmptyState plus PageHeader. Replace empty-state with exact warning UI.

## G2-3-004-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:23-29`; `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:24-29`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:51-60`
- Fix: Legacy content inside PageShell `Courses & Content` group, vNext separately renders PageHeader and listing. Preserve one tab strip and legacy visual heading.

## G2-3-004-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:493-521`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:52-59`; `src/components/courses/admin-assessment-read-directory.tsx:34-62`
- Fix: Legacy places simple course filter before divider + creation selectors; vNext creation panel precedes a six-field FilterBar. Reorder to exact legacy hierarchy.

## G2-3-004-006  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:13-18`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:32-35`
- Fix: Restore warning icon and tone for unselected college, not passive empty screen.

## G2-3-004-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:553-574`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:52-58`
- Fix: Use `Create quiz` with Plus icon and `Export CSV (page)` with Download icon, not unlabeled generic `Export` and unqualified inline creator.

## G2-3-004-016  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:535-558`
- vNext now: `src/components/courses/college-quiz-create.tsx:100-130`; `src/app/(authenticated)/admin/quizzes/page.tsx:54-59`
- Fix: Legacy requires separate course and course-dependent lesson before enabling create modal; vNext inline authoring has different flow/visibility.

## G2-3-004-025  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:217-259`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:39-42`; `src/modules/courses/college-assessment-aggregate-service.ts:128-178`
- Fix: Legacy admin API returns 20/page scoped quizzes; vNext direct Drizzle aggregate 25/page and filters with richer joins. Verify parity of draft visibility and faculty ownership.

## G2-3-004-027  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:43-74`; `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:98-112`
- vNext now: `src/app/(authenticated)/admin/layout.tsx:6-14`; `src/app/(authenticated)/admin/quizzes/page.tsx:25-31`
- Fix: Legacy unauthorized login form/error toast in SuperAdminLayout; vNext redirects to dashboard at layout, page-level access error likely unreachable. Compare authentication UX.

## G2-3-004-032  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:168-215`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:585-605`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:36-50`
- Fix: Legacy 8-row skeleton + stale data refresh alert; new settled Promise error state has no data fallback. Add skeleton/retry while retaining actual list if available.

## G2-3-004-033  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:10-22`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:32-35`
- Fix: No scope is warning, not empty record state; differentiate missing college from zero quiz results.

## G2-3-004-039  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:10-20`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:32-35`
- Fix: Alert warning is announced as warning with icon, EmptyState is not; restore live region/alert role for no scope.

## G2-2-022-064  [P3] GAP  facet F23  effort S
- Legacy: AdminQuizController.java:103 Response success message
- vNext now: src/app/(authenticated)/admin/quizzes/page.tsx:51-60 no same response wrapper
- Fix: Translate for old API consumer compatibility.
