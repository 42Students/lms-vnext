# Work packet: edit src/app/api/academics/batch-promotion/execute/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-batch-promotion.md, docs/audit/gap2/lane-2/batch-controller.md

## G2-9-002-046  [P1] MISSING  facet F10  effort M
- Legacy: PUT /api/v1/batch/update/{id} status COMPLETED for graduation (`docs/legacy-source/frontend/src/api/Services/AdminService.js:160-163`)
- vNext now: Only POST execute PROMOTE, no graduation endpoint here (`src/app/api/academics/batch-promotion/execute/route.ts:7-25`)
- Fix: Connect page to secure graduation service with comparable guard.

## G2-9-002-078  [P1] MISSING  facet F20  effort M
- Legacy: Graduation in-flight ref prevents double submit (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:129-169`)
- vNext now: Execute API only supports PROMOTE (`src/app/api/academics/batch-promotion/execute/route.ts:7-26`)
- Fix: Wire separate idempotent graduation action with pending guard.

## G2-2-029-037  [P2] GAP  facet F07  effort M
- Legacy: BatchController.java:187-203 promotion catches IllegalArgumentException=400/404, IllegalStateException=409, general=500.
- vNext now: batch-promotion/execute/route.ts:18-25 maps blocked/preview/stale to 409 and not-found 404.
- Fix: Map blocker messages into helpful inline copy and preserve 404/409 distinction.

## G2-9-002-031  [P2] GAP  facet F07  effort M
- Legacy: DTO Pattern error Academic year must use YYYY-YY format... (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchPromotionDTO.java:10-19`)
- vNext now: Generic apiErrorResponse or execute error (`src/app/api/academics/batch-promotion/execute/route.ts:10-26`)
- Fix: Map invalid year to precise user-facing message.
