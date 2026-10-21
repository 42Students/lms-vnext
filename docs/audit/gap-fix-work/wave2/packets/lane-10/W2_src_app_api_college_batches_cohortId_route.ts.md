# Work packet (wave 2): edit src/app/api/college/batches/[cohortId]/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-9/college-admin-batches.md

## G2-2-029-007  [P2] GAP  facet F01  effort M
- Legacy: BatchController.java:261-338 PUT update and DELETE delete.
- vNext now: src/app/api/college/batches/[cohortId]/route.ts:15-48 PATCH and DELETE.
- Fix: Migrate REST verbs/URLs, version confirmation and response contract.

## G2-2-029-050  [P2] GAP  facet F10  effort L
- Legacy: BatchController.java:67-92 create; :261-302 update; :304-339 delete.
- vNext now: college/batches/route.ts:11-29, college/batches/[cohortId]/route.ts:15-48 use create/update/retire.
- Fix: Map all legacy mutation contracts, including archive-not-delete difference.

## G2-9-003-048  [P2] GAP  facet F10  effort M
- Legacy: Update and delete endpoints (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:170-342`)
- vNext now: PATCH update, DELETE retire/archive (`src/app/api/college/batches/[cohortId]/route.ts:13-48`)
- Fix: Map legacy hard-delete to planned-only retirement policy.
