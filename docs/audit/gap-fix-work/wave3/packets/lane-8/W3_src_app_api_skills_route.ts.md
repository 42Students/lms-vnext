# Work packet (wave 3): edit src/app/api/skills/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/skill-controller.md, docs/audit/gap2/lane-5/u016-skill-synonym.md

## G2-4-025-005  [P1] MISSING  facet F01  effort L
- Legacy: Three POST mutations and GET verify endpoints (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:96-133,175-193,197-229`)
- vNext now: Only exported GET; no select/cache/verify/load handlers (`src/app/api/skills/route.ts:12-36`)
- Fix: Decide v1 admin/mutation compatibility; implement authorized routes where feature retained.

## G2-4-025-041  [P1] MISSING  facet F10  effort L
- Legacy: POST /load-missing creates Skill rows in batches of 1,000 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:226-299`)
- vNext now: No import endpoint or writes (`src/app/api/skills/route.ts:12-36`)
- Fix: Implement safe super-admin idempotent importer after DB10 schema registration.

## G2-5-016-050  [P1] MISSING  facet F23  effort L
- Legacy: Legacy curated seeded aliases active when bootstrap flag set `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/SynonymDataLoader.java:33-105,109-160`
- vNext now: New GET still disabled before DB10 verified `src/app/api/skills/route.ts:13-23`
- Fix: Migrate data and enable only after verification.

## G2-4-025-067  [P2] MISSING  facet F19  effort L
- Legacy: Admin importer writes batches of 1000 and logs progress (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:255-290`)
- vNext now: No background import/monitoring (`src/app/api/skills/route.ts:12-36`)
- Fix: Use transactional chunked job with progress and safe retries.
