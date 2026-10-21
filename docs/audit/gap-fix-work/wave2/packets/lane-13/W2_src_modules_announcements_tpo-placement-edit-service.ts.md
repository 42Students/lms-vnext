# Work packet (wave 2): edit src/modules/announcements/tpo-placement-edit-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-12-023-023  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:131-136`
- vNext now: `src/modules/announcements/tpo-placement-edit-service.ts:19-29`
- Fix: Legacy future sendAt/showUntil checks UTC and end after send; vNext parsed datetime-local schedule with explicit timezone model, inspect IST cutoff.

## G2-12-023-024  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:56-59`
- vNext now: `src/modules/announcements/tpo-placement-edit-service.ts:19-29`
- Fix: Legacy PUT update accepts entire Draft with optional email/tellAgain; vNext version-locked edit and strict schema, exact validation text differs.

## G2-12-023-053  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:211-241`
- vNext now: `src/modules/announcements/tpo-placement-edit-service.ts:122-138`
- Fix: Legacy edit with tellAgain pushes updated notification to original recipients; vNext inserts updated inAppNotification for users in original notice event, ensure no re-target.
