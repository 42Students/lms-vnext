# Work packet (wave 2): edit src/modules/projects/template-college-availability-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

## G2-7-033-016  [P2] GAP  facet F04  effort M
- Legacy: colleges.js:189-238 assigned IDs and Unknown IDs used for table switches
- vNext now: template-college-availability-service.ts:12-13 returns scoped rows and assignment records; errors whole page
- Fix: Ensure pending/unknown state not misrepresented as unassigned

## G2-7-033-064  [P2] GAP  facet F21  effort L
- Legacy: colleges.js:9-17 AdminService getColleges, getProjectTemplateById, assign/unassign, bulkSet
- vNext now: template-college-availability-service.ts:12-13 + project-template-controls.tsx:458-460 APIs
- Fix: Document all endpoint payloads and draft published constraints
