# Work packet: edit src/modules/academics/college-term-mapping-model.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-16/u007-college-semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-12-002-049  [P1] GAP  facet F12  effort S
- Legacy: Backend credits allow 0..30, UI edit 1..10 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:129-144`
- vNext now: Zod credits 1..10 despite DB 0..30 `src/modules/academics/college-term-mapping-model.ts:3-12`
- Fix: Align legacy accepted credits

## G2-16-007-046  [P1] GAP  facet F12  effort L
- Legacy: `SemesterCourseMapping.js:218-229`: edit credits (default 3), hidden isMandatory switch, courseOrder.
- vNext now: `college-term-mapping-manager.tsx:205-221`; `college-term-mapping-model.ts:9-12`: credits and position only; isMandatory omitted.
- Fix: Determine required legacy isMandatory storage parity; if preserved, migrate/read-write field even if hidden.

## G2-16-007-076  [P1] GAP  facet F22  effort L
- Legacy: `SemesterCourseMapping.js:218-229`: mapping stores course ID, credits, legacy is_mandatory and course_order.
- vNext now: `college-term-mapping-service.ts:155-165`; `college-term-mapping-model.ts:3-12`: programTermCourse stores type, credits, displayOrder.
- Fix: Decide is_mandatory→type migration explicitly, and ensure original electives flag does not silently default to CORE.

## G2-17-002-029  [P1] MISSING  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:421 hidden isMandatory Switch preserved on edit payload at :228-229.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:204-230 exposes credits/position only, src/modules/academics/college-term-mapping-model.ts:9-12 rejects isMandatory entirely.
- Fix: Decide and document mandatory-to-type migration; provide equivalent edit action if parity required.

## G2-17-002-056  [P1] GAP  facet F12  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-42,134-138 backend accepts credit 0..30, while docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:418-420 UI edits 1..10.
- vNext now: src/modules/academics/college-term-mapping-model.ts:3-11 service writes 1..10, src/db/schema/academic-terms.ts:37 allows null or 0..30.
- Fix: Reconcile API/UI/DB limits and historical 0/>10 credits.

## G2-17-002-086  [P1] GAP  facet F22  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-42 permits credits 0-30, entity credits defaults3.
- vNext now: src/db/schema/academic-terms.ts:37 and drizzle/0050_db02_program_terms_curriculum.sql:31-34 permit null or 0-30, src/modules/academics/college-term-mapping-model.ts:3-11 writes 1-10.
- Fix: Align DB/API limits or explain historical read-only out-of-range values.

## G2-5-025-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy mapping fields semester_id, course_id, is_mandatory, credits, course_order, course_ids. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/SemesterCourseDTO.java:12-26`
- vNext now: vNext UUID term mapping, type CORE/ELECTIVE, credits, displayOrder, position. `src/modules/academics/college-term-mapping-model.ts:3-11`, `src/db/schema/academic-terms.ts:25-39`
- Fix: Bridge isMandatory↔type and courseOrder↔displayOrder, retain defaults.

## G2-5-025-019  [P1] GAP  facet F06  effort M
- Legacy: Legacy mapping add allows optional credits/isMandatory/courseOrder; defaults 3,true,max+1. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:33-65`
- vNext now: vNext add requires credits 1..10 and type, display order assigned automatically. `src/modules/academics/college-term-mapping-model.ts:3-11`, `src/modules/academics/college-term-mapping-service.ts:138-158`
- Fix: Preserve optional defaults and consider 0/11..30 existing credits.

## G2-5-025-043  [P1] GAP  facet F12  effort M
- Legacy: Legacy 0 credits permitted, course order >=1. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-44`
- vNext now: vNext schema UI min credits 1 though database permits 0..30. `src/modules/academics/college-term-mapping-model.ts:3-11`, `src/db/schema/academic-terms.ts:25-39`
- Fix: Align UI/service constraint to data contract or migrate invalid existing rows.

## G2-16-007-029  [P2] GAP  facet F07  effort M
- Legacy: `SemesterCourseMapping.js:202-208`: maps backend field keys semester_id, course_ids, program_id into Ant validation.
- vNext now: `college-term-mapping-manager.tsx:59-62`; `college-term-mapping-model.ts:31-40`: error code into generic top paragraph; no per-field mapping.
- Fix: Map server field violations back to Program, Semester and Courses controls.

## G2-5-025-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy credits 0..30, courseOrder>=1, checks course exists. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-48`
- vNext now: vNext credits 1..10, course must be ACTIVE and belong to acting college. `src/modules/academics/college-term-mapping-model.ts:3-11`, `src/modules/academics/college-term-mapping-service.ts:143-148`
- Fix: Document deliberate stricter credit range; flag old 0,>10 mappings.

## G2-5-025-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy empty mappingIds gives `mappingIds is required`; missing/foreign gives 400/403. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:566-585`
- vNext now: vNext position invalid leads TERM_COURSE_POSITION_INVALID, no list payload. `src/modules/academics/college-term-mapping-model.ts:15-21`, `src/modules/academics/college-term-mapping-service.ts:176-207`
- Fix: Expose expected full-list reorder errors/validation UI.

## G2-12-002-032  [P3] GAP  facet F08  effort S
- Legacy: Removed “course” toast `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:253-259`
- vNext now: Same words inline status notice `src/modules/academics/college-term-mapping-model.ts:51-54`
- Fix: Restore toast

## G2-16-007-032  [P3] GAP  facet F08  effort S
- Legacy: `SemesterCourseMapping.js:196-200`: toast `Added N course(s) to this semester.`.
- vNext now: `college-term-mapping-manager.tsx:51-55`; `college-term-mapping-model.ts:51-53`: same success wording as inline notice.
- Fix: Use legacy toast placement/duration instead of inline paragraph for add.

## G2-16-007-034  [P3] GAP  facet F08  effort S
- Legacy: `SemesterCourseMapping.js:255-259`: remove toast `Removed “<course>” from this semester.`.
- vNext now: `college-term-mapping-manager.tsx:49-55`; `college-term-mapping-model.ts:53`: same text but inline notice.
- Fix: Render toast style parity.

## G2-17-002-036  [P3] GAP  facet F08  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:196-200 success toast 'Added N course(s) to this semester.' clears draft; reloads mappings.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:49-58 inline role=status uses exact src/modules/academics/college-term-mapping-model.ts:52 and clears draft, router.refresh.
- Fix: Keep wording, match legacy toast presentation/timeout and accessible announcement.

## G2-17-002-038  [P3] GAP  facet F08  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:255-258 success toast 'Removed “CourseName” from this semester.'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:49-58 and src/modules/academics/college-term-mapping-model.ts:53 preserve text, but display inline until next change.
- Fix: Match old toast timing while preserving status live region.
