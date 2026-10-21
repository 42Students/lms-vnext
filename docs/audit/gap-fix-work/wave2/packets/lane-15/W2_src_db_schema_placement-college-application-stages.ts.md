# Work packet (wave 2): edit src/db/schema/placement-college-application-stages.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md

## G2-10-011-083  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:13-40,89-109 — job_application keyed by numeric ID with learner+job unique, status, notes, rejection and offer letter columns.
- vNext now: src/db/schema/placements.ts:850-1100; src/db/schema/placement-college-application-stages.ts:5-35 — Normalized UUID applications, stage/history tables and offers; non-identical field ownership.
- Fix: Create field-level mapping for all statuses/notes/offers and preserve unique learner/job constraints.
