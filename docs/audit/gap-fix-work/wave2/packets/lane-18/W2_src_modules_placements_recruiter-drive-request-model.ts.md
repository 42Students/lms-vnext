# Work packet (wave 2): edit src/modules/placements/recruiter-drive-request-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md

## G2-12-025-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy drive group status chip per college. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:53-61`
- vNext now: vNext request stage Sent for review / Approved awaiting publication. `src/modules/placements/recruiter-drive-request-model.ts:29-31`, `src/app/(authenticated)/hr/drives/new/page.tsx:100-109`
- Fix: Preserve recruiter-visible per-college request status labels.

## G2-12-025-014  [P2] GAP  facet F06  effort M
- Legacy: Legacy form required, optional collegeIds ignored. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:41-50`
- vNext now: vNext strict collegeId UUID, submissionId UUID, draft schema. `src/modules/placements/recruiter-drive-request-model.ts:5-10`
- Fix: Accept legacy field adapter but ignore spoofed colleges.

## G2-12-025-033  [P2] GAP  facet F12  effort M
- Legacy: Legacy explicitly ignores caller-supplied collegeIds; college from session. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:41-45`
- vNext now: vNext body-selected collegeId must match recruiter grant. `src/modules/placements/recruiter-drive-request-model.ts:5-10`
- Fix: Use trusted scope selection and reject rather than silently ignore foreign ID.

## G2-12-025-044  [P2] GAP  facet F18  effort M
- Legacy: Legacy error `A drive form is required`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:49-50`
- vNext now: vNext generic Zod fields and prose. `src/modules/placements/recruiter-drive-request-model.ts:5-10`
- Fix: Show exact helpful required-form string.
