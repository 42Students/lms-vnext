# Work packet: edit drizzle/0114_drive_change_requests.sql

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-5-023-062  [P1] GAP  facet F22  effort L
- Legacy: Legacy MySQL `drive_change_request` has job_id, college_id, direction, field, kind, current/proposed, note, status, answer/reply, created/resolved actor/type/name/time. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:77-83,132-136,267-272`
- vNext now: vNext PG request table has UUIDs, proposer/target party, mode, reason, decision note, no college_id/currentValue/answerValue/legacy actor name. `src/db/schema/placement-drive-change-requests.ts:7-31`, `drizzle/0114_drive_change_requests.sql:12-34`
- Fix: Specify migration/bridge mapping and add immutable snapshot and outcome fields.

## G2-5-023-063  [P1] GAP  facet F22  effort M
- Legacy: Legacy application-level unique OPEN (job,field,direction), except OTHER. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:126-130`, `src/db/schema/placement-drive-change-requests.ts:23-31`
- vNext now: vNext index (job,status,created_at) but no partial uniqueness constraint. `src/db/schema/placement-drive-change-requests.ts:23-31`, `drizzle/0114_drive_change_requests.sql:42-43`
- Fix: Add partial unique index on active field/party requests excluding OTHER.
