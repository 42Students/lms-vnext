# Work packet (wave 2): edit src/modules/courses/college-faculty-picker-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/faculty-search-controller.md

## G2-19-013-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy search suggestions bounded `limit=15` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:80-93`
- vNext now: vNext full admin directory has paging/search and faculty picker max500 `src/components/admin/admin-scoped-read-page.tsx:184-200` `src/modules/courses/college-faculty-picker-service.ts:9-32`
- Fix: Add autocomplete top15 mode without breaking paged management view.

## G2-19-013-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy `GET /popular` exposes popularity list `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:173-189`
- vNext now: vNext picker alphabetical displayName, not popularity-ranked `src/modules/courses/college-faculty-picker-service.ts:17-32`
- Fix: Provide scoped popular suggestions if legacy consumer requires.

## G2-19-013-017  [P2] GAP  facet F06  effort M
- Legacy: Legacy `limit` default15 for search and 10 popular, 50 college/department/type `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:85-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:173-179` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:219-238`
- vNext now: vNext admin pages use configurable pageSize and faculty picker hard cap500 `src/components/admin/admin-scoped-read-page.tsx:184-200` `src/modules/courses/college-faculty-picker-service.ts:9-32`
- Fix: Validate and normalize endpoint-specific page/limit defaults.

## G2-19-013-029  [P2] GAP  facet F10  effort L
- Legacy: Legacy `GET /popular`, `/colleges`, `/college/{id}`, `/department/{id}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:173-247`
- vNext now: vNext only selected-college faculty list and picker `src/app/(authenticated)/admin/faculty/page.tsx:14-44` `src/modules/courses/college-faculty-picker-service.ts:12-33`
- Fix: Implement required variant readers or document deprecation.

## G2-19-013-047  [P2] GAP  facet F16  effort M
- Legacy: Legacy limit15 search suitable autocomplete `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:83-93`
- vNext now: vNext admin directory card layout/page sizes and picker capped500 `src/modules/courses/college-faculty-picker-service.ts:9-32` `src/components/admin/admin-scoped-read-page.tsx:184-200`
- Fix: Add compact typeahead list with scroll and keyboard when needed.

## G2-19-013-055  [P2] GAP  facet F20  effort M
- Legacy: Legacy popularity `recordUsage(facultyId)` can be called multiple times `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:309-325`
- vNext now: vNext no equivalent usage mutation in scoped read/picker `src/modules/admin-ui/super-admin-scoped-people-service.ts:10-12` `src/modules/courses/college-faculty-picker-service.ts:12-33`
- Fix: If popular suggestions kept, add rate-limited usage tracking.

## G2-19-013-057  [P2] GAP  facet F21  effort M
- Legacy: Legacy FacultySearchCache GenericSearchCache with synonyms, popularity and refresh `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchCache.java:24-34` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchCache.java:67-99`
- vNext now: vNext SQL directory, picker and filters rather than generic in-memory cache `src/modules/admin-ui/super-admin-scoped-people-service.ts:10-12` `src/modules/courses/college-faculty-picker-service.ts:9-33`
- Fix: Document substitution and feature parity matrix per endpoint.

## G2-19-013-027  [P3] GAP  facet F09  effort M
- Legacy: Legacy selection is POST event, not confirmation `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:309-325`
- vNext now: vNext faculty picker read-only list for course creation `src/modules/courses/college-faculty-picker-service.ts:12-33`
- Fix: Track selection only after actual user selection if popular ranking desired.
