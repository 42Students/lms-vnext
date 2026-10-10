# DB-022 — DB10 skill taxonomy and usage source-contract correction

**Date:** 2026-10-11 · **Worker:** Chat 5 · **Phase:** DATABASE  
**Oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`: `model/Skill.java`, `model/SkillSynonym.java`, `repository/SkillRepository.java`, `service/SkillSearchService.java` and `skills/SkillUsageTracker.java`.  
**Status:** SOURCE_REVIEWED / DRAFT_NOT_JOURNALLED / POSTGRES_NOT_RUN. All 15 DB10 skills-family historical fields remain **runtime UNVERIFIED**.

## Two source-level parity bugs found in the earlier draft

**1. Incorrect synonym uniqueness.** The earlier `db10_skill_synonyms_value_uq` unique expression on `lower(synonym)` would forbid one synonym referencing multiple skills. Legacy `SkillSynonym` has a regular nonunique index, and `SkillRepository.searchBySynonym` returns `SELECT DISTINCT s.* ... WHERE lower(synonym) LIKE prefix`, which can legitimately match several skills. The draft now has a **nonunique functional search index**, plus a skill FK and index. Repeated pairs are also not prohibited by the legacy schema; do not silently add a stronger constraint without product sign-off.

**2. Incorrect popularity-counter collapse.** Legacy has both `skills.usage_count` and a separate runtime-created `skill_usage(skill_name,usage_count,last_used)`. `SkillRepository.incrementUsageCount` increments the canonical catalog counter for rank/search; `SkillUsageTracker.recordUsage` separately writes a lowercase free-text name counter and `getPopularSkills` reads that counter before resolving a catalog skill. Those are **different writers and different ranking consumers**. Collapsing them changes behavior and discards the ability to track unknown skill-name strings. The draft now keeps `db10SkillUsage` with the legacy name key, independent count and last-used timestamp; **no FK to skills**.

## Exact source inventory and proposal

| Legacy table | Historical fields | vNext draft | Intent |
|---|---:|---|---|
| `skills` | 9 | `db10Skills` | UUID ID, normalized unique name, display name/category, active flag, catalog usage count, manual search priority 0–100, created/updated timestamps |
| `skill_synonyms` | 3 | `db10SkillSynonyms` | UUID ID, restrict-FK to catalog skill, lowercased alias lookup with nonunique index |
| `skill_usage` | 3 | `db10SkillUsage` | Free-text normalized name as PK, separate nonnegative usage count and last-used timestamp; independent of catalog row |

**Artifacts:** `src/db/schema/db10-skills-catalog.draft.ts` and `scripts/sql/db10-skills-catalog-staging.sql`. Both remain **unexported and outside the numbered Drizzle journal**. Chat 1 must reconcile the migration snapshot, journal, Drizzle definitions and SQL in one integration change.

The PostgreSQL draft uses `lower(name)` unique catalog lookup, nonnegative counters, nonempty names/synonyms, bounded manual priority and restrict FK for the synonym's catalog parent. It intentionally does **not** prohibit two skills sharing an alias. Its `skill_usage` key has no catalog FK because legacy `SkillUsageTracker` can store unknown free-text terms.

## PostgreSQL and product regressions — NOT RUN

- **DB22-01:** two skill rows may have synonym `js`; `js` lookup returns both active skills, never a unique violation.
- **DB22-02:** lookup with inactive parent skill does not surface it even when alias matches.
- **DB22-03:** case-insensitive `skills.name` uniqueness rejects `JavaScript` and `javascript` duplicates.
- **DB22-04:** one catalog `skills.usage_count` increment does not change `skill_usage.usage_count`, and vice versa.
- **DB22-05:** independent `skill_usage` row for an unknown free-text name inserts and increments safely.
- **DB22-06:** race 20 concurrent `INSERT..ON CONFLICT DO UPDATE` free-text increments; exactly 20 are recorded with no lost updates.
- **DB22-07:** negative usage/priority, blank name/alias and missing skill parent fail direct SQL constraints.
- **DB22-08:** source search relevance keeps exact/prefix/contains, catalog popularity and priority, then synonym fallback and category/active filtering; v2 name usage ranking stays independent.
- **DB22-09:** fresh PostgreSQL migration replay and Drizzle catalog/index parity succeeds; all tenant/security invariants remain satisfied.

No Node, TypeScript, PostgreSQL, CI or browser test was executed in this task; authored static guard is not runtime evidence. Product-facing service/API/search implementation belongs to the later global API phase after database certification. The DATABASE task is implementation-staged only, **not DONE_VERIFIED**, and does not prove the other DB10 notification/log-alert/template families.

## Integrator handoff

Chat 1 must add the three skill tables in dependency order (`skills`, `skill_synonyms`, `skill_usage`), preserve distinct counters and nonunique alias semantics, update the schema barrel and migration journal, then execute catalog/duplicate/synonym/usage race tests on disposable PostgreSQL. DB-019 independently dispositions all 15 historical fields. Do not mark any as runtime-verified based on source-only schema presence.
