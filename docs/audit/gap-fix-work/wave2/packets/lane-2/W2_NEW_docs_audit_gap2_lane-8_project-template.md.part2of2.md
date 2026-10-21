# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-8/project-template.md (part 2 of 2)

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/project-template.md

## G2-8-017-084  [P2] GAP  facet F22  effort M
- Legacy: LBE/backend migration/V140__project_template_college_assignment.sql:9-16 template/college unique, nullable assigned_by, BaseModel deletion marker
- vNext now: V/db/schema/projects.ts:123-165 version-pinned active unique partial index, required assignedBy UUID, revokedAt
- Fix: Preserve assignment membership history and reconcile null assigner; document revocation semantics.
