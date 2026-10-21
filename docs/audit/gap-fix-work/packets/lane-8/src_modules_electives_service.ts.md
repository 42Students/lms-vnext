# Work packet: edit src/modules/electives/service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/elective-admin-controller.md

## G2-4-024-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy offering capacity nullable means unlimited (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveRequests.java:25-30`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:306-317`)
- vNext now: New offering input capacity mandatory integer <=100000 and schema capacity nullable (`src/modules/electives/service.ts:28-34`; `src/db/schema/electives.ts:34-45`)
- Fix: Allow null unlimited capacity in form/service without arbitrary upper bound.

## G2-4-024-026  [P1] GAP  facet F06  effort M
- Legacy: Legacy capacity nullable unlimited; rejects explicit capacity below 1 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:306-317`)
- vNext now: New requires capacity1..100000 (`src/modules/electives/service.ts:28-34`)
- Fix: Support unlimited null with appropriate group capacity semantics.

## G2-4-024-043  [P1] GAP  facet F10  effort M
- Legacy: Legacy POST offering builds group, GROUP_BACKED class, auto course association (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:305-353`)
- vNext now: New create validates existing backedDeliveryId and creates/links group (`src/modules/electives/service.ts:91-185`)
- Fix: Ensure new offering automatically provisions valid class/delivery or provide guided selection; don't strand setup.

## G2-4-024-074  [P1] GAP  facet F22  effort M
- Legacy: Legacy offering is course + elective group + GROUP_BACKED class, capacity nullable (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:305-353`)
- vNext now: New offering requires backedDeliveryId and stores capacity nullable; input requires capacity (`src/db/schema/electives.ts:34-55`; `src/modules/electives/service.ts:28-34`)
- Fix: Reconcile delivery vs group-backed class and null capacity migration semantics.

## G2-4-024-076  [P1] GAP  facet F23  effort M
- Legacy: Legacy semester/year editable until historical membership, and unlimited-capacity offerings (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:177-212,306-317`)
- vNext now: New edit hides semester/year and requires numeric finite capacity (`src/components/electives/college-slot-manager.tsx:98-114`; `src/modules/electives/service.ts:28-34`)
- Fix: Restore valid legacy controls or mark intentional loss explicitly.

## G2-4-024-033  [P2] GAP  facet F07  effort M
- Legacy: Legacy capacity check `Capacity cannot go below the current enrolled count (N)` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:355-365`)
- vNext now: New error ELECTIVE_CAPACITY_BELOW_ENROLLMENT without count (`src/modules/electives/service.ts:260-265`)
- Fix: Include actual current count in actionable copy.
