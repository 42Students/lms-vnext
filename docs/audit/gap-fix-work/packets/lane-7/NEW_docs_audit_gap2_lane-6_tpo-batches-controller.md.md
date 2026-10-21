# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/tpo-batches-controller.md

10 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/tpo-batches-controller.md

## G2-6-023-004  [P1] GAP  facet F02  effort L
- Legacy: Legacy overview includes unbatched students and state FINISHED, IN_PLACEMENTS, NOT_STARTED (PlacementEligibilityService.java:366-425).
- vNext now: vNext read returns cohort with invited/finished/deadline, no full overview projection in getTpoBatch (tpo-batch-workspace-read-service.ts:25-39).
- Fix: Build total/eligible/placed/unbatched journey strip and same section ordering.

## G2-6-023-006  [P1] GAP  facet F03  effort M
- Legacy: Legacy eligible student counts, invited status, registered, verified, placed in overview (PlacementEligibilityService.java:366-425).
- vNext now: vNext batch read exposes invitedAt/finishedAt/deadline (tpo-batch-workspace-read-service.ts:25-39).
- Fix: Expose exact counts and quick-action badges per batch from authorized queries.

## G2-6-023-017  [P1] GAP  facet F06  effort L
- Legacy: Legacy eligibility decision array of Change {scopeType,scopeId,status,reason,note} (PlacementEligibilityService.java:136-141; TpoBatchesController.java:114-119).
- vNext now: vNext eligibility decisions modeled college/scope with statuses ELIGIBLE/INELIGIBLE (placement-access.ts:15-56).
- Fix: Support clear-to-NOT_DECIDED semantics via row removal, notes and per-scope decision provenance.

## G2-6-023-019  [P2] GAP  facet F07  effort S
- Legacy: Legacy college() rejects missing scoped college with exact Choose a college (TpoBatchesController.java:32-35).
- vNext now: vNext requires getTpoBatch authorized RequestContext and throws action errors (tpo-batch-workspace-read-service.ts:13-23).
- Fix: Map no-college error to literal copy and 403 scope selection affordance.

## G2-6-023-020  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid decision exact Choose Eligible, Ineligible or Not decided (PlacementEligibilityService.java:175-191).
- vNext now: vNext validation error Ineligible decisions must include a reason but enum paths differ (batch-participation-service.ts:44-62).
- Fix: Restore exact invalid-decision client and HTTP messaging.

## G2-6-023-021  [P2] GAP  facet F07  effort S
- Legacy: Legacy ineligible requires reason Give a reason for marking students ineligible (PlacementEligibilityService.java:188-191).
- vNext now: vNext returns Ineligible decisions must include a reason (batch-participation-service.ts:58-62).
- Fix: Clone literal validation wording and field-level placement.

## G2-6-023-022  [P2] GAP  facet F07  effort S
- Legacy: Legacy finished invite error This batch is finished. Reopen it first. (BatchRegistrationService.java:101-107).
- vNext now: vNext returns DB08_ACTION_INVALID generic typed error (batch-participation-service.ts:645-655).
- Fix: Map error codes to legacy complete wording; disable appropriate button.

## G2-6-023-024  [P2] GAP  facet F08  effort S
- Legacy: Legacy invite returns invited and deadline plus updated batch (TpoBatchesController.java:100-105).
- vNext now: vNext invite records activity event and in-app notification payload (batch-participation-service.ts:673-702).
- Fix: Match confirmation/result summary and success count wording, not just event creation.

## G2-6-023-025  [P2] GAP  facet F08  effort S
- Legacy: Legacy remind returns invited/reminded or everyone chosen copy through BatchRegistrationService (BatchRegistrationService.java:127-154).
- vNext now: vNext remind returns reminded,alreadySent,delivery=APP_ONLY (tpo-batch-reminder-service.ts:39-63).
- Fix: Render legacy Reminded N student(s) / Everyone has chosen already variants.

## G2-6-023-026  [P2] GAP  facet F08  effort M
- Legacy: Legacy rules save returns complete batch rule view including college/batch/effective/jobTypes (TpoBatchesController.java:63-81).
- vNext now: vNext returns only rulesOverride/version (tpo-batch-rules-service.ts:14-18).
- Fix: Return complete effective policy or revalidate/refetch after save.
