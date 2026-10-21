# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/screenings/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u021-application-screening-entity.md

## G2-13-021-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy screens sorted by overall score after job/org/version filter. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ApplicationScreeningRepository.java:23-45`
- vNext now: vNext status-filtered decision queue. `src/app/(authenticated)/admin/placements/screenings/page.tsx:7-9`
- Fix: Match score columns/sort in applicant list, not decision queue.

## G2-13-021-035  [P2] GAP  facet F13  effort M
- Legacy: Legacy pending while async scoring not yet processed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:37-38`
- vNext now: vNext PENDING means awaiting manual review. `src/app/(authenticated)/admin/placements/screenings/page.tsx:4-9`
- Fix: Differentiate Pending automation vs Pending human.

## G2-13-021-043  [P2] GAP  facet F18  effort M
- Legacy: Legacy labels COMPLETED/FAILED as auto screening outcomes. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:31-35`
- vNext now: vNext labels Pending/Hold/Rejected manual outcomes. `src/app/(authenticated)/admin/placements/screenings/page.tsx:4-9`
- Fix: Clarify automatic vs human labels.
