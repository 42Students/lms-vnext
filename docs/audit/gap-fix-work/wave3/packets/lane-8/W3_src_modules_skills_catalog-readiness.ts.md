# Work packet (wave 3): edit src/modules/skills/catalog-readiness.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/skill.md, docs/audit/gap2/lane-4/skill-controller.md

## G2-6-016-043  [P0] MISSING  facet F13  effort L
- Legacy: Legacy v1 search returns HTTP 200 or 500 (SkillController.java:57-75).
- vNext now: New catalog returns 503 until DB10_VERIFIED (route.ts:14-18; catalog-readiness.ts:1-4).
- Fix: Register/verify migrations before enabling functionality, leaving safe 503 while blocked.

## G2-4-025-054  [P1] MISSING  facet F14  effort L
- Legacy: Import source path from config `skills-data/LISKILLSDUMP.rtf`; processes 1000 entries/batch (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:226-299`)
- vNext now: DB10 readiness gate; no RTF importer deployed (`src/modules/skills/catalog-readiness.ts:1-4`)
- Fix: Define seed job from source RTF, controlled super-admin re-import and preview.

## G2-4-025-073  [P1] MISSING  facet F21  effort L
- Legacy: Optional startup MissingSkillsLoader reads RTF and batch writes (`docs/legacy-source/backend/src/main/java/com/_42students/lms/config/MissingSkillsLoader.java:21-39,44-46,79-104`)
- vNext now: Operational env gate; DB10 needs migration registration (`src/modules/skills/catalog-readiness.ts:1-4`)
- Fix: Define migration + deterministic catalog seed lifecycle.
