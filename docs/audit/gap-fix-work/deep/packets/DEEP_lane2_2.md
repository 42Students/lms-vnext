# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-5-027-082  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-032-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [x] G2-6-001-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-6-001-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-6-015-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-6-019-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-15-001-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-15-004-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-15-006-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-15-009-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)

## Results
- G2-6-001-047: OK — `src/modules/people/faculty-bulk-import-model.ts:11,28,76-91` accepts and validates the Faculty Type CSV field as only LECTURER or MENTOR; `src/modules/people/faculty-bulk-import-service.ts:75-82` preserves the lecturer/mentor distinction during import. Matches `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:600,666-668,718`.

