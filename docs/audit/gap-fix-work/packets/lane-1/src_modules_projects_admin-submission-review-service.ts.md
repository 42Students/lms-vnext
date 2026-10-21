# Work packet: edit src/modules/projects/admin-submission-review-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-3/project-delivery-event.md

## G2-2-020-005  [P1] GAP  facet F01  effort M
- Legacy: AdminProjectController.java:427-469 PUT delivery/review for admin
- vNext now: src/modules/projects/admin-submission-review-service.ts:16-85 admin lock but not full review
- Fix: Add admin approve/request-changes/lock actions with feedback and token.

## G2-2-020-038  [P1] GAP  facet F10  effort M
- Legacy: AdminProjectController.java:427-469 delivery review approve/reject/lock with feedback
- vNext now: src/modules/projects/admin-submission-review-service.ts:14-85 lock only
- Fix: Implement complete admin delivery review states and durable feedback.

## G2-2-020-046  [P1] GAP  facet F12  effort M
- Legacy: AdminProjectController.java:427-458 review delivery transitions Accept/Reject/Lock
- vNext now: src/modules/projects/admin-submission-review-service.ts:69-85 LOCK transition
- Fix: Implement review decision state machine, feedback, optimistic tokens.

## G2-2-020-053  [P1] GAP  facet F15  effort M
- Legacy: AdminProjectController.java:447-457 PROJECT_DELIVERY_ADMIN_REVIEW logs feedback/status
- vNext now: src/modules/projects/admin-submission-review-service.ts:77-82 LOCKED event
- Fix: Persist audit event for every admin decision and text feedback.

## G2-3-018-021  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:16-47`
- vNext now: `src/modules/projects/submission-service.ts:322-326`, `src/modules/projects/admin-submission-review-service.ts:77-82`
- Fix: Legacy single project_delivery_event history records broad actions, statuses and snapshots; vNext technical append-only event inserts only attachment change/lock/reopen. Record submission, draft save, review and feedback chronology via combined history.
