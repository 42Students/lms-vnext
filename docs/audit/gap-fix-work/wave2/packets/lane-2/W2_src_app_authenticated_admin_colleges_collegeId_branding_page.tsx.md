# Work packet (wave 2): edit src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l15-u020-college-branding.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-15-020-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:119-142 Super Admin drawer 'Look and feel'
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:1-85 separate page
- Fix: Restore entry and context in Manage College drawer.

## G2-15-020-033  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:14 may be embedded ManageCollegeDrawer
- vNext now: src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:1-85 standalone editor
- Fix: Keep drawer unsaved-close protection.

## G2-5-024-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy `/api/v1/superadmin/tenant` houses domains, onboarding, subdomain, branding and settings. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:40-47`, `docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:3-22`
- vNext now: vNext splits into college setup pages, settings inventory and `/api/tenant-domains` routes. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:14-43`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:17-63`, `src/app/(authenticated)/admin/settings/page.tsx:30-89`
- Fix: Provide precise navigation/route compatibility map.

## G2-5-024-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy domain list, managed web address and branding are separate management surfaces. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:137-149,315-337,568-582`
- vNext now: vNext web address page managed address then custom-domain disclosure; separate branding editor. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:31-41`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-62`
- Fix: Review exact visual section order and titles against legacy in browser.

## G2-5-030-030  [P2] GAP  facet F09  effort M
- Legacy: Legacy each tab contents rendered within drawer with 16px padding. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:124-183`
- vNext now: vNext child pages have own headers and disclosures. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:31-43`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-63`
- Fix: Create embedded form variant excluding duplicate headers.

## G2-5-030-031  [P2] GAP  facet F10  effort M
- Legacy: Legacy Web address/Branding child components issue own admin API reads/writes, report busy/dirty. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:130-155`, `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:12-25`, `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:13-36`
- vNext now: vNext separate server reads and POST/PATCH form actions, no integrated result handling. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:17-39`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:30-55`
- Fix: Map child mutations, preserved values and refresh mechanics.

## G2-5-030-063  [P2] GAP  facet F22  effort M
- Legacy: Legacy local dirty/busy object with domain/signin/branding/admin keys; not persisted. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33`
- vNext now: vNext form-specific draft/version, no shared persisted revision ID. `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:46-55`, `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:28-31`
- Fix: Track per-section expectedVersion and pending changes consistently.

## G2-9-030-001  [P2] GAP  facet F01  effort M
- Legacy: Reusable fixedCollegeId/hideCollegePicker and parent dirty/busy callbacks `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:13-26`
- vNext now: Dedicated URL-only branding page; no embedded parent callbacks `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:17-35`
- Fix: Restore Manage College drawer dirty/busy guard

## G2-9-030-002  [P2] GAP  facet F01  effort S
- Legacy: No college: Look and feel Card with Pick a college first Alert `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:119-129`
- vNext now: Invalid/missing college route returns notFound `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:22-31`
- Fix: Render select-college guidance in shared entry

## G2-9-030-003  [P2] GAP  facet F01  effort S
- Legacy: Header Look and feel in small Card `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:130-144`
- vNext now: PageHeader plus Edit college branding section `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-45`
- Fix: Recreate small card and avoid duplicate heading

## G2-9-030-004  [P2] GAP  facet F02  effort M
- Legacy: Look and feel Card, Reload in header, paragraph and vertical single field `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:130-162`
- vNext now: Separate header/uploader/full form/preview details `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-63`
- Fix: Match card structure and order

## G2-9-030-005  [P2] GAP  facet F02  effort S
- Legacy: Reassures cosmetic only, entirely blank remains valid `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:155-160`
- vNext now: Describes URL, colours, sign-in appearance, omits reassurance `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:43-45`
- Fix: Restore literal optional-branding copy

## G2-9-030-006  [P2] GAP  facet F02  effort M
- Legacy: Logo field, preview, Save in one vertical form `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-239`
- vNext now: Upload, large form and preview disclosure separate `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:46-61` `src/components/admin/college-branding-form.tsx:142-220`
- Fix: Use old vertical sequence

## G2-9-030-007  [P2] GAP  facet F02  effort S
- Legacy: Preview always visible below logo `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:173-234`
- vNext now: Stored preview collapsed in Disclosure `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:57-62`
- Fix: Keep preview expanded

## G2-9-030-008  [P2] MISSING  facet F03  effort S
- Legacy: Reload button ReloadOutlined small, in card extra `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:133-142`
- vNext now: Only back and Verify web address links `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-42`
- Fix: Add Reload with icon

## G2-9-030-018  [P2] GAP  facet F05  effort M
- Legacy: Changing selected college resets form and warns about discarded edits `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:71-85`
- vNext now: Form keyed by collegeId; no explicit discard warning `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:47-55`
- Fix: Warn on dirty college switch

## G2-9-030-021  [P2] GAP  facet F06  effort S
- Legacy: Logo helper states initials fallback and optimal square image `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:165-169`
- vNext now: New URL and upload copy different `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:43-46` `src/components/admin/college-branding-form.tsx:34-41`
- Fix: Use literal old helper text

## G2-9-030-033  [P2] MISSING  facet F09  effort M
- Legacy: onDirtyChange/onBusyChange prevents parent drawer close `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:13-14,31-36`
- vNext now: Standalone form lacks parent callbacks `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:47-55`
- Fix: Support embedded drawer guard

## G2-9-030-035  [P2] GAP  facet F09  effort S
- Legacy: Desktop/Mobile segmented not modal `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:173-235`
- vNext now: Preview details disclosure instead `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:57-62`
- Fix: Use old segmented card preview

## G2-9-030-046  [P2] GAP  facet F13  effort M
- Legacy: Card spinner and load error + Retry `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:143-154`
- vNext now: Server data await without in-panel retry `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:30-35` `src/components/admin/college-branding-form.tsx:142-148`
- Fix: Add in-panel loading/retry

## G2-9-030-047  [P2] GAP  facet F13  effort S
- Legacy: No college Pick a college first warning `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:119-129`
- vNext now: NotFound if no valid ID `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:22-31`
- Fix: Use select-college recovery

## G2-9-030-048  [P2] GAP  facet F13  effort M
- Legacy: Load error separates missing/failed fetch `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:60-68`
- vNext now: Preview null triggers notFound `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:30-35`
- Fix: Differentiate network failure vs missing tenant

## G2-9-030-053  [P2] GAP  facet F16  effort S
- Legacy: One small Card 16px margin `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:130-162`
- vNext now: Page sections with larger vertical spacing/disclosures `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-63`
- Fix: Restore compact card padding

## G2-9-030-056  [P2] GAP  facet F18  effort S
- Legacy: Look and feel, Reload, Pick a college first exact copy `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:119-142`
- vNext now: Look and feel preserved, Reload missing, adds Edit college branding `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-45`
- Fix: Use old Card title and Reload text

## G2-9-030-057  [P2] GAP  facet F18  effort S
- Legacy: Detailed cosmetic login branding helper `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:155-169`
- vNext now: Technical edit colours/login appearance text `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:43-46`
- Fix: Restore friendly exact guidance

## G2-9-030-058  [P3] GAP  facet F18  effort S
- Legacy: Approximation — real page also shows floating symbols and full sign-in form `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:231-233`
- vNext now: Illustration only · No live sign-in `src/components/admin/college-branding-preview.tsx:88-90` `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:57-62`
- Fix: Use legacy footer caveat
