# Work packet: edit src/modules/projects/template-college-availability-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

## G2-7-033-038  [P1] GAP  facet F11  effort L
- Legacy: colleges.js:24-26 assignment is platform-wide, ignores header selected college
- vNext now: template-college-availability-service.ts:12-13 templateAvailabilityCollegesInScope(context.adminScope)
- Fix: Honor Super Admin global assignment management regardless of selected college, while checking row permissions
