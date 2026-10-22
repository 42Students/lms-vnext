# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-17-006-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-17-019-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-17-019-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-17-019-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-17-019-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-17-019-039  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-17-020-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-17-020-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-17-020-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-17-002-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_7.md)

## Results

- G2-17-006-001: OK — vNext src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:45-60 detects a non-UUID first segment and resolves a legacy numeric ID or slug through resolveLegacyLearnerCourseDelivery (src/modules/courses/learner-course-legacy-route-service.ts, scoped to the learner's enrollment, courses.legacyCourseId/slug in learner-course-service.ts:86-113), then redirects keeping the legacy filter/lesson/content/month hints; matches docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:17-22 and utils/learnerCourseDetail.js:2-10.
- G2-17-019-006: OK — vNext src/modules/courses/assignment-submission-service.ts:938-966 appendAssignmentGradeEvent inserts an assignment_grade_events row with previous/new points, feedback, grading status, publish flag, grader, version before/after, called inside the grading transaction (:1057) and the publish transaction (:1150); matches docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1105 logGradeChange.
- G2-17-019-019: OK — vNext assignment-submission-service.ts:1057 (GRADE/REGRADE/HIDE_GRADE) and :1150 (PUBLISH_GRADE) write one ledger row for every grade mutation in the same transaction; the table (drizzle/0205_lane15_assignment_grade_events.sql) is append-only by design: composite identity FK, action/actor/shape CHECKs, unique (submission,version_after) and no update path in the service; matches AssignmentServiceImpl.java:1093-1105.
- G2-17-019-020: OK — vNext assignment-submission-service.ts:1150 records PUBLISH_GRADE with previous/new points and feedback captured from the live publisher (not the original grader), and drizzle/0205 shape_ck requires unchanged points/feedback with published false->true; matches AssignmentServiceImpl.java:741-748 PUBLISH_GRADE audit.
- G2-17-019-035: OK — producer+event atomicity is enforced in the service: the ledger insert shares the grading/publish transaction and the submission CAS (expectedVersion at :1050,1143; ASSIGNMENT_SUBMISSION_CONFLICT on a stale write), with DB-level exact version chain (assignment_grade_events_version_ck after=before+1) and unique (submission,version_after) in drizzle/0205; the DB deferred completeness trigger remains staged exactly as docs/planning/database-parity-db06-history-contract.md:71-75,150-170 prescribes (needs PostgreSQL acceptance before registration), so no unreviewed trigger was added.
- G2-17-019-039: OK — producers are already cut over atomically in code (assignment-submission-service.ts:1057,1150) and the ledger migration 0205 is registered in drizzle/meta/_journal.json; the remaining trigger promotion/direct-SQL-denial acceptance is the staged step of docs/planning/database-parity-db06-history-contract.md:164-181 and is intentionally not applied blind (it would break non-grade writers if enabled without the PG acceptance run).
- G2-17-020-011: OK — vNext src/modules/courses/discussion-service.ts:308-380 delta read (since + afterId, updatedAt >= cursor incl. equal-time rows, deleted rows returned as tombstones, nextCursor) matches docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ClassroomMessageRepository.java:27-41 GET since.
- G2-17-020-025: OK — vNext discussion-service.ts:592-642 soft-deletes (deletedAt set, row and body retained, pinned slot released atomically) with an audited COURSES_DISCUSSION_DELETED activity event carrying actor and time; matches ClassroomServiceImpl.java:126-149.
- G2-17-020-026: OK — vNext discussion-service.ts:330-370 returns only {id, deleted:true,…} for deleted rows in delta reads and normal history hides them (:163,218,240); the retained body/sender never leaves the server (comment :613-614); matches ClassroomServiceImpl.java:68-78 withoutDeletedContent.
- G2-17-002-062: OK — vNext src/components/academics/college-term-mapping-retained.tsx:12-40 keeps the last-good same-college mappings on a failed refresh and shows Alert "Couldn't refresh semester course mapping" with Retry curriculum (writes paused), fed by src/app/(authenticated)/college/semester-courses/page.tsx:18-45; src/app/(authenticated)/college/semester-courses/error.tsx carries the same title for hard failures; matches SemesterCourseMapping.js:387-390.
