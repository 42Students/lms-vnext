# Work packet: edit src/app/(authenticated)/admin/placements/screenings/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u021-application-screening-entity.md

## G2-13-021-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy score visible in job application sorting/details. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ApplicationScreeningRepository.java:16-26`
- vNext now: vNext admin Screening Queue page shows pending/held/rejected decisions, not skill score. `src/app/(authenticated)/admin/placements/screenings/page.tsx:4-9`
- Fix: Provide read-only assessment details if retained.
