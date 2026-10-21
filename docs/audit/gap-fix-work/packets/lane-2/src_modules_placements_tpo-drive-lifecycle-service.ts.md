# Work packet: edit src/modules/placements/tpo-drive-lifecycle-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u015-job-lifecycle-status.md, docs/audit/gap2/lane-3/tpo-drive-controller.md, docs/audit/gap2/lane-8/job-lifecycle-service.md

## G2-14-015-020  [P1] GAP  facet F10  effort M
- Legacy: Legacy transition updates lifecycleStatus plus isDraft/isActive synchronously `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:38-55`
- vNext now: New TPO change transaction updates status/publishedAt/closedAt `src/modules/placements/tpo-drive-lifecycle-service.ts:172-197`
- Fix: Define compatibility flags and preserve timestamp meaning

## G2-14-015-025  [P1] GAP  facet F10  effort M
- Legacy: Legacy CLOSED and CANCELLED terminal, no outgoing transitions `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:33-35`
- vNext now: New TPO offers REOPEN from CLOSED to PUBLISHED `src/modules/placements/tpo-drive-lifecycle-model.ts:38-64` `src/modules/placements/tpo-drive-lifecycle-service.ts:187-197`
- Fix: Document intentional reopening extension and its safety gates

## G2-14-015-026  [P1] GAP  facet F11  effort L
- Legacy: Legacy JobLifecycleService only writer of lifecycleStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:10-16` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:282-291`
- vNext now: New multiple lifecycle entrypoints direct job-service and TPO service `src/modules/placements/job-service.ts:417-530` `src/modules/placements/tpo-drive-lifecycle-service.ts:154-197`
- Fix: Centralize allowed transition checks to prevent permission/path divergence

## G2-3-023-021  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-service.ts:154-164`, `src/modules/placements/tpo-drive-publish-effects.ts:102-119`
- Fix: Legacy publish defaults notifyByEmail true and APP+EMAIL, VNext rejects email true and notifies in-app only.

## G2-3-023-031  [P1] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- vNext now: `src/modules/placements/tpo-drive-publish-effects.ts:102-119`, `src/modules/placements/tpo-drive-lifecycle-service.ts:218-229`
- Fix: Legacy eligible APP+EMAIL default; VNext only in-app and explicit email unavailable. Restore approved channel or document removal.

## G2-3-023-048  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-service.ts:150-164`, `src/components/placements/tpo-drive-lifecycle-controls.tsx:132-141`
- Fix: Legacy publish email defaults enabled; VNext visibly offers email but backend always rejects. Fix or explicitly disable with approved exception.

## G2-8-011-014  [P2] GAP  facet F07  effort S
- Legacy: New job illegal initial transition throws `New drive must start as DRAFT or REQUEST` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:40-46`)
- vNext now: vNext invalid requested action returns strict Zod or placement read-only error (`src/modules/placements/tpo-drive-lifecycle-model.ts:3-9; src/modules/placements/tpo-drive-lifecycle-service.ts:178-185`)
- Fix: Map original error meaning to clear UI rather than generic read-only
