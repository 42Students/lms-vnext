# Work packet: edit src/modules/academics/college-batch-promotion-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-9/college-admin-batch-promotion.md, docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-2-029-060  [P1] GAP  facet F12  effort M
- Legacy: BatchServiceImpl.java:90-91 create ACTIVE in current semester1.
- vNext now: academics.ts:147-149 create PLANNED, progression separate; `college-batch-promotion-model.ts:45-65` requires active.
- Fix: Reconcile initial cohort activation/progression prerequisites and default status.

## G2-9-002-054  [P1] GAP  facet F12  effort M
- Legacy: Suggested academic year advances on academic boundary (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:155-201`)
- vNext now: Year override else current yearStart (`src/modules/academics/college-batch-promotion-model.ts:53-79`)
- Fix: Implement/approve automatic rollover rules.

## G2-9-002-030  [P2] GAP  facet F07  effort M
- Legacy: Error Use consecutive years, e.g. 2026-27 (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:514-532`)
- vNext now: Zod schema validation, generic invalid filters view (`src/modules/academics/college-batch-promotion-model.ts:8-20`)
- Fix: Show exact validation text next to year input.

## G2-9-028-026  [P2] GAP  facet F07  effort S
- Legacy: Bad override error Use consecutive years, e.g. 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:507-512`
- vNext now: Numeric range Zod and generic Invalid batch promotion filters `src/modules/academics/college-batch-promotion-model.ts:8-17` `src/app/(authenticated)/admin/batch-promotion/page.tsx:25-29`
- Fix: Give exact field-level format error

## G2-9-022-026  [P2] GAP  facet F07  effort S
- Legacy: Bad override error Use consecutive years, e.g. 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:507-512`
- vNext now: Numeric range Zod and generic Invalid batch promotion filters `src/modules/academics/college-batch-promotion-model.ts:8-17` `src/app/(authenticated)/admin/batch-promotion/page.tsx:25-29`
- Fix: Give exact field-level format error
