# Work packet (wave 2): edit src/components/academics/college-cohort-management.tsx (part 2 of 2)

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-batches.md, docs/audit/gap2/lane-2/batch-controller.md

## G2-9-023-008  [P2] GAP  facet F03  effort S
- Legacy: Primary Create Batch with PlusOutlined `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:532-536`
- vNext now: Create Batch button no plus icon `src/components/academics/college-cohort-management.tsx:148-152`
- Fix: Add plus icon

## G2-9-023-009  [P2] GAP  facet F03  effort M
- Legacy: Edit, Students, Delete small icon buttons per batch `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-502`
- vNext now: Manage students link + Edit + More actions dropdown `src/app/(authenticated)/admin/batches/page.tsx:90-101` `src/components/academics/college-cohort-management.tsx:244-268`
- Fix: Restore three visible row actions/icons

## G2-9-023-023  [P2] GAP  facet F06  effort S
- Legacy: Program required searchable select; Batch Name max255 placeholder e.g., 2024–2028 Batch `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:69-79`
- vNext now: Program native select Choose program; Batch Name lacks placeholder; mandatory code `src/components/academics/college-cohort-management.tsx:102-123`
- Fix: Restore searchable select and exact name placeholder

## G2-9-023-024  [P2] GAP  facet F06  effort M
- Legacy: DatePicker Start/End Date in half-width row; end disabled before start `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:81-94`
- vNext now: Native date inputs with min startDate `src/components/academics/college-cohort-management.tsx:135-141`
- Fix: Match date picker styling/calendar affordances

## G2-9-023-025  [P2] GAP  facet F06  effort S
- Legacy: Academic Year maxLength7 placeholder e.g., 2024-25 and Recalculate helper `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:95-104`
- vNext now: Input maxLength16 placeholder 2026–2027; no recalculate `src/components/academics/college-cohort-management.tsx:131-146`
- Fix: Restore 7-char canonical and helper button

## G2-9-023-027  [P2] GAP  facet F06  effort M
- Legacy: Edit Status selection ACTIVE/INACTIVE/COMPLETED `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:105-107`
- vNext now: Edit dialog has no status; lifecycle through More `src/components/academics/college-cohort-management.tsx:281-315`
- Fix: Match status edit visibility or explicitly document locked lifecycle

## G2-9-023-028  [P2] GAP  facet F06  effort S
- Legacy: Existing batch Program select disabled with explanatory helper `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:69-75`
- vNext now: Program field absent; text Program and starting period cannot change `src/components/academics/college-cohort-management.tsx:281-285`
- Fix: Show disabled Program with selected value and helper

## G2-9-023-039  [P2] GAP  facet F09  effort M
- Legacy: Edit batch NAME Ant Modal, Save Changes/Cancel with dirty edit discard `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:586-600`
- vNext now: Edit Dialog separate with equivalent dirty tracking `src/components/academics/college-cohort-management.tsx:281-319`
- Fix: Match modal title, size, field order and discard text

## G2-9-023-044  [P2] GAP  facet F10  effort M
- Legacy: POST createBatch with camelCase batchName/programId/start/end/year/status `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:390-393`
- vNext now: POST /api/college/batches program UUID, startPeriodId, code, dates/year `src/app/api/college/batches/route.ts:8-26` `src/components/academics/college-cohort-management.tsx:70-85`
- Fix: Document required start period/code and default status differences

## G2-9-023-045  [P2] GAP  facet F10  effort M
- Legacy: PUT updateBatch and DELETE deleteBatch from AdminService `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:425-428,443-459`
- vNext now: PATCH /api/college/batches/{id}, DELETE archives with CAS `src/components/academics/college-cohort-management.tsx:190-214,222-240`
- Fix: Map operations and ensure audit event/receipt

## G2-9-023-059  [P2] GAP  facet F17  effort S
- Legacy: Per-row aria-label Edit batch, Manage students in..., Move learner... `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:491-502,643-650`
- vNext now: Explicit actions with generic Edit, More, Manage students `src/app/(authenticated)/admin/batches/page.tsx:90-101` `src/components/academics/college-cohort-management.tsx:244-268`
- Fix: Add record-specific accessible names and focus restore

## G2-9-023-060  [P2] GAP  facet F18  effort S
- Legacy: Old subtitle and Create New Batch/Existing Batches titles `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:514-515`
- vNext now: New Batches/Manage batches/Create Batch labels `src/app/(authenticated)/admin/batches/page.tsx:39-45,84-85` `src/components/academics/college-cohort-management.tsx:93-96`
- Fix: Restore full legacy heading strings

## G2-2-029-012  [P3] GAP  facet F03  effort S
- Legacy: Batches.js:77-79 `Batch Name` with placeholder `e.g., 2024–2028 Batch`.
- vNext now: college-cohort-management.tsx:116-118 `Batch Name` Input with no placeholder.
- Fix: Restore exact example placeholder and max length field behavior.

## G2-2-029-013  [P3] GAP  facet F03  effort S
- Legacy: Batches.js:58-70 Program field with edit-time explanatory message.
- vNext now: college-cohort-management.tsx:285-286 explains immutable program/starting period inside edit dialog.
- Fix: Match old field tooltip/help placement and copy exactly.

## G2-2-029-029  [P3] GAP  facet F06  effort S
- Legacy: Batches.js:77-79 placeholder `e.g., 2024–2028 Batch`.
- vNext now: college-cohort-management.tsx:116-118 no placeholder.
- Fix: Set legacy placeholder and preserve required attribute.

## G2-2-029-083  [P3] GAP  facet F18  effort S
- Legacy: Batches.js:520 `Create New Batch`.
- vNext now: college-cohort-management.tsx:93 calls `Create Batch`.
- Fix: Use exact card section title if matching legacy screen.

## G2-2-029-084  [P3] GAP  facet F18  effort S
- Legacy: Batches.js:77-79 placeholder `e.g., 2024–2028 Batch`.
- vNext now: college-cohort-management.tsx:116-118 no placeholder.
- Fix: Restore literal example.

## G2-2-029-085  [P3] GAP  facet F18  effort S
- Legacy: Batches.js:96-104 `Recalculate` academic-year link.
- vNext now: college-cohort-management.tsx:131-133 placeholder `2026–2027`, no recalculate.
- Fix: Restore control/copy.
