# Work packet (wave 2): edit src/modules/projects/delivery-activity-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/project-delivery-event.md

## G2-3-018-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryEventDTO.java:6-24`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryEventRepository.java:19-20`
- vNext now: `src/db/schema/projects.ts:914-936`, `src/modules/projects/delivery-activity-model.ts:4-18`
- Fix: Legacy single chronological history entry covers action, status, actor display, notes, file URL, feedback, revision and createdAt. VNext stores limited technical event and separate activity. Build combined chronological row projection.

## G2-3-018-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:22-47`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryEventDTO.java:10-23`
- vNext now: `src/db/schema/projects.ts:923-935`, `src/modules/projects/delivery-activity-model.ts:12-18`
- Fix: Legacy list can label DRAFT_SAVED/SUBMITTED/REVIEWED and actor notes, status; vNext projectDeliveryEvents eventType enum LOCKED/REOPENED/ATTACHMENTS_CHANGED, activity types DRAFT_CREATED/DRAFT_UPDATED/SUBMITTED/REVIEWED/LOCKED. Map to legacy badges and actor context.

## G2-3-018-027  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:22-26`
- vNext now: `src/db/schema/projects.ts:950-953`, `src/modules/projects/delivery-activity-model.ts:4-18`
- Fix: Legacy free-text action/status length60 accommodates revision/review variants; vNext technical enum only three transitions and activity separate five. Define explicit mapping table for every source action.

## G2-3-018-037  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:382-420`
- vNext now: `src/modules/projects/delivery-activity-model.ts:12-18`
- Fix: Legacy API literal `Project submission history retrieved`/`Project delivery history retrieved`; vNext activity descriptions `Project delivery draft revised`, `Project delivery submitted for review`. Match user-facing labels, show revision count.
