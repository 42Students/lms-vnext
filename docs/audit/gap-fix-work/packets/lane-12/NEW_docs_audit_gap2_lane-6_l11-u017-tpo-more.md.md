# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l11-u017-tpo-more.md

9 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u017-tpo-more.md

## G2-11-017-001  [P1] GAP  facet F01  effort M
- Legacy: Phone footer More destination; Redux active key more (more.js:48-55).
- vNext now: Mobile More button opens BottomSheet; footer model points at /tpo/settings (tpo-mobile-footer.tsx:12-25,43-70).
- Fix: Make More reach /tpo/more and maintain correct active highlight.

## G2-11-017-007  [P1] MISSING  facet F03  effort M
- Legacy: Request and Message badges when >0, max 99+ (more.js:52-63,102).
- vNext now: No badge or counter markup (more/page.tsx:44-64).
- Fix: Render live two count badges with 99+ overflow.

## G2-11-017-009  [P1] MISSING  facet F04  effort S
- Legacy: Placement eligibility link /tpo/batches, exact description (more.js:23).
- vNext now: Absent; Students /tpo/students added (tpo-utility-model.ts:14-19).
- Fix: Restore Placement eligibility as first Work row.

## G2-11-017-024  [P1] MISSING  facet F10  effort M
- Legacy: On mount and Retry fetch GET /api/v1/tpo/counts; no writes (more.js:59-65; TpoHubService.js:37-48).
- vNext now: No API/count call in More server page (more/page.tsx:1-78).
- Fix: Add scoped GET counts reader and retriable UI.

## G2-11-017-025  [P1] MISSING  facet F10  effort M
- Legacy: Response reads requests/messages plus other counts; pendingRequestCount and unreadForTpo (TpoWorkspaceController.java:267-274).
- vNext now: Directory model is static (tpo-utility-model.ts:9-70).
- Fix: Expose mapped pending/unread scoped counters, not full-list reads.

## G2-11-017-042  [P1] MISSING  facet F21  effort M
- Legacy: Reads backend pending student request and recruiter unread count integrations (TpoWorkspaceController.java:267-274).
- vNext now: Page has no integrated counts service (more/page.tsx:8-78).
- Fix: Trace source services and add batched scoped lightweight counts query.

## G2-11-017-045  [P1] MISSING  facet F23  effort M
- Legacy: Legacy Announcements, Messages, Placement team and Settings present (more.js:26-28,41).
- vNext now: All four dropped from More model (tpo-utility-model.ts:9-70).
- Fix: Add four independent legacy links with exact routes and descriptions.

## G2-11-017-020  [P2] MISSING  facet F07  effort M
- Legacy: Count failure shows exact Waiting requests and unread messages could not be counted. Retry (more.js:76-79).
- vNext now: No count error; only route ErrorState Unable to load More (more/error.tsx:6-11).
- Fix: Restore inline count failure while showing links; Retry recounts.

## G2-11-017-021  [P2] GAP  facet F08  effort S
- Legacy: Count successful reload silently clears failure; no toast (more.js:59-65).
- vNext now: No count fetch or success feedback (more/page.tsx:8-78).
- Fix: Silent badge update and warning clearance on retry.
