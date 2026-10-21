# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-5/u010-classes-shared-component.md

34 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-5-010-003  [P2] GAP  facet F01 Purpose/entry/navigation  effort S
- Legacy: When no college, exact Select a College to view classes prompt (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:437-439)
- vNext now: Redirect/unassigned text handled outside component (src/app/(authenticated)/college/classes/page.tsx:21-34)
- Fix: Render same contextual warning inside class module.

## G2-5-010-008  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Create Class & Add Another Plus icon always visible (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:459-462)
- vNext now: Create class Button within initially collapsed Disclosure (src/components/academics/college-section-management.tsx:133-143)
- Fix: Render and label exactly.

## G2-5-010-012  [P2] GAP  facet F03 Visible elements  effort M
- Legacy: Program/Batch filters compact Select controls with widths165 (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:485-494)
- vNext now: Program drop-down and batchCode text field (src/components/academics/college-structure-directory.tsx:59-80)
- Fix: Restore coupled filter selects and widths.

## G2-5-010-013  [P2] GAP  facet F04 Data formatting  effort M
- Legacy: Columns Class/Section Name, Program, Batch, Max Students, Description, Students, Actions (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:389-402)
- vNext now: Class, Program/batch, Period, Capacity, Enrollments, Status, Manage (src/components/academics/college-structure-directory.tsx:380-408)
- Fix: Restore precise column names and order.

## G2-5-010-016  [P2] MISSING  facet F04 Data formatting  effort S
- Legacy: Description ellipsis with hover full content (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:398)
- vNext now: Description not displayed in table (src/components/academics/college-structure-directory.tsx:384-408)
- Fix: Restore ellipsized description cell.

## G2-5-010-019  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: AntD Table 7 columns, compact rows, fixed action width250 (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:389-426)
- vNext now: DataTable different fields, actions no matching width (src/components/academics/college-structure-directory.tsx:380-408)
- Fix: Match density and Actions width.

## G2-5-010-021  [P2] GAP  facet F05 Tables/lists  effort S
- Legacy: No status filter; all class records except electives (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:219-228)
- vNext now: Default ACTIVE status, archived hidden (src/components/academics/college-structure-directory.tsx:81-98)
- Fix: Default to all legacy-visible real sections.

## G2-5-010-024  [P2] GAP  facet F06 Forms  effort M
- Legacy: Program searchable Select, Batch disabled until program (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:63-77)
- vNext now: Native Select, batch shown based selection but not search (src/components/academics/college-section-management.tsx:89-104)
- Fix: Implement searchable dynamic, disabled placeholder.

## G2-5-010-030  [P2] GAP  facet F06 Forms  effort S
- Legacy: After create keep program/batch/max for Add Another (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:455-462)
- vNext now: Clears capacity back to 60, program/batch remain (src/components/academics/college-section-management.tsx:68-74)
- Fix: Keep last capacity and focus class name.

## G2-5-010-034  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Maximum must be a whole number from 1 to 200, maximum>=minimum (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:93-100)
- vNext now: Capacity must be between 1 and 200; no lower-vs-max error (src/modules/academics/college-section-mutation-model.ts:7-8)
- Fix: Restore exact validation and cross-field check.

## G2-5-010-035  [P2] GAP  facet F07 Validation/errors  effort M
- Legacy: Backend field errors mapped into antd form field (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:242-247)
- vNext now: Error output only text notice at top (src/components/academics/college-section-management.tsx:59-74)
- Fix: Map API field errors into relevant controls.

## G2-5-010-037  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: Created class “NAME”. Next, register or move students into this section. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:235-249)
- vNext now: Class created. inline notice (src/components/academics/college-section-management.tsx:68-74)
- Fix: Exact named success toast with legacy instruction.

## G2-5-010-039  [P2] MISSING  facet F08 Success/toasts  effort S
- Legacy: Deleted class “NAME”. error Retry delete (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:293-301)
- vNext now: Archive/Restore instead, no deletion feedback (src/components/academics/college-section-lifecycle-action.tsx:19-39)
- Fix: Restore delete toast/error state.

## G2-5-010-040  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: Recurring toast Scheduled X of N sessions, zero warning (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:355-362)
- vNext now: Inline Created X scheduled sessions and preview conflicts (src/components/academics/college-recurring-preview.tsx:222-260)
- Fix: Display attempted denominator and zero created warning.

## G2-5-010-041  [P2] GAP  facet F09 Modals/drawers  effort M
- Legacy: Edit class “NAME” Modal width550 and mask unclosable (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:513-525)
- vNext now: Dialog title Edit class NAME; width/radius modern (src/components/academics/college-section-management.tsx:191-234)
- Fix: Match quoted name, footer placement and modal width.

## G2-5-010-042  [P2] GAP  facet F09 Modals/drawers  effort S
- Legacy: Cancel dirty edit asks Discard edits to “NAME”? (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:263-266)
- vNext now: Discard unsaved class changes? generic (src/components/academics/college-section-management.tsx:229-233)
- Fix: Use original personalized dialog text.

## G2-5-010-044  [P2] GAP  facet F09 Modals/drawers  effort L
- Legacy: Recurring Modal width720 with seven weekday controls (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:526-599)
- vNext now: Standalone recurring preview page (src/components/academics/college-recurring-preview.tsx:142-215)
- Fix: Match modal and fields or explicit product decision.

## G2-5-010-045  [P2] GAP  facet F10 Actions/side effects  effort L
- Legacy: POST class/create with program_id/batch_id and limits (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:235-249; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:75-106)
- vNext now: POST class route with cohortId/academicPeriodId/code/capacity (src/modules/academics/college-section-mutation-service.ts:156-178)
- Fix: Map IDs/limits without loss.

## G2-5-010-048  [P2] GAP  facet F10 Actions/side effects  effort M
- Legacy: POST class-schedule recurring reports created/requested/failed (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:338-364; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminClassScheduleController.java:92-201)
- vNext now: Preview then Confirm endpoint, skip/conflict counts (src/components/academics/college-recurring-preview.tsx:69-130)
- Fix: Match per-date creation counters and fail summary.

## G2-5-010-050  [P2] GAP  facet F11 Permissions  effort S
- Legacy: If no selected scoped college show warning (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:437-439)
- vNext now: No membership redirects to dashboard (src/app/(authenticated)/college/classes/page.tsx:21-34)
- Fix: Render actionable no-college warning for authorized admin.

## G2-5-010-054  [P2] GAP  facet F12 Business rules  effort S
- Legacy: Time step5m, end after start, date range flexible (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:547-559)
- vNext now: Native time inputs with 93-day max (src/components/academics/college-recurring-preview.tsx:171-181)
- Fix: Restore 5-minute step and flag new 93d constraint.

## G2-5-010-056  [P2] GAP  facet F13 States  effort S
- Legacy: Empty state varies no classes/filter zero/read failure (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:506-508)
- vNext now: Generic No recorded classes match these filters (src/components/academics/college-structure-directory.tsx:368-378)
- Fix: Match three conditions/messages.

## G2-5-010-057  [P2] GAP  facet F13 States  effort S
- Legacy: Missing program/setup help links /college-admin/programs (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:452-455)
- vNext now: Cohort/period setup notice and link (src/components/academics/college-section-management.tsx:80-87)
- Fix: Use equivalent scoped program setup route and copy.

## G2-5-010-058  [P2] GAP  facet F14 Exports  effort M
- Legacy: Export classes.csv current filtered list ID/name/programId/batchId/min/max (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:468-476)
- vNext now: Export CSV in more class tools, 2000 cap (src/app/(authenticated)/college/classes/page.tsx:38-51)
- Fix: Exact filename/header/order and full filtered export.

## G2-5-010-063  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Field validation scrolls to first invalid control (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:50-56)
- vNext now: Single error banner, no scroll/focus (src/components/academics/college-section-management.tsx:59-65)
- Fix: Focus first invalid.

## G2-5-010-064  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Action buttons have contextual aria names and disabled tooltips (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:410-423)
- vNext now: Schedule contextual label, Edit/Archive less detail (src/components/academics/college-structure-directory.tsx:398-406)
- Fix: Restore contextual labels and guard tooltip.

## G2-5-010-068  [P2] GAP  facet F18 Wording  effort S
- Legacy: Leave every day unchecked for daily help (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:562-569)
- vNext now: Repeat on weekdays and Mon-Fri selected (src/components/academics/college-recurring-preview.tsx:186-194)
- Fix: Restore helper and default.

## G2-5-010-070  [P2] GAP  facet F19 Performance  effort S
- Legacy: Page size preference localStorage persistent (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:499-505)
- vNext now: URL pageSize without persist and default10 (src/components/academics/college-structure-directory.tsx:448-459)
- Fix: Persist exact page size options/default.

## G2-5-010-073  [P2] GAP  facet F20 Concurrency  effort S
- Legacy: Duplicate delete blocked, failed Retry button (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:287-305)
- vNext now: Archive lock only (src/components/academics/college-section-lifecycle-action.tsx:15-39)
- Fix: Add guarded delete/retry if restored.

## G2-5-010-075  [P2] GAP  facet F21 Integrations  effort M
- Legacy: Faculty/course/hall lookups have separate partial errors (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:308-330)
- vNext now: SSR choices without per-control Retry (src/components/academics/college-recurring-preview.tsx:199-215)
- Fix: Partial-load Retry per data source.

## G2-5-010-025  [P3] GAP  facet F06 Forms  effort S
- Legacy: Class/Section Name, example CSE-A or Section 1, Description optional (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:79-85)
- vNext now: Class name without example placeholder, Description optional label (src/components/academics/college-section-management.tsx:115-130)
- Fix: Use exact wording and placeholder.

## G2-5-010-038  [P3] GAP  facet F08 Success/toasts  effort S
- Legacy: Updated class “NAME”. fallback Failed to update class. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:274-285)
- vNext now: Class updated. inline notice (src/components/academics/college-section-management.tsx:175-180)
- Fix: Match toast wording and lifetime.

## G2-5-010-066  [P3] GAP  facet F18 Wording  effort S
- Legacy: Placeholder Search class, program, batch or capacity (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:469-470)
- vNext now: Search registered records (src/components/academics/college-structure-directory.tsx:51-57)
- Fix: Restore exact search placeholder.

## G2-5-010-067  [P3] GAP  facet F18 Wording  effort S
- Legacy: Create Class & Add Another exact action (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:459-462)
- vNext now: Create class (src/components/academics/college-section-management.tsx:133-137)
- Fix: Match words and action semantics.
