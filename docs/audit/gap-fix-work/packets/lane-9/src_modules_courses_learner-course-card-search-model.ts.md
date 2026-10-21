# Work packet: edit src/modules/courses/learner-course-card-search-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/course-search-controller.md

## G2-3-014-012  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-189`, `294-352`
- vNext now: `src/modules/courses/learner-course-card-search-model.ts:3-15`, `src/modules/courses/college-course-catalogue-service.ts:24-38`
- Fix: Legacy global super search expands synonyms and fuzzy spell distance2, exact/prefix weighted scores 100/80/60/40 plus usage boost; vNext substring matching or SQL ILIKE. Implement legacy ranking pipeline for autocomplete.
