# Work packet (wave 3): edit src/db/schema/db10-skills-catalog.draft.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u016-skill-synonym.md

## G2-5-016-048  [P0] MISSING  facet F22  effort L
- Legacy: Legacy MySQL table persisted, referenced by repository `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillSynonymRepository.java:13-28`
- vNext now: VNext skill schema explicitly DRAFT ONLY, unregistered `src/db/schema/db10-skills-catalog.draft.ts:1-18`
- Fix: Register schema only after contract verified and migration replayed.
