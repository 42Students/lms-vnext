# Work packet: edit src/components/admin/admin-program-directory.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-2/l18-u026-new-program-controller.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-9/college-admin-programs.md

## G2-10-020-005  [P1] GAP  facet F02  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:270-323 — 24px gutter desktop left span10/right14 with simultaneous visible create/list Cards.
- vNext now: src/components/admin/admin-program-directory.tsx:139-145,193-244 — Single vertical column: create collapsed details, list section beneath.
- Fix: Clone two-column cards at >=lg with mobile stacking.

## G2-10-020-006  [P1] GAP  facet F02  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:272-289 — Create New Program Card visible unconditionally.
- vNext now: src/components/admin/admin-program-directory.tsx:141-145 — Creation collapsed when programs exist.
- Fix: Keep form expanded by default and visible beside existing table.

## G2-10-020-107  [P1] GAP  facet F23  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:267-342 — Legacy Program form beside list always visible.
- vNext now: src/components/admin/admin-program-directory.tsx:141-192 — New native details collapses after first program.
- Fix: Do not hide creation on populated page.

## G2-18-026-048  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:229-245 server paging clamps size1..100 default20
- vNext now: src/components/admin/admin-program-directory.tsx:95-102 in-memory sort/filter/paginate all selected college rows
- Fix: Add server filter/page 20 default and bounded college directory loading

## G2-18-026-057  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/NewProgramDetailsDTO.java:25-68 legacy program structure attached to each program
- vNext now: src/db/schema/academics.ts:79-115 academicPeriods college-level, cohorts program-level; src/components/admin/admin-program-directory.tsx:55-64 reports count
- Fix: Reconcile legacy program-structure semesters and their course maps to new period/cohort schema

## G2-20-029-004  [P1] GAP  facet F02  effort S
- Legacy: Create form always visible inside left Card (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:268-291`)
- vNext now: details collapsed whenever any program exists (`src/components/admin/admin-program-directory.tsx:147-151`)
- Fix: Keep form expanded by default regardless of directory length

## G2-20-029-035  [P1] GAP  facet F07  effort M
- Legacy: Create/update failure keeps closable Alert with field mapped BE validation and toast if no field error (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:125-129`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:151-159`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:273-276`)
- vNext now: Generic toast on create and mutation; no mapped inline field errors (`src/components/admin/admin-program-directory.tsx:125-139`, `src/components/academics/academics-actions.tsx:60-79`)
- Fix: Map backend field errors onto controls and display dismissible Alert

## G2-9-018-003  [P1] GAP  facet F01  effort S
- Legacy: Shared `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:23-25` determines college-admin versus superadmin links
- vNext now: `src/components/admin/admin-program-directory.tsx:146-151` hardcodes /admin/departments from college directory
- Fix: Resolve target from current college URL; college route must link to permitted department page.

## G2-9-018-033  [P1] GAP  facet F07  effort M
- Legacy: Server errors map snake_case dept_id/duration_years onto fields `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:127-134,156-164`
- vNext now: Creation catches exception as toast description `src/components/admin/admin-program-directory.tsx:130-135`
- Fix: Map backend validation errors to Department/Duration and show closeable alert.

## G2-10-020-036  [P2] GAP  facet F07  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:278-285 — Blank name yields 'Please enter program name'.
- vNext now: src/modules/academics/college-program-mutation-model.ts:3-5; src/components/admin/admin-program-directory.tsx:109-117 — Schema 'Program name is required' and generic toast.
- Fix: Show exact field-level legacy error.

## G2-10-020-040  [P2] GAP  facet F07  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:274-275 — Create failure in inline Alert 'Program was not created', dismissible.
- vNext now: src/components/admin/admin-program-directory.tsx:130-135 — Global toast 'Program creation failed'.
- Fix: Add persistent inline closable error panel.

## G2-20-029-032  [P2] GAP  facet F07  effort M
- Legacy: Empty trimmed name gives field error 'Program name cannot be empty' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:115-119`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:146-149`)
- vNext now: Invalid name gives toast 'Program name is required' via Zod (`src/components/admin/admin-program-directory.tsx:108-119`, `src/modules/academics/college-program-mutation-model.ts:3-5`)
- Fix: Render exact field error in create/edit form

## G2-20-029-033  [P2] GAP  facet F07  effort M
- Legacy: Required name says 'Please enter program name', over255 'Maximum 255 characters' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:280-284`)
- vNext now: HTML required/maxLength blocks entry; Zod different wording (`src/components/admin/admin-program-directory.tsx:162-166`, `src/modules/academics/college-program-mutation-model.ts:3-5`)
- Fix: Restore legacy field messages (required,max255)

## G2-20-029-034  [P2] GAP  facet F07  effort M
- Legacy: Missing Department says 'Please select a department' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:258-260`)
- vNext now: Native required select; Zod UUID error/toast (`src/components/admin/admin-program-directory.tsx:156-160`, `src/modules/academics/college-program-mutation-model.ts:9-14`)
- Fix: Show exact inline department required error

## G2-9-018-030  [P2] GAP  facet F07  effort S
- Legacy: Empty name Please enter program name and max255 Maximum 255 characters `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:278-280`
- vNext now: HTML required plus Zod Program name is required; max255 `src/components/admin/admin-program-directory.tsx:165-168` `src/modules/academics/college-program-mutation-model.ts:1-4`
- Fix: Use legacy exact validation text inline, not solely browser/Zod default.

## G2-9-018-031  [P2] GAP  facet F07  effort S
- Legacy: Department required Please select a department `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:257-258`
- vNext now: HTML required on native select without same field copy `src/components/admin/admin-program-directory.tsx:153-163`
- Fix: Attach identical inline required message.

## G2-9-018-032  [P2] GAP  facet F07  effort S
- Legacy: Duration error Please enter program duration `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:282-284`
- vNext now: Validation toast says Duration must be a whole number from 1 to 10 years. `src/components/admin/admin-program-directory.tsx:104-109`
- Fix: Restore field-level required message; keep numeric-range diagnosis.

## G2-9-018-034  [P2] GAP  facet F07  effort S
- Legacy: Create error alert Program was not created, closable `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:273-275`
- vNext now: Program creation failed toast, no persistent form alert `src/components/admin/admin-program-directory.tsx:130-134`
- Fix: Display persistent closeable creation error in panel.

## G2-10-020-039  [P3] GAP  facet F07  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:282-285 — Missing duration 'Please enter program duration'.
- vNext now: src/components/admin/admin-program-directory.tsx:104-117 — Invalid duration toast 'Duration must be a whole number from 1 to 10 years.'.
- Fix: Differentiate required vs range validation wording.

## G2-10-020-048  [P3] GAP  facet F08  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:250-255 — No departments notice includes exact copy.
- vNext now: src/components/admin/admin-program-directory.tsx:149-152 — Same basic instruction without Ant Alert heading.
- Fix: Use exact informational headline.
