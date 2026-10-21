# Work packet (wave 2): edit src/modules/skills/catalog-service.ts

31 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u010-skills-search-controller.md, docs/audit/gap2/lane-4/skill-controller.md, docs/audit/gap2/lane-5/u016-skill-synonym.md, docs/audit/gap2/lane-6/skill.md

## G2-16-010-003  [P2] GAP  facet F01  effort S
- Legacy: SkillsSearchController.java:55-70 /popular standalone GET with default limit10.
- vNext now: catalog-service.ts:48-68 mode=popular but route default limit15.
- Fix: Set mode-specific default 10 for popular alias.

## G2-16-010-006  [P2] GAP  facet F03  effort S
- Legacy: SkillsSearchController.java:72-78 categories returns list of strings.
- vNext now: catalog-service.ts:32-38 returns object {categories}.
- Fix: Preserve Response envelope and array inside data.

## G2-16-010-016  [P2] GAP  facet F05  effort M
- Legacy: SkillsCache.java:383-405 word-prefix in multiword displayName score60.
- vNext now: catalog-service.ts:86-96 lacks word-token prefix tier.
- Fix: Implement word-boundary prefix score60 in ranking.

## G2-16-010-017  [P2] GAP  facet F05  effort M
- Legacy: SkillsCache.java:383-405 score exact100/display95/prefix80/display75/word60/contains40/35.
- vNext now: catalog-service.ts:86-97 score100/name80/display70/synonym60/contains40/display30 and boosts.
- Fix: Match score and tie ordering for v2 query, keep v1 as separate mode if needed.

## G2-16-010-018  [P2] GAP  facet F05  effort M
- Legacy: SkillsCache.java:411-437 popular fallback list fixed order Java/Python/JS/React..., alphabetically fill.
- vNext now: catalog-service.ts:48-68 ranks usage_count then db catalog, alphabetic fallback.
- Fix: Implement fixed fallback when no tracked usage, then sorted catalog.

## G2-16-010-019  [P2] GAP  facet F05  effort M
- Legacy: SkillUsageTracker.java:129-154 popular by in-memory count desc and fallback cache.
- vNext now: catalog-service.ts:48-68 persists DB usage and catalog count fallback.
- Fix: Preserve v2 popularity ranking, confirm ties and cache update.

## G2-16-010-036  [P2] GAP  facet F12  effort M
- Legacy: SkillsCache.java:313-337 exact match returns exact first and prefix list without scored sort.
- vNext now: catalog-service.ts:86-115 full score+priority sort.
- Fix: Separate exact-first v2 ranking semantics.

## G2-16-010-040  [P2] GAP  facet F13  effort S
- Legacy: SkillsSearchController.java:55-69 if no tracked popularity cache fallback fixed skills.
- vNext now: catalog-service.ts:48-68 zero usage orders catalog usageCount/displayName, not fixed list.
- Fix: Restore fallback defaults for empty tracking.

## G2-16-010-041  [P2] GAP  facet F14  effort L
- Legacy: SkillsCache.java:113-145 loads CSV file; 149-262 RTF fallback writes CSV.
- vNext now: catalog-service.ts:16-21 reads DB; no runtime CSV export/import.
- Fix: Create one-time safe seed/migration preserving original skill labels.

## G2-16-010-048  [P2] GAP  facet F19  effort M
- Legacy: SkillsCache.java:94-108 startup indexes, then memory lookup O(1)/prefix.
- vNext now: catalog-service.ts:29-115 query DB per request.
- Fix: Add bounded DB index/trigram or safe cache for performance at autocomplete typing rates.

## G2-16-010-049  [P2] GAP  facet F19  effort M
- Legacy: SkillsCache.java:273-294 prefixIndex max5 chars.
- vNext now: catalog-service.ts:72-80 left(name,length(q)) expression without prebuilt prefix index.
- Fix: Evaluate SQL indexes and bounded query plans at scale.

## G2-16-010-053  [P2] GAP  facet F21  effort L
- Legacy: SkillsCache.java:35-39 CSV/RTF resource location configured.
- vNext now: catalog-service.ts:16-21 Draft Drizzle table rather than classpath.
- Fix: Define seed data import parity to retain skill names/categories.

## G2-16-010-055  [P2] GAP  facet F22  effort M
- Legacy: SkillsCache.java:42-53 names, display, category; DTO skill id unknown.
- vNext now: catalog-service.ts:16-21 selects id,name,displayName,category.
- Fix: Verify exact SkillDTO serialized fields and ID mapping.

## G2-4-025-012  [P2] GAP  facet F04  effort S
- Legacy: Each result id/name/displayName/category/usageCount/isPopular(usageCount>100) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/SkillSearchDTO.java:19-41`)
- vNext now: Only id/name/displayName/category returned (`src/modules/skills/catalog-service.ts:16-21,53-67`)
- Fix: Expose usageCount and isPopular or document removal from consumer contract.

## G2-4-025-016  [P2] GAP  facet F05  effort M
- Legacy: Exact name 100 > prefix 80 > display prefix 70 > name contains 40; boost usage+priority; length and display tie-break (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillRepository.java:30-50`)
- vNext now: Adds synonym prefix 60, display contains 30 and id tie-break (`src/modules/skills/catalog-service.ts:86-113`)
- Fix: Test ranking examples and specify whether new synonym tiers intentionally alter v1 result ordering.

## G2-4-025-047  [P2] GAP  facet F12  effort S
- Legacy: `isPopular` true only when usageCount>100 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/SkillSearchDTO.java:34-41`)
- vNext now: No computed isPopular (`src/modules/skills/catalog-service.ts:16-21`)
- Fix: Compute strict >100 legacy threshold in result adapter.

## G2-4-025-066  [P2] GAP  facet F19  effort L
- Legacy: Fuzzy fallback scans cached active skill set; expensive first load (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:229-256`)
- vNext now: Server query capped at input limit 1..50 (`src/modules/skills/catalog-service.ts:99-115`)
- Fix: Benchmark typo search with bound/indices; document intentional no full-table scan.

## G2-4-025-072  [P2] GAP  facet F21  effort M
- Legacy: Spring Cacheable and @Async on usage writes (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:95-99,151-158,184-205`)
- vNext now: Direct Drizzle read, no background popularity handler (`src/modules/skills/catalog-service.ts:29-115`)
- Fix: Define async event/counter service only if tracking retained.

## G2-5-016-004  [P2] GAP  facet F03  effort M
- Legacy: Legacy autocomplete shows name, category and already-selected badge `docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:121-166`
- vNext now: New projection has name/displayName/category but no already-selected state `src/modules/skills/catalog-service.ts:17-25`
- Fix: Restore selected flag, category badges and icons in consumer.

## G2-5-016-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy Recent/Popular headings with icon and count `docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:168-218`
- vNext now: Catalog emits popular items without section headings `src/modules/skills/catalog-service.ts:39-55`
- Fix: Render Recent and Popular labeled groups with exact counts.

## G2-5-016-009  [P2] GAP  facet F05  effort M
- Legacy: findBySynonymIgnoreCase exact search returns multiple synonyms `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillSynonymRepository.java:22-28`
- vNext now: New catalog queries prefix and substring aliases via EXISTS `src/modules/skills/catalog-service.ts:71-86`
- Fix: Provide exact-match lookup for administrative/dedupe use.

## G2-5-016-010  [P2] GAP  facet F05  effort M
- Legacy: Legacy prefix-alias search ordered by skill usage count DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillRepository.java:93-105`
- vNext now: New alias prefix hit scored alongside canonical and contains matches `src/modules/skills/catalog-service.ts:71-107`
- Fix: Validate exact search relevance against old tiering/popularity.

## G2-5-016-011  [P2] MISSING  facet F05  effort M
- Legacy: findBySkillId lists aliases for one skill `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillSynonymRepository.java:13-18`
- vNext now: New catalog has no list-alias-by-skill endpoint `src/modules/skills/catalog-service.ts:17-25`
- Fix: Add restricted alias read endpoint for editing/deduplication.

## G2-5-016-022  [P2] MISSING  facet F10  effort M
- Legacy: Repository findBySkillId, existsBySynonym, findBySynonymIgnoreCase `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillSynonymRepository.java:13-28`
- vNext now: New service only consults aliases via correlated EXISTS `src/modules/skills/catalog-service.ts:71-86`
- Fix: Implement query-by-parent/existence operations for importer.

## G2-5-016-024  [P2] GAP  facet F10  effort M
- Legacy: Legacy search tries synonym stage after ranked/full-text stage `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:80-130`
- vNext now: New single SQL query combines matches in score `src/modules/skills/catalog-service.ts:71-107`
- Fix: Compare tier ordering and duplicate handling; document intentional changes.

## G2-5-016-031  [P2] GAP  facet F13  effort M
- Legacy: Legacy skill search catches unavailable synonym table and continues fallback `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:80-130`
- vNext now: New search always references synonym table when enabled `src/modules/skills/catalog-service.ts:71-86`
- Fix: Define failure/recovery for incomplete migration.

## G2-5-016-042  [P2] GAP  facet F19  effort M
- Legacy: Legacy prefix alias query limits and orders by usage count `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillRepository.java:93-105`
- vNext now: New score sort then max50 results `src/modules/skills/catalog-service.ts:87-107`
- Fix: Profile matching/latency at 10k+ skills and compare ranking.

## G2-6-016-055  [P2] GAP  facet F21  effort M
- Legacy: Legacy search caches via @Cacheable and exposes guarded eviction (SkillSearchService.java:95-98; SkillController.java:175-193).
- vNext now: New no-store response and DB SELECT (route.ts:25-29; catalog-service.ts:29-35).
- Fix: Decide cache freshness/popularity invalidation vs no-store tradeoff; document and benchmark.

## G2-16-010-011  [P3] GAP  facet F04  effort S
- Legacy: SkillsSearchController.java:67-69 message Popular skills retrieved.
- vNext now: catalog-service.ts:67 returns {items} no message.
- Fix: Restore legacy text for compatibility client.

## G2-16-010-012  [P3] GAP  facet F04  effort S
- Legacy: SkillsSearchController.java:74-77 Categories retrieved.
- vNext now: catalog-service.ts:37 returns categories only.
- Fix: Restore wrapper and message.

## G2-16-010-046  [P3] GAP  facet F18  effort S
- Legacy: SkillsSearchController.java:68 Popular skills retrieved, 76 Categories retrieved.
- vNext now: catalog-service.ts:37,67 only categories/items values.
- Fix: Restore exact envelope messages.
