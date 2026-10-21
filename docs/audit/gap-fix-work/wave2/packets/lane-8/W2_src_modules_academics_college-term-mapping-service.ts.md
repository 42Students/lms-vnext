# Work packet (wave 2): edit src/modules/academics/college-term-mapping-service.ts

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/new-program-structure.md, docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-16/u007-college-semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-12-018-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy program details nests structures with course list `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:223-273`
- vNext now: New semester list and mappings separately queried `src/modules/academics/college-academic-directory-service.ts:53-105` `src/modules/academics/college-term-mapping-service.ts:60-95`
- Fix: Return combined program structure list and mapped course summaries.

## G2-12-018-013  [P2] GAP  facet F05  effort S
- Legacy: Legacy repository findByProgramId returns unsorted list (no OrderBy) `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramStructureRepository.java:9-12`
- vNext now: New maps sorted by program name/termNumber and displayOrder `src/modules/academics/college-term-mapping-service.ts:60-95`
- Fix: Decide stable legacy data order, avoid arbitrarily assigning term numbers from list index.

## G2-12-018-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy update courseIds replaces whole list in one call `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:55-58`
- vNext now: New maps courses via independent add/remove/reorder service `src/modules/academics/college-term-mapping-service.ts:137-169,176-236`
- Fix: Provide atomic whole-list replace or form UX matching legacy curriculum.

## G2-12-018-028  [P2] GAP  facet F10  effort M
- Legacy: Old GET program details includes structure course infos and dates/status `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:209-274`
- vNext now: New listCollegeTermMappings returns terms and mapped courses separately, lacks dates/completed `src/modules/academics/college-term-mapping-service.ts:60-95`
- Fix: Assemble enriched details payload with dates and terminal status.

## G2-12-018-049  [P2] GAP  facet F20  effort M
- Legacy: Legacy create stores empty list when missing; update retains old list if absent `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:23-31,44-58`
- vNext now: New course mappings mutated independently and must be reconciled after create/update `src/modules/academics/college-term-mapping-service.ts:137-169,176-236`
- Fix: Provide atomic replace operation if old clients submit courseIds array.

## G2-12-002-040  [P2] GAP  facet F10  effort S
- Legacy: GET college programs/courses, semesters, selected mappings, staffing separately `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:63-139`
- vNext now: Server joins whole selected college terms/courses/mappings/staffing `src/modules/academics/college-term-mapping-service.ts:60-135`
- Fix: Provide granular retry/state on failed load

## G2-12-002-071  [P2] GAP  facet F20  effort S
- Legacy: Legacy bulk skips concurrent duplicate unique conflicts `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:90-104`
- vNext now: VNext insert guarded by unique constraint and transaction `src/modules/academics/college-term-mapping-service.ts:137-169`
- Fix: Handle retry/duplicate collision idempotently

## G2-16-007-017  [P2] GAP  facet F05  effort M
- Legacy: `SemesterCourseMapping.js:349-359`: form Program list all college programs; Semester list fetched per selected program.
- vNext now: `college-term-mapping-service.ts:63-72`: preloads active/inactive program terms from college; manager filters isActive.
- Fix: Match whether inactive historical terms remain selectable; document excluded scope deliberately.

## G2-16-007-040  [P2] GAP  facet F10  effort L
- Legacy: `SemesterService.js:14-18,25-45,69-70`: API GET programs/semesters/mapping/staffing; PUT update/reorder; POST bulk add; DELETE unmap.
- vNext now: `college-term-mapping-manager.tsx:42-48,103-107`; `college-term-mapping-service.ts:60-135,137-331`: Next route CRUD and DB reads, comparable semantics.
- Fix: Audit response shapes/selected semester failure independently; keep transaction semantics.

## G2-16-007-043  [P2] GAP  facet F10  effort M
- Legacy: `SemesterService.js:41-42`: staffing GET separate from semester mapping GET.
- vNext now: `college-term-mapping-service.ts:97-134`: staffing derived with main read pipeline.
- Fix: Split staffing failure path and preserve core mapping.

## G2-16-007-068  [P2] GAP  facet F19  effort M
- Legacy: `SemesterCourseMapping.js:63-139`: independent lookups/semesters/mapping/staffing requests with request counters avoid stale result.
- vNext now: `college-term-mapping-service.ts:60-134`: server fetches all data at once; no partial render while staffing runs.
- Fix: Separate independent async fallbacks or use partial server streaming for lookups/staffing.

## G2-16-007-077  [P2] GAP  facet F22  effort L
- Legacy: `SemesterCourseMapping.js:67-68,83-96`: program and course source are college-filtered; semester mappings ordered by course_order.
- vNext now: `college-term-mapping-service.ts:63-96`: college joins and displayOrder on program term courses.
- Fix: Map old numeric college/program/semester IDs to UUID contracts and order where migration relevant.

## G2-17-002-045  [P2] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:63-80 gets Programs and Courses concurrently, :83-139 fetches selected semester details and staffing separately.
- vNext now: src/modules/academics/college-term-mapping-service.ts:60-134 loads all terms/courses/mappings/staffing in initial server call.
- Fix: Support per-lookup/per-semester partial refresh and avoid all-data failure on one backend query.

## G2-17-002-048  [P2] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:221-231 edit PUT mapping ID {credits,is_mandatory,course_order}.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:90-112 PATCH src/app/api/academics/semester-course-mappings/[mappingId]/route.ts:25-34 credits,position and src/modules/academics/college-term-mapping-service.ts:176-235 atomically resequences peers.
- Fix: Document removed mandatory field and changed global ordering side effects.

## G2-17-002-087  [P2] GAP  facet F22  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SemesterCourseRepository.java:13-18 filters soft-deleted mapping, :28-39 deleteBySemesterIdAndCourseId hard removes.
- vNext now: src/db/schema/academic-terms.ts:25-39 no isDeleted column; src/modules/academics/college-term-mapping-service.ts:273 deletes and records activity event.
- Fix: Document retention/soft-delete consistency and whether historical mappings are restorable.

## G2-5-025-004  [P2] GAP  facet F01  effort M
- Legacy: Legacy `GET /{semesterId}/staffing` exposes per-course staffing gap. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:484-539`
- vNext now: vNext staffing embedded in listing service, not standalone scoped staffing GET. `src/modules/academics/college-term-mapping-service.ts:97-132`, `src/app/(authenticated)/college/semester-courses/page.tsx:8-21`
- Fix: Keep route/report parity or clearly link to embedded staffing warning.

## G2-5-025-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy reorder accepts complete mappingIds list and assigns contiguous 1-based courseOrder. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:553-599`
- vNext now: vNext PATCH mapping+position renumbers whole term deterministically. `src/modules/academics/college-term-mapping-service.ts:176-234`, `src/modules/academics/college-term-mapping-model.ts:14-21`
- Fix: Offer bulk reorder endpoint or DnD adapter preserving atomic full-list semantics.

## G2-5-025-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy bulk skips null/duplicate existing and adds only absent courses, preserves user list order. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-107`
- vNext now: vNext rejects duplicate IDs or already-mapped IDs atomically. `src/modules/academics/college-term-mapping-service.ts:286-329`
- Fix: Clarify strict bulk validation and offer skip-existing mode where used.

## G2-5-025-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy single and bulk add and audit SEMESTER_COURSE_ADD/BULK_ADD. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:336-432`
- vNext now: vNext single/bulk add transaction logs ACADEMICS_SEMESTER_UPDATED. `src/modules/academics/college-term-mapping-service.ts:138-169,286-331`, `src/app/api/academics/semester-course-mappings/route.ts:9-25`
- Fix: Preserve action distinctions and count in audit display.

## G2-5-025-036  [P2] GAP  facet F10  effort M
- Legacy: Legacy get courses in semester returns course mappings. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:469-481`
- vNext now: vNext mapping read collates all chosen college terms, no semester-specific GET endpoint. `src/modules/academics/college-term-mapping-service.ts:63-132`, `src/app/(authenticated)/college/semester-courses/page.tsx:8-21`
- Fix: Expose filterable semester GET for clients or route adapter.

## G2-5-025-051  [P2] GAP  facet F15  effort M
- Legacy: Legacy maps course add/bulk/remove/reorder/update to distinct audit keys. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:361-362,409-410,445-446,596-596,630-631`
- vNext now: vNext uses same general ACADEMICS_SEMESTER_UPDATED event type for each. `src/modules/academics/college-term-mapping-service.ts:159-166,221-233,274-280,321-327`
- Fix: Differentiate action subtypes in metadata/UX audit filters.

## G2-5-025-057  [P2] GAP  facet F19  effort M
- Legacy: Legacy staffing query N courses then one assignment lookup per course, program classes once. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:484-539`
- vNext now: vNext SQL aggregates deliveries per course, supports fewer reads but different semantics. `src/modules/academics/college-term-mapping-service.ts:97-122`
- Fix: Optimize legacy-equivalent report using set-based query without altering meaning.

## G2-17-002-050  [P3] GAP  facet F10  effort 
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:409-415 bulk add, :445-450 remove, :596 reorder and :631 update audit keys distinguish operations.
- vNext now: src/modules/academics/college-term-mapping-service.ts:159-166,221-234,274-281,321-327 uses generic ACADEMICS_SEMESTER_UPDATED activity with summaries.
- Fix: Keep distinct event type or structured action to allow operation-specific audit filtering.
