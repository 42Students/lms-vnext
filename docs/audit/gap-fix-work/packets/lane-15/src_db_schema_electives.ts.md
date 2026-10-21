# Work packet: edit src/db/schema/electives.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md, docs/audit/gap2/lane-4/elective-admin-controller.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-10-006-077  [P1] GAP  facet F22  effort L
- Legacy: Old offering binds course group AND group-backed class roster_group_id `docs/legacy-source/backend/src/main/resources/db/migration/V167__electives.sql:14-18` `docs/legacy-source/backend/src/main/resources/db/migration/V167__electives.sql:39-56`
- vNext now: New offering binds course group backedDeliveryId and status, without legacy GROUP_BACKED class ID `src/db/schema/electives.ts:34-55`
- Fix: Document precise group-backed class to course-section-delivery mapping for grade and attendance parity

## G2-4-024-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy offering capacity nullable means unlimited (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveRequests.java:25-30`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:306-317`)
- vNext now: New offering input capacity mandatory integer <=100000 and schema capacity nullable (`src/modules/electives/service.ts:28-34`; `src/db/schema/electives.ts:34-45`)
- Fix: Allow null unlimited capacity in form/service without arbitrary upper bound.

## G2-4-024-074  [P1] GAP  facet F22  effort M
- Legacy: Legacy offering is course + elective group + GROUP_BACKED class, capacity nullable (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:305-353`)
- vNext now: New offering requires backedDeliveryId and stores capacity nullable; input requires capacity (`src/db/schema/electives.ts:34-55`; `src/modules/electives/service.ts:28-34`)
- Fix: Reconcile delivery vs group-backed class and null capacity migration semantics.

## G2-9-007-075  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/electives/ElectiveOffering.java:23-68` — Offering backed_class_id and unique group_id; nullable capacity
- vNext now: `src/db/schema/electives.ts:34-55` — Offering backed_delivery_id, unique group/delivery, partial course index
- Fix: Verify backed class/delivery equivalence and status uniqueness
