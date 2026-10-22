# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-12-020-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-18-016-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [x] G2-18-016-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-12-002-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-12-002-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-12-017-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-12-017-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-12-017-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-013-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-014-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)

## Results


- G2-18-016-005: OK (compatibility schema, not an executed migration) — `src/db/schema/quizzes.ts:253-295` retains legacy numeric attempt and learner IDs, original status, bigint scores, local submitted timestamp and source timezone separately from UUID membership, bounded runtime scores and UTC timestamp. Matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAttempt.java:18-32`. Existing vNext schema explicitly models the ID/score/timezone mapping; legacy rows are not claimed imported.
- G2-18-016-035: OK (retention contract, not an executed migration) — `src/db/schema/quizzes.ts:272-281,291-309` retains nullable original deletion/update provenance, uses `deletedAt` to filter current history, and preserves immutable attempt identity/created time. The original soft-deletion and numeric ID lifecycle is in `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37`. Historical imports must populate the provenance columns; no legacy data migration is assumed.
