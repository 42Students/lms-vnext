# Work packet (wave 2): edit src/components/courses/learner-course-list.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u006-learner-courses.md, docs/audit/gap2/lane-3/course-search-controller.md, docs/audit/gap2/lane-3/student-course-controller.md

## G2-15-006-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy PageShell with ListingPageHeader, metric pills and inline right controls (CoursesContent.jsx:381-423,467-470)
- vNext now: VNext bare PageHeader and standalone filters, disclosures, badges above grid (learn/courses/page.tsx:125-131; learner-course-list.tsx:171-333)
- Fix: Restore legacy PageShell canvas/header/filter placement, maintain responsive shape

## G2-15-006-035  [P2] GAP  facet F09  effort M
- Legacy: Legacy metric pills with Popover Semester Details, All Courses and Credits Breakdown (CoursesContent.jsx:346-379,386-397)
- vNext now: VNext nested `Semester information` Disclosure with same section labels (`learner-course-list.tsx:304-332)
- Fix: Replace disclosures with compact anchored popovers; keep 100-row cap and overflow message

## G2-3-014-011  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:103-107`, `165-168`, `224-228`
- vNext now: `src/components/shell/topbar/command-search.tsx:54-68`, `src/components/courses/learner-course-list.tsx:42-43`
- Fix: Legacy defaults search limit15, popular10, department/category50; vNext learner suggestion limit6, command matches8 and learner course list page size48. Match per endpoint and menu caps.

## G2-3-014-016  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/CourseSearchService.js:14-19`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:103-109`
- vNext now: `src/components/shell/topbar/command-search.tsx:127-142`, `src/components/courses/learner-course-list.tsx:202-212`
- Fix: Legacy query max200 chars (400 on >200), defaults empty, limit15, optional deptId; vNext learner course list input max100 while command input has no stated maxLength. Align API and per-input limits, prevent overlong URLs.

## G2-3-025-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:381-423`
- vNext now: `src/components/courses/learner-course-list.tsx:171-231`
- Fix: Match the legacy header metric-pill/toolbar ordering; vNext puts semester and search in a persistent filter grid with additional controls.

## G2-3-025-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:489-565`
- vNext now: `src/components/courses/learner-course-list.tsx:342-488`
- Fix: Compare legacy image/title/instructor/credits simple card structure with vNext description/progress/next-due/action-rich cards and mark intentional extensions.

## G2-3-025-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:387-398`
- vNext now: `src/components/courses/learner-course-list.tsx:279-341`
- Fix: Restore the legacy semester, course-count and credits summary presentation (including popover trigger/icon), or record intentional visual redesign.

## G2-3-025-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:411-420`
- vNext now: `src/components/courses/learner-course-list.tsx:175-231`
- Fix: Legacy semester is inside a Filters popover and search is a header action; vNext puts both labels above inline native controls.

## G2-3-025-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:527-537`
- vNext now: `src/components/courses/learner-course-list.tsx:388-425`
- Fix: Use elective slot name on the card badge when present and render zero-credit value visibly (legacy shows 0 Credits; vNext falsey credits suppress badge).

## G2-3-025-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/StudentCoursesResponseDTO.java:52-85`
- vNext now: `src/components/courses/learner-course-list.tsx:44-85`
- Fix: Account for missing legacy slug and numeric course ID, isMandatory, electiveSlotName and electiveOfferingId in current card shape; vNext uses delivery UUID, progress and due fields.

## G2-3-025-016  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:294-307`
- vNext now: `src/components/courses/learner-course-list.tsx:165-169`
- Fix: Use the same safe credit calculation for invalid, missing and zero values; legacy excludes bad credits and shows warning.

## G2-3-025-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:282-291`
- vNext now: `src/components/courses/learner-course-list.tsx:137-151`
- Fix: Default ordering differs: legacy preserves ordered list with core before elective; vNext applies NAME sorting even before user selection.

## G2-3-025-020  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:417-420`
- vNext now: `src/components/courses/learner-course-list.tsx:202-214`
- Fix: Legacy search has no explicit 100-character maxLength at control; vNext Input maxLength=100. Confirm requirement, then align validation and communicated limit.

## G2-3-025-024  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:338-342`
- vNext now: `src/components/courses/learner-course-list.tsx:176-199`
- Fix: Legacy semester Select shows loading, no-results and disabled-while-refreshing state; vNext server-rendered options lack equivalent fetch control state.

## G2-3-025-025  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:248-255`
- vNext now: `src/components/courses/learner-course-list.tsx:180-190`
- Fix: Legacy switches asynchronously keeping previous cards until success; vNext changes client filter instantly within already-loaded deliveries.

## G2-3-025-032  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:327-379`
- vNext now: `src/components/courses/learner-course-list.tsx:300-340`
- Fix: Legacy metric pills open popovers (semester details, all courses, credits); vNext presents two Details disclosures and raw list/credits blocks.

## G2-3-025-033  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:411-414`
- vNext now: `src/components/courses/learner-course-list.tsx:171-200`
- Fix: Legacy Filters popover trigger uses selected semester name, vNext shows always-visible semester select; match opening and focus behavior.

## G2-3-025-036  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:73-81`
- vNext now: `src/components/courses/learner-course-list.tsx:378-380`
- Fix: Legacy clicking card dispatches a CourseID and optional classId selection before navigation; vNext navigates by delivery UUID without this selection side effect.

## G2-3-025-048  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:451-465`
- vNext now: `src/components/courses/learner-course-list.tsx:153-159`
- Fix: Legacy fallback notice and precise configuration error strings differ from vNext No courses found and setup-copy messaging.

## G2-3-025-053  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:425-449`
- vNext now: `src/components/courses/learner-course-list.tsx:341-344`
- Fix: Legacy uses aria-busy, aria-live Loading courses, role=alert for fatal load; vNext live result count/EmptyState does not cover initial server fetch.

## G2-3-025-054  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:546-560`
- vNext now: `src/components/courses/learner-course-list.tsx:361-380`
- Fix: Legacy unavailable card is a nonlink aria-disabled div; vNext Unavailable article is inert but every normal read-only period card remains navigable. Validate focus/access policy.

## G2-3-025-056  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:527-528`
- vNext now: `src/components/courses/learner-course-list.tsx:389-394`
- Fix: Legacy elective badge is slot name (fallback Elective); vNext always renders Elective.

## G2-3-025-057  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:451-463`
- vNext now: `src/components/courses/learner-course-list.tsx:153-159`
- Fix: Use exact legacy empty/configuration copy and semester fallback text or document deliberate deviation.
