# Work packet (wave 2): edit src/modules/academics/college-cohort-mutation-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md

## G2-2-029-103  [P2] GAP  facet F22  effort M
- Legacy: BatchController.java:54-59 audit records batch integer entityId and collegeId.
- vNext now: college-cohort-mutation-service.ts:148-159 emits UUID subject and organization/college scope.
- Fix: Map legacy audit event target IDs and actor history for support.

## G2-2-029-096  [P3] GAP  facet F21  effort M
- Legacy: BatchController.java:34-52 depends AccessControl, SecurityContext, ScopeResolution, AuditLog.
- vNext now: college-cohort-mutation-service.ts:17-49 uses typed context, acting-college resolver, activity writer.
- Fix: Document service migration dependencies and role scope changes.
