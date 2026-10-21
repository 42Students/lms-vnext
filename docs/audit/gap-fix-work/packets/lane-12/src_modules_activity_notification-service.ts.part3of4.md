# Work packet: edit src/modules/activity/notification-service.ts (part 3 of 4)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/notification.md, docs/audit/gap2/lane-11/l17-u026-notification-controller.md, docs/audit/gap2/lane-15/notification-service-impl.md

## G2-8-018-021  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:18-21: classId/courseId, learnerId, courseSlug audience
- vNext now: src/modules/activity/notification-service.ts:34-58: body + internal actionHref only
- Fix: Add scoped class/course audience projection to notification producer.

## G2-8-018-023  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:37-41: optional scheduledAt yyyy-MM-dd HH:mm:ss (null immediate)
- vNext now: src/modules/activity/notification-service.ts:34-58: direct delivery schema has no schedule
- Fix: Support send-later through due delivery workflow and timezone-aware field.

## G2-8-018-035  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:58-84: POST createNotification authorizes class or course
- vNext now: src/modules/activity/notification-service.ts:140-266: per-event/user deliver
- Fix: Implement audience fanout preserving class/course target scope.

## G2-8-018-036  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:125-175: GET by class/course and recipient
- vNext now: src/modules/activity/notification-service.ts:273-341,476-543: self in-app feeds only
- Fix: Preserve both class notices and recipient-specific feed source.

## G2-8-018-037  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:178-235: PUT edit and DELETE soft-delete authorized staff
- vNext now: src/modules/activity/notification-service.ts:365-466: only mark own read and mark all
- Fix: Map staff edits/deletes to scoped announcement producer state.

## G2-8-018-039  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:139-163: send instantly or schedule, immediate SSE on release
- vNext now: src/modules/activity/notification-service.ts:140-266: direct DB write with no schedule
- Fix: Add due processing and only reveal delivered notices.

## G2-8-018-041  [P1] GAP  facet F11  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:296-315: staff-only write, faculty only own creatorFacultyId
- vNext now: src/modules/activity/notification-service.ts:140-266: event writer checks scoped actor/event
- Fix: Enforce teacher ownership on mutable announcement record, plus staff-only write.

## G2-8-018-043  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:187-201: on edit verify access to old AND new audience
- vNext now: src/modules/activity/notification-service.ts:365-439: only own read state mutation
- Fix: Implement pre- and post-target authorization on announcement edits.

## G2-8-018-054  [P1] GAP  facet F14  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:12-14: sanitized HTML notification message; external assessment_url
- vNext now: src/modules/activity/notification-service.ts:34-58: short plaintext body and internal-only href
- Fix: Preserve safe rich-text and whitelisted http(s) assessment launch.

## G2-8-018-056  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/NotificationDispatcherService.java:8-24: registry in-app, ZeptoMail, TRAI SMS
- vNext now: src/modules/activity/notification-service.ts:140-266, src/db/schema/messaging-receipts.ts:21-96: in-app writer and separate email/SMS receipts
- Fix: Trace every event to provider dispatch, not merely receipt storage.

## G2-8-018-057  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:106-169: email allowlist, retries, job-update SMS
- vNext now: src/modules/activity/notification-service.ts:140-266: no provider send in direct writer
- Fix: Compare safe nonprod outbound provider gates and event templates.

## G2-8-018-070  [P1] GAP  facet F20  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NotificationRepository.java:164-178: query due rows and prune old notices
- vNext now: src/modules/activity/notification-service.ts:476-525: timestamp+id cursor and no due filtering on inbox
- Fix: Enforce due gate before insert; schedule retention/tombstones.

## G2-8-018-074  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:53-169: registry-driven multi-channel dispatch and retries
- vNext now: src/modules/activity/notification-service.ts:140-266: in-app insert only
- Fix: Create event-by-event notification/send parity table, including error outcomes.

## G2-8-018-085  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:76-78: assessment_url VARCHAR2048
- vNext now: src/db/schema/activity.ts:142, src/modules/activity/notification-service.ts:46-55: internal-only actionHref
- Fix: Provide validated external assessment target separate from internal href.

## G2-17-026-014  [P2] GAP  facet F07  effort S
- Legacy: Bean validation messages `HTML content is required`, `HTML content cannot exceed 50000 characters`; NotificationDTO.java:10-13
- vNext now: Zod min/max validation differs for body; notification-service.ts:31-46
- Fix: Mirror exact field error strings on any staff notification composer.

## G2-17-026-015  [P2] GAP  facet F07  effort S
- Legacy: Title validation `Title is required` / `Title cannot exceed 200 characters`; NotificationDTO.java:14-17
- vNext now: Zod title .min(1).max(240), no legacy messages; notification-service.ts:30-38
- Fix: Use legacy 200-char cap and exact messages on corresponding frontend composer.

## G2-17-026-016  [P2] GAP  facet F07  effort S
- Legacy: Auth errors: 401 `Authentication required`, 403 own notification, 404 `Notification not found`, 500 `An error occurred`; NotificationController.java:62-65,113-122,181-211
- vNext now: Owner-only service throws `NOTIFICATION_NOT_FOUND`; notification-service.ts:363-376
- Fix: Map to normalized 401/403/404 and preserve equivalent safe user-facing copy.

## G2-17-026-018  [P2] MISSING  facet F08  effort S
- Legacy: Delete `/delete/{id}` returns `Notification deleted successfully`; legacy delete query `/deleteNotification` returns `Deleted notification successfully`; NotificationController.java:231-233,285-288
- vNext now: Read acknowledgement returns updated row without delete message; notification-service.ts:363-415
- Fix: Implement or explicitly retire staff delete confirmation and distinguish legacy two endpoint response messages.

## G2-17-026-019  [P2] GAP  facet F08  effort S
- Legacy: Create/update returns `OK` with entity/DTO; NotificationController.java:79-85,201-204
- vNext now: Delivery returns counts delivered/skippedInactive/skippedDuplicate; notification-service.ts:218-231
- Fix: Translate backend status to staff action confirmation and expose recipient failure counts.

## G2-15-011-023  [P2] GAP  facet F07  effort S
- Legacy: HTML content is required/Title is required; 50000/200 max exact errors. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:12-17`)
- vNext now: Generic Zod min1/max2000 and max240, not old validation messages. (`src/modules/activity/notification-service.ts:34-45`)
- Fix: Recreate exact legacy content/title validation in applicable compose form.
