# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-012-040 [P1] GAP facet F11
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/ModuleGroupGuard.jsx:27-74` — Placements module-off guard with explanatory off screen
- Expected fix: Render exact placements-off state with admin recovery hint

## G2-9-013-069 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:83-111` — First-load skeleton; failed fetch PanelError Retry; same-drive failed refresh preserves old content.
- Expected fix: Use partial error boundaries and preserve prior record on refresh.

## G2-9-014-051 [P1] MISSING facet F10
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:823-850` — PUT /api/v1/admin/jobs/{jobId}/applications/{applicationId}/status and POST .../bulk-status.
- Expected fix: Wire row/bulk mutations from shortlist page to college stage endpoints.

## G2-9-026-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/activity/page.tsx
- Legacy: Hub receives both selectedOrganizationId and selectedCollegeId `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:4-35`
- Expected fix: Preserve org-only scope selection and its explanatory banner.

## G2-9-023-015 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/batches/page.tsx
- Legacy: Class count classCount; currentStudents `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:475-477`
- Expected fix: Show classes and verify legacy student membership semantics

## G2-9-030-032 [P1] MISSING facet F09
- Files: src/components/admin/college-branding-form.tsx
- Legacy: useUnsavedFormGuard blocks dirty navigation `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:30-36`
- Expected fix: Implement dirty navigation confirmation

## G2-9-030-034 [P1] GAP facet F09
- Files: src/components/admin/college-logo-uploader.tsx
- Legacy: Replaced logo staged as stale key, not deleted until Save succeeds `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:38-46`
- Expected fix: Do not remove referenced logo before main Save commit

## G2-9-030-037 [P1] GAP facet F10
- Files: src/components/admin/college-logo-uploader.tsx, src/app/api/colleges/[collegeId]/branding/logo/route.ts
- Legacy: deleteFileFromR2 called only after successful save `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:38-46,97-109`
- Expected fix: Add deferred cleanup/staged mutation

## G2-9-030-044 [P1] GAP facet F12
- Files: src/components/admin/college-logo-uploader.tsx
- Legacy: Deletion deferred until upsert successful `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:38-46,97-108`
- Expected fix: Stage/delete only after new effective logo persisted

## G2-9-030-050 [P1] GAP facet F14
- Files: src/app/api/colleges/[collegeId]/branding/logo/route.ts, src/components/admin/college-logo-uploader.tsx
- Legacy: Deletes stale storage keys after successful Save `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:104-109`
- Expected fix: Prevent broken login if form Save abandoned

## G2-9-030-065 [P1] GAP facet F22
- Files: src/modules/colleges/branding-service.ts
- Legacy: Old branding data only logoUrl `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:57-62`
- Expected fix: Document migration/default crosswalk

## G2-9-030-066 [P1] GAP facet F22
- Files: src/modules/colleges/branding-service.ts
- Legacy: Stale R2 keys under logoUrl `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:43-46,104-108`
- Expected fix: Migrate object path without broken references

## G2-9-031-016 [P1] GAP facet F05
- Files: src/components/admin/managed-college-subdomain.tsx
- Legacy: Name must lowercase 3–30 ASCII alnum/hyphen `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:55-58`
- Expected fix: Match 3–30 managed subdomain restriction or document intentional loosening.

## G2-9-031-025 [P1] GAP facet F07
- Files: src/modules/tenant-domains/managed-subdomain-model.ts, src/components/admin/managed-college-subdomain.tsx
- Legacy: Exact regex requires 3–30 length and no leading/trailing hyphens `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:10,55-60`
- Expected fix: Validate old range/wording at client and server.

## G2-9-031-032 [P1] GAP facet F09
- Files: src/components/admin/managed-college-subdomain.tsx
- Legacy: Move Modal title with destination, content old address stops working immediately and others need new one `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:80-88`
- Expected fix: Restore consequential move warning verbatim and Keep current.

## G2-9-032-027 [P1] GAP facet F06
- Files: src/components/admin/college-edit-dialog.tsx
- Legacy: Code editable on create and also on edit Modal `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:482-497`
- Expected fix: Document owner decision: legacy edits code; new protects immutable integrations

## G2-9-032-028 [P1] GAP facet F06
- Files: src/components/admin/college-edit-dialog.tsx
- Legacy: Edit can change Organization via selector `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:694-706`
- Expected fix: Document denied organization reassignment and safe alternative migration

## G2-9-032-038 [P1] GAP facet F08
- Files: src/components/admin/college-archive-button.tsx
- Legacy: Delete success College deleted `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:331-335`
- Expected fix: Clarify archival instead of claiming physical deletion

## G2-9-032-041 [P1] MISSING facet F09
- Files: src/components/admin/college-edit-dialog.tsx
- Legacy: Dirty edit modal close confirms Discard college changes? / Keep editing `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:365-378`
- Expected fix: Restore dirty-edit discard confirmation

## G2-9-032-046 [P1] GAP facet F10
- Files: src/components/admin/college-edit-dialog.tsx, src/app/api/colleges/[collegeId]/route.ts
- Legacy: PUT /api/v1/college/update/{id} can modify code/org `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:293-320`
- Expected fix: Enforce immutable new model with documented migration pathway

## G2-9-032-047 [P1] GAP facet F10
- Files: src/components/admin/college-archive-button.tsx, src/app/api/colleges/[collegeId]/route.ts
- Legacy: DELETE /api/v1/college/delete/{id} physical delete when empty `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:323-341`
- Expected fix: Document retained archived record and session scope invalidation

## G2-9-032-048 [P1] GAP facet F10
- Files: src/components/admin/college-bulk-import.tsx, src/modules/colleges/bulk-import-model.ts
- Legacy: Bulk sequential createCollege per row with independent orgId `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:220-256`
- Expected fix: Support multi-org CSV or explicitly require one org per import

## G2-9-032-052 [P1] GAP facet F12
- Files: src/modules/colleges/bulk-import-model.ts
- Legacy: CSV requires numeric orgId plus normalized uniqueId per row `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:129-153`
- Expected fix: Document org mapping and multi-org import option

## G2-9-032-061 [P1] GAP facet F14
- Files: src/modules/colleges/bulk-import-model.ts, src/components/admin/college-bulk-import.tsx
- Legacy: Bulk CSV paste template orgId,name,uniqueId,city,state plus quoted name `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:20-21,625-639`
- Expected fix: Ship import template migration and clarify organization selection

## G2-9-032-077 [P1] GAP facet F22
- Files: src/components/admin/college-archive-button.tsx, src/app/api/colleges/[collegeId]/route.ts
- Legacy: Legacy delete physical empty college `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:323-341`
- Expected fix: Document status lifecycle/restoration and dependent record rules
