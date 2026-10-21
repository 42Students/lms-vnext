# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/project-template-college.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/project-template-college.md

## G2-6-017-008  [P1] GAP  facet F04  effort M
- Legacy: Legacy assigned_by nullable integer (ProjectTemplateCollege.java:26-27; V140__project_template_college_assignment.sql:11).
- vNext now: vNext assignedByUserId UUID NOT NULL FK users (projects.ts:143-147).
- Fix: Choose explicit system actor for historical unowned assignments; provide backward-compatible import fallback.
