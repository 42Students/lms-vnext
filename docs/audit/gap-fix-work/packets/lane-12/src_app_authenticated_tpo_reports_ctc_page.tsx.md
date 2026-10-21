# Work packet: edit src/app/(authenticated)/tpo/reports/ctc/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-13-031-087  [P1] GAP  facet F04  effort M
- Legacy: Legacy package bands <4, 4–6, 6–10, 10–20, 20+ LPA. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:137-160`
- vNext now: vNext accepted full-time distribution in INR. `src/app/(authenticated)/tpo/reports/ctc/page.tsx:94-120`
- Fix: Map exact band boundaries after INR conversion.
