# Work packet: edit src/app/(authenticated)/tpo/settings/public-page/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-placements-page-controller.md

## G2-17-022-029  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:29-32 — K-anonymity MIN_GROUP=5 for students/offers.
- vNext now: src/app/(authenticated)/tpo/settings/public-page/page.tsx:50-55 — Minimum recorded cohort of five + privacy suppressed metric.
- Fix: Distinguish cohort threshold from per-stat suppression.
