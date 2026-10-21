# Work packet (wave 2): edit src/components/projects/project-resource-controls.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md, docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md

## G2-16-028-005  [P2] GAP  facet F02  effort L
- Legacy: WorkspaceResourcesEditor.jsx:42-60 renders in-place repeating editor then sticky action area.
- vNext now: project-resource-controls.tsx:177-283 creates items in dialog rather than in-page editable rows.
- Fix: Implement section-wide edit mode with explicit Save resource library action.

## G2-16-028-008  [P2] GAP  facet F03  effort S
- Legacy: WorkspaceResourcesEditor.jsx:49-59 button `Add resource`, `Save resource library`, footer `Resources are shared with the workspace team.`
- vNext now: project-workspace.tsx:1443-1452 uses CreateProjectResourceControl; project-resource-controls.tsx:177-283 dialog save.
- Fix: Use old button names and footer help text for SA tab.

## G2-16-028-010  [P2] GAP  facet F04  effort M
- Legacy: projectSectionFieldConfigs.js:144-165 exposes key, type, title, url, accessNotes, description, pinned, required in order.
- vNext now: project-resource-controls.tsx:73-173 exposes title, URL, description, details Type/Status/Sprint/Task/Pinned/access notes, visibility, Required.
- Fix: Reorder and label fields to match the legacy resource authoring grid in SA mode.

## G2-16-028-016  [P2] MISSING  facet F06  effort M
- Legacy: projectSectionFieldConfigs.js:147-165 Key optional, with preview if blank (`Auto-generated from title if left blank`).
- vNext now: project-resource-controls.tsx:74-173 has no editable key or slug preview; projects.ts:559-606 templateKey only.
- Fix: Add Key (optional), preview, unique-key persistence and safe key generation.

## G2-16-028-018  [P2] GAP  facet F06  effort M
- Legacy: RepeatingItemEditor.jsx:158-177 groups `half` fields into md=12, xs=24 columns; required field marked red *.
- vNext now: project-resource-controls.tsx:73-173 uses one-column controls in dialog; title required native attribute.
- Fix: Render matched 2-column responsive fields and required asterisk alongside Title.

## G2-16-028-019  [P2] GAP  facet F06  effort M
- Legacy: RepeatingItemEditor.jsx:63-67 defaults new checkbox fields false and other fields empty.
- vNext now: project-resource-controls.tsx:20-25,191-198 defaults Type=LINK, Status=ACTIVE, visibility TEAM.
- Fix: Match empty/new-resource defaults or clearly document deliberately changed defaults before materializing.

## G2-16-028-026  [P2] GAP  facet F09  effort M
- Legacy: resources.js:96-111 shows Alert with Retry; no dedicated create modal.
- vNext now: project-resource-controls.tsx:177-283 opens create modal and separate discard confirmation.
- Fix: Provide equivalent inline admin editor and keep modal behavior documented as optional enhancement.

## G2-16-028-028  [P2] GAP  facet F10  effort M
- Legacy: resources.js:30-37 reload resets and refills form after saving; superAdminWorkspaceSection.js:16-52 ignores stale responses via request sequence.
- vNext now: project-resource-controls.tsx:247-253 clears local create form and refreshes router; does not maintain full-form state.
- Fix: Prevent stale loads overwriting editing state and re-seed only after successful complete reload.

## G2-16-028-039  [P2] GAP  facet F16  effort M
- Legacy: RepeatingItemEditor.jsx:157-174 uses xs24, md12 for half fields and full-width mobile rows.
- vNext now: project-resource-controls.tsx:73-173 forms are a single column; project-resource-list.tsx:93-101 two columns mobile and four sm.
- Fix: Apply old 375px/768px breakpoints for resource editor field pairing and metrics.

## G2-7-013-067  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:51-59: `No resources yet. Add only...`, `Save resource library`, `Resources are shared...`
- vNext now: V/components/projects/project-resource-list.tsx:164-171, project-resource-controls.tsx:271-314: different empty and action wording
- Fix: Use legacy copy in equivalent states

## G2-16-028-017  [P3] GAP  facet F06  effort S
- Legacy: projectSectionFieldConfigs.js:158-164 URL (for a Link) with placeholder `https://...`; access notes input `e.g. Requires college email to view`.
- vNext now: project-resource-controls.tsx:86-106 URL placeholder `https://…` and description hint; accessNotes textarea has no placeholder.
- Fix: Use original field labels, placeholder punctuation and access notes hint.
