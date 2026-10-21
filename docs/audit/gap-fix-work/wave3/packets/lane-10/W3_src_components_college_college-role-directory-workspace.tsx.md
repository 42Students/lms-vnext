# Work packet (wave 3): edit src/components/college/college-role-directory-workspace.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/college-admin-students.md, docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-13-007-028  [P1] MISSING  facet F06  effort L
- Legacy: Old bulk module toggle module placement on/off/inherit (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:593-635`)
- vNext now: New roster page has no bulk module toggle in visible tools (`src/components/college/college-role-directory-workspace.tsx:101-118`)
- Fix: Restore scoped bulk module access including inherit (null) override state.

## G2-13-007-036  [P1] MISSING  facet F08  effort L
- Legacy: Delete success Student deleted successfully! (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:581-590`)
- vNext now: No delete control in new directory (`src/components/college/college-role-directory-workspace.tsx:440-449`)
- Fix: Document intentional deletion removal or restore authorized hard-delete warning workflow.

## G2-13-007-053  [P1] MISSING  facet F12  effort L
- Legacy: Old bulk module null clears student override to inherit class/batch/program defaults (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:593-599`)
- vNext now: New UI has no equivalent control (`src/components/college/college-role-directory-workspace.tsx:101-118`)
- Fix: Restore tri-state inheritance and effective permission preview.

## G2-13-007-080  [P1] MISSING  facet F22  effort L
- Legacy: Old bulk module access overrides inherit through null (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:593-599`)
- vNext now: New directory has no bulk module state UI (`src/components/college/college-role-directory-workspace.tsx:101-118`)
- Fix: Map old student override rows to new effective permission table.

## G2-13-007-082  [P1] MISSING  facet F23  effort L
- Legacy: Old direct OTP clear and permanent Delete controls (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:990-1085`)
- vNext now: New directory omits these (`src/components/college/college-role-directory-workspace.tsx:440-449`)
- Fix: Document intentional removal vs required parity; retain safe policy if restored.

## G2-6-001-018  [P1] MISSING  facet F05  effort L
- Legacy: Old autocomplete debounced 200ms, popular and recent suggestions `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:153-225` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:226-281`
- vNext now: New explicit query input and Apply button, no popular/recent suggestions `src/components/college/college-role-directory-workspace.tsx:142-152` `src/components/college/college-role-directory-workspace.tsx:343-345`
- Fix: Recreate tenant-bound autocomplete, 200ms debounce and recent/popular suggestions

## G2-6-001-038  [P1] MISSING  facet F09  effort L
- Legacy: Old schedule reassign modal with target select and results `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1542-1600`
- vNext now: New college Faculty row has no reassign action `src/components/college/college-role-directory-workspace.tsx:389-399` `src/components/college/college-role-directory-workspace.tsx:440-450`
- Fix: Add schedule reassign on college facet with same permission and report

## G2-6-001-042  [P1] MISSING  facet F10  effort L
- Legacy: Old DELETE `/api/v1/faculty/delete/:id` reachable with confirmation `docs/legacy-source/frontend/src/api/Services/AdminService.js:254-255` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:477-488`
- vNext now: New college row exposes lifecycle but not faculty deletion `src/components/college/college-role-directory-workspace.tsx:440-449` `src/components/college/college-faculty-lifecycle-action.tsx:30-58`
- Fix: Implement guarded deletion with teaching/project dependencies or state justified omission

## G2-6-001-043  [P1] MISSING  facet F10  effort L
- Legacy: Old clears OTP lockout and can reassign class schedules `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:515-571`
- vNext now: New college actions omit both `src/components/college/college-role-directory-workspace.tsx:389-399` `src/components/college/college-role-directory-workspace.tsx:440-450`
- Fix: Route to authorized OTP reset and schedule transfer action; log all mutations
