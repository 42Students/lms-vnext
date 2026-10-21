# Work packet (wave 2): edit src/modules/placements/recruiter-drive-request-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-new.md, docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md

## G2-11-004-115  [P2] GAP  facet F21  effort S
- Legacy: Plan drive POST synchronous, no background job UI `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:269`
- vNext now: Create request persisted in transaction, auto approval optional `src/modules/placements/recruiter-drive-request-service.ts:94`
- Fix: Confirm notify lifecycle and publish policy

## G2-12-025-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy recruiter plan POST `/api/v1/recruiter/plan-drive`, session bound one college. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:16-26,47-51`
- vNext now: vNext recruiter/HR Request a drive page chooses authorized grant, POST via placement requests service. `src/app/(authenticated)/hr/drives/new/page.tsx:26-66`, `src/modules/placements/recruiter-drive-request-service.ts:94-110`
- Fix: Bridge route/body and selected-college semantics.

## G2-12-025-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy groups sorted latest groupId DESC, copies sorted college name. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:110-143`
- vNext now: vNext recruiter request list separate, not sorted by legacy group ID. `src/modules/placements/recruiter-drive-request-service.ts:94-110`
- Fix: Implement creation DESC tie-break and college-scoped grouping.

## G2-12-025-027  [P2] GAP  facet F10  effort M
- Legacy: Legacy other college skips don't abort group; collects skippedReason. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:70-85`
- vNext now: vNext one college request per POST; no skip-college list. `src/modules/placements/recruiter-drive-request-service.ts:94-110`
- Fix: Explicitly show single-college limitation and optional cross-college batch flow.

## G2-12-025-031  [P2] GAP  facet F11  effort M
- Legacy: Legacy per-college recruiter capability DRIVE_REQUEST required. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:71-79`
- vNext now: vNext verifies effective DRIVES capability, linked company and active user. `src/modules/placements/recruiter-drive-request-service.ts:34-56`
- Fix: Map capability names/verification and 403 result.

## G2-12-025-049  [P2] GAP  facet F21  effort M
- Legacy: Legacy uses RecruiterService API and college overview, JdUpload. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:10-14`
- vNext now: vNext own-request service and college branch suggestions instead. `src/app/(authenticated)/hr/drives/new/page.tsx:19-24`, `src/modules/placements/recruiter-drive-request-service.ts:94-153`
- Fix: Map overview/rounds/JD metadata sources.
