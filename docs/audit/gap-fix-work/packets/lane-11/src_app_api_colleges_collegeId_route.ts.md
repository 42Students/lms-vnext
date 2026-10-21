# Work packet: edit src/app/api/colleges/[collegeId]/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-colleges.md, docs/audit/gap2/lane-3/college-controller.md

## G2-9-032-046  [P1] GAP  facet F10  effort L
- Legacy: PUT /api/v1/college/update/{id} can modify code/org `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:293-320`
- vNext now: PATCH /api/colleges/{uuid} excludes organization/code `src/components/admin/college-edit-dialog.tsx:48-69` `src/app/api/colleges/[collegeId]/route.ts:19-50`
- Fix: Enforce immutable new model with documented migration pathway

## G2-9-032-047  [P1] GAP  facet F10  effort M
- Legacy: DELETE /api/v1/college/delete/{id} physical delete when empty `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:323-341`
- vNext now: DELETE /api/colleges/{uuid} calls archiveCollege and clears active scope cookie `src/components/admin/college-archive-button.tsx:74-115` `src/app/api/colleges/[collegeId]/route.ts:57-99`
- Fix: Document retained archived record and session scope invalidation

## G2-9-032-077  [P1] GAP  facet F22  effort L
- Legacy: Legacy delete physical empty college `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:323-341`
- vNext now: New archives and clears scoped session cookie `src/components/admin/college-archive-button.tsx:74-115` `src/app/api/colleges/[collegeId]/route.ts:57-99`
- Fix: Document status lifecycle/restoration and dependent record rules

## G2-9-032-078  [P1] GAP  facet F22  effort M
- Legacy: Legacy editable organization and uniqueId on update `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:294-303`
- vNext now: New organizationId and code immutable after creation `src/components/admin/college-edit-dialog.tsx:120-122` `src/app/api/colleges/[collegeId]/route.ts:19-50`
- Fix: Document migration/renaming policy for existing tenants

## G2-3-028-035  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:180-190`
- vNext now: `src/app/api/colleges/[collegeId]/route.ts:44-53`
- Fix: Legacy Invalid uniqueId / Failed to update college. Please try again or contact support. vs vNext structured codes and generic toast.
