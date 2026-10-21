# Work packet (wave 2): edit src/db/schema/db10-skills-catalog.draft.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/skill-controller.md, docs/audit/gap2/lane-5/u016-skill-synonym.md

## G2-4-025-076  [P2] GAP  facet F22  effort M
- Legacy: skill_synonyms joined by integer skillId; prefix matching (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillRepository.java:98-105`)
- vNext now: DRAFT skill_synonyms with UUID FK/restrict/index (`src/db/schema/db10-skills-catalog.draft.ts:63-80`)
- Fix: Migrate synonyms preserving many-skills-per-synonym and matching semantics.

## G2-4-025-078  [P2] GAP  facet F22  effort M
- Legacy: createdAt/updatedAt LocalDateTime (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Skill.java:46-52`)
- vNext now: timestamp with time zone (`src/db/schema/db10-skills-catalog.draft.ts:47-48`)
- Fix: Use IST rendering and controlled interpretation for migrated naïve values.

## G2-5-016-006  [P2] GAP  facet F04  effort M
- Legacy: SkillSynonym has id int, skill FK, synonym varchar100 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SkillSynonym.java:17-29`
- vNext now: Draft maps id UUID, skill UUID FK, synonym varchar100 `src/db/schema/db10-skills-catalog.draft.ts:64-75`
- Fix: Map numeric legacy skill/synonym IDs to new UUIDs; preserve name length.

## G2-5-016-007  [P2] GAP  facet F04  effort S
- Legacy: Constructor normalizes synonym lowercase and trims `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SkillSynonym.java:31-34`
- vNext now: Draft SQL checks nonblank but does not lowercase or trim stored values `src/db/schema/db10-skills-catalog.draft.ts:75-83`
- Fix: Normalize writes/imports before saving aliases.

## G2-5-016-028  [P2] GAP  facet F12  effort M
- Legacy: Legacy loader checks synonym exists globally before inserting `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/SynonymDataLoader.java:147-158`
- vNext now: New draft allows duplicates with no write guard `src/db/schema/db10-skills-catalog.draft.ts:75-83`
- Fix: Use idempotent per-skill alias import while preserving multi-skill aliases.

## G2-5-016-029  [P2] GAP  facet F12  effort M
- Legacy: Loader skips all inserts when table count>0 `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/SynonymDataLoader.java:119-124`
- vNext now: Draft defines data table but no loader rule `src/db/schema/db10-skills-catalog.draft.ts:64-83`
- Fix: Replace all-or-nothing seed with idempotent incremental migration.

## G2-5-016-044  [P2] GAP  facet F20  effort M
- Legacy: Legacy count() shortcut can leave partial alias corpus after interrupted seed `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/SynonymDataLoader.java:119-160`
- vNext now: Draft only defines check constraint, no loader transaction `src/db/schema/db10-skills-catalog.draft.ts:75-83`
- Fix: Use atomic or fully idempotent seed and retry after partial writes.
