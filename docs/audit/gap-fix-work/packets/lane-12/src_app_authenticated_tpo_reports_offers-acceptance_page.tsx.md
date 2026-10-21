# Work packet: edit src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-13-031-088  [P1] GAP  facet F04  effort M
- Legacy: Legacy acceptance percent = accepted/(accepted+declined+expired), 1 decimal. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:626-635`
- vNext now: vNext accepted/(accepted+declined), whole percent. `src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx:98-105`
- Fix: Include expired and keep one decimal; test unanswered.
