# Work packet: edit src/components/projects/project-create-control.tsx (part 2 of 2)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md, docs/audit/gap2/lane-8/super-admin-project-workspace-new.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md

## G2-7-020-053  [P1] GAP  facet F09  effort M
- Legacy: new.js:404-405 confirmDiscardIfDirty; useUnsavedFormGuard.js:17-56 guards unload and route
- vNext now: project-create-control.tsx:371-380 instant Cancel
- Fix: Provide global dirty-form navigation confirmation

## G2-7-020-070  [P1] GAP  facet F13  effort M
- Legacy: new.js:113-120 template load failure separated from no assigned templates via helper
- vNext now: project-create-control.tsx:214-225 empty No assigned templates, create/page.tsx:19 can throw
- Fix: Render retry for transient template-fetch failure instead of empty/crash

## G2-7-020-085  [P1] GAP  facet F17  effort M
- Legacy: new.js:74 and useUnsavedFormGuard.js:17-56 protect browser nav and page unload
- vNext now: project-create-control.tsx:371-380 Cancel routes directly
- Fix: Add dirty guard to in-app routing and beforeunload

## G2-7-020-092  [P1] GAP  facet F19  effort L
- Legacy: new.js:194-246 remote lookups each 400ms debounced
- vNext now: project-create-control.tsx:82-101 mentor-candidates hard limit100; class-team-workspace-creator.tsx:61-69 loads all classes
- Fix: Add paged remote picker queries and debounce to avoid inaccessible mentors

## G2-8-028-009  [P1] GAP  facet F03  effort M
- Legacy: Old status options Active, In progress, Ready, Blocked, Archived(disabled) docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:422-441.
- vNext now: New class/team mode has no status field; standalone CreateProjectControl offers Planned/Active only src/components/projects/project-create-control.tsx:332-338.
- Fix: Keep full historical status choices and disabled Archive exception or record intentional deprecation.

## G2-8-028-026  [P1] GAP  facet F06  effort M
- Legacy: Old initial Status ACTIVE, ARCHIVED disabled (archive separate), forms for IN_PROGRESS/READY/BLOCKED docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:205-213,422-441.
- vNext now: New separate single-control defaults PLANNED, only ACTIVE as other option src/components/projects/project-create-control.tsx:58-59,332-338.
- Fix: Map legacy status semantics to PLANNED/ACTIVE or preserve legacy statuses in state.

## G2-5-028-028  [P2] GAP  facet F07  effort M
- Legacy: Legacy mentor missing `Select a mentor`, visible in modal Form.Item. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:738-747`
- vNext now: vNext planned project accepts empty mentor and shows `Assign later`. `src/components/projects/project-create-control.tsx:295-319`
- Fix: Keep visible mentor requirement warning where legacy demanded selection.

## G2-5-028-029  [P2] GAP  facet F07  effort M
- Legacy: Legacy learner assignment selection required `Select at least one learner`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:779-789`
- vNext now: vNext create can select zero learners. `src/components/projects/project-create-control.tsx:340-359`
- Fix: Distinguish initial project no-team state vs assignment action requiring one.

## G2-5-028-030  [P2] GAP  facet F07  effort M
- Legacy: Legacy create failure banner `Project was not created` with server field errors mapped. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:814-819`
- vNext now: vNext single inline error paragraph with generic fallback. `src/components/projects/project-create-control.tsx:366-369`, `src/components/projects/project-create-control.tsx:202-207`
- Fix: Show field-level errors and exact banner for 4xx responses.

## G2-5-028-032  [P2] GAP  facet F08  effort M
- Legacy: Legacy create toast `Project created successfully`, closes modal, refreshes table. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:505-508`
- vNext now: vNext toast `Project created` with description template materialized then navigates detail. `src/components/projects/project-create-control.tsx:193-201`
- Fix: Use original toast title, preserve optional detail navigation.

## G2-7-020-039  [P2] GAP  facet F07  effort S
- Legacy: new.js:458-461 Title is required and Title must be 160 characters or fewer
- vNext now: project-create-control.tsx:252-263 native required/max200 and validation.ts:19,333 max200
- Fix: Restore exact field errors and maxlength

## G2-7-020-040  [P2] GAP  facet F07  effort S
- Legacy: new.js:491-499 template required exact sprint/task baseline wording
- vNext now: project-create-control.tsx:231-251 native required only
- Fix: Show exact template requirement error

## G2-7-020-041  [P2] GAP  facet F07  effort S
- Legacy: new.js:517-519 A mentor is required before a workspace can be Active
- vNext now: project-create-control.tsx:155-157 Assign a Mentor before making this Project active
- Fix: Match field-level wording and location

## G2-7-020-044  [P2] GAP  facet F07  effort S
- Legacy: new.js:373-375 Failed to create workspace fallback via modal
- vNext now: project-create-control.tsx:202-207 caught message or Could not create the Project
- Fix: Match safe fallback and preserve specific server errors

## G2-7-020-046  [P2] GAP  facet F08  effort S
- Legacy: new.js:360-362 success toast Workspace created
- vNext now: project-create-control.tsx:193-198 Project created with longer description
- Fix: Use exact Workspace created success toast

## G2-7-020-050  [P2] GAP  facet F08  effort S
- Legacy: new.js:370 server omitted created ID warning and list redirect
- vNext now: project-create-control.tsx:191-201 unguarded result.project.id dereference
- Fix: Handle missing ID with warning and safe list redirect

## G2-8-028-030  [P2] GAP  facet F07  effort M
- Legacy: Old mentor required before ACTIVE: A mentor is required before a workspace can be Active docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:467-472.
- vNext now: New single control errors Assign a Mentor before making this Project active; class-team has no status field src/components/projects/project-create-control.tsx:152-158; src/components/projects/class-team-workspace-creator.tsx:164-204.
- Fix: Use identical mentor requirement wording in all creator paths.
