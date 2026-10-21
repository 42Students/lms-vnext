# Work packet: edit src/modules/academics/college-batch-retire-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md

## G2-2-029-059  [P1] GAP  facet F11  effort M
- Legacy: BatchController.java:308-321 scoped SA delete allows college/org scope.
- vNext now: college-batch-retire-service.ts:17-23 requires COLLEGE_ADMIN membership; no SA in this service.
- Fix: Supply authorized SA retire path through acting college permission, not an unscoped bypass.
