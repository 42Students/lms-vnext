# Work packet: edit src/app/(authenticated)/tpo/reports/joining-status/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-13-031-089  [P1] GAP  facet F04  effort M
- Legacy: Legacy Joining columns count DISTINCT learners per company. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:638-644`
- vNext now: vNext headline joined-offer chart uses offer records. `src/app/(authenticated)/tpo/reports/joining-status/page.tsx:86-110`
- Fix: Deduplicate learners with multiple accepted offers.
