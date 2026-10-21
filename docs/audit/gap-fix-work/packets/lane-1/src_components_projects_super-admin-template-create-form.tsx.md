# Work packet: edit src/components/projects/super-admin-template-create-form.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md

## G2-5-029-005  [P1] GAP  facet F02  effort M
- Legacy: Legacy Content goal/deliverables/DoD/personas, then repeating Sprints/Tasks/Resources, footer actions. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:243-320`
- vNext now: vNext collapsible overview, one first task/release/sprint and one optional resource. `src/components/projects/super-admin-template-create-form.tsx:56-128`
- Fix: Restore repeating sections and list editors, not one-item form.

## G2-5-029-009  [P1] MISSING  facet F03  effort M
- Legacy: Legacy `Add sprint`,`Add task`,`Add resource` buttons and `No ... yet` states. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:285-306`
- vNext now: vNext no add/remove controls, one optional resource. `src/components/projects/super-admin-template-create-form.tsx:31-37,110-122`
- Fix: Add repeatable fieldset controls, delete/move and empty states.

## G2-5-029-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy summary derived from first line of goal or title and truncated to 160. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:37-44,118-128`
- vNext now: vNext Summary is separately typed optional max2000; not auto-derived. `src/modules/projects/super-admin-template-create-model.ts:9-15`, `src/components/projects/super-admin-template-create-form.tsx:48-54`
- Fix: Derive initial summary exactly or migrate existing summary precedence.

## G2-5-029-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy initial workspace status ACTIVE by default; options Active,In progress,Ready,Blocked. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:229-239`
- vNext now: vNext template lifecycle DRAFT and no initial-workspace-status metadata in create model. `src/db/schema/projects.ts:26-69`, `src/components/projects/super-admin-template-create-form.tsx:13-18`
- Fix: Map old initial workspace status to explicit workspace creation defaults or approved removal.

## G2-5-029-015  [P1] GAP  facet F05  effort M
- Legacy: Legacy repeating rows support insertion/deletion/reordering through RepeatingItemEditor. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:285-306`
- vNext now: vNext singleton fields, no list order controls at creation. `src/components/projects/super-admin-template-create-form.tsx:31-37,90-122`
- Fix: Implement sortable/repeatable editor for sprint/task/resource lists.

## G2-5-029-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy Lifecycle status draft or published; archived disabled; initial workspace status selected independently. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:199-241`
- vNext now: vNext always draft, no lifecycle selection at creation. `src/components/projects/super-admin-template-create-form.tsx:15-18,38-55`
- Fix: Expose lifecycle and initial-status controls with disabled archived guard.

## G2-5-029-022  [P1] GAP  facet F06  effort M
- Legacy: Legacy goal 3 rows, deliverables 3 rows required, DoD 3, personas 3. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:245-284`
- vNext now: vNext goal optional and deliverables optional inside collapsed panel; no row counts fixed. `src/components/projects/super-admin-template-create-form.tsx:52-74`
- Fix: Make deliverable required and show exact multiline examples.

## G2-5-029-024  [P1] GAP  facet F06  effort M
- Legacy: Legacy Cancel and Back buttons both use dirty-form discard guard. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:308-320`
- vNext now: vNext Cancel Link navigates unconditionally. `src/components/projects/super-admin-template-create-form.tsx:124-127`
- Fix: Implement dirty navigation guard for Cancel, Back, browser back and route change.

## G2-5-029-027  [P1] GAP  facet F07  effort M
- Legacy: Legacy deliverables must have at least one nonblank line `Add at least one deliverable.` `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:253-265`
- vNext now: vNext deliverables optional; empty array passes draft parser. `src/modules/projects/super-admin-template-create-model.ts:12-15`, `src/components/projects/super-admin-template-create-form.tsx:65-74`
- Fix: Enforce one deliverable on equivalent create or identify intentional relaxed requirement.

## G2-5-029-033  [P1] MISSING  facet F09  effort M
- Legacy: Legacy back/cancel prompts discard when dirty via confirmDiscardIfDirty. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:157-164,308-319`
- vNext now: vNext plain Link Cancel with no modal. `src/components/projects/super-admin-template-create-form.tsx:124-127`
- Fix: Implement unsaved-change confirm dialog, including browser history/navigation.

## G2-5-029-048  [P1] GAP  facet F13  effort M
- Legacy: Legacy cancel guard protects accidental data loss offline/session navigation. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:157-164,308-319`
- vNext now: vNext bare link risks lost draft on cancel or expired session. `src/components/projects/super-admin-template-create-form.tsx:124-127`
- Fix: Dirty-state guard and preserve local values on unauthorized save.

## G2-5-029-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy exact `Title is required`,`Title must be 200 characters or fewer`,`Template slug is required`,`Slug must be 80...`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:175-196`
- vNext now: vNext native required and maxLength64 without legacy messages. `src/components/projects/super-admin-template-create-form.tsx:41-45`, `src/modules/projects/validation.ts:12-19`
- Fix: Match field-level exact error copy.

## G2-5-029-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy slug pattern exact guidance `Use lowercase letters, numbers, and hyphens only (e.g. ...)`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:187-196`
- vNext now: vNext pattern rejected by native input with no same helper/example. `src/components/projects/super-admin-template-create-form.tsx:44-45`
- Fix: Render detailed slug error and example.

## G2-5-029-029  [P2] GAP  facet F07  effort M
- Legacy: Legacy API failures shown via showProjectError modal, fallback `Failed to create template`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:141-145`
- vNext now: vNext generic inline banner `Template creation failed.` `src/components/projects/super-admin-template-create-form.tsx:27-29,123-123`
- Fix: Restore error modal/field recovery without losing inputs.

## G2-5-029-031  [P2] GAP  facet F08  effort M
- Legacy: Legacy success toast exactly `Template created`, then redirect to overview. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:133-145`
- vNext now: vNext redirects to template root without success toast on standalone form. `src/components/projects/super-admin-template-create-form.tsx:23-29`
- Fix: Show `Template created` toast with same duration and direct overview navigation.
