# Work packet (wave 2): edit src/modules/placements/tpo-drive-change-request-service.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md, docs/audit/gap2/lane-16/u031-placements-end-to-end.md, docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-16-025-002  [P2] GAP  facet F01  effort M
- Legacy: RecruiterChangeRequestController.java:49-82 list/create/accept/answer/reply/withdraw endpoints.
- vNext now: tpo-drive-change-request-service.ts:77-151 exposes one read and command mutations.
- Fix: Map old distinct verbs/path to typed action handler as needed.

## G2-16-025-004  [P2] GAP  facet F02  effort M
- Legacy: DriveChangeRequestService.java:77-83 lists all requests newest id first.
- vNext now: tpo-drive-change-request-service.ts:82-96 lists last100 by createdAt DESC plus nested messages.
- Fix: Document visible all-history vs capped100 and tie order.

## G2-16-025-033  [P2] GAP  facet F12  effort M
- Legacy: DriveChangeRequestService.java:253-256 disallows mutations if inactive/rejected.
- vNext now: tpo-drive-change-request-service.ts:102-106 rejects ARCHIVED/CANCELLED, allows CLOSED/PUBLISHED.
- Fix: Map lifecycle terminal statuses and reject unsafe edits after end.

## G2-16-025-037  [P2] GAP  facet F13  effort S
- Legacy: RecruiterChangeRequestController.java:84-89 conflict is a semantic message not crash.
- vNext now: tpo-drive-change-request-service.ts:131-132 typed error.
- Fix: Render conflict inline with retry/reload latest request.

## G2-16-025-045  [P2] GAP  facet F19  effort M
- Legacy: DriveChangeRequestService.java:77-80 all rows query id desc.
- vNext now: tpo-drive-change-request-service.ts:82-88 limit100, index job/status/created_at.
- Fix: Paginate history rather than silently losing older records.

## G2-16-031-091  [P2] GAP  facet F21  effort M
- Legacy: tpo/drives/[jobId].js:428-438 embeds InviteReviewer and ChangeRequests within drive detail.
- vNext now: tpo-drive-change-request-service.ts:98-149 exposes separate request messages, tpo/placements/jobs/[jobId]/change-requests route exists.
- Fix: Show reviewer invite and active change requests inline above tabs for legacy parity.

## G2-5-023-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy request owner on either side can withdraw an open request. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:126-127`
- vNext now: vNext only creatorUserId can withdraw, even if another TPO/team member belongs to the proposer side. `src/modules/placements/tpo-drive-change-request-service.ts:133-136`, `src/components/placements/tpo-drive-change-requests.tsx:108-111`
- Fix: Decide whether side-level or creator-level ownership is intended; retain legacy team capability if required.

## G2-5-023-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET list + POST create/accept/answer/reply/withdraw, per-action `/api/v1/tpo` endpoints. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:45-72`, `docs/legacy-source/frontend/src/api/Services/TpoService.js:17-27`
- vNext now: vNext GET all and POST command envelope; no endpoint-level response aliases. `src/app/api/placements/jobs/[jobId]/change-requests/route.ts:8-19`, `src/modules/placements/tpo-drive-change-request-service.ts:77-151`
- Fix: Document route/action adapters and preserve status semantics for migrated clients.

## G2-5-023-042  [P2] GAP  facet F11  effort M
- Legacy: Legacy receiving side may accept/answer/decline, requesting side may withdraw regardless of individual creator. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:259-264,212-220`
- vNext now: vNext receiving party only can decide, creator alone may withdraw. `src/modules/placements/tpo-drive-change-request-service.ts:133-137`
- Fix: Evaluate team-scope authorization to match legacy institutional operations.

## G2-5-023-045  [P2] GAP  facet F12  effort M
- Legacy: Legacy accepted/answered/replied stop on inactive/rejected jobs, but withdraw allowed on ended jobs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:253-255,210-220`
- vNext now: vNext uniformly rejects all mutation commands on ARCHIVED/CANCELLED including withdraw. `src/modules/placements/tpo-drive-change-request-service.ts:102-106`
- Fix: Permit withdraw cleanup on ended jobs, reject settled-field actions.

## G2-5-023-057  [P2] GAP  facet F19  effort M
- Legacy: Legacy DRIVE internal conversation uses bounded recent messages and read-status updates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoTeamThreadService.java:215-269`
- vNext now: vNext independent request-thread messages loaded without per-request cap. `src/modules/placements/tpo-drive-change-request-service.ts:82-96`
- Fix: Bound threaded message payload, add pagination and read receipts if canonical thread parity intended.

## G2-16-025-009  [P3] GAP  facet F04  effort S
- Legacy: DriveChangeRequestService.java:145-151 create returns id and number open.
- vNext now: tpo-drive-change-request-service.ts:107-115 returns id,status only.
- Fix: Keep open count in created response or refresh header count.

## G2-16-025-011  [P3] GAP  facet F05  effort S
- Legacy: DriveChangeRequestService.java:77-83 order id DESC across all requests.
- vNext now: tpo-drive-change-request-service.ts:82-88 order createdAt DESC limit100.
- Fix: Add stable ID tie and pagination/load older history.
