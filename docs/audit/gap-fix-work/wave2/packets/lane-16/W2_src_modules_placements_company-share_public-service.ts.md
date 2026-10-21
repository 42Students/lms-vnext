# Work packet (wave 2): edit src/modules/placements/company-share/public-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/company-share-token.md, docs/audit/gap2/lane-17/public-job-response-dto.md, docs/audit/gap2/lane-20/public-share-controller.md

## G2-1-029-023  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:163: Table default order source applicant order, no explicit sorter.
- vNext now: src/modules/placements/company-share/public-service.ts:109-110: sorted by displayName then applicationId.
- Fix: Document and match expected default sort/row order.

## G2-1-029-046  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:156-163: downloaded list all loaded applicants, no 500 max.
- vNext now: src/modules/placements/company-share/public-service.ts:109-120: CSV capped at 500, truncation notice.
- Fix: Show truncation before export and paginate bulk dataset if consented.

## G2-17-021-038  [P2] GAP  facet F22  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/PublicJobResponseDTO.java:34-40 — EvaluationConfig and targeting deliberately excluded.
- vNext now: src/modules/placements/company-share/public-service.ts:42-63 — Company-share selects grant columns, not legacy public-job DTO.
- Fix: Review every public select field against explicit safe allowlist.

## G2-20-025-005  [P2] GAP  facet F05  effort S
- Legacy: Old full rows docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:184-201
- vNext now: Page25 CSV500 src/modules/placements/company-share/public-service.ts:100-120
- Fix: Show truncation

## G2-20-025-010  [P2] GAP  facet F10  effort S
- Legacy: Download event recorded docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:53-56
- vNext now: VIEW/CSV audit src/modules/placements/company-share/public-service.ts:108-113
- Fix: Map activity

## G2-20-025-019  [P2] GAP  facet F19  effort S
- Legacy: Unpaged legacy docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:184-201
- vNext now: Page25 export500 src/modules/placements/company-share/public-service.ts:100-120
- Fix: Show totals

## G2-20-025-022  [P2] GAP  facet F22  effort L
- Legacy: Old hashed share state docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:49-64
- vNext now: New token/lock tables src/modules/placements/company-share/public-service.ts:41-68
- Fix: Map DDL
