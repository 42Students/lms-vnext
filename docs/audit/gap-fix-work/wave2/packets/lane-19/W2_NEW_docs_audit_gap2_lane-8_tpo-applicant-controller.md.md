# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-8/tpo-applicant-controller.md

14 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/tpo-applicant-controller.md

## G2-8-023-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy base path /api/v1/tpo/drives/{jobId}/applicants with GET main list (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:17-44).
- vNext now: New /tpo/placements/jobs/{jobId}/applicants-pipeline reads scoped page model (src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:18-50).
- Fix: Preserve drive Applicants deep-link/navigation from existing URLs.

## G2-8-023-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy separate GET /not-applied and POST /remind-not-applied (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:46-56).
- vNext now: New main pipeline's empty state links to #drive-registered-not-applied (src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:121-125); preview/remind handled by separate service (src/modules/placements/tpo-remind-not-applied-service.ts:46-95).
- Fix: Keep visible Registered, not applied tab and clear direct entry from Applicants.

## G2-8-023-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy has POST apply-on-behalf/{learnerId} and POST add-students (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:58-82).
- vNext now: New bulk drive additions through separate scoped bulk-drive service (src/modules/placements/bulk-drive-service.ts:362-407).
- Fix: Wire single and bulk Add to drive entry actions into applicant panel.

## G2-8-023-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy service declares Applicants tab, bulk Move/Reject, Not applied+Remind, Apply on behalf (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:19-21).
- vNext now: New pipeline displays PageHeader, count tiles, filter form, bulk panel, grid and pagination (src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:50-135).
- Fix: Compare subsection order and restore legacy Not applied/Apply controls where missing.

## G2-8-023-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy bulk move is action labelled Move to..., restricted Shortlisted/Test/Interview (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:47-57).
- vNext now: New bulk options split Shortlist for review, Move to test, Move to interview (src/components/tpo/tpo-bulk-action-panel.tsx:156-159).
- Fix: Preserve stage labels and distinguish screening shortlist from application stage.

## G2-8-023-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy JobApplication list returns entity containing learner/job details (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:40-44).
- vNext now: New pipeline shows student and role label, count by persisted states (src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:46-60,110-127).
- Fix: Create explicit field mapping (learner ID, job, role, source, status, dates) for parity.

## G2-8-023-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy add students response added,skipped,results[{learnerId,outcome,message}] (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:88-119).
- vNext now: New returns results and counts, membershipId not learnerId (src/modules/placements/bulk-drive-service.ts:362-405).
- Fix: Map IDs/outcome labels and per-row reason for predictable import results.

## G2-8-023-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy not-applied list filters eligible registered PLACEMENTS latest choice and not applied (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:67-113).
- vNext now: New pipeline filters by stage, channel, eligibility, flag, submittedWithin (src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:47-49,73-104).
- Fix: Keep registered+eligible+not-applied filter as first-class list independent of submission filters.

## G2-8-023-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy single apply on behalf path learnerId no request body (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:58-68).
- vNext now: New bulk add enforces selected roleOptionId and membershipId array (src/modules/placements/bulk-drive-service.ts:362-370).
- Fix: Offer single-click Apply on behalf using same normalized bulk contract.

## G2-8-023-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy single apply on behalf fails if added==0 with first result.message (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:62-67).
- vNext now: New existing application returns skipped outcome; client must show per-row reason (src/modules/placements/bulk-drive-service.ts:151-159,252-259).
- Fix: Ensure single-row failure is visible, not falsely reported as overall success.

## G2-8-023-057  [P2] GAP  facet F18  effort M
- Legacy: Legacy Add outcome text Added, Already on this drive, Debarred from drives, Not eligible for this drive (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:52-60,104-108).
- vNext now: New may show Drive eligibility requirements not met, already application status (src/modules/placements/bulk-drive-service.ts:151-159,261-269).
- Fix: Map precise, distinct legacy reason strings to business-readable UI wording.

## G2-8-023-058  [P2] GAP  facet F18  effort M
- Legacy: Legacy bulk move label Students can be moved only to Shortlisted, Test or Interview (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:53-57).
- vNext now: New options Shortlist for review / Move to test / Move to interview (src/components/tpo/tpo-bulk-action-panel.tsx:156-159).
- Fix: Do not conflate selected status with screening shortlist, preserve exact labels where contract unchanged.

## G2-8-023-064  [P2] GAP  facet F20  effort M
- Legacy: Legacy reminders use UTC-now deadline check plus 20-hour DB window (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:118-125).
- vNext now: New uses IST-day key and JS Date comparison of actual deadline (src/modules/placements/tpo-remind-not-applied-service.ts:41-51,63-85).
- Fix: Test midnight timezone collisions and simultaneous clicks from two TPOs.

## G2-8-023-067  [P2] GAP  facet F21  effort M
- Legacy: Legacy TpoAuditService records APPLICANTS_MOVED, APPLICANTS_NOT_SELECTED, APPLICANTS_MOVE_UNDONE (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoApplicantController.java:90-114).
- vNext now: New per-row activity + PLACEMENTS_BULK_RUN summary in batch service (src/modules/placements/tpo-bulk-action-confirm-service.ts:97-115).
- Fix: Preserve analytics/audit taxonomy query compatibility.
