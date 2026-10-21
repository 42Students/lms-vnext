# Work packet (wave 3): edit src/modules/skills/catalog-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u010-skills-search-controller.md, docs/audit/gap2/lane-4/skill-controller.md

## G2-16-010-057  [P1] MISSING  facet F23  effort L
- Legacy: SkillsCache.java:357-367 fuzzy Levenshtein, 54-92 aliases; controller seven endpoints.
- vNext now: catalog-service.ts:23-27 explicitly documents missing v2 fuzzy and recent cache; route one GET.
- Fix: Close documented v2 parity backlog before marking controller equivalent.

## G2-4-025-081  [P1] MISSING  facet F23  effort L
- Legacy: Legacy fuzzy matching and typo tolerance (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:137-145,229-249`)
- vNext now: Service admits Levenshtein not implemented (`src/modules/skills/catalog-service.ts:23-27`)
- Fix: Add ranked fallback or have owner sign off intentionally reduced search.
