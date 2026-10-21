# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-19/project-meeting-history-entity.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-19/project-meeting-history-entity.md

## G2-19-017-027  [P1] MISSING  facet F10  effort L
- Legacy: Legacy MySQL migration defines real history table and both FKs `docs/legacy-source/backend/src/main/resources/db/migration/V84__project_meetings.sql:38-59`
- vNext now: vNext comparable DDL only in DRAFT unregistered SQL `docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql:1-5` `docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql:17-32`
- Fix: Promote registered migration and runtime write integration.

## G2-19-017-051  [P1] MISSING  facet F22  effort L
- Legacy: Legacy V84 table real source migration `docs/legacy-source/backend/src/main/resources/db/migration/V84__project_meetings.sql:38-59`
- vNext now: vNext DB07 project-history DDL explicitly DRAFT ONLY, not journal registered `docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql:1-5` `docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql:145-149`
- Fix: Register migrations with full DB07 tenant integrity and acceptance checks.
