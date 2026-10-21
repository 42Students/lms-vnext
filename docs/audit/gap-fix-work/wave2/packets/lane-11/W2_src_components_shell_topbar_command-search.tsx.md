# Work packet (wave 2): edit src/components/shell/topbar/command-search.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/course-search-controller.md

## G2-3-014-002  [P2] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/CourseSearchService.js:14-28`, `34-96`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:41-65`, `src/components/shell/topbar/command-search.tsx:35-53`
- Fix: Legacy offers 11 specific v2 routes (search, popular, departments, department/{id}, categories, category, select, slug-select, stats, exists, refresh). vNext scattered SQL catalogue/learner fetch lack equivalent surface. Map each route explicitly.

## G2-3-014-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:53-60`, `560-573`
- vNext now: `src/components/shell/topbar/command-search.tsx:19-25`, `32-35`
- Fix: Legacy hides course search for TPO, recruiter and learner placement pages; vNext topbar still renders command search with portal-specific config, course suggestions only learner. Validate visibility and no inappropriate course prompts.

## G2-3-014-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:584-643`, `644-704`
- vNext now: `src/components/shell/topbar/command-search.tsx:114-145`
- Fix: Legacy header autocomplete groups `Recent` and `Popular` suggestions when empty then `Search Results` when typing; vNext combines learner course results with workspace commands in PopoverListbox. Restore groups/order per portal.

## G2-3-014-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:596-643`
- vNext now: `src/components/shell/topbar/command-search.tsx:54-68`, `145-224`
- Fix: Legacy suggestion cards display courseName and department Tag under Recent/Popular; vNext learner course suggestion uses courseName/courseCode/sectionName, no department name. Add legacy secondary label.

## G2-3-014-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:644-696`
- vNext now: `src/components/shell/topbar/command-search.tsx:54-61`
- Fix: Legacy typing shows loading spinner during debounce/network and `No courses found` when empty; vNext does one preload and local filter, with courseError flag. Align spinner and empty suggestion text.

## G2-3-014-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:708-741`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-112`
- Fix: Legacy selecting one course saves recent list and calls popularity record; vNext routes to delivery directly and omits Recent/Poular group and recorded selection feedback. Recreate side effects without leaking IDs.

## G2-3-014-009  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchDTO.java:19-26`, `44-53`
- vNext now: `src/components/shell/topbar/command-search.tsx:12-12`, `41-47`
- Fix: Legacy DTO exposes id,slug,courseName,shortTitle,deptId,deptName,active,enabled; vNext suggestion row has deliveryId,courseName,courseCode,sectionName. Include shortTitle and department in authorized projection.

## G2-3-014-011  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:103-107`, `165-168`, `224-228`
- vNext now: `src/components/shell/topbar/command-search.tsx:54-68`, `src/components/courses/learner-course-list.tsx:42-43`
- Fix: Legacy defaults search limit15, popular10, department/category50; vNext learner suggestion limit6, command matches8 and learner course list page size48. Match per endpoint and menu caps.

## G2-3-014-016  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/CourseSearchService.js:14-19`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:103-109`
- vNext now: `src/components/shell/topbar/command-search.tsx:127-142`, `src/components/courses/learner-course-list.tsx:202-212`
- Fix: Legacy query max200 chars (400 on >200), defaults empty, limit15, optional deptId; vNext learner course list input max100 while command input has no stated maxLength. Align API and per-input limits, prevent overlong URLs.

## G2-3-014-023  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:596-643`, `644-704`
- vNext now: `src/components/shell/topbar/command-search.tsx:114-145`
- Fix: Legacy Ant autocomplete popover has Recent/Popular/Search Results groups; vNext generic command PopoverListbox mixes commands and course hits, keyboard controls differ. Match ordering, opening and close behavior.

## G2-3-014-024  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:704-741`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-112`
- Fix: Legacy selection jumps to role-specific course route, clears search and options; vNext submit can navigate first matching command when no learner course, otherwise destination fallback. Ensure role-expected navigation and reset.

## G2-3-014-026  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:708-741`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-112`
- Fix: Legacy successful click persists deduped 10 most recent courses in browser, by slug/id; vNext no recent-course store. Add scoped recent history with safe session policy and matching cap.

## G2-3-014-032  [P2] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:194-218`, `256-261`
- vNext now: `src/components/shell/topbar/command-search.tsx:54-61`
- Fix: Legacy popular ordering is in-memory usage count descending, selection increments counter; vNext suggests first six assigned courses in loader order, not popularity. Store and rank popularity.

## G2-3-014-034  [P2] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:56-57`, `285-303`
- vNext now: `src/components/shell/topbar/command-search.tsx:54-61`
- Fix: Legacy MAX_SLUG_LENGTH64 with CourseSlugResolver validation, vNext uses UUID deliveryId. For legacy deep links, provide slug lookup/redirect with format checks.

## G2-3-014-035  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:644-704`
- vNext now: `src/components/shell/topbar/command-search.tsx:23-51`
- Fix: Legacy async search displays spinner, clears stale response on error and no-results label; vNext preloads full learner list once and sets courseError but no inline retry in topbar. Add recovery and loading parity.

## G2-3-014-036  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:111-114`, `195-198`
- vNext now: `src/components/shell/topbar/command-search.tsx:35-53`
- Fix: Legacy unauthenticated GET search/departments explicitly 401; vNext preload errors fall back to command search. Avoid false no-result, signal auth vs network error.

## G2-3-014-041  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:704-741`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-112`, `134-142`
- Fix: Legacy AutoComplete onSelect acts on a selected item; vNext Enter always chooses first matching course or command (not necessarily focused listbox option). Make Enter select focused item and return focus after dismissal.

## G2-3-014-042  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:596-643`, `683-685`
- vNext now: `src/components/shell/topbar/command-search.tsx:114-145`
- Fix: Literal legacy labels Recent, Popular, Search Results and No courses found differ from workspace command list labels. Recreate when course mode active.

## G2-3-014-044  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:46-56`, `93-129`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:65-73`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:41-65`, `src/components/shell/topbar/command-search.tsx:32-53`
- Fix: Legacy cache preloads every active course on app start and can refresh in-memory; vNext per-request SQL catalogue plus one learner preload. Compare latency and authorization under multi-college scale before choosing cache.

## G2-3-014-046  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Global/Header/Header.js:644-704`
- vNext now: `src/components/shell/topbar/command-search.tsx:32-53`, `54-68`
- Fix: Legacy debounced requests use monotonically increasing sequence so stale answers cannot overwrite new search; vNext preloads once with cancel boolean and filters locally. Preserve latest-result-wins when adding remote search.

## G2-3-014-048  [P2] MISSING  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:256-261`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-112`
- Fix: Legacy usageCounts increment on repeated selection, no dedupe beyond recent list; vNext no usage updates. Implement atomic count with contention/expiry strategy.
