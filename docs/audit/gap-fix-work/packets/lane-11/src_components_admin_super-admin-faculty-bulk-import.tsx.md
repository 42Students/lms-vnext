# Work packet: edit src/components/admin/super-admin-faculty-bulk-import.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-18-031-034  [P1] GAP  facet F07  effort M
- Legacy: Legacy faculty CSV validates exact roster+department before Create and blocks duplicates; Faculty.js:634-741
- vNext now: vNext FacultyBulkImport validates local parse then directly POST create, skipped/failed rows; super-admin-faculty-bulk-import.tsx:25-75
- Fix: Add server-side PREVIEW of duplicates/department/role before irreversible create

## G2-18-031-042  [P1] GAP  facet F10  effort L
- Legacy: Legacy Faculty POST /register, /bulk-validate, /bulk-register, PUT /update/{id}, DELETE /delete/{id}; FacultyController.java:107-196,623-690
- vNext now: vNext POST /api/admin/faculty/bulk-import and /api/people/onboard plus scoped profile editor, no verified account deletion route; super-admin-faculty-bulk-import.tsx:48-75;person-onboard-dialog.tsx:69-113
- Fix: Map department/type payloads and batch preflight, retain status/result envelope compatibility for surviving callers

## G2-6-002-041  [P1] GAP  facet F07  effort M
- Legacy: Old CSV validation lists row-level `Duplicate mobile in file`, `Email already in system`, malformed email etc `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:659-683`
- vNext now: New CSV parser stops with generic invalid-row error or imports direct `src/modules/people/faculty-bulk-import-model.ts:25-35` `src/components/admin/super-admin-faculty-bulk-import.tsx:26-28`
- Fix: Present independently actionable row issue messages before creating identities

## G2-6-002-052  [P1] GAP  facet F10  effort L
- Legacy: Old bulk POST `/api/v1/faculty/bulk-validate` followed `/bulk-register` `docs/legacy-source/frontend/src/api/Services/AdminService.js:217-223` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:634-743`
- vNext now: New POST `/api/admin/faculty/bulk-import` performs creation after client parse + confirmation `src/components/admin/super-admin-faculty-bulk-import.tsx:48-74` `src/app/api/admin/faculty/bulk-import/route.ts:7-18`
- Fix: Provide explicit server duplicate/validation preview before irreversible write

## G2-6-002-068  [P1] GAP  facet F14  effort M
- Legacy: Old CSV Validate and Create buttons distinct; detailed duplicate report `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1174-1266`
- vNext now: New single `Validate and Create` with confirm and create result `src/components/admin/super-admin-faculty-bulk-import.tsx:87-116`
- Fix: Separate validation-only preview and explicit irreversible Create action

## G2-6-002-082  [P1] GAP  facet F20  effort M
- Legacy: Old Bulk FileReader sequence guard and validationKey of exact file+dept before create `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:605-628` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:642-646` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:704-711`
- vNext now: New bulk fileVersion protects replacement but create is direct without server validation snapshot `src/components/admin/super-admin-faculty-bulk-import.tsx:29-76`
- Fix: Add immutable server validation hash and reject changes before create

## G2-7-036-039  [P1] GAP  facet F10  effort L
- Legacy: Faculty.js:648-650 bulkValidateFaculty before create
- vNext now: super-admin-faculty-bulk-import.tsx:63-73 local parse then one server POST
- Fix: Verify server checks duplicate mobiles/emails before first write

## G2-7-036-043  [P1] GAP  facet F11  effort M
- Legacy: Faculty.js:634-643 requires college and department for validation
- vNext now: super-admin-faculty-bulk-import.tsx:15-16 collegeId prop only
- Fix: Restore department selection or record explicit default mapping

## G2-15-027-052  [P1] GAP  facet F14  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:593-625 CSV upload parses optional Faculty Type, choose department
- vNext now: src/components/admin/super-admin-faculty-bulk-import.tsx:78-95 download sample 4 columns omits Department and Faculty Type
- Fix: Add legacy Department + Faculty Type to sample and import report.

## G2-7-036-033  [P2] GAP  facet F08  effort S
- Legacy: Faculty.js:625 Parsed N row(s). Select college... Validate or Create.
- vNext now: super-admin-faculty-bulk-import.tsx:98 N rows validated locally
- Fix: Avoid presenting parsed state as fully verified
