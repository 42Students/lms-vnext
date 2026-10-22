# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-5-016-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-017-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-017-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-5-017-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-5-017-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-5-017-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-5-018-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-018-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-5-018-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)

## Results

- OK G2-5-017-014 — `src/db/schema/projects.ts:129-159` defines an append-only `projectTemplateLegacyEvents` ledger with its own event ID, source action, snapshot and timestamp; no uniqueness on template version, matching `docs/legacy-source/backend/src/main/resources/db/migration/V160__project_template_version_sort_index.sql:1-7`.
- OK G2-5-017-047 — `src/db/schema/projects.ts:134-159` preserves repeated actions under the same `legacyTemplateVersion` (unique only on `legacyEventId` per template), matching `docs/legacy-source/backend/src/main/resources/db/migration/V160__project_template_version_sort_index.sql:1-7`.
- OK G2-5-018-010 — `src/db/schema/activity.ts:33-58` retains nullable source user ID and immutable `actorRoleSnapshot`/`actorNameSnapshot` independently of canonical user display data; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:39-46`.

- OK G2-5-018-040 — `src/db/schema/activity.ts:86-89` supplies the partial `(legacy_project_id, occurred_at)` project activity timeline index, while `src/db/schema/activity.ts:82-84` supplies the generic subject/time index; matches the project-first chronological index purpose in `docs/legacy-source/backend/src/main/resources/db/migration/V97__project_performance_indexes.sql:58-71`. The vNext schema uses a typed project ID column instead of searching JSON metadata.

- OK G2-5-017-030 — `src/db/schema/projects.ts:134-144` retains the legacy `actionType` (varchar 40) and `lifecycleStatus` (varchar 20) verbatim as nullable historical event metadata rather than coercing legacy free-text actions into modern vNext statuses; `src/db/schema/projects.ts:125-130` explicitly separates historical action events from executable blueprint revisions. Matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTemplateVersion.java:19-24`. Legacy values remain available for explicit taxonomy interpretation during import, not silently overwritten.
