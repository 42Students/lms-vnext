# Work packet: edit drizzle/0022_placements_p6a_screening.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u021-application-screening-entity.md

## G2-13-021-049  [P1] GAP  facet F22  effort M
- Legacy: Legacy MySQL application_screening int PK FK, double score, JSON skills/exclusions/metadata, version/method and timestamp. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:18-146`
- vNext now: vNext PG manual screening status/decision columns only. `src/db/schema/placements.ts:1114-1166`, `drizzle/0022_placements_p6a_screening.sql:1-27`
- Fix: Define separate auto_score table and migration if retaining old results.
