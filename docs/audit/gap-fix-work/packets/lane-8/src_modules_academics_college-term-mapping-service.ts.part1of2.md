# Work packet: edit src/modules/academics/college-term-mapping-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-16/u007-college-semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-12-018-027  [P1] GAP  facet F10  effort L
- Legacy: POST/create PUT/update DELETE/delete and GET/fetchAllSemesters+fetchActiveSemesters; PUT/updateStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:66-146`
- vNext now: New term mutation service create/update/delete and separate mapping functions `src/modules/academics/semester-mutation-service.ts:106-232` `src/modules/academics/college-term-mapping-service.ts:60-95`
- Fix: Expose full structure management actions and route compatibility.

## G2-12-002-016  [P1] GAP  facet F04  effort S
- Legacy: Program-class staffing warning/tooltip based on unassigned classes `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:494-532`
- vNext now: Active delivery-based staffing metric; courses without deliveries marked unstaffed `src/modules/academics/college-term-mapping-service.ts:97-133`
- Fix: Verify cohort/class universe equivalence and warning threshold

## G2-12-002-045  [P1] GAP  facet F10  effort M
- Legacy: Specific admin audit SEMESTER_COURSE_ADD/REMOVE/UPDATE/REORDER `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:408-410,444-446,595-600,629-633`
- vNext now: Generic ACADEMICS_SEMESTER_UPDATED event `src/modules/academics/college-term-mapping-service.ts:155-166`
- Fix: Emit action-specific audit events and metadata

## G2-12-002-048  [P1] GAP  facet F12  effort S
- Legacy: Duplicate bulk course is skipped silently, preserving others `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-107`
- vNext now: Duplicates rejected with TERM_COURSE_DUPLICATE `src/modules/academics/college-term-mapping-service.ts:149-154`
- Fix: Define idempotent bulk add behavior

## G2-12-002-067  [P1] GAP  facet F19  effort M
- Legacy: Legacy loads mappings+staffing only selected semester `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:99-139`
- vNext now: VNext loads entire college terms/mappings+staffing upfront `src/modules/academics/college-term-mapping-service.ts:60-135`
- Fix: Filter/paginate heavy reads per semester

## G2-16-007-030  [P1] GAP  facet F07  effort M
- Legacy: `SemesterCourseMapping.js:387-393`: mapping fetch error preserves stale rows for same semester; staffing failure separate with retry.
- vNext now: `college-term-mapping-service.ts:60-134`: Promise.all read; mapping/staffing query failure throws whole render; no split warning.
- Fix: Separate staffing read from mapping, show stale data with nonblocking staffing warning and retry.

## G2-16-007-044  [P1] GAP  facet F11  effort S
- Legacy: `semester-courses.js:11-18`: college determined from signed-in loginUser.collegeId; no college gives warning.
- vNext now: `college/semester-courses/page.tsx:9-11`; `college-term-mapping-service.ts:60-62`: server context.membership college; redirects if absent.
- Fix: Distinguish authenticated unassigned admin from session invalid and show legacy warning.

## G2-16-007-075  [P1] GAP  facet F21  effort M
- Legacy: `SemesterCourseMapping.js:129-138`: staffing API is distinct dependency; failure warning doesn't block mapping.
- vNext now: `college-term-mapping-service.ts:97-134`: staffing query integrated, any failure blocks list.
- Fix: Catch staffing-only errors independently; return warnings unavailable marker.

## G2-16-007-076  [P1] GAP  facet F22  effort L
- Legacy: `SemesterCourseMapping.js:218-229`: mapping stores course ID, credits, legacy is_mandatory and course_order.
- vNext now: `college-term-mapping-service.ts:155-165`; `college-term-mapping-model.ts:3-12`: programTermCourse stores type, credits, displayOrder.
- Fix: Decide is_mandatory→type migration explicitly, and ensure original electives flag does not silently default to CORE.

## G2-17-002-014  [P1] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:280-281 missing course name shows 'Course name unavailable (ID X)'.
- vNext now: src/modules/academics/college-term-mapping-service.ts:78-95 uses inner join to courses, hiding orphaned mapping rather than showing explicit fallback.
- Fix: Surface orphaned mappings and show missing course title diagnostics, not silently skip rows.

## G2-17-002-047  [P1] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:253-258 DELETE invokes docs/legacy-source/frontend/src/api/Services/SemesterService.js:31-32 by semesterId/courseId, hard delete docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:112-114.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:41-48 DELETE src/app/api/academics/semester-course-mappings/[mappingId]/route.ts:8-17 by mapping UUID with explicit confirm body and src/modules/academics/college-term-mapping-service.ts:262-272 in-use blocker.
- Fix: Explicitly describe newly blocked current-term deletions before confirm.

## G2-17-002-054  [P1] GAP  facet F12  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-107 bulk skips duplicates and invalid IDs, returns successfully added subset.
- vNext now: src/modules/academics/college-term-mapping-service.ts:288-330 rejects any duplicate/existing ID, whole transaction rolls back, max 100.
- Fix: Present explicit full rollback and duplicate list; decide whether to restore legacy partial success.

## G2-17-002-058  [P1] GAP  facet F12  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:494-531 staffing counts all program classes against active teaching assignments.
- vNext now: src/modules/academics/college-term-mapping-service.ts:99-132 covers only live deliveries for active academic periods.
- Fix: Offer all-program-classes coverage or explicitly relabel current-term-only staffing.

## G2-17-002-063  [P1] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:391-393 staffing fail shows warning 'Faculty staffing warnings unavailable', retains mappings and Retry.
- vNext now: src/modules/academics/college-term-mapping-service.ts:99-134 awaits staffing DB query inside listCollegeTermMappings; failure rejects whole page.
- Fix: Isolate staffing read failure, preserve curriculum table with explicit warning.

## G2-17-002-077  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:63-139 scopes incremental GET to selected program/semester; concurrent distinct lookups.
- vNext now: src/modules/academics/college-term-mapping-service.ts:60-134 loads *all* terms, active courses, mapping rows and staffing counts for entire college on every page load.
- Fix: Add indexed selected-term reads/pagination or profile and bound initial data at large college scale.

## G2-17-002-082  [P1] GAP  facet F20  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-107 partial-safe duplicate skips under concurrent inserts, unique DB constraint.
- vNext now: src/modules/academics/college-term-mapping-service.ts:288-330 rejects whole bulk transaction for duplicate and maps as generic error.
- Fix: Show precisely which course conflicted and safe retry actions; decide all-or-nothing contract.

## G2-5-025-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy staffing result per mapping includes courseId, totalClasses, unstaffedClassCount, unstaffedClasses, fullyUnstaffed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:523-531`
- vNext now: vNext returns staffingWarning/Tooltip derived from active deliveries. `src/modules/academics/college-term-mapping-service.ts:97-132`
- Fix: Restore per-class counts and fullyUnstaffed boolean in report view.

## G2-5-025-019  [P1] GAP  facet F06  effort M
- Legacy: Legacy mapping add allows optional credits/isMandatory/courseOrder; defaults 3,true,max+1. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:33-65`
- vNext now: vNext add requires credits 1..10 and type, display order assigned automatically. `src/modules/academics/college-term-mapping-model.ts:3-11`, `src/modules/academics/college-term-mapping-service.ts:138-158`
- Fix: Preserve optional defaults and consider 0/11..30 existing credits.

## G2-5-025-037  [P1] GAP  facet F10  effort M
- Legacy: Legacy staffing computes missing teaching assignments per program class even without active deliveries. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:484-539`
- vNext now: vNext computes warnings only from active offering deliveries/assignments. `src/modules/academics/college-term-mapping-service.ts:97-132`
- Fix: Offer canonical program-class staffing parity report separate from delivery warnings.

## G2-5-025-061  [P1] GAP  facet F21  effort M
- Legacy: Legacy staffing depends on ClassRepository and FacultyTeachingAssignmentRepository. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:484-539`
- vNext now: vNext staffing uses live offerings/deliveries/teaching assignments. `src/modules/academics/college-term-mapping-service.ts:97-121`
- Fix: Trace both data sources and assess historical/nonoffered classes.
