# Work packet (wave 2): edit src/app/api/placements/jobs/[jobId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/placement-job-service.md

## G2-17-012-029  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:292-311 — Legacy PUT /{jobId} updates Job.
- vNext now: src/app/api/placements/jobs/[jobId]/route.ts:35-50 — vNext PATCH per-job update, different payload schema.
- Fix: Provide adapted request shape for legacy clients and UI.
