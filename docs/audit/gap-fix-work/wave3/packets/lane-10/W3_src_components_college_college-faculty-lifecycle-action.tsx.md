# Work packet (wave 3): edit src/components/college/college-faculty-lifecycle-action.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-6-001-042  [P1] MISSING  facet F10  effort L
- Legacy: Old DELETE `/api/v1/faculty/delete/:id` reachable with confirmation `docs/legacy-source/frontend/src/api/Services/AdminService.js:254-255` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:477-488`
- vNext now: New college row exposes lifecycle but not faculty deletion `src/components/college/college-role-directory-workspace.tsx:440-449` `src/components/college/college-faculty-lifecycle-action.tsx:30-58`
- Fix: Implement guarded deletion with teaching/project dependencies or state justified omission
