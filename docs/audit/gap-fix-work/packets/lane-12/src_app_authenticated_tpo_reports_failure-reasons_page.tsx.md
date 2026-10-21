# Work packet: edit src/app/(authenticated)/tpo/reports/failure-reasons/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-13-031-090  [P1] GAP  facet F04  effort M
- Legacy: Legacy failure share denominator per applied round/branch result set. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:645-655`
- vNext now: vNext adverse event bars use event totals. `src/app/(authenticated)/tpo/reports/failure-reasons/page.tsx:99-111`
- Fix: Restore applied-result denominator and absent reason.
