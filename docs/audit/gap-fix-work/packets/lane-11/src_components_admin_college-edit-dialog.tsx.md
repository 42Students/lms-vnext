# Work packet: edit src/components/admin/college-edit-dialog.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-5-030-039  [P1] GAP  facet F12  effort M
- Legacy: Legacy any busy blocks close, any dirty requires confirm; dirty sections explicit. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33,58-81`
- vNext now: vNext per-page status, no aggregate navigation gate. `src/components/admin/college-edit-dialog.tsx:44-49`, `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-49`
- Fix: Design shared dirty/busy state contract.

## G2-9-032-027  [P1] GAP  facet F06  effort L
- Legacy: Code editable on create and also on edit Modal `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:482-497`
- vNext now: Code immutable and absent from edit dialog `src/components/admin/college-edit-dialog.tsx:120-122,143-226`
- Fix: Document owner decision: legacy edits code; new protects immutable integrations

## G2-9-032-028  [P1] GAP  facet F06  effort L
- Legacy: Edit can change Organization via selector `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:694-706`
- vNext now: Organization ownership immutable and not selectable `src/components/admin/college-edit-dialog.tsx:120-122,143-226`
- Fix: Document denied organization reassignment and safe alternative migration

## G2-9-032-041  [P1] MISSING  facet F09  effort M
- Legacy: Dirty edit modal close confirms Discard college changes? / Keep editing `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:365-378`
- vNext now: Cancel immediately sets open=false, no dirty guard `src/components/admin/college-edit-dialog.tsx:116-129`
- Fix: Restore dirty-edit discard confirmation

## G2-9-032-046  [P1] GAP  facet F10  effort L
- Legacy: PUT /api/v1/college/update/{id} can modify code/org `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:293-320`
- vNext now: PATCH /api/colleges/{uuid} excludes organization/code `src/components/admin/college-edit-dialog.tsx:48-69` `src/app/api/colleges/[collegeId]/route.ts:19-50`
- Fix: Enforce immutable new model with documented migration pathway

## G2-9-032-073  [P1] GAP  facet F20  effort M
- Legacy: Unsaved edit and import drafts guarded before closing `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:343-378`
- vNext now: Create draft persisted, bulk guarded; edit not guarded `src/components/admin/college-create-form.tsx:34-35` `src/components/admin/college-edit-dialog.tsx:116-129` `src/components/admin/college-bulk-import.tsx:85-89`
- Fix: Add edit dirty guard and warn on scope navigation

## G2-9-032-078  [P1] GAP  facet F22  effort M
- Legacy: Legacy editable organization and uniqueId on update `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:294-303`
- vNext now: New organizationId and code immutable after creation `src/components/admin/college-edit-dialog.tsx:120-122` `src/app/api/colleges/[collegeId]/route.ts:19-50`
- Fix: Document migration/renaming policy for existing tenants

## G2-5-030-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy busy close shows info toast `Wait for the current college setup action to finish.` `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:58-61`
- vNext now: vNext Edit dialog has pending guard but no consolidated busy toast on tenant setup links. `src/components/admin/college-edit-dialog.tsx:44-49`
- Fix: Add disabled navigation and exact busy message.

## G2-9-032-034  [P2] GAP  facet F07  effort S
- Legacy: Update failure Failed to update college: SERVER_MESSAGE `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:312-320`
- vNext now: College update failed; generic college could not be updated `src/components/admin/college-edit-dialog.tsx:69-95`
- Fix: Surface specific backend validation messages safely
