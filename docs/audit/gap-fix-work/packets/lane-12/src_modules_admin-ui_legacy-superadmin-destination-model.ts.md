# Work packet: edit src/modules/admin-ui/legacy-superadmin-destination-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u030-superadmin-project-audit.md, docs/audit/gap2/lane-7/u032-superadmin-readiness.md, docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md, docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md, docs/audit/gap2/lane-7/u031-superadmin-projects-index.md

## G2-7-030-001  [P0] GAP  facet F01  effort M
- Legacy: audit/index.js:490-505 /superadmin/projects/audit page with Projects group tabs
- vNext now: superadmin/[...legacy]/page.tsx:12-15 and legacy-superadmin-destination-model.ts:23-25 nested projects/audit refused
- Fix: Redirect exact legacy /superadmin/projects/audit to protected /admin/projects/audit

## G2-7-032-001  [P0] GAP  facet F01  effort M
- Legacy: readiness/index.js:386-417 nested /superadmin/projects/readiness with SuperAdmin Projects tabs
- vNext now: superadmin/[...legacy]/page.tsx:12-15 and legacy-superadmin-destination-model.ts:23-25 reject nested route
- Fix: Redirect legacy route to /admin/projects/readiness under Super Admin guard

## G2-7-033-001  [P0] GAP  facet F01  effort L
- Legacy: templates/[templateId]/colleges.js:22-27 /superadmin/projects/templates/{numericId or slug}/colleges
- vNext now: superadmin/[...legacy]/page.tsx:12-15 and legacy-superadmin-destination-model.ts:23-25 rejects nested segments
- Fix: Redirect nested template-colleges legacy URL to scoped /admin/projects/templates/{UUID}/colleges with slug lookup

## G2-16-028-001  [P1] MISSING  facet F01  effort M
- Legacy: resources.js:19-26 and SuperAdminWorkspaceShell.jsx:8-29 serve `/superadmin/projects/workspaces/[workspaceId]/resources` with Resources tab and workspace breadcrumb.
- vNext now: legacy-superadmin-destination-model.ts:22-35 refuses any path with more than one segment; superadmin/[...legacy]/page.tsx:11-20 calls notFound.
- Fix: Map nested legacy workspace resource paths to `/admin/projects/:id/resources` with secure ID translation; preserve `from` breadcrumb.

## G2-16-028-052  [P1] MISSING  facet F23  effort M
- Legacy: legacy superadmin nested URL exists at resources.js:19-26, but generic redirect VDEST:22-35 refuses nested paths.
- vNext now: legacy-superadmin-destination-model.ts:22-35 has no nested workspace route support.
- Fix: Implement secure nested route mapping; preserve site bookmarks.

## G2-7-031-002  [P1] GAP  facet F01  effort M
- Legacy: superAdminNavGroups.js:21-30 first Super Admin projects tab Templates
- vNext now: legacy-superadmin-destination-model.ts:20-21 projects maps /admin/projects workspaces; project-templates maps templates
- Fix: Make group destination resolve from Super Admin Projects group first tab

## G2-7-031-018  [P1] GAP  facet F10  effort M
- Legacy: superadmin/projects/index.js:5-6 imports superAdminGroupDefaultPath to choose template catalogue
- vNext now: legacy-superadmin-destination-model.ts:4-33 static route map picks workspaces
- Fix: Make redirect target match Templates entry and test route mapping

## G2-7-031-023  [P1] GAP  facet F12  effort M
- Legacy: superAdminNavGroups.js:21-30 Templates first by deliberate role-specific prioritization
- vNext now: legacy-superadmin-destination-model.ts:21 projects maps Workspaces
- Fix: Enforce product rule that Super Admin begins on Templates
