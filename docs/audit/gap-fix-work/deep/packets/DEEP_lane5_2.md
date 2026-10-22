# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-19-002-095  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-010-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-010-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-19-016-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-19-016-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-19-016-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-19-016-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-19-016-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-19-016-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-19-016-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)

## Results


- G2-19-016-002 — OK: `src/db/schema/quizzes.ts:325-398` preserves source integer answer identity alongside UUID attempt/question foreign keys; `scripts/migrate/nsrit/plan-academics.ts:1745-1817` maps accepted legacy answer, attempt, question IDs to deterministic `nsritId` keys and validates their relationship. Matches `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:69-83`.
- G2-19-016-007 — OK: `scripts/migrate/nsrit/plan-academics.ts:1745-1817` parses the legacy option ID list, checks each against the same question's imported options, maps to UUIDs and rejects dangling selections. Source `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:618-623`.
- G2-19-016-011 — OK: `scripts/migrate/nsrit/plan-academics.ts:1745-1817` interprets null/empty legacy `selected_option_ids` as an unanswered empty selection while quarantining malformed nonempty values; `src/db/schema/quizzes.ts:325-398` stores a nonnull JSON UUID list and original nullable CSV separately. Matches `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:69-75`.
- G2-19-016-028 — OK: `scripts/migrate/nsrit/plan-academics.ts:1745-1817` resolves every selected numeric option against the question-specific source-to-UUID map, preserving selected-option identity instead of comparing generated UUID order. Source `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:618-623`.
- G2-19-016-052 — OK: `scripts/migrate/nsrit/plan-academics.ts:1745-1817` rejects missing attempt/question parents, cross-quiz question/attempt pairs, mismatched or missing option IDs and duplicate answer pairs before constructing migrated quiz answers; rejected source rows retain their legacy identity in the collector. Matches `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:69-83`.
- G2-19-016-010 — OK: `scripts/migrate/nsrit/plan-academics.ts:1797-1801` quarantines nonnumeric, negative and greater-than-question-points legacy BIGINT awarded scores before conversion into `src/db/schema/quizzes.ts:359-380` integer score with bounded check; source `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:74-75`.
- G2-19-016-031 — OK: `scripts/migrate/nsrit/plan-academics.ts:1744-1748` explicitly quarantines legacy `is_deleted` rows with `SOFT_DELETED` (not imported as active answers); `src/db/schema/quizzes.ts:336` retains a legacy deletion field for audit compatibility. Source `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:76-78`.
