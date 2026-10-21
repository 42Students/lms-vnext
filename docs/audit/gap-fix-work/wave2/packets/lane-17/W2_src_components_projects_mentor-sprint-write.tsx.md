# Work packet (wave 2): edit src/components/projects/mentor-sprint-write.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md, docs/audit/gap2/lane-7/u014-college-admin-workspace-sprints.md

## G2-15-028-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:63 — Release dropdown uses releaseKey with title labels.
- vNext now: src/components/projects/mentor-sprint-write.tsx:73-79 — Ships in release selects UUID releaseId.
- Fix: Map releaseKey to ID and maintain friendly title display.

## G2-15-028-011  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:27-28 — optional key auto-generated, Due free text e.g. Week 2.
- vNext now: src/components/projects/mentor-sprint-write.tsx:39-47 — date fields with no free-text due label.
- Fix: Preserve legacy due-label display or migrate to date.

## G2-15-028-013  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:92-93 — Add sprint within repeater, empty state No sprints yet...
- vNext now: src/components/projects/mentor-sprint-write.tsx:58-63 — Add sprint per release and Create sprint modal.
- Fix: Use one Add sprint action and legacy empty state.

## G2-15-028-015  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:27,29 — Key optional generated from title, Title required.
- vNext now: src/components/projects/mentor-sprint-write.tsx:63-68,101-105 — Title required <=200, key absent.
- Fix: Restore key preview and stable generated slug.

## G2-15-028-025  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:115-139 — inline expanding row editor, remove Undo control.
- vNext now: src/components/projects/mentor-sprint-write.tsx:62-69 — Create sprint modal dialog; details edit separate modal src/components/projects/mentor-sprint-details-edit.tsx:96-100.
- Fix: Match legacy row editor and reversible delete.

## G2-15-028-043  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:92-100 — Add sprint, Save sprint plan, Only this workspace's sprint plan is updated.
- vNext now: src/components/projects/mentor-sprint-write.tsx:58-69 — Add sprint, Confirm create, no bulk save copy.
- Fix: Restore legacy CTA and reassurance sentence.

## G2-7-014-058  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:33-103 full-width card/metrics and RepeatingItemEditor fields md half width
- vNext now: V/components/projects/project-workspace.tsx:851-1000 nested release cards; mentor-sprint-write.tsx:107-125 one-column fields + 3 date columns on 768px
- Fix: Align metrics/inline editor at 375,768,1280 widths
