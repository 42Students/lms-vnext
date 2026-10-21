# Work packet: edit src/app/(authenticated)/admin/batch-promotion/page.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-9-028-015  [P1] GAP  facet F04  effort M
- Legacy: Students column currentStudents in legacy DTO `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:314-316`
- vNext now: Counts only ACTIVE learner-program enrollments `src/modules/academics/college-batch-promotion-service.ts:49-63` `src/app/(authenticated)/admin/batch-promotion/page.tsx:95-98`
- Fix: Reconcile old currentStudents semantics and label clearly

## G2-9-028-018  [P1] GAP  facet F05  effort M
- Legacy: Ant table default page size 10, size changer and row range `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:442-450`
- vNext now: Renders all cohorts in one DataTable without pagination `src/app/(authenticated)/admin/batch-promotion/page.tsx:35-36,87-105`
- Fix: Add 10-per-page pagination and size changer, server-side when large

## G2-9-028-019  [P1] GAP  facet F05  effort S
- Legacy: Initial active-only list, switch reveals all other statuses `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:30-32,114-119`
- vNext now: Default excludes Completed/Archived but includes Planned `src/app/(authenticated)/admin/batch-promotion/page.tsx:24,35-36`
- Fix: Use strict ACTIVE default filter

## G2-9-028-022  [P1] GAP  facet F06  effort M
- Legacy: Optional academic-year override string max length 7, e.g. 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:501-514`
- vNext now: Academic year start override number min1900 max9998 `src/app/(authenticated)/admin/batch-promotion/page.tsx:69-74`
- Fix: Support YYYY-YY entry and convert to yearStart for backend

## G2-9-028-028  [P1] GAP  facet F07  effort M
- Legacy: Preview fetch failure explains couldn't verify; disables promotion `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:191-205,527-548`
- vNext now: Unhandled preview exception outside batch-not-found fallback `src/app/(authenticated)/admin/batch-promotion/page.tsx:39-49`
- Fix: Catch unexpected preview errors with fail-closed local Retry

## G2-9-028-058  [P1] GAP  facet F19  effort L
- Legacy: Client loads all batches, paginates ten visible rows `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:47-72,442-449`
- vNext now: Loads all available cohorts, displays every row `src/modules/academics/college-batch-promotion-service.ts:41-74` `src/app/(authenticated)/admin/batch-promotion/page.tsx:87-105`
- Fix: Use server pagination for large colleges

## G2-9-022-015  [P1] GAP  facet F04  effort M
- Legacy: Students column currentStudents in legacy DTO `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:314-316`
- vNext now: Counts only ACTIVE learner-program enrollments `src/modules/academics/college-batch-promotion-service.ts:49-63` `src/app/(authenticated)/admin/batch-promotion/page.tsx:95-98`
- Fix: Reconcile old currentStudents semantics and label clearly

## G2-9-022-018  [P1] GAP  facet F05  effort M
- Legacy: Ant table default page size 10, size changer and row range `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:442-450`
- vNext now: Renders all cohorts in one DataTable without pagination `src/app/(authenticated)/admin/batch-promotion/page.tsx:35-36,87-105`
- Fix: Add 10-per-page pagination and size changer, server-side when large

## G2-9-022-019  [P1] GAP  facet F05  effort S
- Legacy: Initial active-only list, switch reveals all other statuses `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:30-32,114-119`
- vNext now: Default excludes Completed/Archived but includes Planned `src/app/(authenticated)/admin/batch-promotion/page.tsx:24,35-36`
- Fix: Use strict ACTIVE default filter

## G2-9-022-022  [P1] GAP  facet F06  effort M
- Legacy: Optional academic-year override string max length 7, e.g. 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:501-514`
- vNext now: Academic year start override number min1900 max9998 `src/app/(authenticated)/admin/batch-promotion/page.tsx:69-74`
- Fix: Support YYYY-YY entry and convert to yearStart for backend

## G2-9-022-028  [P1] GAP  facet F07  effort M
- Legacy: Preview fetch failure explains couldn't verify; disables promotion `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:191-205,527-548`
- vNext now: Unhandled preview exception outside batch-not-found fallback `src/app/(authenticated)/admin/batch-promotion/page.tsx:39-49`
- Fix: Catch unexpected preview errors with fail-closed local Retry

## G2-9-022-058  [P1] GAP  facet F19  effort L
- Legacy: Client loads all batches, paginates ten visible rows `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:47-72,442-449`
- vNext now: Loads all available cohorts, displays every row `src/modules/academics/college-batch-promotion-service.ts:41-74` `src/app/(authenticated)/admin/batch-promotion/page.tsx:87-105`
- Fix: Use server pagination for large colleges

## G2-9-028-026  [P2] GAP  facet F07  effort S
- Legacy: Bad override error Use consecutive years, e.g. 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:507-512`
- vNext now: Numeric range Zod and generic Invalid batch promotion filters `src/modules/academics/college-batch-promotion-model.ts:8-17` `src/app/(authenticated)/admin/batch-promotion/page.tsx:25-29`
- Fix: Give exact field-level format error

## G2-9-028-027  [P2] GAP  facet F07  effort M
- Legacy: Missing program warning includes max-semester refresh instructions `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:171-175`
- vNext now: Generic Batch unavailable state `src/app/(authenticated)/admin/batch-promotion/page.tsx:39-49,108-109`
- Fix: Give distinct parent-program error with Retry

## G2-9-022-026  [P2] GAP  facet F07  effort S
- Legacy: Bad override error Use consecutive years, e.g. 2026-27 `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:507-512`
- vNext now: Numeric range Zod and generic Invalid batch promotion filters `src/modules/academics/college-batch-promotion-model.ts:8-17` `src/app/(authenticated)/admin/batch-promotion/page.tsx:25-29`
- Fix: Give exact field-level format error

## G2-9-022-027  [P2] GAP  facet F07  effort M
- Legacy: Missing program warning includes max-semester refresh instructions `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:171-175`
- vNext now: Generic Batch unavailable state `src/app/(authenticated)/admin/batch-promotion/page.tsx:39-49,108-109`
- Fix: Give distinct parent-program error with Retry
