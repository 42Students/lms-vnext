# Work packet (wave 2): edit src/modules/placements/recruiter-company-reports-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-022  [P2] GAP  facet F05  effort M
- Legacy: Reports table has `pagination={false}`; all own drives shown (`docs/legacy-source/frontend/src/pages/recruiter/company.js:122-122`)
- vNext now: SQL paginates 25 by default, 10/25/50 choices (`src/modules/placements/recruiter-company-reports-service.ts:143-166`)
- Fix: Document intentional scaling limit; ensure export/full totals reflect all authorized records.

## G2-13-001-043  [P2] GAP  facet F10  effort M
- Legacy: Reports GET `/api/v1/recruiter/colleges/{collegeId}/reports` (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:83-84`)
- vNext now: Server query `getRecruiterCompanyReports`; separate CSV route (`src/modules/placements/recruiter-company-reports-service.ts:60-108`)
- Fix: Map old `/reports` contract to route or adapt UI to new shape; preserve deep links.

## G2-13-001-048  [P2] GAP  facet F11  effort L
- Legacy: Reports driven by own drives for recruiter at one college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:97-104`)
- vNext now: All employer-relationship published/closed jobs can enter report (`src/modules/placements/recruiter-company-reports-service.ts:95-108`)
- Fix: Apply per-recruiter ownership if legacy parity is contractual; otherwise label all-company totals explicitly.

## G2-13-001-074  [P2] GAP  facet F19  effort M
- Legacy: Old reports table loads all drives with no pagination (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:97-104`)
- vNext now: New reports SQL LIMIT/OFFSET 25, maximum 50; no streaming (`src/modules/placements/recruiter-company-reports-service.ts:143-166`)
- Fix: Verify large-portfolio totals, exports and page transitions at 200+ drives.
