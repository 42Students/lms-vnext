# Work packet (wave 2): edit src/components/college/college-student-lifecycle-action.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

## G2-1-001-001  [P2] GAP  facet F01  effort M
- Legacy: `AdminUserLifecycleController.java:42-46,83-86,137-140`; `Faculty.js:875-913`, `Students.js:1028-1064` put actions in respective roster.
- vNext now: `college-faculty-lifecycle-action.tsx:64-71`, `college-student-lifecycle-action.tsx:42-46` show detail/directory actions; `/api/college/faculty/[membershipId]/lifecycle/route.ts:10-19`.
- Fix: Keep suspend/reactivate actions in the same legacy roster action column as well as any detail page; preserve row access.

## G2-1-001-003  [P2] GAP  facet F02  effort M
- Legacy: `Faculty.js:875-913`, `Students.js:1028-1064` present compact icon action and inline AntD popconfirm, no separate reason section.
- vNext now: `college-faculty-lifecycle-action.tsx:64-91` adds standalone button, audit link and dialog with reason; `college-student-lifecycle-action.tsx:42-62` adds a standalone button and dialog.
- Fix: Use compact row action/confirmation hierarchy and spacing from legacy; keep required vNext reason handling as explicitly labelled change.

## G2-1-001-004  [P2] GAP  facet F03  effort S
- Legacy: `Faculty.js:884-912` uses `CheckCircleOutlined`/`StopOutlined` icon-only buttons with title/aria-label; `Students.js:1037-1063` same.
- vNext now: `college-faculty-lifecycle-action.tsx:66-69`, `college-student-lifecycle-action.tsx:43-46` use text buttons.
- Fix: Restore matching icons, accessible names and hover labels in row actions.

## G2-1-001-012  [P2] GAP  facet F06  effort S
- Legacy: `Faculty.js:895-913`, `Students.js:1047-1064` only require confirmation, no typed inputs.
- vNext now: `college-faculty-lifecycle-action.tsx:82-88` requires 3-500 reason; student reason input max 500 (`college-student-lifecycle-action.tsx:55-58`); generic dialog max 1000 (`person-membership-actions.tsx:342-357`).
- Fix: Unify reason field length, minimum and helper text across all lifecycle launch points.

## G2-1-001-021  [P2] GAP  facet F09  effort M
- Legacy: `Faculty.js:875-913`, `Students.js:1028-1064`: antd `Popconfirm`, icon trigger, title, body, confirm and cancel.
- vNext now: `college-faculty-lifecycle-action.tsx:75-91`, `college-student-lifecycle-action.tsx:48-61` open full ConfirmDialog; `person-membership-actions.tsx:305-358` opens custom Dialog.
- Fix: Consolidate onto clone-styled confirmation primitive matching legacy geometry and text; preserve needed reason input.

## G2-1-001-033  [P2] GAP  facet F13  effort M
- Legacy: `Faculty.js:498-499`, `Students.js:648-649` give role-specific error after failed request; old controller handles 404/409 (`AdminUserLifecycleController.java:93-94,122-125`).
- vNext now: `college-faculty-lifecycle-action.tsx:50-58` provides one generic failure message regardless status; student `college-student-lifecycle-action.tsx:34-38` reduces errors to 409 vs other.
- Fix: Differentiate 403/404/409/network/offline with retry and preserve draft; add re-auth link for 401.

## G2-1-001-037  [P2] GAP  facet F17  effort S
- Legacy: `Faculty.js:884-912` exposes explicit `aria-label` including person name; `Students.js:1037-1063` same.
- vNext now: `college-faculty-lifecycle-action.tsx:66-69` uses visible text only, no person-specific accessible label; student `college-student-lifecycle-action.tsx:43-46` shows generic Suspend/Reactivate.
- Fix: Include person name in aria-label for every row lifecycle trigger to disambiguate repeated buttons.

## G2-1-001-039  [P2] GAP  facet F18  effort S
- Legacy: `Faculty.js:876-901` exact headings 'Reactivate Faculty' / 'Suspend Faculty'; `Students.js:1029-1053` 'Reactivate Student' / 'Suspend Student'.
- vNext now: `college-faculty-lifecycle-action.tsx:75-79` uses name-first title e.g. 'Deactivate Name?'; student `college-student-lifecycle-action.tsx:49-52` uses 'Suspend Name?'.
- Fix: Use exact legacy headings and attach person name as supplemental subtitle, not title replacement.
