# Work packet (wave 2): edit src/modules/courses/learner-course-card-search-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/course-search-controller.md

## G2-3-014-031  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:103-129`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-189`
- vNext now: `src/modules/courses/college-course-catalogue-service.ts:24-38`, `src/modules/courses/learner-course-card-search-model.ts:3-15`
- Fix: Legacy cache loads active courses once and uses exact/prefix/fuzzy/ranking, whereas vNext SQL/live local rows match substring and sort name/code. Restore weighted result order where legacy user-visible.

## G2-3-014-033  [P2] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:68-84`
- vNext now: `src/modules/courses/learner-course-card-search-model.ts:3-15`
- Fix: Legacy synonym map 16 acronyms e.g cs, dsa, dbms, oop, prog; vNext no synonym expansion in local search. Port exact map and field weights.

## G2-3-014-047  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:99-163`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-189`
- vNext now: `src/modules/courses/learner-course-card-search-model.ts:3-15`
- Fix: Legacy >200 query returns error, null/blank yields popular globally, scoped blank yields first N; vNext blank yields all loaded assigned and max100 truncation in card search. Preserve intended defaults distinctly by role.
