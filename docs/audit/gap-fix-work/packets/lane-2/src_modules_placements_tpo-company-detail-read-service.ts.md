# Work packet: edit src/modules/placements/tpo-company-detail-read-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md

## G2-11-007-066  [P1] GAP  facet F12  effort M
- Legacy: Legacy no company detail if neither recruiter lead nor job; job-only details accepted. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:392`
- vNext now: vNext name memory based on grouped jobs/leads; canonical detail requires active college relationship. `src/modules/placements/tpo-company-detail-read-service.ts:30`
- Fix: Keep job-only legacy memory route available, never force canonical-company association.
