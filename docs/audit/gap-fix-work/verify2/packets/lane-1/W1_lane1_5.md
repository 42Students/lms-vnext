# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-028-039 [P1] GAP facet F09
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy before replace displays up to 20 names, `and N more`, red Remove and save, Keep them. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:299-329`
- Expected fix: List exact removals before membership revoke.

## G2-5-028-045 [P1] GAP facet F10
- Files: src/modules/projects/member-service.ts
- Legacy: Legacy `/projectId/learners` supports replaceExisting and roleLabel. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:331-369`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:527-553`
- Expected fix: Build bulk replace endpoint with transaction and impacted list.

## G2-5-028-046 [P1] GAP facet F10
- Files: src/components/projects/project-admin-workspace-list.tsx, src/modules/projects/instance-service.ts
- Legacy: Legacy archive and soft-delete POST, restore supported. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:399-465`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:555-630`
- Expected fix: Preserve soft delete/restore semantics and historical visibility.

## G2-5-028-047 [P1] GAP facet F11
- Files: src/modules/projects/instance-service.ts
- Legacy: Legacy collegeId required selected scope, backend requires admin action and module.projects.enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:55-62`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:173-185`
- Expected fix: Ensure module gate and active college selection match legacy.

## G2-5-028-050 [P1] GAP facet F12
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy project initial status IN_PROGRESS, phase Planning, progress0. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:216-225`
- Expected fix: Map legacy phases/status/progress to canonical projects.

## G2-5-028-051 [P1] GAP facet F12
- Files: src/modules/projects/member-service.ts
- Legacy: Legacy replaceExisting removes learners not in new list only after confirmation. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:299-328`
- Expected fix: Retain explicit destructive replacement and notification event.

## G2-5-028-071 [P1] GAP facet F20
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy replaceExisting warns removed learners, first20 listed. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:309-328`
- Expected fix: Add atomic replace with sorted removal preview.

## G2-5-028-077 [P1] GAP facet F23
- Files: src/components/projects/project-admin-workspace-list.tsx
- Legacy: Legacy explicit replace learner roster action guarded by named confirmation. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:299-328`
- Expected fix: Restore direct replace UX or visible route with exact warning.

## G2-5-029-005 [P1] GAP facet F02
- Files: src/components/projects/super-admin-template-create-form.tsx
- Legacy: Legacy Content goal/deliverables/DoD/personas, then repeating Sprints/Tasks/Resources, footer actions. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:243-320`
- Expected fix: Restore repeating sections and list editors, not one-item form.

## G2-5-029-009 [P1] MISSING facet F03
- Files: src/components/projects/super-admin-template-create-form.tsx
- Legacy: Legacy `Add sprint`,`Add task`,`Add resource` buttons and `No ... yet` states. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:285-306`
- Expected fix: Add repeatable fieldset controls, delete/move and empty states.

## G2-5-029-015 [P1] GAP facet F05
- Files: src/components/projects/super-admin-template-create-form.tsx
- Legacy: Legacy repeating rows support insertion/deletion/reordering through RepeatingItemEditor. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:285-306`
- Expected fix: Implement sortable/repeatable editor for sprint/task/resource lists.

## G2-5-029-021 [P1] GAP facet F06
- Files: src/components/projects/super-admin-template-create-form.tsx
- Legacy: Legacy Lifecycle status draft or published; archived disabled; initial workspace status selected independently. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:199-241`
- Expected fix: Expose lifecycle and initial-status controls with disabled archived guard.

## G2-5-029-022 [P1] GAP facet F06
- Files: src/components/projects/super-admin-template-create-form.tsx
- Legacy: Legacy goal 3 rows, deliverables 3 rows required, DoD 3, personas 3. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:245-284`
- Expected fix: Make deliverable required and show exact multiline examples.

## G2-5-029-024 [P1] GAP facet F06
- Files: src/components/projects/super-admin-template-create-form.tsx
- Legacy: Legacy Cancel and Back buttons both use dirty-form discard guard. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:308-320`
- Expected fix: Implement dirty navigation guard for Cancel, Back, browser back and route change.

## G2-5-029-048 [P1] GAP facet F13
- Files: src/components/projects/super-admin-template-create-form.tsx
- Legacy: Legacy cancel guard protects accidental data loss offline/session navigation. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:157-164,308-319`
- Expected fix: Dirty-state guard and preserve local values on unauthorized save.

## G2-5-030-025 [P1] MISSING facet F08
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx
- Legacy: Legacy dirty confirmation `Discard unsaved college setup changes?`, `Discard and close`, `Keep editing`. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:73-80`
- Expected fix: Implement prompt on drawer close/back/scope switch.

## G2-6-020-020 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy create DTO name NotBlank/Size255, collegeId required and leadership IDs optional min1 (DepartmentDTO.java:10-24).
- Expected fix: Preserve chair/vice options if product decides data parity; otherwise record intentional omission.

## G2-6-027-052 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: Legacy /active paginates in memory after fetching all jobs with max100 (JobController.java:123-132).
- Expected fix: DB page source before eligibility, use bounded query and cached shared eligibility by job.

## G2-11-017-025 [P1] MISSING facet F10
- Files: (none, new feature)
- Legacy: Response reads requests/messages plus other counts; pendingRequestCount and unreadForTpo (TpoWorkspaceController.java:267-274).
- Expected fix: Expose mapped pending/unread scoped counters, not full-list reads.

## G2-11-023-049 [P1] MISSING facet F23
- Files: (none, new feature)
- Legacy: Legacy single integrated table with proof links and grouped ActionsWindow (RequestsPanel.js:328-466).
- Expected fix: Restore core request details and action discoverability, not only visual shell.

## G2-11-029-026 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Scope from useSuperAdminScope.selectedCollegeId (sprints.js:26-29).
- Expected fix: Verify acting-college scope and permission parity to prevent tenant edits.

## G2-14-029-022 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Parallel getBatch/getBatchStudents/getStudentsTable independently tracked (batches/[batchId].js:74-113).
- Expected fix: Partial readiness for optional sources rather than full failure.

## G2-6-016-024 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy selected value is array of skill/proficiency/skillId objects (SkillsAutocomplete.jsx:23-25,33-48).
- Expected fix: Support multiple selected skills and stable IDs and proficiency, with preservation on edit.

## G2-6-028-061 [P1] GAP facet F19
- Files: src/components/projects/project-mentor-reassignment.tsx
- Legacy: Legacy faculty options use last-response-wins sequence token for async search (reassign-mentor.js:54-75).
- Expected fix: Add server-backed typeahead/search pagination so eligible mentors beyond first100 selectable.

## G2-6-030-064 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: Legacy cancel edit checks dirty snapshot before closing, blocks during saving (LectureHalls.js:20-27,173-186).
- Expected fix: Add snapshot-based unsaved-change protection and concurrent save denial.
