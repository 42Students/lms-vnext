# Work packet: edit src/modules/academics/college-batch-promotion-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u021-batch.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-9/college-admin-batch-promotion.md, docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-5-021-004  [P1] GAP  facet F03  effort M
- Legacy: Legacy batch currentStudents server-computed from primary SECTION class `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:85-91`
- vNext now: VNext lists activeLearners via count of ACTIVE program enrollments `src/modules/academics/college-batch-promotion-service.ts:56-69`
- Fix: Count only intended cohort/section membership, avoid double-count.

## G2-14-031-033  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:109-132 Super Admin all/org/college batch listings
- vNext now: src/modules/academics/college-batch-promotion-service.ts:23-43 preview requires selected college, execute College Admin only
- Fix: Provide permitted Super Admin read/act-in-college promotion path

## G2-9-002-019  [P1] GAP  facet F05  effort M
- Legacy: Only ACTIVE initially, unless Show completed/inactive checked (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:120-130`)
- vNext now: Cohort options include all statuses, sorted programs and names (`src/modules/academics/college-batch-promotion-service.ts:50-78`)
- Fix: Default active only and keep toggle counts.

## G2-9-028-015  [P1] GAP  facet F04  effort M
- Legacy: Students column currentStudents in legacy DTO `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:314-316`
- vNext now: Counts only ACTIVE learner-program enrollments `src/modules/academics/college-batch-promotion-service.ts:49-63` `src/app/(authenticated)/admin/batch-promotion/page.tsx:95-98`
- Fix: Reconcile old currentStudents semantics and label clearly

## G2-9-028-058  [P1] GAP  facet F19  effort L
- Legacy: Client loads all batches, paginates ten visible rows `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:47-72,442-449`
- vNext now: Loads all available cohorts, displays every row `src/modules/academics/college-batch-promotion-service.ts:41-74` `src/app/(authenticated)/admin/batch-promotion/page.tsx:87-105`
- Fix: Use server pagination for large colleges

## G2-9-022-015  [P1] GAP  facet F04  effort M
- Legacy: Students column currentStudents in legacy DTO `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:314-316`
- vNext now: Counts only ACTIVE learner-program enrollments `src/modules/academics/college-batch-promotion-service.ts:49-63` `src/app/(authenticated)/admin/batch-promotion/page.tsx:95-98`
- Fix: Reconcile old currentStudents semantics and label clearly

## G2-9-022-058  [P1] GAP  facet F19  effort L
- Legacy: Client loads all batches, paginates ten visible rows `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:47-72,442-449`
- vNext now: Loads all available cohorts, displays every row `src/modules/academics/college-batch-promotion-service.ts:41-74` `src/app/(authenticated)/admin/batch-promotion/page.tsx:87-105`
- Fix: Use server pagination for large colleges
