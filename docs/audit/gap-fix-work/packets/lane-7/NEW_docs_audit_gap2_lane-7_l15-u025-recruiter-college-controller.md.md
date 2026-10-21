# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/l15-u025-recruiter-college-controller.md

15 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l15-u025-recruiter-college-controller.md

## G2-15-025-002  [P1] GAP  facet F01  effort L
- Legacy: LBE/controller/RecruiterCollegeController.java:71-75 GET `/overview` returns college summary with recruiter privacy and counts.
- vNext now: V/app/(authenticated)/hr/home/page.tsx:75-129 shows activity/drive state; V/modules/placements/recruiter-company-overview-model.ts:8-26 counts own company drives only.
- Fix: Restore privacy-banded college overview as a separate authorized read view.

## G2-15-025-008  [P1] GAP  facet F04  effort L
- Legacy: LBE/controller/RecruiterCollegeController.java:129-159: id,roleTitle,status,canResubmit,declined,note,ctc,requestedAt,description,location,minCgpa,branches,passingYears,driveMode,ctcLpa/fixed/variable/bonus/stipend,jobType,jdUrl,deadline,lifecycle.
- vNext now: V/db/schema/placement-drive-requests.ts:19-40 status, draft jsonb, decisionNote/sourceJob/approvedJob; V/modules/placements/recruiter-drive-request-service.ts:94-164 returns request object.
- Fix: Build recruiter request response projection for every listed field including salary and eligibility details.

## G2-15-025-009  [P1] GAP  facet F04  effort L
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:62-113 returns collegeName, studentsTotal rounded, byBranch, cgpaBands verified, cgpaBasedOn, asOf.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:21-26 returns active,closed,total,recent drives.
- Fix: Separate college demographics aggregate from drive summary and preserve asOf timestamp.

## G2-15-025-013  [P1] GAP  facet F06  effort L
- Legacy: LBE/dto/tpo/DriveForm.java:15-55 fields jobTitle, companyName/logo/id, jobDescription, jdUrl, location, driveMode, registration details, roleOptions, eligibility, rounds, deadline, seasonId.
- vNext now: V/modules/placements/recruiter-drive-request-model.ts:5-10 strict collegeId+submissionId+sourceJobId+hrDriveDraftSchema.
- Fix: Provide explicit field-by-field DTO map and unambiguous defaults for imported legacy drafts.

## G2-15-025-024  [P1] GAP  facet F10  effort L
- Legacy: LBE/controller/RecruiterCollegeController.java:71-75 calls requireCollege capability COLLEGE_OVERVIEW then overview service.
- vNext now: V/app/(authenticated)/hr/home/page.tsx:49-75 grant-scoped Today, V/modules/placements/recruiter-company-overview-model.ts:8-26 portfolio totals.
- Fix: Add scoped non-identifying demographic query returning legacy fields.

## G2-15-025-025  [P1] GAP  facet F10  effort L
- Legacy: LBE/controller/RecruiterCollegeController.java:84-89 writes legacy Job request via driveService.createRequest.
- vNext now: V/modules/placements/recruiter-drive-request-service.ts:94-164 inserts separate placementRecruiterDriveRequests row, may auto-approve draft job.
- Fix: Plan migration from Job lifecycle REQUEST/SENT_BACK into new request row preserving ID backlinks.

## G2-15-025-026  [P1] GAP  facet F10  effort M
- Legacy: LBE/controller/RecruiterCollegeController.java:93-100 PUT calls resubmitRequest(jobId,...), likely mutates same Job entity.
- vNext now: V/modules/placements/recruiter-drive-request-service.ts:166-213 PATCH updates request JSON and lifecycle, immutable request ID.
- Fix: Map legacy job id to new request id and approvedJobId without loss of edit history.

## G2-15-025-050  [P1] MISSING  facet F20  effort M
- Legacy: LBE/service/tpo/RecruiterCollegeOverviewService.java:48-50 Math.round(n / 5.0) *5, integer counts.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:21-26 no rounding concept.
- Fix: Implement exact nearest5 rounding including ties and small-group withholding.

## G2-15-025-051  [P1] GAP  facet F21  effort M
- Legacy: LBE/controller/RecruiterCollegeController.java:84-101 TpoDriveService.createRequest/resubmit integrates college approval and notifications.
- vNext now: V/modules/placements/recruiter-drive-request-service.ts:122-163 evaluates trusted grant, approval settings and may auto-create a draft, sends TPO bell.
- Fix: Cross-check no-auto-publish behavior and approval policy; preserve TPO ownership.

## G2-15-025-052  [P1] GAP  facet F21  effort L
- Legacy: LBE/controller/RecruiterCollegeController.java:71-75 overviewService depends on learner academic & placement metrics.
- vNext now: V/modules/placements/recruiter-company-overview-model.ts:8-26 own job portfolio only.
- Fix: Restore read-only aggregation and query-time privacy gate separate from drive pipeline.

## G2-15-025-053  [P1] GAP  facet F22  effort L
- Legacy: LBE/controller/RecruiterCollegeController.java:129-159 own requests are Job entities with JSON roleOptions and eligibility.
- vNext now: V/db/schema/placement-drive-requests.ts:19-70 separate placement_recruiter_drive_requests JSON draft, related to optional sourceJobId/approvedJobId.
- Fix: Migrate old requests to typed request rows with lifecycle and legacy Job ID mapping.

## G2-15-025-017  [P2] GAP  facet F07  effort S
- Legacy: LBE/controller/RecruiterCollegeController.java:103-109 missing recruiter company `Your account has no company yet. Please contact the placement cell`.
- vNext now: V/modules/placements/recruiter-drive-request-service.ts:24-31,53-56 typed FORBIDDEN.
- Fix: Show specific missing employer identity message separate from revoked grant.

## G2-15-025-019  [P2] GAP  facet F07  effort M
- Legacy: LBE/controller/RecruiterCollegeController.java:172-182 IllegalArgumentException 400/404 and IllegalStateException 409 with `{error:message}`.
- vNext now: V/app/api/placements/recruiter/drives/requests/route.ts:10-17 typed JSON `{error:CODE}` incl 409.
- Fix: Map exact legacy human-readable validation errors for UI while preserving structured codes.

## G2-15-025-021  [P2] GAP  facet F08  effort S
- Legacy: LBE/controller/RecruiterCollegeController.java:113-125 labels five statuses Draft, Sent for review, Live, Completed, Cancelled.
- vNext now: V/modules/placements/recruiter-drive-request-model.ts:29-31 DRAFT label Approved — awaiting publication, REQUEST/SENT_BACK Sent for review.
- Fix: Implement exact five status labels for request + published job composite, avoid status collisions.

## G2-15-025-020  [P3] GAP  facet F08  effort S
- Legacy: LBE/controller/RecruiterCollegeController.java:84-101 request create returns 201 full view; resubmit returns 200 full view, no toast text.
- vNext now: V/app/api/placements/recruiter/drives/requests/route.ts:29-38 returns 201/200 replay, PATCH request object.
- Fix: Ensure recruiter UI success wording distinguishes create/resubmit/replayed POST.
