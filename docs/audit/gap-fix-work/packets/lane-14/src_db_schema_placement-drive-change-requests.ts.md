# Work packet: edit src/db/schema/placement-drive-change-requests.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md, docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-16-025-008  [P1] GAP  facet F04  effort L
- Legacy: DriveChangeRequestService.java:77-82 fields currentValue, proposedValue, note, answerValue, replyText, createdByType/Name, resolvedAt.
- vNext now: placement-drive-change-requests.ts:7-23 stores proposedValue/reason/decisionNote/actor ID but not currentValue, answerValue, replyText, creatorName.
- Fix: Preserve prior value, typed answer, decline reason and creator display snapshot.

## G2-16-025-050  [P1] GAP  facet F22  effort L
- Legacy: DriveChangeRequestService.java:77-83 DB drive_change_request fields current/answer/reply/created_by_name/resolved_at.
- vNext now: placement-drive-change-requests.ts:7-31 normalized id/user parties/mode/value/reason/status/decisionNote.
- Fix: Extend table for before/after values, name and resolved actor; protect history.

## G2-16-025-051  [P1] GAP  facet F22  effort M
- Legacy: DriveChangeRequestService.java:90-94 open direction/status counts.
- vNext now: placement-drive-change-requests.ts:23-30 index job/status but no unique-open partial index.
- Fix: Create index by job,targetParty,status,field and partial dedupe.

## G2-5-023-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy includes current drive field value at time of request, and status resolution timestamp. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:78-83`
- vNext now: vNext change-request table has neither `current_value` nor `resolved_at`-equivalent except decidedAt (answer indistinguishable). `src/db/schema/placement-drive-change-requests.ts:7-22`
- Fix: Persist snapshot of current value and separate outcome/answer fields.

## G2-5-023-043  [P1] GAP  facet F12  effort M
- Legacy: Legacy duplicate OPEN per `(job, field, direction)`, except OTHER; proposed equal to current rejected. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:97-130`
- vNext now: vNext has no duplicate check or matching unique constraint. `src/modules/placements/tpo-drive-change-request-service.ts:107-115`, `src/db/schema/placement-drive-change-requests.ts:23-30`
- Fix: Enforce atomic per-field-direction active uniqueness and no-op comparison.

## G2-5-023-062  [P1] GAP  facet F22  effort L
- Legacy: Legacy MySQL `drive_change_request` has job_id, college_id, direction, field, kind, current/proposed, note, status, answer/reply, created/resolved actor/type/name/time. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:77-83,132-136,267-272`
- vNext now: vNext PG request table has UUIDs, proposer/target party, mode, reason, decision note, no college_id/currentValue/answerValue/legacy actor name. `src/db/schema/placement-drive-change-requests.ts:7-31`, `drizzle/0114_drive_change_requests.sql:12-34`
- Fix: Specify migration/bridge mapping and add immutable snapshot and outcome fields.

## G2-5-023-063  [P1] GAP  facet F22  effort M
- Legacy: Legacy application-level unique OPEN (job,field,direction), except OTHER. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:126-130`, `src/db/schema/placement-drive-change-requests.ts:23-31`
- vNext now: vNext index (job,status,created_at) but no partial uniqueness constraint. `src/db/schema/placement-drive-change-requests.ts:23-31`, `drizzle/0114_drive_change_requests.sql:42-43`
- Fix: Add partial unique index on active field/party requests excluding OTHER.
