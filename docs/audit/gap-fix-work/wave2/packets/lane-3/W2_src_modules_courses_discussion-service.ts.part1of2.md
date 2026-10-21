# Work packet (wave 2): edit src/modules/courses/discussion-service.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-17/classroom-message-entity.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-2/classroom-controller.md, docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md, docs/audit/gap2/lane-3/l17-u027-discussion-controller.md

## G2-19-031-022  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:103-128` — Lesson messages enrich profile images and learner display information.
- vNext now: `src/modules/courses/discussion-service.ts:126-176` — New delivery thread returns displayName but no profile image field.
- Fix: Add scoped profile avatar and name mapping to lesson view.

## G2-19-031-035  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ClassroomMessageCreateDTO.java:19-29` — Classroom message needs courseId, classId, messageText <=4000.
- vNext now: `src/modules/courses/discussion-service.ts:33-38` — New post takes delivery path and messageText central length constant.
- Fix: Map class and limits/copy, avoid over-accepting wrong scope.

## G2-19-031-068  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:56-78` — Delta includes id-only tombstones for removed messages.
- vNext now: `src/modules/courses/discussion-service.ts:126-180` — New list fetches active messages by cursor, with client local-deleted guard.
- Fix: Propagate cross-client delete in refresh without leaking content.

## G2-19-031-113  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:33-47` — Classroom delta cursor only changes and deletions.
- vNext now: `src/modules/courses/discussion-service.ts:104-180` — New newest-page fetches instead of since delta.
- Fix: Conditional lightweight updates or delta token.

## G2-17-020-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:16-48 — GET /api/v1/classroom/messages?courseId&classId[&since].
- vNext now: src/modules/courses/discussion-service.ts:104-118 — listCourseDiscussionMessages uses deliveryId and cursor page.
- Fix: Map legacy class/course route to delivery-scoped chat.

## G2-17-020-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:570-593 — Pinned first message with unpin icon, count and author.
- vNext now: src/modules/courses/discussion-service.ts:147-180 — Highlighted pinned message, one latest pinned.
- Fix: Preserve first-pinned semantics and count of all pinned.

## G2-17-020-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ClassroomMessageRepository.java:17-24 — Chronological created_at ASC,id ASC.
- vNext now: src/modules/courses/discussion-service.ts:145-175 — Fetch DESC newest page, reverse before returning.
- Fix: Verify first page shows most recent bottom and back-pagination correctly.

## G2-17-020-012  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:33-47 — First load full history, incremental since for later polls.
- vNext now: src/modules/courses/discussion-service.ts:43-48 — Default 60 messages, maximum 100.
- Fix: Provide load-older affordance and matching chronological feed.

## G2-17-020-014  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:50-55 — POST message courseId,classId,messageText.
- vNext now: src/modules/courses/discussion-service.ts:218-260 — Server derives sender from authenticated membership and delivery.
- Fix: Map IDs, preserve create payload validation and UI paths.

## G2-17-020-028  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:126-149 — Own message by ID+role, or moderator can remove other message.
- vNext now: src/modules/courses/discussion-service.ts:375-415 — Own unpinned message or scoped moderator deletion.
- Fix: Check removal of own pinned message vs legacy rule.

## G2-17-020-033  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:134-149 — Soft deletion hides message even if pinned.
- vNext now: src/modules/courses/discussion-service.ts:375-415 — Hard deletion with pinned guard.
- Fix: Allow moderator delete of pinned messages or explicit unpin-first policy.

## G2-17-020-035  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:203-275 — Delta polling does not blank feed and refreshes on visibility.
- vNext now: src/modules/courses/discussion-service.ts:104-180 — Cursor pagination service no since updates.
- Fix: Implement polling/realtime and preserve scroll.

## G2-17-020-043  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ClassroomMessageRepository.java:27-41 — UpdatedAt >= cursor + dedupe by ID handles same instant.
- vNext now: src/modules/courses/discussion-service.ts:118-125 — Tuple cursor createdAt+id for page, microsecond preservation.
- Fix: Cover same-tick edits/soft deletes with updatedAt-based delta.

## G2-17-020-045  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:203-275 — Client polls for new messages on visible tab.
- vNext now: src/modules/courses/discussion-service.ts:104-180 — No background service/cron; query on request.
- Fix: Verify polling or realtime in actual client.

## G2-18-001-054  [P2] GAP  facet F10  effort M
- Legacy: Legacy discussion endpoints GET/POST/PATCH/DELETE `/api/v1/classroom/messages`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:17-68`
- vNext now: vNext server discussion service reads/writes delivery-scoped courseDiscussionMessages, with moderation. `src/modules/courses/discussion-service.ts:104-182`, `src/modules/courses/discussion-service.ts:218-275`
- Fix: Document request/response conversion and preserve client observable behavior; no unauthenticated alias.

## G2-2-033-014  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:91-104 message senderName/role snapshot
- vNext now: src/modules/courses/discussion-service.ts:128-137 reads current users.displayName by membership join
- Fix: Define whether historical sender display name should be snapshot or live, including deleted user.

## G2-2-033-020  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:194-198 pinnedMessages[0] chosen from full history
- vNext now: src/modules/courses/discussion-service.ts:147-169 pinned query sorted descending newest
- Fix: Verify which pinned message is prioritized when >1; old chronological first vs newest.

## G2-2-033-042  [P2] GAP  facet F11  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:135-146 own message may be deleted even by learner, staff moderator of others
- vNext now: src/modules/courses/discussion-service.ts:391-416 learner own unpinned only, moderators all within delivery
- Fix: Document learner pinned own deletion restriction and enforce correct role.

## G2-2-033-056  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassroomServiceImpl.java:149-151 soft-delete message notifies polling clients indirectly
- vNext now: src/modules/courses/discussion-service.ts:410-434 hard delete with activity; polling client reads current page
- Fix: Ensure other readers receive privacy-safe deletion updates in timely cadence.

## G2-2-033-073  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:20-25 ClassroomService+SecurityContextUtil
- vNext now: src/modules/courses/discussion-service.ts:52-78 RequestContext and Drizzle tenant memberships
- Fix: Document migrated ownership/authorization data flow.

## G2-2-033-079  [P2] GAP  facet F22  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:198-199 first pinned message from full list
- vNext now: src/modules/courses/discussion-service.ts:147-167 newest pinned separate query
- Fix: Document pinned-choice semantics; add deterministic legacy order if required.

## G2-12-009-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:169-172`
- vNext now: `src/modules/courses/discussion-service.ts:52-76`
- Fix: Legacy one discussion per courseId/classId; vNext one per delivery tied to offering + section, historic class assignment resolution needs mapping.

## G2-12-009-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:103-123`
- vNext now: `src/modules/courses/discussion-service.ts:104-179`
- Fix: Legacy polling GET since=latest updatedAt only changes, merges tombstones/pins; vNext GET returns newest60 snapshot and cursor beforeCreatedAt+beforeId to fetch older.

## G2-12-009-025  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:170-172`
- vNext now: `src/modules/courses/discussion-service.ts:52-75`
- Fix: Legacy classId may fall back to loginUser.classId, vNext requires delivery mapping and membership validation.

## G2-12-009-038  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:357-399`
- vNext now: `src/modules/courses/discussion-service.ts:317-434`
- Fix: Legacy toggle pin and soft-delete by numeric messageId; vNext PATCH/DELETE message UUID with expectedUpdatedAt+confirmed for faculty moderation.

## G2-12-009-039  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:103-123`
- vNext now: `src/modules/courses/discussion-service.ts:168-179`
- Fix: Legacy server deltas include tombstones from isDeleted, vNext hard-deletes and reconciliation uses newer snapshot windows.

## G2-12-009-040  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:171-172`
- vNext now: `src/modules/courses/discussion-service.ts:52-75`
- Fix: Legacy Faculty or ADMIN may moderate course/class feed; vNext faculty moderation requires teaching assignment, active membership and server scope.

## G2-12-009-042  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:569-596`
- vNext now: `src/modules/courses/discussion-service.ts:286-314`
- Fix: Legacy faculty pin/unpin UI includes ADMIN userType; vNext checks active FACULTY membership role and authorized delivery.

## G2-12-009-047  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:103-123`
- vNext now: `src/modules/courses/discussion-service.ts:42-49`
- Fix: Legacy change cursor on updatedAt including pin/delete, vNext older-history cursor tuple (createdAt,id). Intentional different page semantics.

## G2-12-009-054  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:336-355`
- vNext now: `src/modules/courses/discussion-service.ts:268-279`
- Fix: Legacy classroom service may record message creation without central platform activity events; vNext explicitly writes COURSES_DISCUSSION_POSTED/REPLIED audit.

## G2-12-009-077  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:428-434`
- vNext now: `src/modules/courses/discussion-service.ts:128-145`
- Fix: Legacy senderName preserved in message DTO, vNext joins users.displayName live; profile rename rewrites old attribution on display.

## G2-17-027-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:103-128`
- vNext now: `src/modules/courses/discussion-service.ts:104-170`
- Fix: Legacy fetches lessonContent messages+profile images; vNext returns paginated entire delivery messages.

## G2-17-027-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:109-123`
- vNext now: `src/modules/courses/discussion-service.ts:128-145`
- Fix: Legacy response includes profileImageUrl/userName/rollNumber, vNext live users.displayName with senderRole.

## G2-17-027-009  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:116-117`
- vNext now: `src/modules/courses/discussion-service.ts:136-145`
- Fix: Legacy ISO_LOCAL_DATE_TIME no zone suffix, vNext stored timestamptz cursor string.

## G2-17-027-010  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:98-104`
- vNext now: `src/modules/courses/discussion-service.ts:104-170`
- Fix: Legacy entire lesson thread list, vNext newest 60 delivery messages then older cursor pages.

## G2-17-027-012  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/DiscussionDTO.java:13-15`
- vNext now: `src/modules/courses/discussion-service.ts:34-49`
- Fix: Legacy nonblank message max5000, vNext delivery message max3900 via shared client message-limit model.

## G2-17-027-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/DiscussionDTO.java:16-19`
- vNext now: `src/modules/courses/discussion-service.ts:34-39`
- Fix: Legacy accepts sequence and (ignored) client user metadata, vNext optional replyToMessageId/expectedParentUpdatedAt; no sequence.

## G2-17-027-022  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:44-59`
- vNext now: `src/modules/courses/discussion-service.ts:218-279`
- Fix: Old normalizes text and resolves identity snapshot before insert, vNext audit event and live membership join.

## G2-17-027-029  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:98-104`
- vNext now: `src/modules/courses/discussion-service.ts:168-179`
- Fix: Legacy empty lesson discussion returns [] in successful envelope, vNext empty course chat plus pagination and prompt.

## G2-17-027-041  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:120-125`
- vNext now: `src/modules/courses/discussion-service.ts:128-145`
- Fix: Old per-row image/class lookups can be N+1, new users join is bounded; do not assume same name snapshot.
