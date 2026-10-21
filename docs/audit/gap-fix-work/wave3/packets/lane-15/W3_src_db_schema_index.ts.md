# Work packet (wave 3): edit src/db/schema/index.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/skill.md, docs/audit/gap2/lane-19/project-meeting-history-entity.md

## G2-6-016-057  [P0] MISSING  facet F22  effort L
- Legacy: Legacy persisted skills table integer id and name unique, 200/200/50 lengths (Skill.java:10-33).
- vNext now: Draft skills UUID and identical text lengths, not registered (db10-skills-catalog.draft.ts:35-61; src/db/schema/index.ts:1-24).
- Fix: Approve, register and replay numbered DB10 migration; verify FK and seed parity.

## G2-19-017-001  [P1] MISSING  facet F01  effort L
- Legacy: Legacy ProjectMeetingHistory is a JPA entity for project workspace meeting edits, not a route `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:10-16` `docs/legacy-source/backend/src/main/resources/db/migration/V84__project_meetings.sql:38-45`
- vNext now: vNext staged history type exists but not exported via registered db/schema/index; activity is separate `src/db/schema/project-audit-staged.ts:19-40` `src/db/schema/index.ts:18-19`
- Fix: Promote history table and identify live writer for meeting revision records.
