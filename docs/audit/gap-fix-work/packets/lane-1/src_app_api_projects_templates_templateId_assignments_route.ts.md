# Work packet: edit src/app/api/projects/templates/[templateId]/assignments/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-template-controller.md

## G2-2-021-004  [P1] GAP  facet F01  effort M
- Legacy: AdminProjectTemplateController.java:145-171 GET/PUT /{id}/colleges for set with expected IDs
- vNext now: src/app/api/projects/templates/[templateId]/assignments/route.ts:29-87 POST/DELETE one college
- Fix: Expose atomic bulk assignment replace with expected set CAS.

## G2-2-021-020  [P1] GAP  facet F06  effort M
- Legacy: AdminProjectTemplateController.java:154-168 PUT `{collegeIds,expectedCollegeIds}`
- vNext now: src/app/api/projects/templates/[templateId]/assignments/route.ts:17-21 `{collegeId}` single UUID
- Fix: Add bulk desired set + optimistic expected set; reject concurrent assignment edits.

## G2-2-021-034  [P1] GAP  facet F10  effort M
- Legacy: AdminProjectTemplateController.java:154-168 bulk assignment expected set CAS
- vNext now: src/app/api/projects/templates/[templateId]/assignments/route.ts:29-87 independent per-college mutations
- Fix: Atomic replace with expected assigned set to prevent lost concurrent edits.

## G2-2-021-062  [P1] GAP  facet F20  effort M
- Legacy: AdminProjectTemplateController.java:161-168 expectedCollegeIds optimistic assignment set
- vNext now: src/app/api/projects/templates/[templateId]/assignments/route.ts:17-26 one college ID only
- Fix: Implement CAS for assignment set and meaningful conflict report.

## G2-2-021-025  [P2] GAP  facet F07  effort M
- Legacy: AdminProjectTemplateController.java:161-168 invalid college list parsing throws IllegalArgumentException 400
- vNext now: src/app/api/projects/templates/[templateId]/assignments/route.ts:17-26 Zod UUID payload
- Fix: Use actionable assignment validation per selected college.

## G2-2-021-028  [P2] GAP  facet F08  effort M
- Legacy: AdminProjectTemplateController.java:339 Template assigned to college,362 unassigned from college
- vNext now: src/app/api/projects/templates/[templateId]/assignments/route.ts:51-54,82 `{assignment}`
- Fix: Display per-college assignment success/unchanged/error with precise label.
