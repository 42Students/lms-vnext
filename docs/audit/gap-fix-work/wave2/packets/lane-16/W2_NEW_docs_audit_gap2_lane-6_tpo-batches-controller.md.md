# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/tpo-batches-controller.md

12 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/tpo-batches-controller.md

## G2-6-023-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy GET /api/v1/tpo/batches returns college-scoped placement batch overview (TpoBatchesController.java:32-41).
- vNext now: vNext TPO batch workspace reads cohort and lifecycle under RequestContext (tpo-batch-workspace-read-service.ts:13-39).
- Fix: Map legacy batch overview fields and first-entry route to vNext batches index with same states.

## G2-6-023-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy batch detail includes classes, 50 history entries and lastAction (PlacementEligibilityService.java:431-462).
- vNext now: vNext batch read separately paginates roster and loads up to 100 eligibility events (tpo-batch-workspace-read-service.ts:75-120).
- Fix: Match 50 history depth and class decision card semantics; preserve separate student page pagination.

## G2-6-023-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy batch view outputs college, batch and effective rules plus jobTypes (TpoBatchesController.java:71-81).
- vNext now: vNext save service returns rulesOverride and version only (tpo-batch-rules-service.ts:8-18).
- Fix: Provide read DTO exposing inherited and effective rule sets plus all custom job types.

## G2-6-023-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy job type display contains name and countsAsPlaced (TpoBatchesController.java:78-81).
- vNext now: vNext ruleSave result omits jobTypes (tpo-batch-rules-service.ts:18).
- Fix: Join college custom job types and derive effective placed count per displayed type.

## G2-6-023-015  [P2] GAP  facet F06  effort M
- Legacy: Legacy batch update fields registrationDeadline, boolean setDeadline, optional finished (TpoBatchesController.java:84-94).
- vNext now: vNext upsertPlacementBatchSettings requires current lifecycle version (batch-participation-service.ts:466-501).
- Fix: Ensure explicit clear-deadline and finish/reopen workflows map to distinct safe operations.

## G2-6-023-016  [P2] GAP  facet F06  effort M
- Legacy: Legacy invite request nullable deadline LocalDateTime (TpoBatchesController.java:97-105).
- vNext now: vNext invite logic derives input/current deadline in transaction (batch-participation-service.ts:645-680).
- Fix: Compare null deadline default and exclusive deadline parsing/timezone; surface disabled state when missing.

## G2-6-023-029  [P2] GAP  facet F10  effort M
- Legacy: Legacy PUT updateBatch mutates deadline and finished flag and returns fresh detail (TpoBatchesController.java:84-95).
- vNext now: vNext lifecycle stored with registrationDeadline/finishedAt and transaction safeguards (batch-participation-service.ts:466-501,725-734).
- Fix: Expose reopen and finish transitions with exact status and no silently lost deadline.

## G2-6-023-050  [P2] GAP  facet F18  effort S
- Legacy: Legacy states NOT_STARTED, IN_PLACEMENTS, FINISHED (PlacementEligibilityService.java:417-419).
- vNext now: VNext lifecycle exposed as invitedAt/finishedAt/deadline (tpo-batch-workspace-read-service.ts:25-39).
- Fix: Derive literal visible legacy status and tint for each batch.

## G2-6-023-051  [P2] GAP  facet F18  effort M
- Legacy: Legacy rule JSON keys college,batch,effective,jobTypes (TpoBatchesController.java:71-81).
- vNext now: VNext save API uses rulesOverride/version (tpo-batch-rules-service.ts:14-18).
- Fix: Preserve readable labels and effective-inheritance explanations.

## G2-6-023-055  [P2] GAP  facet F20  effort M
- Legacy: Legacy LocalDateTime deadline and invitation window (TpoBatchesController.java:11,84-105).
- vNext now: VNext Date/timestamptz stored on lifecycle (batch-participation-service.ts:645-680).
- Fix: Validate IST display and UTC server deadline exclusivity at boundary.

## G2-6-023-057  [P2] GAP  facet F22  effort L
- Legacy: Legacy tables placement_eligibility and placement_eligibility_event scoped BATCH/CLASS/LEARNER (PlacementEligibilityService.java:17-29,171-265).
- vNext now: VNext placement_eligibility_decisions scoped COHORT/SECTION/MEMBERSHIP (placement-access.ts:15-61).
- Fix: Document mapping and precedence, event restore and tenant composite keys.

## G2-6-023-012  [P3] GAP  facet F05  effort S
- Legacy: Legacy history limits 50 events for detail (PlacementEligibilityService.java:462).
- vNext now: vNext returns max100 latest events (tpo-batch-workspace-read-service.ts:106-120).
- Fix: Show 50 by default, allow additional history without silently truncating.
