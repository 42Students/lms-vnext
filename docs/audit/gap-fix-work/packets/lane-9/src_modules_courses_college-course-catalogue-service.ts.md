# Work packet: edit src/modules/courses/college-course-catalogue-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/course-search-controller.md

## G2-3-014-012  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-189`, `294-352`
- vNext now: `src/modules/courses/learner-course-card-search-model.ts:3-15`, `src/modules/courses/college-course-catalogue-service.ts:24-38`
- Fix: Legacy global super search expands synonyms and fuzzy spell distance2, exact/prefix weighted scores 100/80/60/40 plus usage boost; vNext substring matching or SQL ILIKE. Implement legacy ranking pipeline for autocomplete.

## G2-3-014-013  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:121-157`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:160-205`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:24-30`, `41-64`
- Fix: Legacy department/college-filtered search truncates scoped candidate list to limit BEFORE query substring filtering, potentially missing later matches; vNext filters before SQL limit. Preserve intended results, document fix to legacy truncation as deliberate parity exception.

## G2-3-014-025  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:269-303`, `353-362`
- vNext now: `src/components/shell/topbar/command-search.tsx:99-112`, `src/modules/courses/college-course-catalogue-service.ts:41-65`
- Fix: Legacy two POST selection routes update in-memory usageCounts; POST refresh rebuilds index from DB. No corresponding vNext post-search side effects. Create authorization-checked usage store and refresh semantics.

## G2-3-014-028  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:59-97`, `111-157`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:12-22`, `src/components/shell/topbar/command-search.tsx:32-53`
- Fix: Legacy non-super users scoped by college, org super by org, global super across all, learner scope fallback, department check on deptId; vNext catalogue only COLLEGE_ADMIN and learner suggestions only assigned. Add role-aware search service, no global leakage.

## G2-3-014-030  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:305-335`, `353-362`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:12-22`
- Fix: Legacy stats and refresh require super-admin, with global-versus-scoped stats; vNext has no matching command/API. Add `courses.stats` or super-admin privilege and cross-college restrictions.
