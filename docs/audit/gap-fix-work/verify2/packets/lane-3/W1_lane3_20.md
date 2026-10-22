# Verification packet (P1 round 2): 12 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-016-072 [P1] MISSING facet F13
- Files: src/app/(authenticated)/college/placements/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:608-639` — Data retention report lazy loads only after expansion with status/err states.
- Expected fix: Implement lazily fetched disclosure with retries and truncation.

## G2-9-013-002 [P1] MISSING facet F01
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:5-10` — Workspace tabs Overview, Applications, Schedule, Settings; Settings is active.
- Expected fix: Render shared four-tab DriveSubNav in exact order, with Settings active.

## G2-9-014-036 [P1] MISSING facet F07
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1379-1420` — Invalid stage transition warns Cannot move from X to Y.
- Expected fix: Surface guarded transition warning at action row.

## G2-9-018-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/programs/page.tsx
- Legacy: No-college route shows warning and contact-administrator description `docs/legacy-source/frontend/src/pages/college-admin/programs.js:19-32`
- Expected fix: Display old actionable no-college warning rather than silently redirect.

## G2-9-025-011 [P1] GAP facet F03
- Files: src/components/courses/faculty-lesson-authoring.tsx, src/modules/courses/super-admin-content-directory-model.ts
- Legacy: Visible to students switch in editor, defaults true on creation `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:404-406`
- Expected fix: Support explicit visibility state with correct published ancestry and audience.

## G2-9-025-015 [P1] GAP facet F04
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Materials column equals mixed FILE/LINK count from contentDataDTO `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:313-313`
- Expected fix: Query and display all authorized material entries, not URL boolean.

## G2-9-025-024 [P1] MISSING facet F06
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: Materials list each File/Link title with remove icon `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:395-403`
- Expected fix: Add repeatable material list with remove operation and counts.

## G2-9-025-029 [P1] MISSING facet F07
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: 20 material cap, allowed extensions, max50MB each; explicit messages `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:214-219`
- Expected fix: Implement file count/size/MIME checks matching old copy.

## G2-9-025-034 [P1] MISSING facet F08
- Files: src/components/courses/super-admin-content-authoring.tsx, src/components/courses/faculty-lesson-authoring.tsx
- Legacy: Resource files uploaded toast `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:239-244`
- Expected fix: Add post-upload confirmation and handles for retry.

## G2-9-025-040 [P1] GAP facet F10
- Files: src/components/courses/faculty-lesson-authoring.tsx, src/app/api/courses/lesson-contents/route.ts
- Legacy: POST /api/v1/lesson/contents/create with content_data_dto.resource_materials and class/lesson/course `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:5-15,255-288`
- Expected fix: Add mixed-material storage mapping and audience scoped to delivery.

## G2-9-025-066 [P1] GAP facet F21
- Files: src/components/courses/faculty-lesson-authoring.tsx
- Legacy: External R2 signed upload dependency for per-file resources `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:14-16,210-244`
- Expected fix: Map new storage permission, signed upload and malware scanning before enabling attachments.

## G2-9-022-018 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/batch-promotion/page.tsx
- Legacy: Ant table default page size 10, size changer and row range `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:442-450`
- Expected fix: Add 10-per-page pagination and size changer, server-side when large

## Lane-13 verification notes (22 Oct 2026)

- **OK G2-9-013-002:** College drive Settings renders the four `Tabs` in Overview, Applications, Schedule, Settings order with `value="settings"` and local same-tab hrefs.
- **OK G2-9-018-002:** College Programs returns the existing `Admin not assigned to a college` warning, explicitly directs the user to contact their administrator, and does not redirect when college scope is missing.
- **OK G2-9-022-018:** Batch Promotion defaults to `pageSize=10`, offers 10/25/50 size links, displays row ranges, and passes page/pageSize to the scoped listing service.
- **DEFERRED G2-9-016-072:** Placement retention report fetch-on-expand, retries and truncation require a complete data/UI walkthrough.
- **DEFERRED G2-9-014-036:** Shortlist transition-row warning requires action-flow verification.
- **DEFERRED G2-9-025-011, G2-9-025-015, G2-9-025-024, G2-9-025-029, G2-9-025-034, G2-9-025-040, G2-9-025-066:** Materials/publishing/upload contract requires reviewing authoring controls, API schema, signed storage and scoped persistence together; no unsupported OK asserted.
