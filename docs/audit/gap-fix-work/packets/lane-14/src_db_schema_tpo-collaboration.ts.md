# Work packet: edit src/db/schema/tpo-collaboration.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-1/learner-placement-profile-controller.md

## G2-19-031-130  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:31-44` — Legacy TPO thread has reply token and email throttle marker.
- vNext now: `src/db/schema/tpo-collaboration.ts:34-68` — New thread lacks replyToken/recruiterEmailedAt.
- Fix: Add email token and sent-window fields/indexes.

## G2-19-031-131  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:92-123` — Legacy TPO messages have kind/event/request/via fields.
- vNext now: `src/db/schema/tpo-collaboration.ts:71-104` — New message table has senderType, body, readAt only.
- Fix: Add transport, event, request data with FK guard.

## G2-1-009-053  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:44-55`: reads external share/download audit from tpo_share_event.
- vNext now: `src/db/schema/tpo-collaboration.ts:106-229`: typed placementTpoShareLinks and placementTpoShareEvents available.
- Fix: Connect learner data-access read to share-event schema with stage/visibility controls.

## G2-1-009-056  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:46-55`: relational job/share/event/application log.
- vNext now: `src/db/schema/tpo-collaboration.ts:106-229`: placementTpoShareLinks and placementTpoShareEvents normalized UUID and constraints.
- Fix: Implement learner-level read joins with safe share-record eligibility and timestamp indexes.
