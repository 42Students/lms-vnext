# Work packet (wave 2): edit src/modules/placements/company-share/token-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/public-share-controller.md, docs/audit/gap2/lane-8/job-slug-generator.md

## G2-20-025-004  [P2] GAP  facet F04  effort M
- Legacy: Projects/skills columns docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:25
- vNext now: New chosen fields differ src/modules/placements/company-share/token-model.ts:10-16
- Fix: Map columns

## G2-20-025-012  [P2] GAP  facet F12  effort S
- Legacy: 7day expiry docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoShareService.java:14-16
- vNext now: Default2d src/modules/placements/company-share/token-model.ts:7-9
- Fix: Align default

## G2-8-010-013  [P2] GAP  facet F06  effort S
- Legacy: Validator accepts arbitrary `smr-` body length 1..28 (overall up to32), not generated fixed16 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:42-49`)
- vNext now: New company-share token validator requires exactly 43 base64url characters (`src/modules/placements/company-share/token-model.ts:4-6`)
- Fix: Preserve old validator acceptance for legacy tokens where migrated; canonical new input should enforce exact length

## G2-8-010-036  [P2] GAP  facet F20  effort S
- Legacy: Legacy isValidSlug allows `smr-` prefix and 1..28 suffix, case-sensitive regex (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobSlugGenerator.java:42-49`)
- vNext now: New company share token regex strict 43 chars base64url and hex digest (`src/modules/placements/company-share/token-model.ts:4-6,22-28`)
- Fix: Use separate validators per link family; never accept legacy slug as recruiter share proof
