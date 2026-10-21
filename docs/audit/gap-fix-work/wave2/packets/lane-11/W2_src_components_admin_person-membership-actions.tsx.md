# Work packet (wave 2): edit src/components/admin/person-membership-actions.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

## G2-1-001-012  [P2] GAP  facet F06  effort S
- Legacy: `Faculty.js:895-913`, `Students.js:1047-1064` only require confirmation, no typed inputs.
- vNext now: `college-faculty-lifecycle-action.tsx:82-88` requires 3-500 reason; student reason input max 500 (`college-student-lifecycle-action.tsx:55-58`); generic dialog max 1000 (`person-membership-actions.tsx:342-357`).
- Fix: Unify reason field length, minimum and helper text across all lifecycle launch points.

## G2-1-001-021  [P2] GAP  facet F09  effort M
- Legacy: `Faculty.js:875-913`, `Students.js:1028-1064`: antd `Popconfirm`, icon trigger, title, body, confirm and cancel.
- vNext now: `college-faculty-lifecycle-action.tsx:75-91`, `college-student-lifecycle-action.tsx:48-61` open full ConfirmDialog; `person-membership-actions.tsx:305-358` opens custom Dialog.
- Fix: Consolidate onto clone-styled confirmation primitive matching legacy geometry and text; preserve needed reason input.

## G2-1-001-040  [P2] GAP  facet F18  effort M
- Legacy: `Faculty.js:895-897`, `Students.js:1047-1049` exactly say 'Blocks login immediately and revokes any active session. Reversible — data and history are kept.'
- vNext now: `person-membership-actions.tsx:309-310` uses 'Suspension blocks this college membership without disabling ... other college memberships.'
- Fix: Preserve legacy promise about immediate revocation with accurate per-membership qualifier; do not claim it for faculty path until fixed.
