# Work packet: edit src/components/shell/topbar/command-search.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/course-search-controller.md

## G2-3-014-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:31-36`, `99-107`, `165-168`
- vNext now: `src/components/shell/topbar/command-search.tsx:18-35`, `99-110`
- Fix: Legacy search accessible via `/api/v2/courses/search`, popular and course header autocomplete; vNext header command search loads authorized learner courses and search destinations, no v2 general search endpoint. Provide parity course search for permitted roles.

## G2-3-014-018  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:269-303`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-112`
- Fix: Legacy POST course selection by numeric ID or validated slug increments usage for popularity; vNext Enter/click navigates but does not invoke selection recording. Add authorized server mutation and call once per successful selection.

## G2-3-014-025  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:269-303`, `353-362`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-112`, `src/modules/courses/college-course-catalogue-service.ts:41-65`
- Fix: Legacy two POST selection routes update in-memory usageCounts; POST refresh rebuilds index from DB. No corresponding vNext post-search side effects. Create authorization-checked usage store and refresh semantics.

## G2-3-014-028  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:59-97`, `111-157`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:12-22`, `src/components/shell/topbar/command-search.tsx:32-53`
- Fix: Legacy non-super users scoped by college, org super by org, global super across all, learner scope fallback, department check on deptId; vNext catalogue only COLLEGE_ADMIN and learner suggestions only assigned. Add role-aware search service, no global leakage.

## G2-3-014-029  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:175-190`, `199-222`
- vNext now: `src/components/shell/topbar/command-search.tsx:32-53`
- Fix: Legacy popular/departments check authentication and filtered college/allowed departments, vNext learner preload alone does not implement faculty/admin popular lists. Enforce tenant and actor permission.

## G2-3-014-055  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:269-303`, `353-362`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-112`
- Fix: Legacy course-selection usage tracking, cache refresh and popular suggestions omitted from vNext; no deliberate removal reason established. Implement or document owner-approved exclusion.

## G2-3-014-019  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:108-114`
- vNext now: `src/components/shell/topbar/command-search.tsx:35-51`, `127-142`
- Fix: Legacy exact overlong error `Query length must not exceed 200` and unauthenticated `Authentication required`; vNext apiFetch preload catches errors to courseError, no equivalent inline error. Map exact feedback.

## G2-3-014-020  [P2] MISSING  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:258-261`, `285-294`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-110`
- Fix: Legacy forbidden category `Department not in scope` and invalid slug `Invalid slug`/resolver reason; vNext command search uses validated delivery IDs but lacks analogous endpoint/error message.

## G2-3-014-021  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:160-163`, `187-189`, `221-222`
- vNext now: `src/components/shell/topbar/command-search.tsx:145-224`
- Fix: Legacy Response message `Courses retrieved in Nms`, `Popular courses retrieved`, `Departments retrieved`; vNext command dropdown shows no API success message. Keep API diagnostics if recreating endpoint.

## G2-3-014-022  [P3] MISSING  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:277-281`, `300-303`, `353-362`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-112`
- Fix: Legacy selection returns `Selection recorded`, refresh returns `Cache refreshed`; vNext has no selection/cache action feedback. Keep server response semantics.
