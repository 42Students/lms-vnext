# Work packet (wave 2): edit src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/classroom-controller.md, docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md, docs/audit/gap2/lane-3/l17-u027-discussion-controller.md

## G2-2-033-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:16-18 course/class
- vNext now: src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:19-42 delivery URL
- Fix: Use delivery URL mapping rather than integer class/course pair.

## G2-2-033-015  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:43-47 GET Response(status,message,data)
- vNext now: src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:28-37 returns accessMode,canPost,messages,nextCursor
- Fix: Implement typed compatibility parser; do not expect res.data.data.

## G2-2-033-037  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassroomController.java:50-55 POST JSON message courseId/classId
- vNext now: src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:42-68 body messageText/replyTo; returns message 201
- Fix: Map payload, HTTP status and response envelope.

## G2-12-009-036  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:203-225`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:19-38`
- Fix: Legacy courseServices GET /classroom/messages?courseId&classId&since; vNext /api/courses/deliveries/{UUID}/discussions read no-store with cursor schema.

## G2-12-009-037  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:336-355`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:42-69`
- Fix: Legacy create POST courseId/classId/messageText, vNext POST deliveryId/messageText optional replyTo, returns201 {message} and audit activity.

## G2-12-009-074  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:13-17`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:19-69`
- Fix: Legacy courseServices REST and Spring classroom endpoints replaced by Next API and Drizzle activity services, not a websocket.

## G2-17-027-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:75-93`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:42-65`
- Fix: Legacy `/post` and `/fetchDiscussion?lessonContentId=`; vNext POST/GET `/api/courses/deliveries/{UUID}/discussions`.

## G2-17-027-011  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:87-93`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:20-34`
- Fix: Old GET parameter lessonContentId numeric, new `{deliveryId}` UUID and beforeCreatedAt/beforeId.

## G2-17-027-028  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:47-52`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:34-38`
- Fix: Legacy optional LessonContentsService missing -> 503 Service unavailable; vNext cannot fetch staged thread, no equivalent error UX.

## G2-17-027-045  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:75-94`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:20-69`
- Fix: Old headless JSON APIs vs Next same-origin POST/GET using signed-in request context.

## G2-17-027-039  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:84-84`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:64-65`
- Fix: Old success OK/"success" response, new `{message}` 201; frontend toast must be mapped.
