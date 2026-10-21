# Work packet (wave 2): edit src/modules/skills/catalog-validation.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u010-skills-search-controller.md, docs/audit/gap2/lane-4/skill-controller.md, docs/audit/gap2/lane-5/u016-skill-synonym.md

## G2-16-010-002  [P2] GAP  facet F01  effort S
- Legacy: SkillsSearchController.java:35-53 search defaults query empty, limit15.
- vNext now: catalog-validation.ts:3-8 same defaults via mode=search.
- Fix: Map /search path to mode=search and retain query parameter contract.

## G2-16-010-007  [P2] GAP  facet F03  effort S
- Legacy: SkillsSearchController.java:80-90 /category/{category} default limit50.
- vNext now: catalog-validation.ts:3-8 default 15, max50.
- Fix: Honor 50 default for category route compatibility.

## G2-16-010-022  [P2] GAP  facet F06  effort S
- Legacy: SkillsSearchController.java:58,84 category/popular mode default50/10 respectively.
- vNext now: catalog-validation.ts:3-8 universal 15.
- Fix: Set mode-specific defaults.

## G2-4-025-002  [P2] GAP  facet F01  effort S
- Legacy: GET `/search?query=&limit=15` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:57-76`)
- vNext now: GET mode=search with query/limit (`src/modules/skills/catalog-validation.ts:3-7,17-23`)
- Fix: Preserve legacy URL alias and wrapped response contract for deep links/client calls.

## G2-4-025-003  [P2] GAP  facet F01  effort S
- Legacy: GET `/popular?limit=10` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:78-94`)
- vNext now: Popular mode shares 15 default limit (`src/modules/skills/catalog-validation.ts:3-7`)
- Fix: Set popular default limit to 10, without changing search default 15.

## G2-4-025-004  [P2] GAP  facet F01  effort S
- Legacy: GET `/categories` and `/category/{category}?limit=50` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:137-171`)
- vNext now: Categories and category modes use one endpoint; default limit 15 (`src/modules/skills/catalog-validation.ts:4-10,17-23`)
- Fix: Retain category path alias and 50-result default.

## G2-4-025-020  [P2] GAP  facet F06  effort S
- Legacy: Search query may be omitted; arbitrary integer limit parsed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:62-64`)
- vNext now: Query max 80 and limit 1..50 (`src/modules/skills/catalog-validation.ts:3-10`)
- Fix: Decide safety bounds and show exact client validation; avoid silent truncation.

## G2-4-025-021  [P2] GAP  facet F06  effort S
- Legacy: Path category arbitrary text with default limit 50 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:155-160`)
- vNext now: Category required in category mode and max 50 (`src/modules/skills/catalog-validation.ts:6-10`)
- Fix: Show category constraint and full path encoding compatibility.

## G2-16-010-044  [P3] GAP  facet F17  effort S
- Legacy: SkillsSearchController.java:35-121 Swagger ApiOperation/ApiParam provides parameter help.
- vNext now: catalog-validation.ts:3-12 typed Zod parser, no public OpenAPI here.
- Fix: Document parameters/error modes for screen reader clients and API consumers.

## G2-5-016-043  [P3] GAP  facet F20  effort S
- Legacy: Legacy lowerCase uses JVM default locale `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SkillSynonym.java:31-34`
- vNext now: New query normalizes en-US then SQL lower() `src/modules/skills/catalog-validation.ts:24-30`
- Fix: Explicit Unicode and casefold parity tests.
