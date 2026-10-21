# Work packet (wave 2): edit src/app/api/college/batches/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-9/college-admin-batches.md, docs/audit/gap2/lane-9/superadmin-batches-component.md, docs/audit/gap2/lane-9/superadmin-batches.md

## G2-2-029-001  [P2] GAP  facet F01  effort M
- Legacy: BatchController.java:29-32 routes `/api/v1/batch`; `create` at :67-68.
- vNext now: src/app/api/college/batches/route.ts:11-19 POST `/api/college/batches`.
- Fix: Map legacy URL/response to new scoped route; preserve create navigation.

## G2-2-029-021  [P2] GAP  facet F04  effort S
- Legacy: BatchController.java:137-144 uses `{status:'OK',message:'OK',data:batches}` for program fetch.
- vNext now: src/app/api/college/batches/route.ts:19 uses `{cohort}` response; `cohort-service.ts:127-153` raw list.
- Fix: Map envelope variants and ensure client parser does not infer success from absent `.data`.

## G2-2-029-050  [P2] GAP  facet F10  effort L
- Legacy: BatchController.java:67-92 create; :261-302 update; :304-339 delete.
- vNext now: college/batches/route.ts:11-29, college/batches/[cohortId]/route.ts:15-48 use create/update/retire.
- Fix: Map all legacy mutation contracts, including archive-not-delete difference.

## G2-9-003-085  [P2] GAP  facet F21  effort M
- Legacy: Batches and learner/class endpoints Java REST (`docs/legacy-source/frontend/src/api/Services/AdminService.js:137-165`)
- vNext now: Cohort create route Next.js POST + Drizzle (`src/app/api/college/batches/route.ts:10-28`)
- Fix: Map integration contract for status, ID, and enrollment transfer.

## G2-9-029-044  [P2] GAP  facet F10  effort M
- Legacy: POST createBatch with camelCase batchName/programId/start/end/year/status `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:390-393`
- vNext now: POST /api/college/batches program UUID, startPeriodId, code, dates/year `src/app/api/college/batches/route.ts:8-26` `src/components/academics/college-cohort-management.tsx:70-85`
- Fix: Document required start period/code and default status differences

## G2-9-023-044  [P2] GAP  facet F10  effort M
- Legacy: POST createBatch with camelCase batchName/programId/start/end/year/status `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:390-393`
- vNext now: POST /api/college/batches program UUID, startPeriodId, code, dates/year `src/app/api/college/batches/route.ts:8-26` `src/components/academics/college-cohort-management.tsx:70-85`
- Fix: Document required start period/code and default status differences
