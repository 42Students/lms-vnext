# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-5/u003-college-admin-classes.md

25 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md

## G2-5-003-002  [P2] GAP  facet F01 Purpose/entry/navigation  effort S
- Legacy: Unassigned college: warning 'Admin not assigned to a college' plus contact administrator. (docs/legacy-source/frontend/src/pages/college-admin/classes.js:18-29)
- vNext now: Redirect to dashboard if no membership; no role-specific missing-college warning. (src/app/(authenticated)/college/classes/page.tsx:21-23)
- Fix: Render original warning for college admin without college assignment.

## G2-5-003-005  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Headline Classes & Sections; subtitle 'Create teaching sections within a batch, manage capacity and schedule recurring sessions from the same roster.' (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:442-443)
- vNext now: Title Classes and link Academic workspace; no matching subtitle. (src/components/academics/college-structure-directory.tsx:38-49)
- Fix: Match exact title/subtitle and header spacing.

## G2-5-003-006  [P2] GAP  facet F02 Layout/section order  effort M
- Legacy: Create card always visible with inline form, per-field errors and Add Another submit. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:448-464)
- vNext now: Create form inside Disclosure titled Create class, initially closed. (src/components/academics/college-section-management.tsx:78-143)
- Fix: Keep create form visible on first load; match label and card heading.

## G2-5-003-007  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Primary Plus icon button 'Create Class & Add Another' stays visible under form. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:459-462)
- vNext now: Primary button 'Create class' no Plus icon and collapsed until Disclosure open. (src/components/academics/college-section-management.tsx:133-137)
- Fix: Restore icon, exact label, position, and Add Another behavior.

## G2-5-003-011  [P2] GAP  facet F04 Data format  effort M
- Legacy: Columns Class/Section Name, Program, Batch, Max Students, Description, Students, Actions. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:389-402)
- vNext now: Columns Class, Program/batch, Academic period, Capacity, Active enrollments, Status, Manage; Description missing. (src/components/academics/college-structure-directory.tsx:385-405)
- Fix: Restore separate Program and Batch, description column and legacy headers.

## G2-5-003-015  [P2] MISSING  facet F04 Data format  effort S
- Legacy: Description column ellipsis. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:398)
- vNext now: Description omitted in table though persisted. (src/components/academics/college-structure-directory.tsx:384-407)
- Fix: Add description with ellipsis and tooltip.

## G2-5-003-016  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: 7-column table with Actions width250 and compact row styling. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:389-427)
- vNext now: 7-column DataTable with different fields and Manage actions; no fixed actions width. (src/components/academics/college-structure-directory.tsx:380-408)
- Fix: Match legacy column sizing, density, action wrapping.

## G2-5-003-022  [P2] GAP  facet F06 Forms  effort M
- Legacy: Program and Batch searchable AntD Select; Batch disabled until program picked. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:63-77)
- vNext now: Native Select, batch choices filtered by Program but not disabled before selection. (src/components/academics/college-section-management.tsx:89-104)
- Fix: Implement searchable options and disabled state, exact placeholder 'Select program first'.

## G2-5-003-028  [P2] GAP  facet F06 Forms  effort S
- Legacy: After create reset name/description but retain Program/Batch/capacity for Add Another. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:455-462; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:237-240)
- vNext now: Reset name, code, capacity60 and description; selected Program/Batch remain. (src/components/academics/college-section-management.tsx:68-71)
- Fix: Retain capacity as last chosen and exact post-create focus.

## G2-5-003-035  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: Update toast 'Updated class “NAME”.' and fallback 'Failed to update class.' (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:274-285)
- vNext now: Inline 'Class updated.' and 'Class update failed.' (src/components/academics/college-section-management.tsx:175-180)
- Fix: Match exact toast and fallback wording.

## G2-5-003-036  [P2] MISSING  facet F08 Success/toasts  effort S
- Legacy: Delete toast 'Deleted class “NAME”.', on failure Retry delete banner. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:293-301)
- vNext now: Archive/Restore changes state without equivalent deletion success toast. (src/components/academics/college-section-lifecycle-action.tsx:25-37)
- Fix: Implement delete feedback if delete action restored.

## G2-5-003-037  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: Recurring success toast created X of N sessions; zero-created warning. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:355-362)
- vNext now: Inline Created X scheduled sessions; preview conflict warning. (src/components/academics/college-recurring-preview.tsx:222-236)
- Fix: Match count denominator and zero-create wording; keep preview benefit.

## G2-5-003-038  [P2] GAP  facet F09 Modals/drawers  effort M
- Legacy: Edit modal title Edit class “NAME”, width550, mask cannot close, Cancel and Save Changes. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:513-525)
- vNext now: Dialog title Edit class NAME, layout responsive; cancel button Save changes. (src/components/academics/college-section-management.tsx:191-234)
- Fix: Match quotes/label and mask/keyboard while preserving accessible dialog.

## G2-5-003-039  [P2] GAP  facet F09 Modals/drawers  effort S
- Legacy: On dirty edit cancel confirm 'Discard edits to “NAME”?' and 'Your unsaved changes will be lost.' (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:263-266)
- vNext now: ConfirmDialog 'Discard unsaved class changes?' and different explanation/confirm. (src/components/academics/college-section-management.tsx:229-233)
- Fix: Use exact named dialog title and button 'Discard edits'.

## G2-5-003-048  [P2] GAP  facet F11 Permissions  effort S
- Legacy: Unscoped Super Admin wrapper can choose college; College Admin must have assigned college. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:437-439)
- vNext now: Only membership existence explicitly checked at page, service permission gates actual read. (src/app/(authenticated)/college/classes/page.tsx:21-23)
- Fix: Provide actionable unassigned warning and forbidden feedback rather than generic redirect.

## G2-5-003-053  [P2] GAP  facet F12 Business rules  effort S
- Legacy: Times 5-minute step, end strictly after start, no explicit 93-day form limit. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:547-559)
- vNext now: HTML time inputs, end validation backend, To label up to93 days. (src/components/academics/college-recurring-preview.tsx:171-181)
- Fix: Match 5-minute stepping and explain new 93-day cap.

## G2-5-003-055  [P2] GAP  facet F13 States  effort S
- Legacy: Empty text depends on load error, filtered result, or genuinely no classes. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:506-508)
- vNext now: Single recorded classes match filters message and empty-page wording. (src/components/academics/college-structure-directory.tsx:368-378)
- Fix: Use legacy three exact messages conditional on state.

## G2-5-003-056  [P2] GAP  facet F13 States  effort S
- Legacy: Missing programs help links /college-admin/programs; no program => cannot create class. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:452-455)
- vNext now: Missing cohorts or periods help; only period links Setup. (src/components/academics/college-section-management.tsx:80-87)
- Fix: Add no-program explanatory link and disable form correctly.

## G2-5-003-057  [P2] GAP  facet F14 Exports  effort M
- Legacy: CSV classes.csv, exports current filtered list with id/name/programId/batchId/startDate/endDate/minStudents/maxStudents. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:468-476)
- vNext now: Server Export CSV link with 2000-row cap and truncation notice. (src/app/(authenticated)/college/classes/page.tsx:38-51)
- Fix: Match filename/column order and filtered data semantics; warn if capped.

## G2-5-003-058  [P2] GAP  facet F14 Exports  effort S
- Legacy: Export accessible in table toolbar, no upload/import. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:468-476)
- vNext now: Export hidden under More class tools; no upload/import. (src/app/(authenticated)/college/classes/page.tsx:38-51)
- Fix: Place Export CSV alongside search/refresh.

## G2-5-003-071  [P2] GAP  facet F20 Concurrency  effort S
- Legacy: deleteRef blocks duplicate deletes; previous failures offer Retry delete. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:287-305)
- vNext now: Archive/Restore inFlight ref prevents repeated PATCH; no Retry delete. (src/components/academics/college-section-lifecycle-action.tsx:15-39)
- Fix: Replicate guarded delete and retry failure state if parity approved.

## G2-5-003-074  [P2] GAP  facet F21 Integrations  effort M
- Legacy: Recurring faculty/course/hall options fetch independently with retry/partial failure. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:308-330; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:533-539)
- vNext now: Choices supplied by SSR loader; no independent retry when one lookup fails. (src/components/academics/college-recurring-preview.tsx:199-215)
- Fix: Give partial lookup banners and Retry choices without disabling unaffected inputs.

## G2-5-003-023  [P3] GAP  facet F06 Forms  effort S
- Legacy: Name label Class/Section Name, placeholder e.g. CSE-A or Section 1; Description placeholder Optional description. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:79-85)
- vNext now: Name label Class name with no placeholder; Description optional label no placeholder. (src/components/academics/college-section-management.tsx:115-130)
- Fix: Restore label and placeholder text.

## G2-5-003-027  [P3] GAP  facet F06 Forms  effort S
- Legacy: Help sentence 'Class dates follow the batch/semester academic structure. Schedule actual teaching dates from the Schedule action.' (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:85-88)
- vNext now: Different helper says server validates academic period belongs to batch timeline. (src/components/academics/college-section-management.tsx:140-143)
- Fix: Restore exact instructional text.

## G2-5-003-065  [P3] GAP  facet F18 Wording  effort S
- Legacy: Search placeholder Search class, program, batch or capacity. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:469-470)
- vNext now: Search registered records. (src/components/academics/college-structure-directory.tsx:51-57)
- Fix: Use legacy placeholder.
