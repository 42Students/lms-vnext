# Work packet: edit src/modules/placements/tpo-company-create-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-company-controller.md

## G2-4-023-025  [P1] MISSING  facet F06  effort M
- Legacy: Legacy duplicate name can explicitly be `notTheSame=true` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-45,56-58`)
- vNext now: New creation checks case-insensitive name/primary domain and no override field (`src/modules/placements/company-service.ts:249-284`; `src/modules/placements/tpo-company-create-model.ts:4-8`)
- Fix: Provide conflict-safe distinct-company flow with explicit reason and canonical alias policy.

## G2-4-023-073  [P1] MISSING  facet F23  effort M
- Legacy: Legacy `/resolve` allows TPO to explicitly create distinct company despite same-name duplicate (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-45,52-58`)
- vNext now: New rejects identity conflict and cannot distinguish same-name separate employer (`src/modules/placements/company-service.ts:249-284`; `src/modules/placements/tpo-company-create-model.ts:4-8`)
- Fix: Build controlled distinct-name override with domains and duplicate review, not blanket creation.
