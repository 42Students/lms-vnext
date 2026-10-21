# Work packet (wave 2): edit drizzle/0024_placements_p6c_results.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-058  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/RoundResult.java:20-72 — round_result bigint id, integer FKs and nullable timestamps; superseded_by ID
- vNext now: drizzle/0024_placements_p6c_results.sql:1-22,48-57 — UUID FKs, version and enum status, superseded_at
- Fix: Record migration disposition of old result IDs and superseded_by relational chain
