# Work packet (wave 2): edit src/modules/projects/resource-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-16-028-032  [P2] GAP  facet F12  effort M
- Legacy: projectSectionFieldConfigs.js:348-353 derives collision-safe resource keys from title and preserves explicit existing keys.
- vNext now: resource-service.ts:149-167 inserts templateKey null and sequence latest+1.
- Fix: Add collision-safe key generation and uniqueness parity; do not null every new resource key.

## G2-16-028-047  [P2] GAP  facet F20  effort M
- Legacy: projectSectionFieldConfigs.js:348-353 generates unique keys for repeated names; RepeatingItemEditor.jsx:87-95 handles adjacent reorder.
- vNext now: projects.ts:602-608 has unique template key + sequence constraints; resource-service.ts:147-169 uses max+1.
- Fix: Handle concurrent sequence insertion conflicts and repeated slug names predictably.

## G2-4-029-060  [P2] GAP  facet F21  effort M
- Legacy: Calls projectWorkspaceService.getProjectResourceAudit (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:839-861`)
- vNext now: Resource mutations emit activity taxonomy/audit (`src/modules/projects/resource-service.ts:8-12,92-100`)
- Fix: Maintain dedicated audit record generation alongside activity stream.

## G2-15-017-041  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectResourceAuditRepository.java:18-22 Pageable project query; key query unbounded
- vNext now: src/modules/projects/resource-service.ts:76-89 list of current resources, not history
- Fix: DB paginate append-only history; index sorted scope and key

## G2-15-017-045  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V80__project_resource_audit.sql:1-20 durable synchronous history table
- vNext now: src/modules/projects/resource-service.ts:175-178 transaction-scoped activity writer, no history table
- Fix: Persist history transactionally and not as deferred notification
