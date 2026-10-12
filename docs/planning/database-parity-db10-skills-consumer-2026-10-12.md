# W06 / DB10 — Shared Skills Catalog consumer handoff (2026-10-12)

**Implementation scope:** `42Students/lms-vnext`, W06 issue [#26](https://github.com/42Students/lms-vnext/issues/26). Source comparison: legacy backend `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, frontend `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`. This is source-authored **not PostgreSQL-verified**.

## Source jobs reconciled

- Legacy `SkillRepository`, `SkillController`, and `SkillSearchService`: exact name > prefix name > prefix display > contains with popularity boost, search priority, categories, persisted synonyms, active-only results.
- Legacy `SkillsCache`, `SkillsSearchController`, `SkillUsageTracker`: search/popular/categories/category; synonym and fuzzy search; two **independent** popularity representations `skills.usage_count` and `skill_usage.usage_count`. These must not be blindly merged.
- Legacy FE `SkillsAutocomplete.jsx`, `SkillService.js`: profile section uses search, popular and category results; local Recent values/proficiency picker, Add/Remove chips and v2 `/select` usage recording remain **W02 page producer/consumer work**, not replaced by a read-only API.

## W06 code-authored consumer contract

- `GET /api/skills?mode=search&query=java&limit=15` → `{items: [{id,name,displayName,category}]}`.
- `GET /api/skills?mode=popular&limit=10` → `{items: [...]}`. Separate `skill_usage` is primary v2 popularity ranking, catalog `skills.usage_count` is fallback/tie.
- `GET /api/skills?mode=categories` → `{categories: string[]}`, active-only; `mode=category&category=Technical%20Skills&limit=50` → active-only items.
- Literal case-insensitive search (including `%`, `_`, punctuation); persisted synonym prefix/substring expansion via correlated `exists` (not a duplicate-returning join); bounded 1–50 results with deterministic score, shorter-name and display/ID ties.
- The catalog is global (not a college-scoped people directory), but every request requires an active authenticated College membership, active recruiter grant or active Super Admin system role. Response is `private, no-store`; no public write endpoint.
- Every HTTP request **fails 503 `DB10_SKILLS_MIGRATIONS_PENDING`** unless `DB10_SKILLS_READY=DB10_VERIFIED`. All read services use isolated unregistered `db10-skills-catalog.draft.ts` directly and do not touch `src/db/schema/index.ts` or `drizzle/**`.
- Invalid query/limit/category produce 400, inactive user returns 403. No plaintext SQL LIKE wildcard expansion; all input is parameterized in Drizzle SQL.

## Tests / migration handoff

| Evidence | State |
| --- | --- |
| `tests/unit/db10-skills-catalog.test.ts` source-authored unit scope/query cases | **NOT RUN** |
| `tests/db10-skills-route-gates.test.mjs` source-assertions for disabled gate + safe imports | **NOT RUN** |
| `tests/integration/db10-skills-catalog.test.ts` seeded disposable PG synonym, ranking, popularity and category suite | **NOT RUN / MIGRATION_BLOCKED** |
| TypeScript, lint, Next build, Playwright | **NOT RUN** |
| Legacy 3 table / individual field semantics + PostgreSQL replay | **NOT VERIFIED** |

**W01 / #21 must** approve and register/migrate the three DB10 skills draft tables, check typed names/indices, test schema replay and shared barrel export. `DB10_SKILLS_READY` must remain unset until the deployment and PG integration suite are verified; never set merely to make a demo render.

**W02 / #22 must** integrate the shared consumer into learner/faculty/profile autocomplete, protect sensitive profile and selection mutations under W01's authorization and preserve recent skills, proficiency, exact UI states. Explicitly resolve legacy in-memory fuzzy search and v1/v2 usage recording before claiming end-to-end parity. No fake `recordSelection` endpoint was exposed.

**Remaining DB10:** the catalog is a consumer-only source stage, not evidence of 0→verified advancement. Source snapshots for DB10 remain 19 legacy table candidates / 221 fields, zero PostgreSQL-semantic-verified. Feature remains OFF; all verification gates OPEN.
