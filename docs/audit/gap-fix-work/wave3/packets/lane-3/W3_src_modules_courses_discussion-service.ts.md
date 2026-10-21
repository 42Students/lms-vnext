# Work packet (wave 3): edit src/modules/courses/discussion-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-19-031-002  [P1] MISSING  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:75-93` — Lesson-content discussion has independent post/fetch routes keyed lessonContentId.
- vNext now: `src/modules/courses/discussion-service.ts:33-38` — New primary post takes delivery path and optional parent ID, no lessonContentId.
- Fix: Ship distinct lesson-content discussion API/UI, not a delivery-wide substitute.

## G2-19-031-036  [P1] MISSING  facet F06  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/DiscussionDTO.java:12-19` — Lesson post has contentText <=5000 and sequence.
- vNext now: `src/modules/courses/discussion-service.ts:35-38` — Delivery post uses messageText and optional parent, no lesson target.
- Fix: Build lesson form with 5000 cap and sequence contract.
