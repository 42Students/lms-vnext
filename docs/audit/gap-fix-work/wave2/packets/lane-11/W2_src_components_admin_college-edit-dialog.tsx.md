# Work packet (wave 2): edit src/components/admin/college-edit-dialog.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-controller.md, docs/audit/gap2/lane-5/u030-manage-college-drawer.md, docs/audit/gap2/lane-9/superadmin-colleges.md

## G2-3-028-041  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:343-379`
- vNext now: `src/components/admin/college-edit-dialog.tsx:97-143`
- Fix: Reinstate legacy dirty-edit discard guard Discard college changes? / Keep editing; vNext dialog close lacks equivalent.

## G2-5-030-029  [P2] GAP  facet F09  effort M
- Legacy: Legacy maskClosable=false and closable/keyboard disabled during busy. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:117-122`
- vNext now: vNext CollegeEditDialog only edits base metadata; no same drawer mask/keyboard lock. `src/components/admin/college-edit-dialog.tsx:97-110`
- Fix: Ensure setup overlay doesn't close on backdrop or during pending.

## G2-9-032-029  [P2] GAP  facet F06  effort M
- Legacy: Edit Modal width600 with fields org,name,code,city,state,address,pin,country `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:682-754`
- vNext now: Dialog title Edit NAME with name, address fields, landmark, no org/code `src/components/admin/college-edit-dialog.tsx:116-227`
- Fix: Match modal title/width/field order and show disabled immutable IDs

## G2-9-032-065  [P2] GAP  facet F17  effort S
- Legacy: Edit college NAME and Delete college NAME aria-labels `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:420-446`
- vNext now: Generic More/Edit/Archive without row name in accessible trigger `src/app/(authenticated)/admin/colleges/page.tsx:60-85` `src/components/admin/college-edit-dialog.tsx:99-114`
- Fix: Add accessible row-specific action names

## G2-9-032-066  [P2] GAP  facet F17  effort M
- Legacy: Dirty edit/bulk modal prevents accidental close `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:343-378`
- vNext now: Bulk guard exists, edit guard absent `src/components/admin/college-edit-dialog.tsx:116-129` `src/components/admin/college-bulk-import.tsx:85-89`
- Fix: Restore edit focus/dirty dismissal guard

## G2-3-028-071  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:177-178`
- vNext now: `src/components/admin/college-edit-dialog.tsx:83-88`
- Fix: College updated successfully exact legacy backend message is shortened in vNext toast.
