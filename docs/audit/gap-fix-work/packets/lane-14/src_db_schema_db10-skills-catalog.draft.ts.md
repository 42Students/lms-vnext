# Work packet: edit src/db/schema/db10-skills-catalog.draft.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u010-skills-search-controller.md, docs/audit/gap2/lane-4/skill-controller.md, docs/audit/gap2/lane-5/u016-skill-synonym.md

## G2-16-010-054  [P1] GAP  facet F22  effort L
- Legacy: SkillUsageTracker.java:46-55 runtime MySQL skill_usage string PK/count/last_used.
- vNext now: src/db/schema/db10-skills-catalog.draft.ts and catalog-service.ts:5-9 Postgres db10SkillUsage.
- Fix: Register migration for catalog/synonyms/usage with constraints and seed.

## G2-4-025-013  [P1] GAP  facet F04  effort L
- Legacy: Database int identity id and 200-character name/displayName (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Skill.java:22-30`)
- vNext now: UUID skill id and 200-character name/displayName (`src/db/schema/db10-skills-catalog.draft.ts:35-48`)
- Fix: Provide integer legacy ID mapping when legacy profile/selection APIs require it.

## G2-4-025-075  [P1] GAP  facet F22  effort L
- Legacy: skills table ID integer; normalized name unique, indexes name/category/display/active/usage/priority; timestamps (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Skill.java:10-17,22-51`)
- vNext now: DRAFT UUID ID, compound indexes/checks, tz timestamps (`src/db/schema/db10-skills-catalog.draft.ts:35-61`)
- Fix: Register migration and track integer→UUID mapping, review SQL index plan.

## G2-5-016-047  [P1] GAP  facet F22  effort L
- Legacy: Legacy int identity PK/skill_id, nonunique indexes and varchar100 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SkillSynonym.java:12-29`
- vNext now: New schema draft UUID PK/FK and functional case-index `src/db/schema/db10-skills-catalog.draft.ts:64-83`
- Fix: Implement numbered migration and explicit ID maps, replay safely.
