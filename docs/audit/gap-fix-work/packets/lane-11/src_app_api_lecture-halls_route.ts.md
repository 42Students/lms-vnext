# Work packet: edit src/app/api/lecture-halls/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md

## G2-14-013-032  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET search uses cache.search(query,min(limit,200)), filters in JVM after search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:76-94`
- vNext now: New GET invokes Drizzle SQL filters, sort and limit `src/app/api/lecture-halls/route.ts:14-22` `src/modules/academics/lecture-hall-service.ts:175-234`
- Fix: Preserve relevant match ranking while performing tenant-safe DB filtering

## G2-14-013-027  [P3] GAP  facet F08  effort S
- Legacy: Legacy search success message Lecture halls retrieved `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:93-94`
- vNext now: New endpoint returns data without success message `src/app/api/lecture-halls/route.ts:14-22`
- Fix: Use legacy text only for old API adapter
