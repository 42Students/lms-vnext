# Work packet (wave 2): edit src/components/projects/project-workspace.tsx (part 1 of 4)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md, docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md, docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md, docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md, docs/audit/gap2/lane-3/superadmin-workspace-delivery.md

## G2-15-028-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:19-22,132-138 — /superadmin/projects/workspaces/:id/sprints, titled workspace name.
- vNext now: src/components/projects/project-workspace.tsx:75-105,835-910 — /admin/projects/:id/sprints renders shared workspace summary/release list.
- Fix: Preserve direct Sprints section and workspace shell nav.

## G2-15-028-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:111-130 — no college warning retains SuperAdminWorkspaceShell tabs.
- vNext now: src/components/projects/project-workspace.tsx:75-105 — admin workspace section uses generic Tabs, no explicit scopeLoaded warning in component.
- Fix: Restore scope loading/selection warning in wrapper.

## G2-15-028-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:33-43 — Sprint plan Card with Delivery cadence eyebrow, headline, helper.
- vNext now: src/components/projects/project-workspace.tsx:835-910 — Release cards and nested Sprint entries instead of standalone plan card.
- Fix: Restore source intro/card composition.

## G2-15-028-004  [P2] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:45-52 — four summary stats Total sprints/Active/Completed/Releases available.
- vNext now: src/components/projects/project-workspace.tsx:835-910 — release/sprint sections but no four-card summary bar.
- Fix: Add exact summary strip.

## G2-15-028-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:39-42 — plan outcomes intro text and scan without expanding.
- vNext now: src/components/projects/project-workspace.tsx:907-943 — sprint heading and status; release sections dominate.
- Fix: Keep source scan-first copy and row hierarchy.

## G2-15-028-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:97-139 — row accordion, Up/Down/Remove with undo.
- vNext now: src/components/projects/project-workspace.tsx:945-966 — discrete Delete/Edit sprint controls only.
- Fix: Restore bulk reordering and row accordion.

## G2-15-028-014  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:25-30 — dashboard counts active and completed, releases available.
- vNext now: src/components/projects/project-workspace.tsx:835-944 — counts not surfaced in summary.
- Fix: Restore counts without duplicating per-release info.

## G2-15-028-026  [P2] MISSING  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:66-70 — Retry releases inline Action in Ant Alert.
- vNext now: src/components/projects/project-workspace.tsx:835-910 — no equivalent retry action in this component.
- Fix: Add release retry action.

## G2-15-028-029  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:20-25 — selectedCollegeId super admin scoped workspace read.
- vNext now: src/components/projects/project-workspace.tsx:884-900 — mode=!LEARNER and !readOnly; readOnly gate separate from super admin.
- Fix: Verify Super Admin write path and permissions on each action.

## G2-15-028-034  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:139-160 — errors above Skeleton six lines, Workspace not found alert.
- vNext now: src/components/projects/project-workspace.tsx:835-910 — SSR workspace route handles not-found/loading separately.
- Fix: Match in-shell loading/error/empty geometry.

## G2-15-028-035  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:91-94 — No sprints yet. Add first sprint when release is ready.
- vNext now: src/components/projects/project-workspace.tsx:905-966 — zero sprints renders empty release nested section.
- Fix: Use precise source empty description.

## G2-15-028-038  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:33-52 — four metric cards and flexible Ant form inside single Card.
- vNext now: src/components/projects/project-workspace.tsx:835-965 — responsive release cards with nested inline actions.
- Fix: Compare 320/375/768px metrics/card layout.

## G2-15-028-040  [P2] MISSING  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:45 — metrics aria-label Sprint plan summary.
- vNext now: src/components/projects/project-workspace.tsx:835-910 — no equivalent summarized four-metric aria region.
- Fix: Restore labelled metrics region.

## G2-15-028-041  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:115-138 — per-row aria-expanded and named reordering controls.
- vNext now: src/components/projects/project-workspace.tsx:945-966 — separate action buttons, no row accordion.
- Fix: Restore keyboard reorder and item-specific names.

## G2-15-028-042  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:33-42 — Sprint plan, Delivery cadence, Plan work in clear release-bound increments.
- vNext now: src/components/projects/project-workspace.tsx:835-910 — release list headings and per-sprint names, no source copy.
- Fix: Use exact intro copy and hierarchy.

## G2-15-028-053  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/sprints.js:39-63 — no releases warning and explicit retry.
- vNext now: src/components/projects/project-workspace.tsx:835-910 — release list loaded server-side with no partial retry.
- Fix: Preserve partial failure recovery affordance.

## G2-18-028-004  [P2] GAP  facet F02  effort M
- Legacy: Old PageShell head/title/actions/tabs/breadcrumb then Project brief card; overview.js:128-147;SuperAdminWorkspaceShell.jsx:23-29
- vNext now: New ProjectWorkspace heading/tab strip followed by Overview inline; src/components/projects/project-workspace.tsx:316-335,460-471
- Fix: Align page head, bread crumbs and single-canvas section order

## G2-18-028-010  [P2] GAP  facet F04  effort S
- Legacy: Legacy name normaliseCollegeScopedName fallback Workspace; overview.js:130-134
- vNext now: New project.title and status/mentor text; project-workspace.tsx:177-200
- Fix: Use scoped title display/fallback while retaining extra status badge

## G2-18-028-038  [P2] GAP  facet F18  effort S
- Legacy: Old Project brief/Learner & mentor view/Make the project understandable before anyone opens the board; WorkspaceOverviewEditor.jsx:19-29
- vNext now: New Overview/Edit project brief; project-workspace.tsx:460-471;workspace-brief-editor.tsx:36-43
- Fix: Restore exact editor labels and lede text

## G2-16-028-003  [P2] GAP  facet F02  effort L
- Legacy: resources.js:91-111 wraps subtitle, error, skeleton and editor in one workspace shell.
- vNext now: project-workspace.tsx:1432-1463 shows Resources heading, create control, directory, files panel; no page-level Resource library form.
- Fix: Add superadmin section wrapper with same page-head, editor card, and save footer, not the generic resource directory alone.

## G2-16-028-004  [P2] GAP  facet F02  effort S
- Legacy: WorkspaceResourcesEditor.jsx:21-39 orders Project references eyebrow, headline, help copy, then four metrics.
- vNext now: project-resource-list.tsx:93-100 renders metrics before filtering; project-workspace.tsx:1432-1452 puts Resource heading before list.
- Fix: Restore old headline, explanatory text and metrics position exactly for SA resource tab.

## G2-16-028-008  [P2] GAP  facet F03  effort S
- Legacy: WorkspaceResourcesEditor.jsx:49-59 button `Add resource`, `Save resource library`, footer `Resources are shared with the workspace team.`
- vNext now: project-workspace.tsx:1443-1452 uses CreateProjectResourceControl; project-resource-controls.tsx:177-283 dialog save.
- Fix: Use old button names and footer help text for SA tab.

## G2-16-028-042  [P2] GAP  facet F18  effort S
- Legacy: resources.js:94 subtitle `Curate the references, files and access guidance this workspace team needs.`
- vNext now: project-workspace.tsx:1432-1440 only section title Resources, generic project shell.
- Fix: Restore page-specific subtitle in SA route.

## G2-13-028-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:47-57 Task plan card, eyebrow, headline and intro
- vNext now: src/components/projects/project-workspace.tsx:802-811 shows Execution section Releases & Sprints
- Fix: Restore dedicated Task plan card title, intro and hierarchy.

## G2-13-028-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:59-66 metrics four columns Tasks,In progress,Done,Submissions
- vNext now: src/components/projects/project-workspace.tsx:362-378 summary metrics elsewhere, tasks section built into Sprints/Execution
- Fix: Add four exact metrics above editable plan.

## G2-13-028-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:108-163 independent Task submissions card below editor
- vNext now: src/components/projects/project-workspace.tsx:1011-1104 task rows include latest attempt and submission link
- Fix: Restore separate submissions summary with four-column table.

## G2-13-028-011  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:109-111 counter 'N with submission links'
- vNext now: src/components/projects/project-workspace.tsx:1059-1104 shows individual submission, not count
- Fix: Show exact aggregate count in Task submissions header.

## G2-13-028-013  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:38-42 four metrics use current authored vs live resolved tasks
- vNext now: src/components/projects/project-workspace.tsx:284-294 workspace.tasks/taskSubmissions and :1069-1104 per-task status
- Fix: Compute exact live and draft metric formulas; don't count stale archived tasks.

## G2-13-028-014  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:134-159 submissions Task,Submission,Submitted by,Submitted at
- vNext now: src/components/projects/project-workspace.tsx:1099-1104 per-task URL, status shown with detail
- Fix: Provide old submission table columns and date format/empty values.

## G2-13-028-016  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:119-131 submissions paginate only when >10, pageSize10 fixed
- vNext now: src/components/projects/project-workspace.tsx:1011-1104 task list repeated under sprints, no submissions page
- Fix: Restore 10/page submission list with total range copy.

## G2-13-028-017  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:134-159 columns Task,Submission,Submitted by,Submitted at
- vNext now: src/components/projects/project-workspace.tsx:1080-1104 task DL Assignee,Due date,Estimate,Task type,Submission
- Fix: Match separate table headers and ordering.

## G2-13-028-018  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:92-95 Add task list keyed by field rows
- vNext now: src/components/projects/project-workspace.tsx:262-271 group tasks by sprint and includes backlog differently
- Fix: Show tasks without sprint in backlog as old edit list does.

## G2-13-028-034  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:72 showProjectError modal on failed save
- vNext now: src/components/projects/project-workspace.tsx:1010-1142 no admin plan modal visible
- Fix: Provide conflict/retry modal rather than silent loss.

## G2-13-028-051  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:119-131 Ant table x max-content on mobile
- vNext now: src/components/projects/project-workspace.tsx:1080-1105 DL responsive sm:grid-cols-2
- Fix: Clone submission table scroll and phone row fallback.

## G2-13-028-055  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:47 'Task plan',:50 'Work breakdown',:51 headline
- vNext now: src/components/projects/project-workspace.tsx:805-811 'Execution' and Releases and Sprints
- Fix: Restore task-plan heading/subtitle and metrics labels.

## G2-13-028-056  [P2] MISSING  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:100-103 'Save task plan' and readonly note
- vNext now: src/components/projects/project-workspace.tsx:1011-1142 no equivalent save/footer
- Fix: Restore primary CTA and exact readonly disclaimer.

## G2-13-028-058  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:119-131 submissions paged10 when >10
- vNext now: src/components/projects/project-workspace.tsx:1011-1104 embeds all tasks under sprints
- Fix: Bound submissions list independently and show total range.

## G2-13-028-067  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:108-163 separate submissions table
- vNext now: src/components/projects/project-workspace.tsx:1099-1104 latest submission embedded per task
- Fix: Restore staff submissions overview if needed; keep improved per-task facts.

## G2-3-029-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/SuperAdminWorkspaceShell.jsx:14-27`
- vNext now: `src/components/projects/project-workspace.tsx:320-337`
- Fix: Legacy shell supplies workspace breadcrumb/back button and ten exact section tabs, vNext generic ProjectWorkspace tabs and summary header. Match titles/order/crumb placement.

## G2-3-029-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:48-87`
- vNext now: `src/components/projects/project-workspace.tsx:1212-1293`
- Fix: Legacy delivery hero Card with eyebrow and facts grid; vNext linear heading then one article per version separated by border.
