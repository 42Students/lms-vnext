# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l11-u026-public-bug-tracker-controller.md

8 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u026-public-bug-tracker-controller.md

## G2-11-026-003  [P2] GAP  facet F02  effort M
- Legacy: REST JSON Spring ResponseEntity; list returns Page with content, totalElements, pageable (PublicBugTrackerController.java:37-47).
- vNext now: NextResponse JSON of custom service page, not Spring Page (issues/route.ts:19-25).
- Fix: Map list response shape and pagination contract for old frontend callers.

## G2-11-026-006  [P2] GAP  facet F04  effort M
- Legacy: PublicId LMS-%04d based on row id (BugTrackerService.java:71-74).
- vNext now: LMS- plus 64-bit random decimal, padded >=4 (report-service.ts:18-22).
- Fix: Retain stable externally sharable IDs; decide whether sequential format strict requirement or privacy improvement.

## G2-11-026-008  [P2] GAP  facet F05  effort M
- Legacy: List caps size1..100; clamps negative page to0; sort ASC if requested else DESC (BugTrackerService.java:83-99).
- vNext now: Strict query parser rejects unknown keys/duplicates; cursor style beforeCreatedAt/beforeId (issues-api-query.ts:2-20).
- Fix: Provide equivalent size/page clamp semantics or explicit pagination adapter.

## G2-11-026-009  [P2] GAP  facet F06  effort M
- Legacy: POST @Valid body using @NotBlank and max lengths reporter120 role32 env32 page120 screen120 section120 type80 description4000 severity32 evidence1000 (BugReportCreateRequest.java:9-28).
- vNext now: Strict Zod lengths largely match, but reporterName/type limited to option lists (report-input-model.ts:6-20).
- Fix: Document stricter reporter/type pickers, preserve max lengths and trim validation.

## G2-11-026-020  [P2] GAP  facet F10  effort M
- Legacy: Activity GET returns chronological workflowService.listActivity (PublicBugTrackerController.java:58-62; BugTrackerWorkflowService.java:152-158).
- vNext now: No /activity API; detail service supports cursor query for timeline (issues/[publicId]/route.ts:23-32).
- Fix: Expose authorized chronological activity list or documented cursor conversion.

## G2-11-026-028  [P2] GAP  facet F13  effort S
- Legacy: Tracker service page clamps page/size rather than 400 (BugTrackerService.java:87-99).
- vNext now: Strict parser returns 400 INVALID_REQUEST for invalid query (issues/route.ts:21-22).
- Fix: Choose explicit adaptation for legacy invalid pagination.

## G2-11-026-035  [P2] GAP  facet F18  effort M
- Legacy: Exact API error texts 'Issue not found', 'Invalid screenshot file name', 'Only PNG, JPEG and WebP screenshots are supported' (BugTrackerService.java:114-120; BugTrackerAttachmentService.java:156-180).
- vNext now: No attachment endpoint and generic JSON `INVALID_REQUEST` (issues/route.ts:21-22).
- Fix: Expose actionable equivalents and exact validation strings.

## G2-11-026-036  [P2] GAP  facet F19  effort M
- Legacy: Sorted by createdAt direction DESC default, JPA Page size20 default (PublicBugTrackerController.java:37-46; BugTrackerService.java:83-99).
- vNext now: Cursor queries beforeCreatedAt/beforeId; strict limit/query (issues-api-query.ts:1-20).
- Fix: Preserve stable descending order, 20 default, count/seek semantics with adapter.
