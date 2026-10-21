# Work packet (wave 2): edit src/modules/groups/college-group-detail-write-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/admin-group-controller.md

## G2-3-024-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:150-265`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/page.tsx:150-244`, `src/modules/groups/college-group-detail-write-service.ts:20-133`
- Fix: Legacy members, bulk add, locks, events, rule GET/PUT/DELETE/preview/apply endpoints; VNext splits detail actions/rule preview, bulk CSV is preview-only. Build route matrix for actual mutations.

## G2-3-024-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:156-201`
- vNext now: `src/modules/groups/service.ts:222-352`, `src/modules/groups/college-group-detail-write-service.ts:83-133`
- Fix: Legacy member add supports numeric learner IDs/roll numbers, source MANUAL/CSV, note; VNext uses collegeMembership UUID identity and separate CSV dry-run. Build conversion and bulk add.

## G2-3-024-026  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:203-223`
- vNext now: `src/modules/groups/service.ts:604-715`, `src/modules/groups/college-group-detail-write-service.ts:99-133`
- Fix: Legacy membership states, lock bit and waitlist rules; VNext enforces queue-head promotion, CAS, capacity, membership status. Preserve legacy semantics and improved safety.
