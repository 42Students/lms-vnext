# Work packet (wave 2): edit src/components/academics/college-section-management.tsx

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-5/u003-college-admin-classes.md, docs/audit/gap2/lane-5/u008-superadmin-classes.md, docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-2-031-008  [P2] GAP  facet F02  effort M
- Legacy: Classes.js:58-104 exposes Program/Batch/Class/Description/Min-Max in traditional Ant fields.
- vNext now: src/components/academics/college-section-management.tsx:80-135 exposes Program/Batch/academicPeriod/name/code/capacity/description in grid.
- Fix: Map field order and extra period/code labels to old form density; preserve genuine new fields.

## G2-2-031-011  [P2] GAP  facet F03  effort M
- Legacy: Classes.js:65-74 Program then Batch selects with option-loading placeholder.
- vNext now: college-section-management.tsx:90-111 adds academic period selector between batch and name.
- Fix: Match legacy select style, status and error messages; explain academic-period requirement.

## G2-2-031-041  [P2] GAP  facet F09  effort M
- Legacy: Classes.js:136-143 edits via Ant Modal and recurring drawer.
- vNext now: college-section-management.tsx:191-233 has Dialog with unsaved-change confirm; recurring-preview link page :44-46.
- Fix: Match old edit modal width/footer/focus and recurring drawer UI.

## G2-2-031-043  [P2] GAP  facet F09  effort M
- Legacy: Classes.js:60-100 inline Create class card; edit modal uses same fields.
- vNext now: college-section-management.tsx:78-139 create Disclosure and :191-224 edit Dialog.
- Fix: Align duplicate shared form field ordering and modal geometry.

## G2-2-031-066  [P2] GAP  facet F16  effort M
- Legacy: Classes.js:58-104 Ant form stacked single-column.
- vNext now: college-section-management.tsx:101-134 grid responsive with md columns.
- Fix: Match old form field widths and responsive breakpoint while keeping accessibility.

## G2-5-003-029  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Required name invalid 'Enter the class or section name', max255 'Maximum 255 characters'. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:79-84)
- vNext now: Zod min1 max255 but first-issue generic notice; not same specific messages. (src/modules/academics/college-section-mutation-model.ts:4-9; src/components/academics/college-section-management.tsx:115-118)
- Fix: Use exact legacy field-level error and focus first invalid.

## G2-5-003-030  [P2] GAP  facet F07 Validation/errors  effort M
- Legacy: Missing Program 'Select a program'; Batch 'Select a batch'. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:63-76)
- vNext now: Native required selects and generic Zod first issue shown in status paragraph. (src/components/academics/college-section-management.tsx:59-65; src/components/academics/college-section-management.tsx:89-104)
- Fix: Show per-field validation messages and focus invalid selector.

## G2-5-003-031  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Capacity errors exact 'Maximum must be a whole number from 1 to 200', 'Maximum cannot be less than minimum'. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:93-100)
- vNext now: Zod capacity error 'Capacity must be between 1 and 200.' and basic browser number constraints. (src/modules/academics/college-section-mutation-model.ts:7-8; src/components/academics/college-section-management.tsx:123-126)
- Fix: Match exact legacy range/cross-field messages and 1-200 rule.

## G2-5-003-032  [P2] GAP  facet F07 Validation/errors  effort M
- Legacy: Server field errors mapped to AntD fields for create/edit. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:242-247; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:278-284)
- vNext now: Single notice string for first issue or mapped API error, no per-control server field errors. (src/components/academics/college-section-management.tsx:60-74; src/components/academics/college-section-management.tsx:168-181)
- Fix: Display server errors next to matching form item and preserve focus.

## G2-5-003-034  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: On create toast 'Created class “NAME”. Next, register or move students into this section.'; error 'Failed to create class.' (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:235-249)
- vNext now: Inline 'Class created.' or 'Class creation failed.' no named toast. (src/components/academics/college-section-management.tsx:68-74; src/components/academics/college-section-management.tsx:139)
- Fix: Restore transient named success/error toast copy.

## G2-5-003-062  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Validation failures scroll to and focus first invalid field. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:50-56; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:455-458)
- vNext now: First Zod error renders notice but does not focus invalid control. (src/components/academics/college-section-management.tsx:59-65; src/components/academics/college-section-management.tsx:139)
- Fix: Focus/scroll failing control with live error association.

## G2-5-003-063  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Edit/Schedule/Delete have contextual aria-label including section name; disabled Delete has tooltip. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:410-423)
- vNext now: Schedule has contextual aria-label; Edit and Archive buttons generic. (src/components/academics/college-structure-directory.tsx:398-406; src/components/academics/college-section-management.tsx:185-190; src/components/academics/college-section-lifecycle-action.tsx:42-46)
- Fix: Add contextual Edit/Archive labels, disabled reason tooltip.

## G2-5-003-064  [P2] GAP  facet F18 Wording  effort S
- Legacy: Classes & Sections; Create New Class/Section; Existing Classes/Sections. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:442-448)
- vNext now: Classes; Create class; Filters. (src/components/academics/college-structure-directory.tsx:38-51; src/components/academics/college-section-management.tsx:78-79)
- Fix: Restore exact titles and heading hierarchy.

## G2-5-003-072  [P2] GAP  facet F20 Concurrency  effort M
- Legacy: Dirty edit/schedule cancel require confirmation; busy recurring cannot close. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:263-266; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:369-383)
- vNext now: Edit dirty guard exists; recurring is separate page, preview may be lost on navigation. (src/components/academics/college-section-management.tsx:159-162; src/components/academics/college-section-management.tsx:229-233; src/components/academics/college-recurring-preview.tsx:94-130)
- Fix: Guard navigation away from dirty recurring pattern with explicit dialog.

## G2-5-008-008  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Edit modal overlays directory while retaining side-by-side create (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:513-525)
- vNext now: Create disclosure and separate Edit dialog from row (src/app/(authenticated)/admin/classes/page.tsx:38-108; src/components/academics/college-section-management.tsx:191-234)
- Fix: Match edit modal width and relationship to dual pane.

## G2-5-008-032  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Class name required Enter the class or section name, max255 (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:79-84)
- vNext now: Zod min1/max255, generic error banner (src/modules/academics/college-section-mutation-model.ts:4-9; src/components/academics/college-section-management.tsx:115-118)
- Fix: Use exact field-level validation messages.

## G2-5-008-063  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Validation scrolls to first invalid field (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:50-56)
- vNext now: Error summary only, no autofocus (src/components/academics/college-section-management.tsx:59-65; src/components/academics/college-section-management.tsx:139)
- Fix: Scroll/focus invalid field.

## G2-5-010-001  [P2] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: Reusable Classes screen sits in admin academic workspace (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:440-465)
- vNext now: vNext College classes standalone page with separated create and directory (src/app/(authenticated)/college/classes/page.tsx:18-35; src/components/academics/college-section-management.tsx:78-88)
- Fix: Match module-in-old-LMS shell and academic grouping.

## G2-5-010-032  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Name required message Enter the class or section name; max255 (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:79-84)
- vNext now: Zod generic first issue shown in notice (src/modules/academics/college-section-mutation-model.ts:4-9; src/components/academics/college-section-management.tsx:59-65)
- Fix: Show exact field-level messages and focus invalid.

## G2-5-010-033  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Program/Batch required respective Select program/Select batch (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:63-76)
- vNext now: Native required and single notice (src/components/academics/college-section-management.tsx:59-65; src/components/academics/college-section-management.tsx:89-104)
- Fix: Use individual field errors.

## G2-2-031-012  [P3] GAP  facet F03  effort S
- Legacy: Classes.js:80-83 name field `Class Name` example `e.g., CSE-A or Section 1`.
- vNext now: college-section-management.tsx:115-119 name input no example placeholder shown.
- Fix: Restore exact example and label if legacy clone required.

## G2-2-031-014  [P3] GAP  facet F03  effort S
- Legacy: Classes.js:85-100 uses maximum class size field 1..200 with lowerLimit hidden.
- vNext now: college-section-management.tsx:124-125 capacity defaults 60, bounded 1..200.
- Fix: Use `Maximum students` presentation and optionally show 60 default difference explicitly.

## G2-2-031-071  [P3] GAP  facet F18  effort S
- Legacy: Classes.js:80-83 placeholder `e.g., CSE-A or Section 1`.
- vNext now: college-section-management.tsx:115-119 no placeholder.
- Fix: Restore exact example and terminology.

## G2-2-031-074  [P3] GAP  facet F18  effort S
- Legacy: Classes.js:109-160 title `Classes` plus Create class card.
- vNext now: college-section-management.tsx:78 uses `Create class`, PageHeader title Classes :26.
- Fix: Align exact capitalization and subtitle copy.

## G2-5-003-066  [P3] GAP  facet F18 Wording  effort S
- Legacy: Create Class & Add Another and Save Changes. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:459-462; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:513-525)
- vNext now: Create class, Save changes. (src/components/academics/college-section-management.tsx:133-137; src/components/academics/college-section-management.tsx:217-225)
- Fix: Match capitalization/action descriptions.
