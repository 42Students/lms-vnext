# Work packet (wave 2): edit src/modules/projects/college-project-summary-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md

## G2-14-028-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy class picker label and Class ID int. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:640-660`
- vNext now: vNext Section ID UUID and active class choices. `src/components/projects/college-project-summary-editor-full.tsx:81-86`, `src/modules/projects/college-project-summary-model.ts:12-12`
- Fix: Map original Class to current Section with cohort and college.

## G2-14-028-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy Workspace title required, max160 with character counter. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:526-531`
- vNext now: vNext required max200, no showCount. `src/components/projects/college-project-summary-editor-full.tsx:71-73`, `src/modules/projects/college-project-summary-model.ts:5-5`
- Fix: Align max length/counter or map approved schema change.

## G2-14-028-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy phase/due labels max80, course label max160. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:639-652`
- vNext now: vNext phase max120, dueLabel160, course160. `src/components/projects/college-project-summary-editor-full.tsx:80-80`, `src/modules/projects/college-project-summary-model.ts:9-11`
- Fix: Retain historical field-length constraints or migrate.
