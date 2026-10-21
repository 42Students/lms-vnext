# Work packet: edit src/app/api/admin/features/[collegeId]/trace/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l19-u026-module-access-controller.md

## G2-19-026-063  [P1] GAP  facet F23  effort M
- Legacy: Legacy placements exempt from lower scope hierarchy as eligibility separate. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:62`
- vNext now: vNext placement trace returns placementParticipation separate; descendant editor still includes placements. `src/app/api/admin/features/[collegeId]/trace/route.ts:31`
- Fix: Use trace participation as sole below-college placement gate and mark ignored scopes.
