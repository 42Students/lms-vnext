# Work packet: edit src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u030-manage-college-drawer.md

## G2-5-030-009  [P1] GAP  facet F03  effort M
- Legacy: Legacy save-in-progress on any child closes disabled, emits `Wait for current college setup action...`. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:58-61`
- vNext now: vNext navigation links always clickable, no cross-child busy close guard. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-49`
- Fix: Implement cross-tab save busy state and block losing in-flight work.

## G2-5-030-024  [P1] GAP  facet F07  effort M
- Legacy: Legacy dirty close confirmation lists dirty section names. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:67-80`
- vNext now: vNext multi-page navigation cannot enumerate simultaneous dirty sections. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:35-49`
- Fix: Warn with exact dirty section names and cancel/confirm semantics.

## G2-5-030-025  [P1] MISSING  facet F08  effort M
- Legacy: Legacy dirty confirmation `Discard unsaved college setup changes?`, `Discard and close`, `Keep editing`. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:73-80`
- vNext now: vNext no close action or matching confirmation dialog. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-49`
- Fix: Implement prompt on drawer close/back/scope switch.

## G2-5-030-028  [P1] MISSING  facet F09  effort M
- Legacy: Legacy Modal.confirm triggered by Drawer close if any child dirty, danger Discard. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:73-80`
- vNext now: vNext no cross-tab dialog; subpages are separate. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-49`
- Fix: Implement overarching unsaved changes confirm with exact copy.

## G2-5-030-039  [P1] GAP  facet F12  effort M
- Legacy: Legacy any busy blocks close, any dirty requires confirm; dirty sections explicit. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33,58-81`
- vNext now: vNext per-page status, no aggregate navigation gate. `src/components/admin/college-edit-dialog.tsx:44-49`, `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-49`
- Fix: Design shared dirty/busy state contract.

## G2-5-030-058  [P1] GAP  facet F20  effort M
- Legacy: Legacy dirty close guarded but scope change useEffect directly resets; unresolved path. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:58-81`
- vNext now: vNext context routing checks DB; no aggregate dirty state. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:12-17`
- Fix: Handle scope-switch while pending explicitly.

## G2-5-030-022  [P2] GAP  facet F07  effort M
- Legacy: Legacy null ID exact red `Missing collegeId`, `This drawer requires a valid college record...`. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:83-100`
- vNext now: vNext notFound route, no inline recovery. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:15-17`
- Fix: Restore legacy message on drawer fallback.

## G2-5-030-027  [P3] GAP  facet F08  effort S
- Legacy: Legacy clean close silently closes without toast. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:52-56`
- vNext now: vNext navigates back using PageBackLink. `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx:25-49`
- Fix: Preserve silent clean close and opener scroll/focus.
