# Work packet: edit src/modules/placements/tpo-drive-change-request-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md, docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md

## G2-5-023-035  [P0] GAP  facet F10  effort L
- Legacy: Legacy Accept and Answer immediately mutate Job title/description/location/type/mode/deadline/pay/eligibility. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:154-191,408-431`
- vNext now: vNext updates only request status, no placementJobs or job options/eligibility values. `src/modules/placements/tpo-drive-change-request-service.ts:131-149`
- Fix: Implement atomic validated field mutation or explicitly change product parity contract after owner sign-off.

## G2-16-025-012  [P1] MISSING  facet F05  effort M
- Legacy: DriveChangeRequestService.java:126-130 disallows open duplicate same field+direction, except OTHER.
- vNext now: tpo-drive-change-request-service.ts:107-115 inserts without duplicate-open check.
- Fix: Reject duplicate open same job+field+direction in transaction with partial unique index.

## G2-16-025-020  [P1] MISSING  facet F07  effort S
- Legacy: DriveChangeRequestService.java:129 duplicate `There is already an open request on...`.
- vNext now: tpo-drive-change-request-service.ts:107-115 no dedupe.
- Fix: Enforce duplicate-open and display exact conflict.

## G2-16-025-023  [P1] GAP  facet F08  effort M
- Legacy: DriveChangeRequestService.java:281-285 last company response triggers TPO bell `answered your change requests`.
- vNext now: tpo-drive-change-request-service.ts:146-149 emits per-request message, no last-open aggregate.
- Fix: On last institutional request settled, update drive changes-made and notify TPO priority queue.

## G2-16-025-028  [P1] GAP  facet F10  effort M
- Legacy: DriveChangeRequestService.java:210-221 withdrawing proposal permitted even if drive ended.
- vNext now: tpo-drive-change-request-service.ts:102-106 forbids CANCELLED/ARCHIVED for all actions.
- Fix: Permit WITHDRAW cleanup after drive over, maintain ownership guard.

## G2-16-025-029  [P1] GAP  facet F10  effort M
- Legacy: DriveChangeRequestService.java:34-35 all steps write drive Discussion company thread.
- vNext now: tpo-drive-change-request-service.ts:61-75 events+per-request messages, no explicit company thread post.
- Fix: Mirror lifecycle event to shared recruiter/TPO conversation timeline.

## G2-16-025-040  [P1] GAP  facet F15  effort M
- Legacy: DriveChangeRequestService.java:280-285 special last-request priority notification.
- vNext now: tpo-drive-change-request-service.ts:146-149 generic decision notice only.
- Fix: Add final-institutional-request completion bell and queue reorder.

## G2-16-025-044  [P1] MISSING  facet F18  effort S
- Legacy: DriveChangeRequestService.java:54 multi-role error exact `This drive has several roles; use Something else...`.
- vNext now: tpo-drive-change-request-service.ts:98-149 no multi-role branch.
- Fix: Implement exact explanatory error.

## G2-16-025-046  [P1] GAP  facet F20  effort L
- Legacy: DriveChangeRequestService.java:37-38 locks request then drive FOR UPDATE.
- vNext now: tpo-drive-change-request-service.ts:102-104 locks drive FOR SHARE before request FOR UPDATE 117-119.
- Fix: Establish consistent lock order + FOR UPDATE for applying drive edits; prevent deadlocks/races.

## G2-16-025-047  [P1] MISSING  facet F20  effort M
- Legacy: DriveChangeRequestService.java:126-130 dedupes open same field/direction under job lock.
- vNext now: tpo-drive-change-request-service.ts:107-115 no uniqueness guard.
- Fix: Add partial unique index and check inside transaction.

## G2-16-025-049  [P1] GAP  facet F21  effort L
- Legacy: DriveChangeRequestService.java:58-60 uses LiveDriveChangeService, Messages and TPO audit.
- vNext now: tpo-drive-change-request-service.ts:58-75 sends in-app notifications but no live drive apply.
- Fix: Integrate live drive mutation and recruiter Discussion event emit.

## G2-5-023-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy list includes `currentValue`, `answerValue`, `replyText`, `fieldLabel`, `createdByName`, `createdAt`, `resolvedAt`, `direction`, `kind`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:77-83`
- vNext now: vNext stores/list projects `proposedValue`, `reason`, decisionNote, proposerParty, timestamps; no currentValue/answerValue/replyText/createdByName. `src/modules/placements/tpo-drive-change-request-service.ts:82-96`, `src/components/placements/tpo-drive-change-requests.tsx:14-16`
- Fix: Add immutable before-value, distinct answer, decline, author display and resolved timestamp projections.

## G2-5-023-014  [P1] GAP  facet F05  effort M
- Legacy: Legacy lists all requests ordered numeric `id DESC`; no cap. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:77-83`
- vNext now: vNext lists latest 100 by `createdAt DESC`; older requests silently inaccessible. `src/modules/placements/tpo-drive-change-request-service.ts:82-89`
- Fix: Implement cursor pagination and count/history access beyond 100.

## G2-5-023-024  [P1] GAP  facet F07  effort M
- Legacy: Legacy errors for no recruiter, expired college access, duplicate same-field open request and unchanged proposed value. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:110-129`
- vNext now: vNext create path has no corresponding recruiter/duplicate/current-value checks. `src/modules/placements/tpo-drive-change-request-service.ts:107-115`
- Fix: Preflight recruiter visibility, duplicate open field/direction and no-op comparisons transactionally.

## G2-5-023-027  [P1] GAP  facet F07  effort M
- Legacy: Legacy exact errors `This one asks for a detail: answer it instead`, `Type the answer`, `Type a reason`, and settled/over checks. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:156-158,175-178,199-204`
- vNext now: vNext allows any recipient decision regardless of kind; generic invalid state and min3 note. `src/modules/placements/tpo-drive-change-request-service.ts:131-145`, `src/modules/placements/tpo-drive-change-request-model.ts:6-9`
- Fix: Validate action against ASK/PROPOSE and preserve distinct error feedback.

## G2-5-023-036  [P1] GAP  facet F10  effort L
- Legacy: Legacy completed live drive term changes trigger applicant notices/recheck and company thread event lines. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:297-307`
- vNext now: vNext emits activity event/in-app notification but no live applicant consequence and no main discussion event. `src/modules/placements/tpo-drive-change-request-service.ts:58-75,138-149`
- Fix: Invoke applicant notice, eligibility re-evaluation and canonical drive discussion append.

## G2-5-023-037  [P1] GAP  facet F10  effort M
- Legacy: Legacy create clears changesMadeAt for institutional requests; company resolving last open institutional request sets changesMadeAt and optionally TPO bell. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:138-151,280-291`
- vNext now: vNext never updates drive `changesMadeAt` queue priority/readiness. `src/modules/placements/tpo-drive-change-request-service.ts:107-115,138-149`
- Fix: Implement transition after last company resolution and TPO ready-to-review signal.

## G2-5-023-038  [P1] GAP  facet F10  effort M
- Legacy: Legacy `/internal-notes` GET/POST reads/writes Team DRIVE messages with kind MESSAGE and deleted filtering. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:75-102`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoTeamThreadService.java:275-296`
- vNext now: vNext scoped change-request API has no internal-notes equivalent; request messages are separate store. `src/app/api/placements/jobs/[jobId]/change-requests/route.ts:8-19`, `src/modules/placements/tpo-drive-change-request-service.ts:77-151`
- Fix: Preserve Team DRIVE thread integration and legacy notes access in drive Discussion.

## G2-5-023-041  [P1] GAP  facet F11  effort M
- Legacy: Legacy `/api/v1/tpo/**` permits TPO or college admin fallback when no TPO account (per client service contract). `docs/legacy-source/frontend/src/api/Services/TpoService.js:3-5`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoChangeRequestController.java:22-35`
- vNext now: vNext page strictly requires TPO membership; no College Admin fallback. `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx:11-14`, `src/modules/placements/tpo-drive-change-request-service.ts:18-26`
- Fix: Restore controlled College Admin delegation/acting-role path as required by access policy.

## G2-5-023-043  [P1] GAP  facet F12  effort M
- Legacy: Legacy duplicate OPEN per `(job, field, direction)`, except OTHER; proposed equal to current rejected. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:97-130`
- vNext now: vNext has no duplicate check or matching unique constraint. `src/modules/placements/tpo-drive-change-request-service.ts:107-115`, `src/db/schema/placement-drive-change-requests.ts:23-30`
- Fix: Enforce atomic per-field-direction active uniqueness and no-op comparison.
