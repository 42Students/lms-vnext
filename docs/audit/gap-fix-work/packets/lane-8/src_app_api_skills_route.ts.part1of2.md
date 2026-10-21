# Work packet: edit src/app/api/skills/route.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u016-skill-synonym.md, docs/audit/gap2/lane-16/u010-skills-search-controller.md, docs/audit/gap2/lane-4/skill-controller.md

## G2-5-016-001  [P0] GAP  facet F01  effort L
- Legacy: Global skill alias entity behind skills search, no standalone route `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SkillSynonym.java:9-15`
- vNext now: New read-only catalog at /api/skills, gated until DB10 verified `src/app/api/skills/route.ts:12-23`
- Fix: Register and replay verified DB10 skills migration, then enable catalog.

## G2-16-010-001  [P1] GAP  facet F01  effort M
- Legacy: SkillsSearchController.java:22-27 serves /api/v2/skills, CORS approved domains.
- vNext now: src/app/api/skills/route.ts:10-13 exposes /api/skills GET under app context.
- Fix: Provide compatibility redirect/adapter for six old endpoint paths and documented clients.

## G2-16-010-004  [P1] GAP  facet F02  effort M
- Legacy: SkillsSearchController.java:35-121 seven public methods, no screen UI.
- vNext now: src/app/api/skills/route.ts:13-35 one query-mode endpoint only.
- Fix: Expose documented public skills API families through compatibility handlers.

## G2-16-010-009  [P1] MISSING  facet F03  effort M
- Legacy: SkillsSearchController.java:92-100 select POST increments usage.
- vNext now: src/app/api/skills/route.ts:13-35 GET only.
- Fix: Implement authenticated POST skill selection with same-origin CSRF and usage counter.

## G2-16-010-031  [P1] GAP  facet F10  effort L
- Legacy: SkillsSearchController.java:35-121 GET search/popular/categories/category/stats/exists, POST select.
- vNext now: src/app/api/skills/route.ts:13-35 GET one endpoint with mode and runtime gate.
- Fix: Implement all seven v2 operations and preserve read/selection HTTP semantics.

## G2-16-010-034  [P1] GAP  facet F11  effort M
- Legacy: SkillsSearchController.java:26 open CORS specific frontend origins incl localhost.
- vNext now: src/app/api/skills/route.ts:21-24 current request context and catalog permission required.
- Fix: Decide public autocomplete entitlement and auth enforcement for profile candidates.

## G2-16-010-035  [P1] GAP  facet F11  effort M
- Legacy: SkillsSearchController.java:92-100 unauthenticated POST select increments global usage.
- vNext now: src/app/api/skills/route.ts:13-35 GET only.
- Fix: Keep selection event behind approved rate-limited auth to avoid abuse; document hardening.

## G2-16-010-038  [P1] MISSING  facet F12  effort M
- Legacy: SkillUsageTracker.java:87-105 async insert/upsert records selection usage.
- vNext now: src/app/api/skills/route.ts:13-35 no mutation.
- Fix: Add idempotent usage write per valid POST, safe retry handling.

## G2-16-010-039  [P1] GAP  facet F13  effort M
- Legacy: SkillsCache.java:113-145 CSV read failure tries RTF generation, not fatal.
- vNext now: src/app/api/skills/route.ts:14-19 DB10 migration pending returns 503.
- Fix: Seed and gate availability before release, show explicit unavailable suggestion state.

## G2-16-010-050  [P1] MISSING  facet F20  effort M
- Legacy: SkillUsageTracker.java:87-105 @Async usage merge concurrent, DB upsert.
- vNext now: src/app/api/skills/route.ts:13-35 no write endpoint.
- Fix: Use atomic DB counter with concurrency safe retry.

## G2-4-025-022  [P1] MISSING  facet F06  effort M
- Legacy: Batch POST JSON `{skillIds:[integers]}`; null/empty accepted as success (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:114-125`)
- vNext now: No POST or selection payload validator (`src/app/api/skills/route.ts:12-36`)
- Fix: Implement authenticated POST with array validation and empty-batch idempotence.

## G2-4-025-037  [P1] MISSING  facet F10  effort M
- Legacy: POST /{skillId}/select increments usage asynchronously (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:96-111`)
- vNext now: No selection POST; autocomplete selects without usage event (`src/app/api/skills/route.ts:12-36`)
- Fix: Add secure usage-update endpoint; call on confirmed catalogue selection.

## G2-4-025-038  [P1] MISSING  facet F10  effort M
- Legacy: POST /select/batch increments each unique matched ID once using `IN` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:114-133`)
- vNext now: No batch mutation (`src/app/api/skills/route.ts:12-36`)
- Fix: Add batch route with validated ID list, preserve set semantics.

## G2-4-025-051  [P1] GAP  facet F13  effort L
- Legacy: Read failure responds HTTP 500 with explicit envelope (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:65-75`)
- vNext now: Feature flag off returns HTTP 503 `DB10_SKILLS_MIGRATIONS_PENDING` (`src/app/api/skills/route.ts:14-19`)
- Fix: Register/replay DB10 and ensure normal reads available; show outage state until then.

## G2-4-025-080  [P1] MISSING  facet F23  effort M
- Legacy: Legacy v1 seven public read/selection paths all in one controller (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:57-171`)
- vNext now: New API read-only, drops legacy mutation endpoints (`src/app/api/skills/route.ts:12-36`)
- Fix: Track dropped POSTs as explicit product decision, not accidental parity.

## G2-5-016-016  [P1] GAP  facet F07  effort S
- Legacy: Legacy search failure message 'Failed to search skills. Please try again or contact support.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:49-62`
- vNext now: New returns DB10_SKILLS_MIGRATIONS_PENDING HTTP503 `src/app/api/skills/route.ts:13-23`
- Fix: Provide useful unavailable/search-retry UI message.

## G2-5-016-023  [P1] GAP  facet F10  effort M
- Legacy: Loader runs ordered after skill seed and inserts absent synonyms `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/SynonymDataLoader.java:13-20,109-160`
- vNext now: New route returns 503 while migration pending `src/app/api/skills/route.ts:13-23`
- Fix: Replay curated synonym seed after parent skills migration.

## G2-5-016-030  [P1] GAP  facet F13  effort S
- Legacy: Legacy loader disabled by default, skips with log `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/SynonymDataLoader.java:109-115`
- vNext now: New skill API disabled with 503 until ready marker `src/app/api/skills/route.ts:13-23`
- Fix: Separate read readiness and alias bootstrap flags.

## G2-16-010-027  [P2] MISSING  facet F07  effort S
- Legacy: SkillsSearchController.java:118-120 exists on absent returns false.
- vNext now: src/app/api/skills/route.ts:13-35 returns invalid query if mode differs; endpoint missing.
- Fix: Return false for unknown skill instead of 404 in exists route.

## G2-4-025-024  [P2] GAP  facet F07  effort S
- Legacy: 500 search error: `Failed to search skills. Please try again or contact support.` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:70-75`)
- vNext now: Generic apiErrorResponse; UI generic catalog-unavailable (`src/app/api/skills/route.ts:30-35`)
- Fix: Map backend failure to exact user-facing message and meaningful retry.
