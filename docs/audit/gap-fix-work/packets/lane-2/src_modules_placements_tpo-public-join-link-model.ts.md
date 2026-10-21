# Work packet: edit src/modules/placements/tpo-public-join-link-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u022-tpo-public-link.md, docs/audit/gap2/lane-8/job-slug-generator.md

## G2-16-022-010  [P1] GAP  facet F06  effort M
- Legacy: TpoPublicLinkController.java:24-27 enabled and postDirect nullable fields.
- vNext now: tpo-public-join-link-model.ts:50-53 only enabled boolean.
- Fix: Add independent validated posting policy field.

## G2-8-010-014  [P2] GAP  facet F07  effort S
- Legacy: Null or length <4 validator returns false; other invalid values return false rather than throw (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:42-49`)
- vNext now: Zod public-join change schema throws parse issues for invalid action/scope/confirmation (`src/modules/placements/tpo-public-join-link-model.ts:3-24; src/modules/placements/tpo-public-join-link-service.ts:93-95`)
- Fix: Map invalid legacy job slug to stable not-found/invalid-link response without disclosing internals
