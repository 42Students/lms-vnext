# Work packet: edit drizzle/0024_placements_p6c_results.sql

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-009  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/RoundResult.java:24-71 — Long/Integer IDs; outcome, rank, Double score, reason, comment, source, submitter, timestamps
- vNext now: drizzle/0024_placements_p6c_results.sql:1-22 — UUID IDs; version; score_percent integer; candidate_message/internal_comment; status enum
- Fix: Specify exhaustive old-to-new field crosswalk; preserve comment confidentiality

## G2-12-022-059  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/RoundResult.java:36-58 — score Double, nullable category/comment, source string
- vNext now: drizzle/0024_placements_p6c_results.sql:6-15,28-37 — score_percent int 0..100, reason enum and constrained source
- Fix: Define rounding, legacy source→TPO/HR/IMPORT mapping, and reject overflow explicitly
