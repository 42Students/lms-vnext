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
- [x] G2-4-017-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [x] G2-4-017-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-4-018-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
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


- G2-4-018-067 — OK: `src/db/schema/projects.ts:1016-1040` explicitly separates legacy JPA optimistic `@Version` from revisionCount and submission ordinal, rejecting invalid imported tokens; `src/db/schema/projects.ts:1052-1063` persists distinct columns. `src/modules/projects/submission-service.ts` serializes draft creation with a project `FOR UPDATE` lock and edits with row locks plus `projectDraftRevisionMatches` stale-token rejection, not the ordinal. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:123-129`. Source-level assessment; concurrent execution not claimed.

- G2-4-017-017 — OK: `src/db/schema/projects.ts:274-285` retains nullable templateId/templateVersionId as a null pair for manual historical projects, while `src/modules/projects/instance-service.ts:145-170` requires a published assigned template for new projects. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:79-91`.
- G2-4-017-018 and G2-4-017-049 — OK: `src/db/schema/projects.ts:253-263,295-301` documents restore eligibility and maintains nullable legacyRecoverableContent separately from deletedAt. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:93-95`.
- G2-4-017-046 — OK: `src/db/schema/projects.ts:246-250,311-339` explicitly maps IN_PROGRESS to ACTIVE, preserves provenance and progress, retains four-week sprint and POINTS defaults. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:31-56`.
- G2-4-017-070 — OK: `src/db/schema/projects.ts:218-249,270-342` documents integer-to-UUID crosswalk, nullable template and legacy source field preservation, tenant/section identities and lifecycle mapping. Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:13-125`.
