# Work packet: edit src/components/admin/college-create-form.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md, docs/audit/gap2/lane-9/superadmin-colleges.md, docs/audit/gap2/lane-3/college-controller.md

## G2-10-023-004  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:83-90 — Creating college auto-selects it and jumps identity tab.
- vNext now: src/components/admin/college-create-form.tsx:50-90; src/app/(authenticated)/admin/tenants/create/page.tsx:54-58 — Separate create stage; says select college manually.
- Fix: After create select scoped college and move directly to Launch setup

## G2-10-023-052  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:87-122 — createCollege payload includes code/org/address; success selects scope.
- vNext now: src/components/admin/college-create-form.tsx:50-90; src/app/(authenticated)/admin/tenants/create/page.tsx:34-58 — New POST and redirect, no explicit automatic admin scope switch.
- Fix: Preserve selected tenant transition

## G2-9-032-073  [P1] GAP  facet F20  effort M
- Legacy: Unsaved edit and import drafts guarded before closing `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:343-378`
- vNext now: Create draft persisted, bulk guarded; edit not guarded `src/components/admin/college-create-form.tsx:34-35` `src/components/admin/college-edit-dialog.tsx:116-129` `src/components/admin/college-bulk-import.tsx:85-89`
- Fix: Add edit dirty guard and warn on scope navigation

## G2-10-023-035  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:462-497 — Missing org/name/code each has Ant Form.Item error message.
- vNext now: src/components/admin/college-create-form.tsx:101-152 — Native required fields with field-level validity not same copy.
- Fix: Restore exact required errors

## G2-10-023-036  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:89-95 — Bad code toast 'Unique ID must be 3-63 chars...'.
- vNext now: src/components/admin/college-create-form.tsx:142-152 — Input title same rule but feedback differs.
- Fix: Use precise toast/field error

## G2-10-023-040  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:113-118 — 'College created' toast then form resets.
- vNext now: src/components/admin/college-create-form.tsx:50-90 — Create advances route and state, no same inline toast guaranteed.
- Fix: Preserve creation toast and field reset

## G2-9-032-031  [P2] GAP  facet F07  effort S
- Legacy: Required organization/name/code display Please select organization / Please enter college name / Please enter unique ID `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:459-498`
- vNext now: Native required field browser defaults, not Ant inline messages `src/components/admin/college-create-form.tsx:104-153`
- Fix: Restore exact inline errors

## G2-9-032-033  [P2] GAP  facet F07  effort S
- Legacy: Create failure Failed to create college: SERVER_MESSAGE toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:120-126`
- vNext now: Inline Alert generic or uniqueId conflict, no same toast `src/components/admin/college-create-form.tsx:82-88,185-189`
- Fix: Map status to server-safe message and show contextual toast

## G2-9-032-036  [P2] MISSING  facet F08  effort S
- Legacy: Create success College created toast and onCreated callback `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:113-119`
- vNext now: Create clears draft/refreshes, no success toast or onCreated `src/components/admin/college-create-form.tsx:61-81`
- Fix: Emit College created toast and invoke optional callback

## G2-3-028-038  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:87-125`
- vNext now: `src/components/admin/college-create-form.tsx:50-91`
- Fix: Legacy College created toast and reset, vNext reset/refresh with no matching success notification.
