# Work packet: edit src/modules/placements/recruiter-drive-request-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md

## G2-12-025-034  [P1] GAP  facet F12  effort M
- Legacy: Legacy group records one Job per college, lifecycle status from createRequest. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:50-85`
- vNext now: vNext request statuses REQUEST,SENT_BACK,DRAFT,REJECTED,CANCELLED, autoapprove policy. `src/modules/placements/recruiter-drive-request-model.ts:12-31`
- Fix: Create status mapping and review autoapproval semantics.

## G2-12-025-051  [P1] GAP  facet F22  effort M
- Legacy: Legacy DriveForm contains job, company, pay/eligibility/rounds and college/group ties. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:14-49`
- vNext now: vNext HR draft nested structured shape inside placementRecruiterDriveRequests. `src/modules/placements/recruiter-drive-request-model.ts:5-10`
- Fix: Field-by-field DriveForm to HrDriveDraft transform and validation.

## G2-12-025-018  [P2] GAP  facet F07  effort M
- Legacy: Legacy null drive form throws `A drive form is required`; handler maps IllegalArgumentException to 404. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:49-50`
- vNext now: vNext Zod strict invalid input; 400/422 via central API. `src/modules/placements/recruiter-drive-request-model.ts:5-10`
- Fix: Use field-level required message and appropriate 400 rather than misleading 404.
