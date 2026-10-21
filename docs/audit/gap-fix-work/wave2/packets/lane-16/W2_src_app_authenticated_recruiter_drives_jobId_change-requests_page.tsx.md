# Work packet (wave 2): edit src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md

## G2-16-025-001  [P2] GAP  facet F01  effort M
- Legacy: RecruiterChangeRequestController.java:20-28 recruited own college/drives requests at /api/v1/recruiter/colleges/{collegeId}.
- vNext now: recruiter/drives/[jobId]/change-requests/page.tsx:10-24 route scoped to jobId, back link.
- Fix: Preserve college-specific drill-in and page label under recruiter Drives.

## G2-16-025-003  [P2] GAP  facet F02  effort L
- Legacy: DriveChangeRequestService.java:27-35 institutional and company requests in one drive Discussion timeline.
- vNext now: recruiter/drives/[jobId]/change-requests/page.tsx:17-24 dedicated Change requests page and messages per request.
- Fix: Keep unified company thread events and deep links, not isolated request-only feed.
