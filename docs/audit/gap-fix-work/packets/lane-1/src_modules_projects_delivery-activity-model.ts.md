# Work packet: edit src/modules/projects/delivery-activity-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/project-delivery-event.md

## G2-3-018-046  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:14-48`
- vNext now: `src/modules/projects/delivery-activity-model.ts:19-37`
- Fix: Historical actor snapshots, event feedback, revision counts and evidence links are not preserved by vNext sanitized activity taxonomy. Add authorized dedicated delivery-history projection/storage.

## G2-3-018-017  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:382-420`
- vNext now: `src/modules/projects/delivery-activity-model.ts:12-18`
- Fix: Legacy returns response messages `Project submission history retrieved` and `Project delivery history retrieved`; vNext event consumers likely show general activity descriptions, not identical confirmation/empty copy. Restore exact panel header and zero-row message.
