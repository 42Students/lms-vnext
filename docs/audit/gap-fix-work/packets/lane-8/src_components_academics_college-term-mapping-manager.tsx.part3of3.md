# Work packet: edit src/components/academics/college-term-mapping-manager.tsx (part 3 of 3)

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-16/u007-college-semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-12-002-034  [P3] GAP  facet F08  effort S
- Legacy: Semester course order saved toast `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:263-277`
- vNext now: Same wording inline notice `src/components/academics/college-term-mapping-manager.tsx:108-113`
- Fix: Restore toast

## G2-16-007-027  [P3] GAP  facet F07  effort S
- Legacy: `SemesterCourseMapping.js:349-359`: field errors `Select a program`, `Select a semester`.
- vNext now: `college-term-mapping-manager.tsx:132-149`: native required controls, browser default validation bubbles.
- Fix: Show exact field-level custom Ant messages.

## G2-16-007-028  [P3] GAP  facet F07  effort S
- Legacy: `SemesterCourseMapping.js:191-193`: bad mapping/table state warns `Load the selected semester before adding courses.`; empty warns `Select at least one course.`
- vNext now: `college-term-mapping-manager.tsx:79-84`: error `Select one or more eligible courses for the semester.`
- Fix: Differentiate no selection vs loading/mapping failure and use exact legacy strings.

## G2-16-007-032  [P3] GAP  facet F08  effort S
- Legacy: `SemesterCourseMapping.js:196-200`: toast `Added N course(s) to this semester.`.
- vNext now: `college-term-mapping-manager.tsx:51-55`; `college-term-mapping-model.ts:51-53`: same success wording as inline notice.
- Fix: Use legacy toast placement/duration instead of inline paragraph for add.

## G2-16-007-033  [P3] GAP  facet F08  effort S
- Legacy: `SemesterCourseMapping.js:230-231`: edit toast `Updated mapping for “<course>”.`.
- vNext now: `college-term-mapping-manager.tsx:108-112`: generic `Semester course mapping updated.`.
- Fix: Emit course-specific edit success string.

## G2-16-007-034  [P3] GAP  facet F08  effort S
- Legacy: `SemesterCourseMapping.js:255-259`: remove toast `Removed “<course>” from this semester.`.
- vNext now: `college-term-mapping-manager.tsx:49-55`; `college-term-mapping-model.ts:53`: same text but inline notice.
- Fix: Render toast style parity.

## G2-16-007-035  [P3] GAP  facet F08  effort S
- Legacy: `SemesterCourseMapping.js:271-275`: success `Semester course order saved.`, error `Could not save order; previous order restored.`.
- vNext now: `college-term-mapping-manager.tsx:109-116`: same success string on changed order, generic `Unable to update mapping...` error.
- Fix: Restore specific reorder failure toast and rollback state.

## G2-17-002-036  [P3] GAP  facet F08  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:196-200 success toast 'Added N course(s) to this semester.' clears draft; reloads mappings.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:49-58 inline role=status uses exact src/modules/academics/college-term-mapping-model.ts:52 and clears draft, router.refresh.
- Fix: Keep wording, match legacy toast presentation/timeout and accessible announcement.

## G2-17-002-038  [P3] GAP  facet F08  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:255-258 success toast 'Removed “CourseName” from this semester.'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:49-58 and src/modules/academics/college-term-mapping-model.ts:53 preserve text, but display inline until next change.
- Fix: Match old toast timing while preserving status live region.

## G2-5-025-028  [P3] GAP  facet F08  effort S
- Legacy: Legacy course success strings add N/remove/reorder. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:363-367,409-415,447-450,598-600`
- vNext now: vNext model has mapping notices and `Semester course order saved.` `src/components/academics/college-term-mapping-manager.tsx:49-56,109-111`
- Fix: Match exact legacy per-action copy.
