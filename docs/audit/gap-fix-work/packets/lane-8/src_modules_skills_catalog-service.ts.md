# Work packet: edit src/modules/skills/catalog-service.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u010-skills-search-controller.md, docs/audit/gap2/lane-4/skill-controller.md, docs/audit/gap2/lane-5/u016-skill-synonym.md

## G2-16-010-014  [P1] GAP  facet F05  effort L
- Legacy: SkillsCache.java:313-378 lookup exact then prefix then bounded fuzzy Levenshtein distance2 if fewer than5.
- vNext now: catalog-service.ts:70-115 SQL contains/prefix/synonym, no edit-distance fuzzy.
- Fix: Port distance≤2 fallback when matches below five; cap candidates and score.

## G2-16-010-015  [P1] GAP  facet F05  effort M
- Legacy: SkillsCache.java:54-92 expands 26 fixed shortcuts js,ts,py,cpp,k8s etc.
- vNext now: catalog-service.ts:76-85 persisted synonym table, no guaranteed legacy dictionary seed.
- Fix: Seed all fixed synonym aliases in active table and test expected matches.

## G2-16-010-032  [P1] GAP  facet F10  effort L
- Legacy: SkillsCache.java:35-39 on startup loads skills-data CSV or RTF.
- vNext now: catalog-service.ts:16-21 queries staged db10Skills table.
- Fix: Publish/seed immutable CSV dataset into registered migration before enabling endpoint.

## G2-16-010-037  [P1] MISSING  facet F12  effort M
- Legacy: SkillsCache.java:357-367 fuzzy only when fewer than five prefix matches, query len>=3.
- vNext now: catalog-service.ts:99-115 no fuzzy search.
- Fix: Add deterministic fuzzy fallback threshold and distance cap.

## G2-16-010-052  [P1] GAP  facet F21  effort L
- Legacy: SkillsSearchController.java:19-20 in-memory-only search no database.
- vNext now: catalog-service.ts:29-31 DB dependency, 503 if schema flag absent.
- Fix: Provide seeded DB and readiness monitor, or fallback local catalog.

## G2-16-010-054  [P1] GAP  facet F22  effort L
- Legacy: SkillUsageTracker.java:46-55 runtime MySQL skill_usage string PK/count/last_used.
- vNext now: src/db/schema/db10-skills-catalog.draft.ts and catalog-service.ts:5-9 Postgres db10SkillUsage.
- Fix: Register migration for catalog/synonyms/usage with constraints and seed.

## G2-4-025-017  [P1] GAP  facet F05  effort L
- Legacy: When fewer than 3 search results, try full-text then persisted synonyms; fuzzy only if zero (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:118-145`)
- vNext now: Single union query; no staged fallbacks/fuzzy (`src/modules/skills/catalog-service.ts:70-115`)
- Fix: Implement tiered fallbacks including typo-distance ≤2 or formally approve changed relevance.

## G2-4-025-018  [P1] GAP  facet F05  effort M
- Legacy: Popular sorted by skills.usage_count DESC, displayName ASC (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillRepository.java:74-75`)
- vNext now: Uses skill_usage first, then skills.usage_count (`src/modules/skills/catalog-service.ts:49-66`)
- Fix: Choose v1 vs v2 feed deliberately; expose separate popular endpoints if needed.

## G2-4-025-045  [P1] GAP  facet F12  effort M
- Legacy: Hardcoded abbreviations e.g. js→javascript, py→python, k8s→kubernetes before query (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:31-82,101-115`)
- vNext now: No COMMON_SYNONYMS expansion; only DB synonym records (`src/modules/skills/catalog-service.ts:70-113`)
- Fix: Seed/retain all legacy synonym mapping, with deterministic fallback.

## G2-4-025-046  [P1] GAP  facet F12  effort L
- Legacy: Fuzzy Levenshtein edit distance ≤2, popularity tie-break (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:229-249`)
- vNext now: No fuzzy edit-distance fallback (`src/modules/skills/catalog-service.ts:70-115`)
- Fix: Add bounded typo tolerance without massive DB scans.

## G2-5-016-019  [P2] GAP  facet F08  effort M
- Legacy: Legacy loader logs added/missing skill counts `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/SynonymDataLoader.java:119-160`
- vNext now: New read service has no synonym import/report path `src/modules/skills/catalog-service.ts:17-38`
- Fix: Expose migration/import diagnostics for unmatched aliases.

## G2-4-025-030  [P3] GAP  facet F08  effort S
- Legacy: Popular success `Popular skills retrieved successfully` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:83-87`)
- vNext now: Bare `{items}`; no message (`src/modules/skills/catalog-service.ts:49-67`)
- Fix: Restore legacy success message for compatible caller.

## G2-4-025-031  [P3] GAP  facet F08  effort S
- Legacy: Category list success `Categories retrieved successfully` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:139-144`)
- vNext now: Bare `{categories}` (`src/modules/skills/catalog-service.ts:32-38`)
- Fix: Include legacy status/message in alias.
