# Work packet (wave 2): edit src/modules/people/college-faculty-csv-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-15-027-051  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkFacultyRegisterRequest.java:20-28 JSON bulk list max 500
- vNext now: src/modules/people/college-faculty-csv-service.ts:10-42 CSV 5 headers and 500 cap
- Fix: Accept/convert old JSON bulk payload or document deliberate CSV-only format.
