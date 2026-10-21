# Work packet (wave 2): edit src/modules/academics/semester-copy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-5-025-055  [P2] GAP  facet F18  effort M
- Legacy: Legacy HTTP error text `Failed to ... Please try again or contact support.`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:130-155,193-210`
- vNext now: vNext shows short `Semester was not created/updated/deleted` client fallback. `src/modules/academics/semester-copy.ts:11-23`, `src/app/api/academics/semesters/route.ts:18-24`
- Fix: Use original fallback guidance and backend-specific safe errors.
