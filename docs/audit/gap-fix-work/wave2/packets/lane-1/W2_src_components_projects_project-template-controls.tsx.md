# Work packet (wave 2): edit src/components/projects/project-template-controls.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md, docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-033-033  [P2] GAP  facet F09  effort S
- Legacy: colleges.js:199-205 destructive per-college Popconfirm with workspaces unaffected explanation
- vNext now: project-template-controls.tsx:503-516 revoke Dialog with same consequence helper
- Fix: Match anchored confirmation title and Remove label

## G2-7-033-057  [P2] GAP  facet F18  effort S
- Legacy: colleges.js:200 Remove this template from the college?
- vNext now: project-template-controls.tsx:503-504 Revoke college assignment?
- Fix: Match exact destructive title and explanation

## G2-7-033-064  [P2] GAP  facet F21  effort L
- Legacy: colleges.js:9-17 AdminService getColleges, getProjectTemplateById, assign/unassign, bulkSet
- vNext now: template-college-availability-service.ts:12-13 + project-template-controls.tsx:458-460 APIs
- Fix: Document all endpoint payloads and draft published constraints

## G2-7-035-036  [P2] GAP  facet F09  effort M
- Legacy: overview.js:732-759 Duplicate template modal with optional slug/title/summary/status
- vNext now: project-template-controls.tsx:483-502 duplicate Dialog requires fields via new version model
- Fix: Match optional defaults and legacy initial status

## G2-7-035-039  [P2] GAP  facet F09  effort M
- Legacy: overview.js:491-557 Popconfirm on Publish, Unpublish and Archive with consequence
- vNext now: project-template-controls.tsx:503-561 Dialog for revoke/archive, lifecycle publish via mutate
- Fix: Match confirmation placement/title/description/danger

## G2-7-035-048  [P2] GAP  facet F12  effort M
- Legacy: overview.js:86-104 lifecycle Archived disabled in Select and initial workspace Archived disabled
- vNext now: project-template-controls.tsx:294-477 archive requires explicit dialog, no initial status Select
- Fix: Preserve no unconfirmed archive and seeded workspace status validation

## G2-7-035-062  [P2] GAP  facet F17  effort S
- Legacy: overview.js:503-524 disabled Publish tooltip via span wrapper remains keyboard focusable
- vNext now: project-template-controls.tsx:294-477 publish actions no such disabled explanation
- Fix: Show accessible blocker explanation near button
