# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/skill.md

10 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/skill.md

## G2-6-016-023  [P1] GAP  facet F06  effort L
- Legacy: Legacy allows allowProficiency, disabled, showPopular, showRecent, maxResults props (SkillsAutocomplete.jsx:23-42).
- vNext now: New props only value string + onChange (learner-skill-catalog-input.tsx:7-8).
- Fix: Restore configurable multi-skill/proficiency/disabled/popular/recent props at consumer layer.

## G2-6-016-024  [P1] GAP  facet F06  effort L
- Legacy: Legacy selected value is array of skill/proficiency/skillId objects (SkillsAutocomplete.jsx:23-25,33-48).
- vNext now: New value is a single string (learner-skill-catalog-input.tsx:7-8).
- Fix: Support multiple selected skills and stable IDs and proficiency, with preservation on edit.

## G2-6-016-027  [P1] GAP  facet F07  effort M
- Legacy: Search v1 failure 500 exact message Failed to search skills. Please try again or contact support. (SkillController.java:70-75).
- vNext now: Runtime 503 DB10_SKILLS_MIGRATIONS_PENDING; route maps Zod to INVALID_REQUEST (route.ts:14-18,30-34).
- Fix: Add friendly localized UI error while honoring genuine 503; do not enable until migration registered.

## G2-6-016-031  [P1] MISSING  facet F08  effort M
- Legacy: Legacy selects return Selection recorded, batch Selections recorded (SkillController.java:96-132).
- vNext now: New GET-only, no selection response (route.ts:12-36).
- Fix: Implement permissioned POST selection tracking and exact success/error UX.

## G2-6-016-033  [P1] MISSING  facet F10  effort M
- Legacy: On select legacy v1 increments skills.usage_count atomically by ID (SkillRepository.java:77-91; SkillController.java:96-132).
- vNext now: New catalog read-only (route.ts:12-36).
- Fix: Add POST selection with atomic increment, rate controls and a clear consumer binding.

## G2-6-016-034  [P1] MISSING  facet F10  effort M
- Legacy: v2 selects records free-text skill usage (SkillsSearchController.java:92-101).
- vNext now: Draft separate skill_usage table exists but no route writer (db10-skills-catalog.draft.ts:82-99; route.ts:12-36).
- Fix: Implement dedicated free-text usage writer preserving independent counters.

## G2-6-016-038  [P1] GAP  facet F11  effort M
- Legacy: Superadmin required for RTF load and cache eviction (SkillController.java:175-181,226-231).
- vNext now: New read-only endpoint has no admin mutation route (route.ts:12-36).
- Fix: Admin-only import/refresh route must require same system role and CSRF protections.

## G2-6-016-052  [P1] MISSING  facet F20  effort M
- Legacy: Legacy atomic usageCount increments on select (SkillRepository.java:77-91).
- vNext now: No selection route or write transaction (route.ts:12-36).
- Fix: Idempotent/rate-limited concurrent write path with independent counters and request auth.

## G2-6-016-028  [P2] GAP  facet F07  effort S
- Legacy: Legacy query string optional, min 1 described, no max80 hard reject shown (SkillController.java:57-66).
- vNext now: Zod trims and max80, invalid 400 (catalog-validation.ts:3-8; route.ts:30-33).
- Fix: Resolve >80-character behavior against live legacy; show inline 80-max feedback or align limit.

## G2-6-016-030  [P3] GAP  facet F08  effort S
- Legacy: Legacy search successes Skills retrieved successfully or Skills retrieved in Nms (SkillController.java:65-69; SkillsSearchController.java:44-52).
- vNext now: New returns bare {items} JSON no success string (route.ts:25-29).
- Fix: Map exact success wording only if UI exposes backend message; API response contract documented.
