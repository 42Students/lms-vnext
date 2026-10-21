# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/l15-u025-recruiter-college-controller.md

14 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l15-u025-recruiter-college-controller.md

## G2-15-025-001  [P2] GAP  facet F01  effort M
- Legacy: LBE/controller/RecruiterCollegeController.java:34-42 recruiter portal nested `/api/v1/recruiter/colleges/{collegeId}`.
- vNext now: V/app/(authenticated)/hr/home/page.tsx:42-75 and V/app/(authenticated)/hr/drives/page.tsx:43-69 use selected college query parameters.
- Fix: Document route relocation, preserve multi-college authorized selection.

## G2-15-025-003  [P2] GAP  facet F01  effort M
- Legacy: LBE/controller/RecruiterCollegeController.java:77-101 GET/POST/PUT `/drive-requests` nested under college.
- vNext now: V/app/api/placements/recruiter/drives/requests/route.ts:19-38 GET/POST/PATCH with collegeId query/body.
- Fix: Map original request create/resubmit routes to new CRUD actions and typed payload.

## G2-15-025-004  [P2] GAP  facet F02  effort M
- Legacy: LBE/controller/RecruiterCollegeController.java:71-81 GET overview then recruiter own requests.
- vNext now: V/app/(authenticated)/hr/home/page.tsx:130-150 Today greeting/action queue; V/app/(authenticated)/hr/drives/page.tsx:101-120 drives tab and discussion proposals section.
- Fix: Place aggregated college context on recruiter view before requests, preserving portal hierarchy.

## G2-15-025-006  [P2] GAP  facet F03  effort M
- Legacy: LBE/controller/RecruiterCollegeController.java:112-159 returns canResubmit, declined, noteFromPlacementCell, salary breakdown, JD URL/deadline.
- vNext now: V/app/(authenticated)/hr/drives/page.tsx:69-88 requests combined in All/Waiting/Closed tabs; V/modules/placements/recruiter-drive-request-model.ts:29-31 legacy label approximation.
- Fix: Render each distinct legacy action/flag/field in request row/card.

## G2-15-025-007  [P2] MISSING  facet F03  effort M
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:37-38 labels Below 6; 6 to 7; 7 to 8; 8 to 9; 9 and above.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:21-26 no CGPA bands.
- Fix: Add exact five band labels with privacy suppressions.

## G2-15-025-010  [P2] GAP  facet F04  effort M
- Legacy: LBE/controller/RecruiterCollegeController.java:148-169 role option selects FIRST from JSON and maps salary details; malformed JSON yields null.
- vNext now: V/db/schema/placement-drive-requests.ts:33-35 draft jsonb object, data normalized under hrDriveDraftSchema.
- Fix: Map first role option from draft and tolerate absent legacy malformed options.

## G2-15-025-012  [P2] MISSING  facet F05  effort M
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:65-82 by-branch ordered rounded count DESC.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:21-26 recent drives slice3; no branch list.
- Fix: Return by-branch ranked count with MIN_GROUP=10.

## G2-15-025-016  [P2] GAP  facet F06  effort M
- Legacy: LBE/dto/tpo/DriveForm.java:13-14 ignores unknown JSON fields.
- vNext now: V/modules/placements/recruiter-drive-request-model.ts:5-10 strictObject and hrDriveDraftSchema.
- Fix: Document intentional rejection of extra payloads, guard legacy saved client drafts with mapping.

## G2-15-025-033  [P2] GAP  facet F12  effort M
- Legacy: LBE/controller/RecruiterCollegeController.java:113-125 lifecycle REQUEST/SENT_BACK/DRAFT/REJECTED/CANCELLED/CLOSED to five labels.
- vNext now: V/modules/placements/recruiter-drive-request-model.ts:12-31 statuses REQUEST,SENT_BACK,DRAFT,REJECTED,CANCELLED, no published LIVE/CLOSED on request row.
- Fix: Join approvedJobId to published placementJobs and map Live/Completed accurately.

## G2-15-025-035  [P2] GAP  facet F13  effort S
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:95-104 small CGPA samples produce no cgpaBands and null based-on.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:21-26 overview lacks both fields.
- Fix: Render privacy-safe omitted-band explanation, not fake zero if sample below threshold.

## G2-15-025-036  [P2] GAP  facet F13  effort S
- Legacy: LBE/controller/RecruiterCollegeController.java:103-109 missing linked company yields actionable 400.
- vNext now: V/app/(authenticated)/hr/drives/page.tsx:62-67 empty state `No active college access`; create service FORBIDDEN.
- Fix: Separate no-company vs no-grant vs suspended errors.

## G2-15-025-040  [P2] GAP  facet F15  effort M
- Legacy: LBE/controller/RecruiterCollegeController.java:84-101 request/resubmit delegates to TpoDriveService notifications.
- vNext now: V/modules/placements/recruiter-drive-request-service.ts:59-92 notifies active TPO users in-app on NEW/UPDATED/CANCELLED and recruiter on autoapproval.
- Fix: Map legacy notify recipients and condition on college policy, avoid duplicate bells after retries.

## G2-15-025-044  [P2] GAP  facet F18  effort S
- Legacy: LBE/controller/RecruiterCollegeController.java:112-125 exact labels Draft/Sent for review/Live/Completed/Cancelled.
- vNext now: V/modules/placements/recruiter-drive-request-model.ts:29-31 shows Approved — awaiting publication for DRAFT.
- Fix: Restore five statuses at list boundary; preserve more granular status in tooltip if needed.

## G2-15-025-045  [P2] GAP  facet F18  effort S
- Legacy: LBE/controller/RecruiterCollegeController.java:103-109 exact missing company message.
- vNext now: V/app/(authenticated)/hr/drives/page.tsx:62-67 generic access empty notice.
- Fix: Show `Your account has no company yet. Please contact the placement cell`.
