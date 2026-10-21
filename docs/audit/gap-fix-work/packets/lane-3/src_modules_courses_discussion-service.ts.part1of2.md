# Work packet: edit src/modules/courses/discussion-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-17/classroom-message-entity.md, docs/audit/gap2/lane-2/classroom-controller.md, docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md, docs/audit/gap2/lane-3/l17-u027-discussion-controller.md, docs/audit/gap2/lane-5/u020-discussions.md

## G2-19-031-001  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:28-68` — Course/class classroom uses GET with optional since, POST message, PATCH pin, DELETE.
- vNext now: `src/modules/courses/discussion-service.ts:104-110` — New primary discussion is delivery-scoped, not course-and-class-scoped.
- Fix: Resolve class-to-delivery identity and verify no cross-section thread mixing.

## G2-19-031-071  [P1] GAP  facet F11  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:47-72` — Lesson access checks class/course and faculty teaching scope.
- vNext now: `src/modules/courses/discussion-service.ts:52-72` — New discussion access is course-section delivery scoped.
- Fix: On per-lesson route enforce content/class teaching assignment.

## G2-17-020-011  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ClassroomMessageRepository.java:27-41 — GET since fetches changed rows including tombstones >= cursor.
- vNext now: src/modules/courses/discussion-service.ts:41-48 — Cursor pagination beforeCreatedAt+beforeId, no delta tombstones.
- Fix: Implement delta polling or realtime updates with removed-row tombstones.

## G2-17-020-025  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:126-149 — Delete marks isDeleted true, retains record.
- vNext now: src/modules/courses/discussion-service.ts:375-415 — Calls `.delete(courseDiscussionMessages)` hard delete.
- Fix: Switch to soft delete with immutable actor/time history.

## G2-17-020-026  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:68-78 — Deleted changed-row redacts sender/text while retaining ID tombstone.
- vNext now: src/modules/courses/discussion-service.ts:104-180 — Hard delete and cursor pagination; no tombstone.
- Fix: Prevent deleted text resurfacing; emit redacted delta.

## G2-2-033-002  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:28-48 GET with optional since
- vNext now: src/modules/courses/discussion-service.ts:104-179 GET beforeCreatedAt+beforeId history cursor
- Fix: Preserve incremental live-update semantics with bounded cursor or dedicated change feed.

## G2-2-033-013  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:30-47 courseId/classId integers
- vNext now: src/modules/courses/discussion-service.ts:33-34 UUID delivery/message IDs
- Fix: Map historic message identity to delivery UUID and sender membership.

## G2-2-033-016  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:68-78 incremental deleted rows omit confidential text
- vNext now: src/modules/courses/discussion-service.ts:410-431 physically removes messages and no tombstone feed
- Fix: Invalidate previously cached deleted rows during polling; ensure stale cards disappear on other sessions.

## G2-2-033-039  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:126-151 sets isDeleted true
- vNext now: src/modules/courses/discussion-service.ts:407-434 physically DELETEs and records event
- Fix: Decide audit/retention policy for erased messages and downstream sync tombstones.

## G2-2-033-045  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:64-78 deleted incremental content redacted
- vNext now: src/modules/courses/discussion-service.ts:407-434 hard delete, no deleted record returned
- Fix: Use privacy-safe tombstone IDs and support client deletion sync without redisclosing content.

## G2-2-033-070  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:64-78 deleted content redacted to ID when polling
- vNext now: src/modules/courses/discussion-service.ts:410-434 delete no tombstone
- Fix: Protect privacy and stale-state consistency with tombstones or versioned refresh.

## G2-2-033-077  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:126-151 JPA isDeleted soft deletion
- vNext now: src/modules/courses/discussion-service.ts:410-434 DELETE row, discussions.ts:16-79 lacks deletedAt
- Fix: Choose retention semantics and tombstone mechanism before migrating old deleted content.

## G2-2-033-081  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:28-48 supports since incremental with deleted tombstones
- vNext now: src/modules/courses/discussion-service.ts:104-179 only history cursor
- Fix: Restore incremental update parity for other-client delete/pin events.

## G2-2-033-082  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:126-151 moderator/owner delete soft
- vNext now: src/modules/courses/discussion-service.ts:375-434 hard delete with optimistic token
- Fix: Obtain explicit data retention decision; preserve CAS concurrency improvement.

## G2-12-009-041  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:438-465`
- vNext now: `src/modules/courses/discussion-service.ts:375-414`
- Fix: Legacy isFacultyRole or own message can delete, including own pinned; vNext learner own deletion only when not pinned, plus faculty moderator.

## G2-12-009-076  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:373-399`
- vNext now: `src/modules/courses/discussion-service.ts:407-421`
- Fix: Legacy deletion uses soft-delete retaining moderation/audit history; vNext `.delete(courseDiscussionMessages)` hard removes row. DB05 parity draft not yet registered per doc.

## G2-17-027-021  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:87-94`
- vNext now: `src/modules/courses/discussion-service.ts:104-170`
- Fix: Legacy lesson-thread fetch by lessonContentId; new list by deliveryId can mix messages from multiple lessons.

## G2-17-027-023  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:47-72`
- vNext now: `src/modules/courses/discussion-service.ts:52-76`
- Fix: Legacy access controls class/course and requireTeachingScope even on GET; vNext learner/faculty section delivery chat allows learners when scoped.

## G2-5-020-015  [P1] GAP  facet F06  effort M
- Legacy: Legacy post DiscussionDTO carries lessonContentId,sequence,userId,names,text `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:37-55`
- vNext now: VNext create `{messageText,replyToMessageId?,expectedParentUpdatedAt?,confirmed?}` `src/modules/courses/discussion-service.ts:33-39`
- Fix: Define lesson post body compatible with content/sequence; ignore spoofed identity.

## G2-5-020-021  [P1] GAP  facet F07  effort L
- Legacy: Legacy orphan content without course/class scope 403 fixed error `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:55-71`
- vNext now: New requires delivery/offer scope, not same legacy ancestor traversal `src/modules/courses/discussion-service.ts:58-87`
- Fix: Implement ancestor-scope guard and wrong-college negative tests.
