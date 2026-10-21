# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/project-template-college.md

8 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/project-template-college.md

## G2-6-017-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy repository offers findByCollegeId and findByTemplateId (ProjectTemplateCollegeRepository.java:18-22).
- vNext now: vNext directory shows active assignment counts in admin directory (super-admin-template-directory-service.ts:29-39).
- Fix: Expose and match template-wise assigned-college view and college-wise template list entry.

## G2-6-017-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy BaseModel created_at/updated_at/is_deleted metadata (BaseModel.java:28-37).
- vNext now: vNext assignedAt and revokedAt; no updatedAt/isDeleted (projects.ts:148-156).
- Fix: Map creation to assignedAt and clarify update-at and deletion behavior in audit/export.

## G2-6-017-013  [P2] GAP  facet F05  effort M
- Legacy: Repository findByTemplateId declared for future assigned-colleges view (ProjectTemplateCollegeRepository.java:20-22).
- vNext now: vNext directory aggregates activeAssignment count (super-admin-template-directory-service.ts:29-39).
- Fix: Implement explicit per-college detail list if UI requires, not just count.

## G2-6-017-014  [P2] GAP  facet F05  effort M
- Legacy: Legacy assignment uniqueness template_id+college_id all-time (ProjectTemplateCollege.java:16).
- vNext now: vNext uniqueness only among revokedAt NULL rows (projects.ts:157-162).
- Fix: Document historical repeat assignments; ensure consumer never mistakes old revoked row for active.

## G2-6-017-016  [P2] GAP  facet F06  effort M
- Legacy: Legacy assignedBy can be null (V140__project_template_college_assignment.sql:9-11).
- vNext now: vNext assignment insertion always current user id (template-service.ts:709-715).
- Fix: Define migration/system actor and display placeholder for historical null assignedBy.

## G2-6-017-021  [P2] GAP  facet F10  effort M
- Legacy: Legacy unassign deletes row, not status flip (ProjectTemplateCollege.java:13-15; ProjectTemplateCollegeRepository.java:24).
- vNext now: vNext revoke sets revokedAt leaving historical row (template-service.ts:751-755).
- Fix: Treat absence of active assignment identically; document intentional history retention in audit/export.

## G2-6-017-030  [P2] GAP  facet F13  effort S
- Legacy: Repository returns false/empty for absent mapping (ProjectTemplateCollegeRepository.java:14-18).
- vNext now: vNext detail throws PROJECT_TEMPLATE_NOT_ASSIGNED (instance-service.ts:61-122).
- Fix: Render legacy empty/not-assigned state rather than generic 500.

## G2-6-017-042  [P2] GAP  facet F22  effort L
- Legacy: Legacy project_template_college has int ID, created/updated, is_deleted, templateId, collegeId, nullable assignedBy, unique pair, FK only template (V140__project_template_college_assignment.sql:4-17).
- vNext now: vNext table UUID ID, templateVersionId and users/college FK, assignedAt/revokedAt, active partial unique (projects.ts:123-170).
- Fix: Write explicit field/constraint parity mapping and migration rules for legacy assignments.
