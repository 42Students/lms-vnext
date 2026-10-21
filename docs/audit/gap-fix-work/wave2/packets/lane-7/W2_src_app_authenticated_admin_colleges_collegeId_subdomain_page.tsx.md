# Work packet (wave 2): edit src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-9/superadmin-college-subdomain.md

## G2-5-024-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy `/api/v1/superadmin/tenant` houses domains, onboarding, subdomain, branding and settings. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:40-47`, `docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:3-22`
- vNext now: vNext splits into college setup pages, settings inventory and `/api/tenant-domains` routes. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:14-43`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:17-63`, `src/app/(authenticated)/admin/settings/page.tsx:30-89`
- Fix: Provide precise navigation/route compatibility map.

## G2-5-024-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy domain list, managed web address and branding are separate management surfaces. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:137-149,315-337,568-582`
- vNext now: vNext web address page managed address then custom-domain disclosure; separate branding editor. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:31-41`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-62`
- Fix: Review exact visual section order and titles against legacy in browser.

## G2-5-024-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy managed subdomain control displays base domain/current host and Allot or Remove. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:6-24`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:325-396`
- vNext now: vNext managed section is environment-gated and displays ready status. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:32-40`, `src/modules/tenant-domains/managed-subdomain-service.ts:30-38`
- Fix: Show same visible address fields and actionable env readiness help.

## G2-5-024-044  [P2] GAP  facet F13  effort M
- Legacy: Legacy web address load has spinner,error fallback and ignores stale fetches. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:28-51`
- vNext now: vNext server-side request, errors go to boundary. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:14-23`
- Fix: Provide local retry and distinguish missing config from fetch failure.

## G2-5-024-053  [P2] GAP  facet F18  effort M
- Legacy: Legacy says web address works immediately with HTTPS as soon as allotted. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:127-130`
- vNext now: vNext says only verified address may become primary and managed domain depends on infra. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:32-41`
- Fix: Align copy for verified managed wildcard and retain prerequisite caveat.

## G2-5-030-030  [P2] GAP  facet F09  effort M
- Legacy: Legacy each tab contents rendered within drawer with 16px padding. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:124-183`
- vNext now: vNext child pages have own headers and disclosures. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:31-43`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-63`
- Fix: Create embedded form variant excluding duplicate headers.

## G2-5-030-031  [P2] GAP  facet F10  effort M
- Legacy: Legacy Web address/Branding child components issue own admin API reads/writes, report busy/dirty. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:130-155`, `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:12-25`, `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:13-36`
- vNext now: vNext separate server reads and POST/PATCH form actions, no integrated result handling. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:17-39`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:30-55`
- Fix: Map child mutations, preserved values and refresh mechanics.

## G2-9-031-001  [P2] GAP  facet F01  effort M
- Legacy: Embedded component accepts fixedCollegeId and parent dirty/busy callbacks `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:12-26`
- vNext now: Dedicated route with college UUID and no embedded callbacks `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:14-23`
- Fix: Support dirty/busy state in Manage College drawer integration.

## G2-9-031-002  [P2] GAP  facet F01  effort S
- Legacy: Always Look and feel style Web address Card with exact title `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:120-130`
- vNext now: PageHeader college name, nested Managed college address section `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:31-37`
- Fix: Use framed Card headed Web address.

## G2-9-031-004  [P2] GAP  facet F02  effort M
- Legacy: Small Web address Card, Reload in header, helper, live banner, input and actions `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:120-160`
- vNext now: Large header, managed section, custom-domain disclosure, no Card framing `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:31-42` `src/components/admin/managed-college-subdomain.tsx:50-91`
- Fix: Restore compact Card structure/spacing.

## G2-9-031-008  [P2] MISSING  facet F03  effort S
- Legacy: Small Reload button with ReloadOutlined icon `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:125-126`
- vNext now: No explicit Reload button, relies on page navigation/refresh `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:31-42` `src/components/admin/managed-college-subdomain.tsx:50-91`
- Fix: Add Reload with old wording and loading indicator.

## G2-9-031-045  [P2] GAP  facet F13  effort M
- Legacy: Card loading spinner and error banner Couldn't load the web address `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:28-47,120-129`
- vNext now: Server page error bubble, no inline loading card `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:19-23`
- Fix: Add in-card loading/error Retry.
