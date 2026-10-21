# Work packet: edit src/modules/placements/tpo-drive-change-request-service.ts (part 2 of 2)

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md, docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md

## G2-5-023-044  [P1] GAP  facet F12  effort M
- Legacy: Legacy OTHER always ASK and ASK can't be accepted; only PROPOSE can be accepted. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:102-105,154-158,173-191`
- vNext now: vNext does not constrain `mode+field+action` relationship. `src/modules/placements/tpo-drive-change-request-model.ts:2-9`, `src/modules/placements/tpo-drive-change-request-service.ts:138-149`
- Fix: Enforce mode/field transition matrix at UI and service.

## G2-5-023-050  [P1] GAP  facet F15  effort L
- Legacy: Legacy company create sends TPO bell; last company resolution sends review-ready bell; all request events appear in drive company thread, not email. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:142-148,280-306`
- vNext now: vNext sends in-app change-request notices per event, but does not update company discussion thread/queue signal. `src/modules/placements/tpo-drive-change-request-service.ts:58-75,107-149`
- Fix: Match receiver triggers and main thread event propagation without duplicate announcements.

## G2-5-023-056  [P1] GAP  facet F19  effort M
- Legacy: Legacy list uncapped DESC query; no paging. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:77-83`
- vNext now: vNext caps 100 and loads all associated messages for those requests. `src/modules/placements/tpo-drive-change-request-service.ts:82-88`
- Fix: Use cursor paging, bounded message fanout and total count.

## G2-5-023-058  [P1] GAP  facet F20  effort M
- Legacy: Legacy locks job FOR UPDATE before create, and request then job FOR UPDATE before decision. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:37-39,97-100,235-250`
- vNext now: vNext job FOR SHARE and request FOR UPDATE; does not lock job exclusively before deciding field changes. `src/modules/placements/tpo-drive-change-request-service.ts:101-104,117-119`
- Fix: Lock placement job row FOR UPDATE when applying accepted/answered changes.

## G2-5-023-059  [P1] GAP  facet F20  effort M
- Legacy: Legacy compares current vs proposed equivalently and serializes duplicate creation. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:126-130,330-355`
- vNext now: vNext lacks duplicate/no-op guard; simultaneous CREATE can double-post. `src/modules/placements/tpo-drive-change-request-service.ts:101-115`
- Fix: Use constraint + transaction lock and canonicalized comparison.

## G2-5-023-061  [P1] GAP  facet F21  effort L
- Legacy: Legacy downstream live-drive applicant messaging, eligibility recheck, recruiter invitation/college public-link lookup. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:297-307`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveReviewInviteService.java:56-132`
- vNext now: vNext only activity/in-app push in mapped service, no legacy downstream processors. `src/modules/placements/tpo-drive-change-request-service.ts:58-75,107-149`
- Fix: Wire live-change downstream and invite integrations; document eventual retry guarantees.

## G2-16-025-022  [P2] GAP  facet F08  effort S
- Legacy: RecruiterChangeRequestController.java:84-89 conflict returns HTTP409 `{status:'CONFLICT',message}`.
- vNext now: tpo-drive-change-request-service.ts:131-132 generic placement error code; API normalizer.
- Fix: Return actionable 409 with human conflict string.

## G2-16-025-021  [P3] GAP  facet F07  effort S
- Legacy: DriveChangeRequestService.java:261-263 `This request is already settled`.
- vNext now: tpo-drive-change-request-service.ts:131-132 throws PLACEMENT_REQUEST_INVALID_STATE.
- Fix: Map stale state to legacy human conflict copy.
