# Deep verification packet (round 2, Claude agent 4)

Rows still unchecked after the first deep pass. Each row ends OK (vNext file:line + docs/legacy-source file) or FIXED. DEFERRED is not allowed.

- [ ] G2-16-005-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-16-027-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-17-010-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_7.md)
- [ ] G2-19-002-095  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-010-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-010-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-19-018-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-006-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-006-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-010-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-013-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-014-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-015-092  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-016-134  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-2-017-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [x] G2-2-017-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_13.md)
- [ ] G2-4-017-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-017-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-018-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-018-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-018-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-025-075  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-025-082  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-028-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-12-016-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-13-031-098  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)

## Results

- G2-2-017-057 — OK: `drizzle/0212_learner_content_progress_attempts.sql:3-9` drops the obsolete membership/content unique index, creates a membership/content/attempt unique index, and adds the descending latest-attempt index; `src/db/schema/courses.ts:594,608-621` matches the attempt default and indexes. Legacy comparison: `docs/legacy-source/backend/src/main/resources/db/migration/V132__learner_content_progress_attempt.sql:19-32` (learner ID becomes scoped membership ID). Migration 0212 is registered in `drizzle/meta/_journal.json`. The earlier `0098` only introduced the attempt column and is correctly followed by 0212.

- G2-4-018-046 — OK: `src/db/schema/projects.ts:1019-1045` defines `planLegacyDeliveryRevisionImport`, retaining the legacy `revisionCount` and optimistic version independently while importing the current snapshot as submission version 1. It requires independent, chronological historical evidence rather than inventing previous revisions from the counter. Source: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:63-64,123-129`.
- G2-4-018-067 — OK: `src/db/schema/projects.ts:1019-1043` separates legacy `optimisticVersion` from revision counts and vNext submission ordinal; `src/modules/projects/submission-service.ts:193-224,237-262` locks the draft row and checks `expectedUpdatedAt` before mutation, rejecting stale concurrent edits. Source: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:123-129` (nullable JPA @Version). The new row uses its own concurrency token rather than the imported legacy token.
