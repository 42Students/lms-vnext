# Work packet (wave 2): edit src/app/api/admin/faculty/bulk-import/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-15-027-037  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:186-197 POST bulk-register per-row response
- vNext now: src/app/api/admin/faculty/bulk-import/route.ts:7-18 POST CSV imported as JSON, no-store
- Fix: Map legacy bulk result counts and failed-item details into new report.
