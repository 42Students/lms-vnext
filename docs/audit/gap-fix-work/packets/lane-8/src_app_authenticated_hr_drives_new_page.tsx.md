# Work packet: edit src/app/(authenticated)/hr/drives/new/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-new.md, docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md

## G2-11-004-003  [P1] GAP  facet F01  effort S
- Legacy: Legacy source request missing/error rendered distinct Result `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:114`
- vNext now: Invalid source/not-owned job sends global notFound `src/app/(authenticated)/hr/drives/new/page.tsx:57`
- Fix: Restore request-not-found state and back link

## G2-11-004-066  [P1] GAP  facet F10  effort M
- Legacy: GET college overview for branches and approximate student counts `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:139`
- vNext now: Reads college branches but no approximate eligible population `src/app/(authenticated)/hr/drives/new/page.tsx:24`
- Fix: Restore rounded student count in preview

## G2-11-004-084  [P1] GAP  facet F13  effort M
- Legacy: Overview suggestions failure alert with Retry suggestions `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:349`
- vNext now: Backend branch read used in SSR, no independent retry `src/app/(authenticated)/hr/drives/new/page.tsx:24`
- Fix: Allow manual eligibility with warning and retry

## G2-12-025-002  [P1] MISSING  facet F01  effort M
- Legacy: Legacy GET `/drive-groups` and `/{groupId}` for recruiter own college copies. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:53-61`
- vNext now: vNext own requests fetched from placementRecruiterDriveRequests, no drive-group read equivalent. `src/app/(authenticated)/hr/drives/new/page.tsx:83-92`, `src/modules/placements/recruiter-drive-request-service.ts:94-110`
- Fix: Expose historical group/linkage data or migrate to request list.

## G2-11-004-051  [P2] GAP  facet F07  effort S
- Legacy: Source lookup failure title We couldn't load that drive `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:307`
- vNext now: Throws/notFound from source lookup `src/app/(authenticated)/hr/drives/new/page.tsx:58`
- Fix: Use retryable lookup Result separate from 404
