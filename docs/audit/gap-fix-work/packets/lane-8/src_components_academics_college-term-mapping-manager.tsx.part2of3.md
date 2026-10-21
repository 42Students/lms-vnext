# Work packet: edit src/components/academics/college-term-mapping-manager.tsx (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md, docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-16/u007-college-semester-courses.md

## G2-17-002-041  [P1] MISSING  facet F09  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:185-187 Modal.confirm 'Switch semesters with unsaved course choices?' with selected count and 'Switch semester'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:143-146 switches semester directly.
- Fix: Restore semester-change confirmation before preserving/restoring draft.

## G2-17-002-042  [P1] MISSING  facet F09  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:250-251 dirty edit cancel opens danger confirm 'Discard mapping changes?' and 'Discard changes'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:226-227 Cancel clears editing without compare.
- Fix: Compare original vs draft credits/order and ask before discarding dirty form.

## G2-17-002-047  [P1] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:253-258 DELETE invokes docs/legacy-source/frontend/src/api/Services/SemesterService.js:31-32 by semesterId/courseId, hard delete docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:112-114.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:41-48 DELETE src/app/api/academics/semester-course-mappings/[mappingId]/route.ts:8-17 by mapping UUID with explicit confirm body and src/modules/academics/college-term-mapping-service.ts:262-272 in-use blocker.
- Fix: Explicitly describe newly blocked current-term deletions before confirm.

## G2-17-002-049  [P1] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:263-276 reorders via bulk PUT docs/legacy-source/frontend/src/api/Services/SemesterService.js:69-70 mappingIds full sequence.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:186-192 moves only one mapping with PATCH position.
- Fix: Reintroduce whole-list reorder commit after drag and rollback on error.

## G2-17-002-059  [P1] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:385-403 separately handles table refresh, reorder, stale mapping error, staffing error and 6-row first-load skeleton.
- vNext now: src/app/(authenticated)/college/semester-courses/page.tsx:11 relies on one awaited service read; src/components/academics/college-term-mapping-manager.tsx:128-175 has no independent mapping/staffing status model.
- Fix: Introduce separate lookup, mappings and staffing loading/error states with targeted retries.

## G2-17-002-081  [P1] GAP  facet F20  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:243-251 cancels dirty edit only after confirmation.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:226-227 immediate edit reset.
- Fix: Implement dirty confirmation and preserve pending values on cancel dismissal.

## G2-17-002-090  [P1] MISSING  facet F23  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:169-187 unsaved-change modals, :250-251 discard modal, :383 manual Refresh, :404 keyboard reorder help.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:133-146 changes directly, :226-227 discards, :173-255 lacks refresh/help.
- Fix: Restore missing state-protection and keyboard/refresh controls before parity sign-off.

## G2-12-002-027  [P2] GAP  facet F07  effort S
- Legacy: Form.Item required `Select a program` and `Select a semester` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:349-357`
- vNext now: Native required validation; no exact message `src/components/academics/college-term-mapping-manager.tsx:131-151`
- Fix: Use exact field errors

## G2-12-002-028  [P2] GAP  facet F07  effort S
- Legacy: Empty course selection warning `Select at least one course.` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:190-193`
- vNext now: Inline `Select one or more eligible courses for the semester.` `src/components/academics/college-term-mapping-manager.tsx:77-85`
- Fix: Match warning text/channel

## G2-12-002-030  [P2] GAP  facet F07  effort S
- Legacy: Edit Credits required `Enter credits`; edit alert `Course mapping was not updated` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:415-420`
- vNext now: Generic inline `Check mapping details.` `src/components/academics/college-term-mapping-manager.tsx:90-98`
- Fix: Restore field error and distinct alert

## G2-12-002-033  [P2] GAP  facet F08  effort S
- Legacy: Updated mapping for “course” toast `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:221-231`
- vNext now: `Semester course mapping updated.` inline notice `src/components/academics/college-term-mapping-manager.tsx:108-113`
- Fix: Restore course-specific success message

## G2-16-007-029  [P2] GAP  facet F07  effort M
- Legacy: `SemesterCourseMapping.js:202-208`: maps backend field keys semester_id, course_ids, program_id into Ant validation.
- vNext now: `college-term-mapping-manager.tsx:59-62`; `college-term-mapping-model.ts:31-40`: error code into generic top paragraph; no per-field mapping.
- Fix: Map server field violations back to Program, Semester and Courses controls.

## G2-16-007-031  [P2] GAP  facet F07  effort M
- Legacy: `SemesterCourseMapping.js:415-419`: edit failure alert `Course mapping was not updated`, field errors `Enter credits`.
- vNext now: `college-term-mapping-manager.tsx:90-120,256-269`: generic inline `Unable to update mapping. Refresh and try again.`.
- Fix: Add field-level edit failures and exact modal alert.

## G2-17-002-031  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:349-356 has specific Program/Semester field messages.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:132-149 uses native required selectors without those messages.
- Fix: Render field-level 'Select a program' and 'Select a semester'.

## G2-17-002-032  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:190-192 distinguishes mapping not loaded vs empty courseIds with warnings.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:79-85 uses one 'Select one or more eligible courses for the semester.' error.
- Fix: Expose separate mappings-unavailable and no-course warnings with verbatim text.

## G2-17-002-034  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:225-241 handles missing mapping ID specifically and credits/mandatory/order field errors.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:92-100 checks Zod first issue and shows one inline error, no corresponding isMandatory field.
- Fix: Distinguish missing ID and field-specific edit failures.

## G2-17-002-035  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:205-207 'Failed to add courses to this semester.' fallback.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:59-62 'Unable to change mapping. Refresh and try again.'.
- Fix: Use operation-specific add fallback wording.

## G2-17-002-037  [P2] GAP  facet F08  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:228-231 toast 'Updated mapping for “CourseName”.'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:108-112 inline 'Semester course mapping updated.' or 'Semester course order saved.'.
- Fix: Preserve edited course name and edit-specific success copy.

## G2-17-002-039  [P2] GAP  facet F08  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:270-276 reorder toast 'Semester course order saved.' / fallback 'Could not save order; previous order restored.'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:108-116 reorder notice inline or generic failed PATCH 'Unable to update mapping. Refresh and try again.'.
- Fix: Show reorder-specific result and rollback text.

## G2-12-002-031  [P3] GAP  facet F08  effort S
- Legacy: Added N course(s) toast `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:195-200`
- vNext now: Same words inline status notice `src/components/academics/college-term-mapping-manager.tsx:49-58`
- Fix: Restore toast duration and location
