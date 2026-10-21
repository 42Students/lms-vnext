# Work packet: edit src/modules/placements/recruiter-team-drive-count-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-054  [P1] GAP  facet F12  effort M
- Legacy: Legacy team drive count includes all nondeleted jobs created by each colleague (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:85-91`)
- vNext now: New counts only recruiter-visible jobs and special approved request attribution (`src/modules/placements/recruiter-team-drive-count-service.ts:11-58`)
- Fix: Match all-owned count or rename metric to clearly state published visible attributed jobs.
