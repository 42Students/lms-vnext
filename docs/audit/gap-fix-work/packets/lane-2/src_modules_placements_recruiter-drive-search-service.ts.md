# Work packet: edit src/modules/placements/recruiter-drive-search-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md, docs/audit/gap2/lane-16/u013-job-search-dto.md, docs/audit/gap2/lane-17/job-search-controller.md

## G2-11-003-028  [P1] GAP  facet F05  effort L
- Legacy: Primary sort sent-back first then descending numeric job ID `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:126`
- vNext now: VNext default createdAt DESC; attention sorted only after page slice `src/modules/placements/recruiter-drive-search-service.ts:102`
- Fix: Sort openRequests first globally then legacy ID

## G2-11-003-030  [P1] GAP  facet F05  effort L
- Legacy: Legacy closed includes cancelled/rejected job lifecycle `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:124`
- vNext now: vNext SQL only PUBLISHED/CLOSED jobs, requests separately `src/modules/placements/recruiter-drive-search-service.ts:48`
- Fix: Reconcile rejected/cancelled published history

## G2-16-013-024  [P1] GAP  facet F11  effort L
- Legacy: JobSearchDTO.java:33-38 contains organizationId, collegeId, target department/program IDs.
- vNext now: recruiter-drive-search-service.ts:38-49 checks recruiter company/college relationship/owner.
- Fix: Align old organization scoping with new tenant/college and exact recruiter grants.

## G2-17-013-028  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:215-365 — GET popular/organizations/org/department/program/type/categories/category.
- vNext now: src/modules/placements/recruiter-drive-search-service.ts:14-111 — Single recruiter search view, no legacy route family.
- Fix: Provide mapping or remove obsolete endpoints with navigation audit.
