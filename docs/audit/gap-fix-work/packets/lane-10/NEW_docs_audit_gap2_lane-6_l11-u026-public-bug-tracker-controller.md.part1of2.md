# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l11-u026-public-bug-tracker-controller.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u026-public-bug-tracker-controller.md

## G2-11-026-001  [P1] GAP  facet F01  effort M
- Legacy: Public API base /api/v1/public/bug-tracker (PublicBugTrackerController.java:15-18).
- vNext now: Admin API /api/tracker/issues with request context (src/app/api/tracker/issues/route.ts:1-12).
- Fix: Document intentionally secured route; expose safe reporter intake if approved, without public manager writes.

## G2-11-026-005  [P1] MISSING  facet F04  effort M
- Legacy: Issue fields reporterName/accountRole/environment/page/screen/section/issueType/description/severity/evidenceLink/sourceUrl/sourcePath/browser/viewport (BugReportCreateRequest.java:9-40).
- vNext now: Zod report schema rejects extra sourceUrl/sourcePath/browser/viewport (report-input-model.ts:6-20); service saves only evidenceLink (report-service.ts:31-46).
- Fix: Accept validated legacy metadata (2000/500/500/64 max) and persist it.

## G2-11-026-007  [P1] GAP  facet F05  effort M
- Legacy: GET list accepts status/environment/reporter/search/page=0/size=20/sort=DESC (PublicBugTrackerController.java:37-46).
- vNext now: GET accepts status/severity/environment/q/sort/beforeCreatedAt/beforeId/limit (issues-api-query.ts:1-20).
- Fix: Support old filters or client adapter for reporter, search, zero-index page and size.

## G2-11-026-010  [P1] MISSING  facet F06  effort M
- Legacy: Source URL validates http/https with hostname; optional sourcePath/browser/viewport length limits (BugTrackerService.java:61-65,186-204).
- vNext now: Extra fields banned by Zod strict (report-input-model.ts:19-36).
- Fix: Add safe http(s) URL validation and field limits for browser/source metadata.

## G2-11-026-011  [P1] MISSING  facet F06  effort M
- Legacy: Presign request fileName<=255, contentType<=100, contentLength 1..8388608 (BugTrackerAttachmentPresignRequest.java:11-24).
- vNext now: No public attachment presign route in /api/tracker/issues tree (issues/[publicId]/route.ts:1-37).
- Fix: Add authorized upload negotiation with exact field validation.

## G2-11-026-012  [P1] MISSING  facet F06  effort M
- Legacy: Confirm storageKey<=700, originalFilename<=255 nonblank (BugTrackerAttachmentConfirmRequest.java:9-16).
- vNext now: No confirm API in issue-detail route tree (issues/[publicId]/route.ts:1-37).
- Fix: Add protected confirmation contract, verify key ownership and metadata.

## G2-11-026-016  [P1] GAP  facet F08  effort M
- Legacy: POST create returns HTTP200 with BugReportResponse object (PublicBugTrackerController.java:31-35).
- vNext now: POST returns HTTP201 with {issue:{publicId}} only (issues/route.ts:46-47; report-service.ts:55).
- Fix: Align full response metadata and status for legacy client compatibility.

## G2-11-026-018  [P1] MISSING  facet F09  effort M
- Legacy: No controller UI dialogs: attachment presign then PUT to URL then confirm (PublicBugTrackerController.java:64-76; BugTrackerAttachmentService.java:63-73,75-137).
- vNext now: Route has no attachment handshake, hence UI cannot complete same flow (issues/[publicId]/route.ts:10-37).
- Fix: Implement presign/confirm sequence and caller error/retry states.

## G2-11-026-021  [P1] MISSING  facet F10  effort M
- Legacy: Attachment presign/confirm/list uses attachmentService (PublicBugTrackerController.java:64-82).
- vNext now: No corresponding routes (issues/[publicId]/route.ts:1-37).
- Fix: Integrate with signed object store and attachment table.

## G2-11-026-023  [P1] GAP  facet F11  effort M
- Legacy: Legacy reporter allowed if active display name found; no session required for create (BugTrackerService.java:43-50).
- vNext now: Current active platform context required; creates inactive synthetic reporter access row (report-service.ts:18-29).
- Fix: Support approved reporter identity resolution without granting manager access.

## G2-11-026-027  [P1] MISSING  facet F13  effort M
- Legacy: Storage unavailable returns 503 'Screenshot storage is unavailable' (BugTrackerAttachmentService.java:183-190).
- vNext now: No attachment route, so no dedicated storage 503 (issues/[publicId]/route.ts:1-37).
- Fix: Add 503/Retry response without losing issue metadata.

## G2-11-026-029  [P1] MISSING  facet F14  effort M
- Legacy: 3 max attachments per issue, PNG/JPEG/WebP, <=8MiB (BugTrackerAttachmentService.java:22-25,38-54,173-180).
- vNext now: Schema MIME and size check, but no API uploader (db10-bug-tracker.ts:138-154).
- Fix: Enforce 3 attachments and 8MiB server side in uploader and confirm.

## G2-11-026-030  [P1] MISSING  facet F14  effort M
- Legacy: Presign expires in 15 minutes, object bug-tracker/<publicId>/<UUID>.<ext> (BugTrackerAttachmentService.java:63-69).
- vNext now: No attachment presign endpoint (issues/[publicId]/route.ts:1-37).
- Fix: Use 15-minute scoped signed PUTs; private object access recommended.

## G2-11-026-031  [P1] MISSING  facet F14  effort M
- Legacy: Confirm checks object metadata true MIME/size/key extension, deletes invalid object (BugTrackerAttachmentService.java:79-136).
- vNext now: Only DB MIME/size CHECK, no verify-and-delete flow (db10-bug-tracker.ts:148-154).
- Fix: Verify object metadata on confirmation, cleanup invalid and duplicate keys.

## G2-11-026-038  [P1] MISSING  facet F20  effort M
- Legacy: Confirm same storageKey idempotently returns existing attachment; if foreign report error (BugTrackerAttachmentService.java:88-95).
- vNext now: No confirmation route (issues/[publicId]/route.ts:1-37).
- Fix: Make confirm idempotent and prevent cross-issue references.

## G2-11-026-039  [P1] GAP  facet F21  effort M
- Legacy: R2 presigned upload provider mandatory only for attachments (BugTrackerAttachmentService.java:27-35,183-190).
- vNext now: Issue create service uses database only, no object storage (report-service.ts:18-56).
- Fix: Connect provider with fail-closed upload capability; no need to block issue create.

## G2-11-026-041  [P1] GAP  facet F22  effort M
- Legacy: Reporter selected from active BugTrackerAccess existing row (BugTrackerService.java:43-50).
- vNext now: New inactive access row inserted for each report, no token/session (report-service.ts:23-29).
- Fix: Document reporter identity and dedup model; avoid duplicated access row per report if reporter tracking requires it.

## G2-11-026-042  [P1] GAP  facet F23  effort M
- Legacy: Public list/report accessible without JWT, but manager update removed (PublicBugTrackerController.java:54-56).
- vNext now: Admin-only list/report, DB runtime gate 503 migrations pending (issues/route.ts:12-17,30-36).
- Fix: Preserve manager isolation while designing authorized reporter session/intake path.

## G2-11-026-043  [P1] GAP  facet F23  effort M
- Legacy: Legacy evidence metadata includes sourceUrl/path/browser/viewport (BugReportCreateRequest.java:27-40).
- vNext now: Schema stores fields but POST never populates them (db10-bug-tracker.ts:68-72; report-service.ts:31-46).
- Fix: Extend input and persistence mapping; never silently drop report diagnostics.

## G2-11-026-013  [P3] GAP  facet F07  effort S
- Legacy: Invalid reporter says 'Select a valid reporter' (BugTrackerService.java:43-49).
- vNext now: Zod reporter option refine says 'Select your name.' (report-input-model.ts:7-8).
- Fix: Match the field-specific legacy backend error as needed by UI.
