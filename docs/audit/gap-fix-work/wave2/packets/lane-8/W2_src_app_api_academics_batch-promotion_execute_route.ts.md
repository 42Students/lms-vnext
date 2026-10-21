# Work packet (wave 2): edit src/app/api/academics/batch-promotion/execute/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-2-029-005  [P2] GAP  facet F01  effort M
- Legacy: BatchController.java:159-227 POST promote and GET preview by batch ID.
- vNext now: src/app/api/academics/batch-promotion/execute/route.ts:9-26 and `college/batch-promotion/page.tsx:53-60` server preview.
- Fix: Map form preview/execute semantics and protect authorization on both routes.

## G2-9-028-039  [P3] GAP  facet F10  effort M
- Legacy: POST /api/v1/batch/{id}/promote target_semester,new_academic_year `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:243-249` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:158-184`
- vNext now: POST /api/academics/batch-promotion/execute expectedVersion,target,year,confirm `src/components/academics/college-promotion-confirmation.tsx:34-43` `src/app/api/academics/batch-promotion/execute/route.ts:8-25`
- Fix: Document required CAS payload and response

## G2-9-022-039  [P3] GAP  facet F10  effort M
- Legacy: POST /api/v1/batch/{id}/promote target_semester,new_academic_year `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:243-249` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:158-184`
- vNext now: POST /api/academics/batch-promotion/execute expectedVersion,target,year,confirm `src/components/academics/college-promotion-confirmation.tsx:34-43` `src/app/api/academics/batch-promotion/execute/route.ts:8-25`
- Fix: Document required CAS payload and response
