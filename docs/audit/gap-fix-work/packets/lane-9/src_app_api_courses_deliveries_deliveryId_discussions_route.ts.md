# Work packet: edit src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l17-u027-discussion-controller.md, docs/audit/gap2/lane-5/u020-discussions.md

## G2-17-027-001  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:26-30`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:20-32`
- Fix: Legacy `/api/v1/discussion` is per lesson-content discussion; vNext GET delivery chat is a different resource. Lesson-content API still staged.

## G2-17-027-020  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:75-85`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:42-69`
- Fix: Lesson-content post persists Discussion row with sequence; vNext create posts delivery message, not lesson-linked, changing isolation.

## G2-5-020-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy `/api/v1/discussion/post` and `/fetchDiscussion` per lesson_content_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:22-30,75-94`
- vNext now: VNext registered `/api/courses/deliveries/[deliveryId]/discussions` per delivery not lesson `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:1-42`
- Fix: Implement lesson-content-scoped runtime API or migrate clients explicitly.

## G2-17-027-014  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:47-52`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:20-38`
- Fix: Old service unavailable 503/Auth required401/content missing404 explicit, vNext unified apiErrorResponse with scoped errors.

## G2-17-027-016  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:83-84`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:64-65`
- Fix: Legacy success `Response(OK,OK,success)` status200, vNext 201 `{message}`.

## G2-17-027-017  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:91-93`
- vNext now: `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:34-38`
- Fix: Legacy read returns Response envelope list, vNext object response including pagination and permission capabilities.

## G2-5-020-022  [P3] GAP  facet F08  effort S
- Legacy: Legacy POST success Response(HttpStatus.OK, 'OK', 'success') `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:76-83`
- vNext now: New CRUD returns structured message record, no exact response wrapper `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts:1-42`
- Fix: Add compatibility envelope where old callers remain.
