# Work packet: edit src/db/schema/discussions.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-17/classroom-message-entity.md, docs/audit/gap2/lane-2/classroom-controller.md, docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md, docs/audit/gap2/lane-3/l17-u027-discussion-controller.md, docs/audit/gap2/lane-5/u020-discussions.md

## G2-19-031-023  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:18-29` — Legacy lesson discussions save contentText, sequence, userName, profileName.
- vNext now: `src/db/schema/discussions.ts:16-51` — New delivery discussions store messageText and sender membership, no per-lesson sequence.
- Fix: Add lesson scoped data mapping and sequence; avoid conflating threads.

## G2-19-031-128  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V73__classroom_messages.sql:1-13` — MySQL classroom_messages course/class, sender snapshot, soft delete and pin indexes.
- vNext now: `src/db/schema/discussions.ts:16-63` — Postgres discussions keyed delivery and membership.
- Fix: Build identity/schema mapping preserving class and tombstone.

## G2-17-020-008  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassroomMessage.java:14-33 — courseId,classId,senderId,senderName,senderRole,messageText,pinned.
- vNext now: src/db/schema/discussions.ts:16-55 — deliveryId,senderMembershipId,role,text,pin, pinnedBy, times.
- Fix: Persist trusted sender-name snapshot for historical attribution.

## G2-17-020-015  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:91-104 — Trim, reject empty, server computes senderId/name/role, pinned false.
- vNext now: src/db/schema/discussions.ts:26-40 — Sender membership and role, pinned default false, no name snapshot.
- Fix: Write immutable senderNameSnapshot from trusted context.

## G2-17-020-046  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V73__classroom_messages.sql:1-14 — MySQL course,class,sender and name snapshot, soft-delete, pin/time index.
- vNext now: src/db/schema/discussions.ts:16-78 — Postgres delivery/membership, no snapshot or soft-deletedAt.
- Fix: Register DB05 canonical migration and guarded retention fields.

## G2-17-020-047  [P1] MISSING  facet F22  effort M
- Legacy: docs/planning/db05-classroom-message-parity-contract.md:51-63 — Schema parity proposals remain unregistered and untested.
- vNext now: src/db/schema/discussions.ts:16-78 — Current Drizzle shape still lacks history fields.
- Fix: Coordinate history migration + SQL guard and service cutover.

## G2-2-033-076  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassroomMessage.java:11-35 int ID,courseId,classId,senderId,role/name snapshot,isDeleted,pinned
- vNext now: src/db/schema/discussions.ts:16-79 UUID ID,deliveryId,membershipId,role,message,pinned/pinnedBy, no isDeleted
- Fix: Write explicit schema migration: message IDs, role/name, class/course mappings, deletion state.

## G2-2-033-077  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:126-151 JPA isDeleted soft deletion
- vNext now: src/modules/courses/discussion-service.ts:410-434 DELETE row, discussions.ts:16-79 lacks deletedAt
- Fix: Choose retention semantics and tombstone mechanism before migrating old deleted content.

## G2-12-009-075  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:98-122`
- vNext now: `src/db/schema/discussions.ts:16-76`
- Fix: Legacy courseId/classId/numeric message sender identity/isDeleted+sender_name snapshot vs vNext UUID deliveryId/senderMembershipId, no sender-name snapshot, no deletedAt; historic migration needs ETL.

## G2-17-027-047  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:109-123`
- vNext now: `src/db/schema/discussions.ts:16-79`
- Fix: Active courseDiscussionMessages is delivery-level, cannot substitute for old per-lesson Discussions data model.

## G2-5-020-007  [P1] GAP  facet F04  effort L
- Legacy: Legacy numeric lessonContentId stored with message `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:17-19`
- vNext now: Registered vNext deliveryId UUID; lesson content link only staged `src/db/schema/discussions.ts:16-27` `src/db/schema/db05-lesson-discussions.staged.ts:20-37`
- Fix: Map lesson content UUID and college scope separately.

## G2-5-020-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy userId int, userName/profileName snapshots `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:22-30`
- vNext now: Registered senderMembershipId UUID/role, name read from users; staged lesson has name snapshots `src/db/schema/discussions.ts:23-39` `src/db/schema/db05-lesson-discussions.staged.ts:28-35`
- Fix: Persist trusted author snapshots for lesson stream and resolve legacy user IDs.

## G2-5-020-045  [P1] GAP  facet F22  effort L
- Legacy: Legacy Discussions int PK inherited, lesson_content_id int, text, sequence, author snapshots, soft delete `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:13-30` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37`
- vNext now: VNext registered classroom table UUID/deliveryId and staged lesson table separate `src/db/schema/discussions.ts:16-77` `src/db/schema/db05-lesson-discussions.staged.ts:20-49`
- Fix: Build dedicated lesson discussion migration and ID/name mapping.

## G2-17-020-018  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:91-95 — Empty string error `Message cannot be empty`.
- vNext now: src/db/schema/discussions.ts:69-70 — DB requires trim length 1..4000.
- Fix: Use exact legacy empty text in UI.
