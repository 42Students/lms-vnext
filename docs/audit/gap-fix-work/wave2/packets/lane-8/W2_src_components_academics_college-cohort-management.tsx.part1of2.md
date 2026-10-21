# Work packet (wave 2): edit src/components/academics/college-cohort-management.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-9/college-admin-batches.md, docs/audit/gap2/lane-9/superadmin-batches-component.md, docs/audit/gap2/lane-9/superadmin-batches.md

## G2-2-029-002  [P2] GAP  facet F01  effort M
- Legacy: BatchController.java:94-103 GET `/getBranchDetailsById?batchId=` (misnamed branch).
- vNext now: src/modules/academics/cohort-service.ts:127-153 list by program; college batch row actions `college-cohort-management.tsx:159-244`.
- Fix: Expose authenticated batch detail read/route without legacy misnomer; map ID and shape.

## G2-2-029-008  [P2] GAP  facet F02  effort M
- Legacy: Batches.js:509-531 has `Batches` admin heading, Create New Batch card, and table below.
- vNext now: college-cohort-management.tsx:93-101 renders Create Batch Disclosure not same standalone card.
- Fix: Reproduce old title/card proportions, card header, inner padding and table relationship.

## G2-2-029-009  [P2] GAP  facet F02  effort M
- Legacy: Batches.js:57-111 uses vertical Ant form fields inside Create New Batch.
- vNext now: college-cohort-management.tsx:101-150 uses grid 2 columns from md breakpoint.
- Fix: Align field order, label spacing, input height and full-width/column behavior.

## G2-2-029-010  [P2] GAP  facet F02  effort M
- Legacy: Batches.js:465-509 uses Ant Table and inline edit/team/delete icon actions.
- vNext now: college-cohort-management.tsx:244-282 uses actions and Dropdown `More` mobile sheet.
- Fix: Match table action column icon, order and compact button treatment; retain touch accessibility.

## G2-2-029-014  [P2] GAP  facet F03  effort M
- Legacy: Batches.js:92-104 academic-year field has Recalculate action and start-month explanation.
- vNext now: college-cohort-management.tsx:131-133 has Academic Year text input with placeholder `2026–2027`.
- Fix: Restore computed academic-year default/recalculate affordance and original helper copy.

## G2-2-029-015  [P2] GAP  facet F03  effort M
- Legacy: Batches.js:490-503 inline Edit, Manage students, Delete actions with aria labels.
- vNext now: college-cohort-management.tsx:244-282 row actions include Edit and More lifecycle Dropdown.
- Fix: Ensure Manage students CTA and icons are present in equivalent table row.

## G2-2-029-046  [P2] GAP  facet F09  effort M
- Legacy: Batches.js:58-111 create card inline; edit modal around Batches.js edit handlers.
- vNext now: college-cohort-management.tsx:281-332 uses Dialog for edit and action menu.
- Fix: Match edit modal width, button order, close-on-success, backdrop and footer.

## G2-2-029-047  [P2] GAP  facet F09  effort S
- Legacy: Batches.js:444-459 delete confirmation guarded and toast.
- vNext now: college-cohort-management.tsx:267-279 shows `Remove planned batch` confirm dialog/More menu.
- Fix: Preserve explicit irreversible warning wording while making archive semantics transparent.

## G2-2-029-069  [P2] GAP  facet F13  effort S
- Legacy: Batches.js:510-528 warns to select a college, missing program CTA.
- vNext now: college-cohort-management.tsx:93-100 says create program/period and links Academic Setup.
- Fix: Match non-scoped warning banner and empty prerequisite link placement.

## G2-2-029-077  [P2] GAP  facet F16  effort M
- Legacy: Batches.js:465-509 full Ant Table with wrap actions.
- vNext now: college-cohort-management.tsx:244-282 moves lifecycle into mobile `More` sheet.
- Fix: Match old desktop actions, preserve touch-safe mobile sheet.

## G2-2-029-078  [P2] GAP  facet F16  effort M
- Legacy: Batches.js:58-111 fields stack vertically in card.
- vNext now: college-cohort-management.tsx:101-150 responsive 1-col mobile /2-col md.
- Fix: Match default card breakpoints and label widths in side-by-side screenshots.

## G2-2-029-080  [P2] GAP  facet F17  effort S
- Legacy: Batches.js:491-502 has accessible `Edit batch`, `Manage students`, `Delete batch` labels.
- vNext now: college-cohort-management.tsx:245-251 action row, dropdown `Batch lifecycle actions`.
- Fix: Mirror item-specific accessible action names for screen readers.

## G2-14-031-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:66-91 create,159-225 promote/preview,230-258 semester correction
- vNext now: src/components/academics/college-cohort-management.tsx:45-156 create disclosure and 159-336 row actions
- Fix: Restore legacy action grouping by batch

## G2-14-031-010  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:106-158 batch details include current semester/year
- vNext now: src/components/academics/college-cohort-management.tsx:22-35 cohort currentTermNumber, year, counts and endPeriod
- Fix: Render Current semester and academic year labels with legacy formatting

## G2-14-031-018  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BatchRequestDTO.java:25-27 year YYYY-YY max7
- vNext now: src/components/academics/college-cohort-management.tsx:131-134 placeholder 2026–2027 max16
- Fix: Apply old format or supply a canonical converter and exact copy

## G2-9-003-007  [P2] GAP  facet F03  effort M
- Legacy: Create New Batch Card title and Plus icon Create Batch (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:520-535`)
- vNext now: Create Batch Disclosure and plain primary button (`src/components/academics/college-cohort-management.tsx:93-105,148-156`)
- Fix: Match card heading/create icon and initial open state.

## G2-9-003-027  [P2] GAP  facet F06  effort M
- Legacy: Program Select showSearch; Batch Name placeholder 'e.g., 2024–2028 Batch' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:71-126`)
- vNext now: Native Select Choose program; Batch Name no placeholder (`src/components/academics/college-cohort-management.tsx:102-120`)
- Fix: Restore search-enabled program picker and exact batch-name example.

## G2-9-003-028  [P2] GAP  facet F06  effort M
- Legacy: Start Date/End Date optional date pickers (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:92-116`)
- vNext now: Native date inputs plus required start academic period (`src/components/academics/college-cohort-management.tsx:135-143`)
- Fix: Retain optional date semantics and represent start period explicitly.

## G2-9-003-041  [P2] GAP  facet F09  effort M
- Legacy: Edit batch <name> modal width520, footer Save Changes/Cancel (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:585-600`)
- vNext now: Edit Batch Dialog with inline Save changes/Cancel (`src/components/academics/college-cohort-management.tsx:281-333`)
- Fix: Match title capitalization, modal width, footer placement.

## G2-9-003-042  [P2] GAP  facet F09  effort M
- Legacy: Discard edits to <name>? nested confirm (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:415-420`)
- vNext now: Discard unsaved batch changes? generic dialog (`src/components/academics/college-cohort-management.tsx:216-220,328-333`)
- Fix: Match per-batch name and exact Discard edits label.

## G2-9-003-060  [P2] GAP  facet F13  effort M
- Legacy: No programs in this college yet with Go to Programs link (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:521-529`)
- vNext now: Create a program before adding batches, no direct programs link (`src/components/academics/college-cohort-management.tsx:93-100`)
- Fix: Restore Go to Programs affordance.

## G2-9-003-071  [P2] MISSING  facet F16  effort M
- Legacy: Student move modal width and capacity select (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:657-694`)
- vNext now: No student modal (`src/components/academics/college-cohort-management.tsx:244-268`)
- Fix: Provide mobile sheet and accessible action on narrow view.

## G2-9-003-072  [P2] GAP  facet F17  effort M
- Legacy: Edit/Students/Delete buttons each named for batch (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:490-502`)
- vNext now: Edit and More generic trigger (`src/components/academics/college-cohort-management.tsx:243-268`)
- Fix: Add batch-specific accessible button labels and Students action.

## G2-9-003-075  [P2] GAP  facet F18  effort M
- Legacy: Create New Batch and Existing Batches headings (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:513-537`)
- vNext now: Create Batch disclosure / Batch results (`src/components/academics/college-cohort-management.tsx:92-100`)
- Fix: Restore exact headings.

## G2-9-003-078  [P2] GAP  facet F18  effort M
- Legacy: Academic Year input e.g., 2024-25 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:111-130`)
- vNext now: 2026–2027 placeholder (`src/components/academics/college-cohort-management.tsx:130-134`)
- Fix: Match YYYY-YY example and length unless format intentionally extended.

## G2-9-003-079  [P2] GAP  facet F18  effort M
- Legacy: Batch was not deleted and Retry delete (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:549-552`)
- vNext now: Batch removal failed generic notice (`src/components/academics/college-cohort-management.tsx:201-214`)
- Fix: Preserve separate failure alert and Retry delete.

## G2-9-029-006  [P2] GAP  facet F02  effort S
- Legacy: Create New Batch card always open with create button `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:520-536`
- vNext now: Create Batch Disclosure closed by default `src/components/academics/college-cohort-management.tsx:93-101`
- Fix: Keep full create panel visible

## G2-9-029-008  [P2] GAP  facet F03  effort S
- Legacy: Primary Create Batch with PlusOutlined `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:532-536`
- vNext now: Create Batch button no plus icon `src/components/academics/college-cohort-management.tsx:148-152`
- Fix: Add plus icon

## G2-9-029-009  [P2] GAP  facet F03  effort M
- Legacy: Edit, Students, Delete small icon buttons per batch `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-502`
- vNext now: Manage students link + Edit + More actions dropdown `src/app/(authenticated)/admin/batches/page.tsx:90-101` `src/components/academics/college-cohort-management.tsx:244-268`
- Fix: Restore three visible row actions/icons

## G2-9-029-023  [P2] GAP  facet F06  effort S
- Legacy: Program required searchable select; Batch Name max255 placeholder e.g., 2024–2028 Batch `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:69-79`
- vNext now: Program native select Choose program; Batch Name lacks placeholder; mandatory code `src/components/academics/college-cohort-management.tsx:102-123`
- Fix: Restore searchable select and exact name placeholder

## G2-9-029-024  [P2] GAP  facet F06  effort M
- Legacy: DatePicker Start/End Date in half-width row; end disabled before start `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:81-94`
- vNext now: Native date inputs with min startDate `src/components/academics/college-cohort-management.tsx:135-141`
- Fix: Match date picker styling/calendar affordances

## G2-9-029-025  [P2] GAP  facet F06  effort S
- Legacy: Academic Year maxLength7 placeholder e.g., 2024-25 and Recalculate helper `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:95-104`
- vNext now: Input maxLength16 placeholder 2026–2027; no recalculate `src/components/academics/college-cohort-management.tsx:131-146`
- Fix: Restore 7-char canonical and helper button

## G2-9-029-027  [P2] GAP  facet F06  effort M
- Legacy: Edit Status selection ACTIVE/INACTIVE/COMPLETED `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:105-107`
- vNext now: Edit dialog has no status; lifecycle through More `src/components/academics/college-cohort-management.tsx:281-315`
- Fix: Match status edit visibility or explicitly document locked lifecycle

## G2-9-029-028  [P2] GAP  facet F06  effort S
- Legacy: Existing batch Program select disabled with explanatory helper `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:69-75`
- vNext now: Program field absent; text Program and starting period cannot change `src/components/academics/college-cohort-management.tsx:281-285`
- Fix: Show disabled Program with selected value and helper

## G2-9-029-039  [P2] GAP  facet F09  effort M
- Legacy: Edit batch NAME Ant Modal, Save Changes/Cancel with dirty edit discard `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:586-600`
- vNext now: Edit Dialog separate with equivalent dirty tracking `src/components/academics/college-cohort-management.tsx:281-319`
- Fix: Match modal title, size, field order and discard text

## G2-9-029-044  [P2] GAP  facet F10  effort M
- Legacy: POST createBatch with camelCase batchName/programId/start/end/year/status `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:390-393`
- vNext now: POST /api/college/batches program UUID, startPeriodId, code, dates/year `src/app/api/college/batches/route.ts:8-26` `src/components/academics/college-cohort-management.tsx:70-85`
- Fix: Document required start period/code and default status differences

## G2-9-029-045  [P2] GAP  facet F10  effort M
- Legacy: PUT updateBatch and DELETE deleteBatch from AdminService `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:425-428,443-459`
- vNext now: PATCH /api/college/batches/{id}, DELETE archives with CAS `src/components/academics/college-cohort-management.tsx:190-214,222-240`
- Fix: Map operations and ensure audit event/receipt

## G2-9-029-059  [P2] GAP  facet F17  effort S
- Legacy: Per-row aria-label Edit batch, Manage students in..., Move learner... `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-502,643-650`
- vNext now: Explicit actions with generic Edit, More, Manage students `src/app/(authenticated)/admin/batches/page.tsx:90-101` `src/components/academics/college-cohort-management.tsx:244-268`
- Fix: Add record-specific accessible names and focus restore

## G2-9-029-060  [P2] GAP  facet F18  effort S
- Legacy: Old subtitle and Create New Batch/Existing Batches titles `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:514-515`
- vNext now: New Batches/Manage batches/Create Batch labels `src/app/(authenticated)/admin/batches/page.tsx:39-45,84-85` `src/components/academics/college-cohort-management.tsx:93-96`
- Fix: Restore full legacy heading strings

## G2-9-023-006  [P2] GAP  facet F02  effort S
- Legacy: Create New Batch card always open with create button `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:520-536`
- vNext now: Create Batch Disclosure closed by default `src/components/academics/college-cohort-management.tsx:93-101`
- Fix: Keep full create panel visible
