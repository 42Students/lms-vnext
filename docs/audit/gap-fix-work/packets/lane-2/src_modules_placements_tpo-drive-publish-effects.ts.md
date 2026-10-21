# Work packet: edit src/modules/placements/tpo-drive-publish-effects.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-3-023-021  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-service.ts:154-164`, `src/modules/placements/tpo-drive-publish-effects.ts:102-119`
- Fix: Legacy publish defaults notifyByEmail true and APP+EMAIL, VNext rejects email true and notifies in-app only.

## G2-3-023-031  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- vNext now: `src/modules/placements/tpo-drive-publish-effects.ts:102-119`, `src/modules/placements/tpo-drive-lifecycle-service.ts:218-229`
- Fix: Legacy eligible APP+EMAIL default; VNext only in-app and explicit email unavailable. Restore approved channel or document removal.
