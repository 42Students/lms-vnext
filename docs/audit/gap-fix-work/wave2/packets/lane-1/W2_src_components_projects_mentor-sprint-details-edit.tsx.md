# Work packet (wave 2): edit src/components/projects/mentor-sprint-details-edit.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md

## G2-15-028-025  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:115-139 — inline expanding row editor, remove Undo control.
- vNext now: src/components/projects/mentor-sprint-write.tsx:62-69 — Create sprint modal dialog; details edit separate modal src/components/projects/mentor-sprint-details-edit.tsx:96-100.
- Fix: Match legacy row editor and reversible delete.

## G2-15-028-039  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:168-170 — Ant grid per-row half fields.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:100-119 — modal stacked fields and md grid for dates.
- Fix: Align responsive form layout and field ordering.

## G2-15-028-046  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:27-28 — useUnsavedFormGuard protects workspace sprint edit across navigation.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:14-15,96-100 — useProjectEditorDiscardGuard in modal; route-wide full-plan guard absent.
- Fix: Cover tab/back/reload dirty plan, not just modal close.

## G2-15-028-047  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:65-79 — form reset+seed synchronous; stamping client IDs stable.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:26-37 — modal draft snapshots original, reload after save.
- Fix: Prevent stale local edits after route refresh.

## G2-15-028-016  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:31-35 — Sprint goal placeholder One sentence: what this sprint is trying to achieve.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:112-113 — Sprint goal textarea without source placeholder.
- Fix: Match example placeholder.

## G2-15-028-017  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:64-69 — What does done look like? textarea acceptance criteria helper.
- vNext now: src/components/projects/mentor-sprint-details-edit.tsx:114-115 — same label, no sample placeholder.
- Fix: Restore acceptance-criteria sample.
