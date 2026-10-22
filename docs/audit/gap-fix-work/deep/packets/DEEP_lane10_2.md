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
- [ ] G2-5-017-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-5-017-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-5-018-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-018-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-018-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)

## Results

- OK G2-5-017-014 — `src/db/schema/projects.ts:129-159` defines an append-only `projectTemplateLegacyEvents` ledger with its own event ID, source action, snapshot and timestamp; no uniqueness on template version, matching `docs/legacy-source/backend/src/main/resources/db/migration/V160__project_template_version_sort_index.sql:1-7`.
- OK G2-5-017-047 — `src/db/schema/projects.ts:134-159` preserves repeated actions under the same `legacyTemplateVersion` (unique only on `legacyEventId` per template), matching `docs/legacy-source/backend/src/main/resources/db/migration/V160__project_template_version_sort_index.sql:1-7`.
- OK G2-5-018-010 — `src/db/schema/activity.ts:33-58` retains nullable source user ID and immutable `actorRoleSnapshot`/`actorNameSnapshot` independently of canonical user display data; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:39-46`.
