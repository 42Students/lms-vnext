# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-6/skill.md

4 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/skill.md

## G2-6-016-059  [P0] MISSING  facet F22  effort L
- Legacy: Legacy separate synonym DB and v2 free-text usage tracking (SkillRepository.java:93-105; SkillsSearchController.java:29-33).
- vNext now: Draft skill_synonyms and skill_usage tables, unregistered (db10-skills-catalog.draft.ts:63-99).
- Fix: Register all three tables atomically and replay tests; do not turn on before verified.

## G2-6-016-035  [P1] MISSING  facet F10  effort L
- Legacy: Admin load-missing RTF parses/categorizes skills in batches of 1000 (SkillController.java:226-298).
- vNext now: New schema draft/read-only service has no importer (db10-skills-catalog.draft.ts:1-21; route.ts:12-36).
- Fix: Provide idempotent catalog import, invalid/duplicate report and admin trigger or seed migration.

## G2-6-016-044  [P1] MISSING  facet F14  effort L
- Legacy: RTF source used for verification and load-missing endpoint, output missing/extra max100 (SkillController.java:197-224,226-298).
- vNext now: Only isolated draft schema and GET reader (db10-skills-catalog.draft.ts:1-21; route.ts:12-36).
- Fix: Build admin RTF/CSV validation and import report; preserve 100-item bounded missing/extra preview.

## G2-6-016-056  [P1] MISSING  facet F21  effort L
- Legacy: Legacy RTF verification/loader is an administrator-triggered integration (SkillController.java:197-298).
- vNext now: New DB10 draft leaves registration to W01 (db10-skills-catalog.draft.ts:1-21).
- Fix: Wire deterministic seed import/replay and verification report as deployment gate.
