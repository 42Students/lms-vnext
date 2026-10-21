# Verification packet (P1 sample): 6 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-030-023 [P1] GAP facet F05
- Files: src/components/projects/project-admin-audit-page.tsx
- Legacy: audit/index.js:635-645 All time only paginated 25/page; today/7d/30d up to200
- Expected fix: Implement 200 wide range / 25 all-time and cap disclosure

## G2-7-034-033 [P1] MISSING facet F18
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: SuperAdminTemplateShell.jsx:46 Back to templates and :51 Use this template
- Expected fix: Restore exact Use this template CTA

## G2-12-028-013 [P1] GAP facet F05
- Files: src/components/projects/project-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:105-131 columns Member, Role, Tasks assigned, Done · In review · In progress, Last task update
- Expected fix: Use DataTable with five exact column labels, badges, last-update format and horizontal scroll

## G2-8-018-003 [P1] GAP facet F01
- Files: src/components/activity/notification-toolbar.tsx
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:36-48,517-548: learner category tabs Course/Project/Announcements/Job; faculty College/Department/Faculty/Personal
- Expected fix: Restore role-category navigation and category-specific counts.

## G2-9-001-033 [P1] MISSING facet F09
- Files: src/app/(authenticated)/college/activity/page.tsx
- Legacy: Inline disclosure per event, details payload/IP/When (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:243-257`)
- Expected fix: Implement inline expand/collapse.

## G2-9-014-063 [P1] MISSING facet F12
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2025-2040` — Source EXTERNAL rows cannot be selected for admin bulk updates.
- Expected fix: Keep external candidate selection disabled with explanation.
