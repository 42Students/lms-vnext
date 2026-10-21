# Work packet (wave 2): edit src/components/projects/college-project-summary-editor-full.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-workspace-model.md, docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md

## G2-4-017-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy blocker and nextAction unrestricted TEXT. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:58-62`)
- vNext now: New text columns with editor maxLength4000. (`src/db/schema/projects.ts:203-204`; `src/components/projects/college-project-summary-editor-full.tsx:98-101`)
- Fix: Handle >4000 historic text instead of silent truncation.

## G2-4-017-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy sprintLengthWeeks initialized4. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:46-50`)
- vNext now: New integer nullable with no DB default and editor blank when null. (`src/db/schema/projects.ts:207-208`; `src/components/projects/college-project-summary-editor-full.tsx:27-28`)
- Fix: Default new workspace sprint length4 unless approved nullable.

## G2-4-017-028  [P2] GAP  facet F06  effort M
- Legacy: Legacy sprintLengthWeeks and estimationUnit edit fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectWorkspaceUpdateDTO.java:44-48`)
- vNext now: New edit controls 1-104 weeks and Points/Hours/Tasks. (`src/components/projects/college-project-summary-editor-full.tsx:91-96`)
- Fix: Match legacy default4 and warn on unit change after estimates.

## G2-4-017-061  [P2] GAP  facet F18  effort M
- Legacy: Legacy title/label data include IN_PROGRESS and sprint unit POINTS/HOURS. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:31-56`)
- vNext now: New UI labels PLANNED/ACTIVE/COMPLETED, includes TASKS unit. (`src/components/projects/college-project-summary-editor-full.tsx:73-96`)
- Fix: Map legacy status wording and estimation display labels consistently.

## G2-14-028-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy snapshot and risk banners above always-open Workspace settings Card. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:492-523`
- vNext now: vNext summary editor collapsed behind Edit workspace summary then top metric strip. `src/components/projects/project-workspace.tsx:335-365`, `src/components/projects/college-project-summary-editor-full.tsx:67-70`
- Fix: Use old always-visible editor and snapshot placement.

## G2-14-028-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy Basic info, Status, Schedule & setup, Content groups, Save footer. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:522-675`
- vNext now: vNext two-col form with grouped fields and summary/blocker at end. `src/components/projects/college-project-summary-editor-full.tsx:70-107`
- Fix: Match group headings/spacing and editor order.

## G2-14-028-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy Save changes button only in always-visible card. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:671-675`
- vNext now: vNext Save changes and Cancel inside toggle editor. `src/components/projects/college-project-summary-editor-full.tsx:103-107`
- Fix: Match action placement and disabled state.

## G2-14-028-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy fields title, summary, status, progress, blocker,nextAction,phase,dueLabel,courseLabel,classId,start,end,sprintWeeks,estimation. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:230-249`
- vNext now: vNext similarly stores 14 editor fields with sectionId in place of classId. `src/components/projects/college-project-summary-editor-full.tsx:23-29`
- Fix: Field parity map and type migration.

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

## G2-14-028-037  [P2] GAP  facet F10  effort M
- Legacy: Legacy after load resets touched and seeds fields atomically. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:221-250`
- vNext now: vNext seeds state once from prop, re-opens previous local draft until remount. `src/components/projects/college-project-summary-editor-full.tsx:23-29`
- Fix: Reset local editor when project or persisted version changes.

## G2-14-028-050  [P2] GAP  facet F16  effort M
- Legacy: Legacy md12 two-column and md8 third row editor grids. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:536-558,582-663`
- vNext now: vNext md2 grid for most fields, textareas full width. `src/components/projects/college-project-summary-editor-full.tsx:70-102`
- Fix: Compare column widths at 375,768,1280.

## G2-14-028-052  [P2] GAP  facet F17  effort M
- Legacy: Legacy nested dropdown Escape prioritization and modal close guard. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:204-218`
- vNext now: vNext no nested template chooser. `src/components/projects/college-project-summary-editor-full.tsx:67-111`
- Fix: Build keyboard-safe replacement modal.

## G2-14-028-053  [P2] GAP  facet F17  effort M
- Legacy: Legacy Form.Item title and date field validation hints. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:526-531,595-606`
- vNext now: vNext inline error Banner and labels; no field-associated help. `src/components/projects/college-project-summary-editor-full.tsx:40-43,64-66`
- Fix: Associate errors with field aria-describedby.

## G2-14-028-056  [P2] GAP  facet F18  effort M
- Legacy: Legacy Workspace settings, Basic info, Status, Schedule & setup, Content headings. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:522-524,665-669`
- vNext now: vNext Edit workspace summary and no section headings. `src/components/projects/college-project-summary-editor-full.tsx:67-103`
- Fix: Use original group headings.

## G2-14-028-057  [P2] MISSING  facet F19  effort M
- Legacy: Legacy remote-search published templates on focus/typing, race-safe. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:147-201`
- vNext now: vNext class options fetched lazy, no template search. `src/components/projects/college-project-summary-editor-full.tsx:31-39`
- Fix: Support paginated search and preserve selected label.

## G2-14-028-059  [P2] GAP  facet F20  effort M
- Legacy: Legacy templateSearchSeq guards delayed search response. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:189-201`
- vNext now: vNext AbortController for class options, not template chooser. `src/components/projects/college-project-summary-editor-full.tsx:31-39`
- Fix: Apply race guard to template search.

## G2-4-017-058  [P3] GAP  facet F16  effort S
- Legacy: Old field title160 and dueLabel80 enforce shorter widths. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:19-23`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:64-65`)
- vNext now: New title input max200 and dueLabel160, wraps in card. (`src/components/projects/college-project-summary-editor-full.tsx:64-80`; `src/components/projects/project-admin-workspace-list.tsx:115-126`)
- Fix: Check long labels do not overflow old shell widths.
