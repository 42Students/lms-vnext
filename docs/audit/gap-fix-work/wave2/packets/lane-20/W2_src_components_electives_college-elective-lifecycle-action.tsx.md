# Work packet (wave 2): edit src/components/electives/college-elective-lifecycle-action.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-10-006-042  [P2] GAP  facet F09  effort M
- Legacy: Old Archive prompt says Archive this slot? All its offerings are archived; enrolled students lose access, history is kept. `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:216-223`
- vNext now: New window.confirm uses electiveLifecyclePrompt and supports Restore `src/components/electives/college-elective-lifecycle-action.tsx:13-38`
- Fix: Use legacy detailed destructive warning in styled confirmation dialog

## G2-10-006-062  [P2] GAP  facet F17  effort M
- Legacy: Old drawer/dialog focus and modal cancel guard managed by Antd `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:182-202` `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:55-68`
- vNext now: New inline panel and browser confirm, without modal focus trap or return `src/components/electives/college-slot-manager.tsx:91-137` `src/components/electives/college-elective-lifecycle-action.tsx:13-17`
- Fix: Use accessible dialog primitives with Escape, focus return, and pending close lock

## G2-9-007-042  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:175-179` — Archive Popconfirm warns archived offerings and lost student access
- vNext now: `src/components/electives/college-elective-lifecycle-action.tsx:13-25` — Native confirm via lifecyclePrompt
- Fix: Use impact warning and proper cancel/confirm controls
