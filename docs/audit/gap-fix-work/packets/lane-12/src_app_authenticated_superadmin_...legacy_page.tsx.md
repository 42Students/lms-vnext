# Work packet: edit src/app/(authenticated)/superadmin/[...legacy]/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u029-superadmin-at-risk.md, docs/audit/gap2/lane-7/u030-superadmin-project-audit.md, docs/audit/gap2/lane-7/u032-superadmin-readiness.md, docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md, docs/audit/gap2/lane-7/u034-superadmin-template-index.md, docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-029-001  [P0] GAP  facet F01  effort M
- Legacy: superadmin/projects/at-risk/index.js:60-63 route /superadmin/projects/at-risk uses selected Super Admin college scope
- vNext now: superadmin/[...legacy]/page.tsx:12-15 calls legacySuperAdminDestination; model.ts:23-25 rejects all paths longer than 1 segment
- Fix: Add exact protected redirect /superadmin/projects/at-risk -> /admin/projects/at-risk preserving safe query

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

## G2-7-034-001  [P0] GAP  facet F01  effort L
- Legacy: templates/[templateId]/index.js:14-21 redirects /superadmin/projects/templates/{id} to /superadmin/projects/templates/{id}/overview with same query
- vNext now: superadmin/[...legacy]/page.tsx:12-15 nested paths rejected, old URL 404
- Fix: Map legacy nested template root via authorized numeric/slug lookup to /admin/projects/templates/{UUID}

## G2-7-035-001  [P0] GAP  facet F01  effort L
- Legacy: templates/[templateId]/overview.js:153-156 /superadmin/projects/templates/{numeric/slug}/overview
- vNext now: superadmin/[...legacy]/page.tsx:12-15 nested route rejected by pathSegment.length check
- Fix: Add safe historical template overview redirect to /admin/projects/templates/{UUID}

## G2-18-028-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy /superadmin/projects/workspaces/[workspaceId]/overview under college selection and named shell tabs; overview.js:31-37,107-151;SuperAdminWorkspaceShell.jsx:14-26
- vNext now: Canonical vNext /admin/projects/[projectId]/overview and Super Admin legacy-route redirect; src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx:13-25;src/app/(authenticated)/superadmin/[...legacy]/page.tsx:10-20
- Fix: Confirm old deep-link route maps to overview, preserves from/college and does not 404

## G2-16-028-001  [P1] MISSING  facet F01  effort M
- Legacy: resources.js:19-26 and SuperAdminWorkspaceShell.jsx:8-29 serve `/superadmin/projects/workspaces/[workspaceId]/resources` with Resources tab and workspace breadcrumb.
- vNext now: legacy-superadmin-destination-model.ts:22-35 refuses any path with more than one segment; superadmin/[...legacy]/page.tsx:11-20 calls notFound.
- Fix: Map nested legacy workspace resource paths to `/admin/projects/:id/resources` with secure ID translation; preserve `from` breadcrumb.

## G2-7-031-001  [P1] GAP  facet F01  effort M
- Legacy: superadmin/projects/index.js:17-23 /superadmin/projects redirects with router.replace to first Projects tab
- vNext now: superadmin/[...legacy]/page.tsx:12-20 maps slug projects to /admin/projects
- Fix: Redirect /superadmin/projects to /admin/projects/templates not /admin/projects

## G2-7-031-013  [P2] GAP  facet F07  effort S
- Legacy: superadmin/projects/index.js:20-23 only router.isReady check before redirect
- vNext now: superadmin/[...legacy]/page.tsx:14-15 notFound when unmapped route
- Fix: Ensure known projects slug never 404s; unknown nested links handled explicitly

## G2-7-031-015  [P3] GAP  facet F08  effort S
- Legacy: superadmin/projects/index.js:25-29 active loading skeleton but no toast
- vNext now: superadmin/[...legacy]/page.tsx:10-20 no visible loading or toast
- Fix: Match loading state if browser navigation occurs during redirect
