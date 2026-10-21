# Work packet (wave 2): edit src/modules/academics/faculty-assignment-service.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/faculty-course-mapping.md, docs/audit/gap2/lane-3/faculty-course-association.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-20-019-002  [P2] GAP  facet F01  effort S
- Legacy: DTO courseSlug and mapping_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/FacultyCourseMappingDTO.java:11-17`
- vNext now: New UUID id and no course slug `src/modules/academics/faculty-assignment-service.ts:73-85`
- Fix: Join course slug for links

## G2-20-019-004  [P2] GAP  facet F02  effort M
- Legacy: Faculty/class/course grouping by repository lookups `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseMappingRepository.java:13-49`
- vNext now: Single section list instead `src/modules/academics/faculty-assignment-service.ts:45-65`
- Fix: Restore faculty-wide and course-wide groupings

## G2-20-019-006  [P2] MISSING  facet F03  effort S
- Legacy: Legacy DTO section_name `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/FacultyCourseMappingDTO.java:15-17`
- vNext now: New only sectionId and displayName `src/modules/academics/faculty-assignment-service.ts:73-85`
- Fix: Join section name for visible row

## G2-20-019-008  [P2] MISSING  facet F04  effort M
- Legacy: Nested Course and courseSlug in DTO `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/FacultyCourseMappingDTO.java:11-17`
- vNext now: New no course payload `src/modules/academics/faculty-assignment-service.ts:73-85`
- Fix: Expose course name/slug projection

## G2-20-019-009  [P2] GAP  facet F05  effort M
- Legacy: Distinct courses for a faculty `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseMappingRepository.java:13-14`
- vNext now: Read demands sectionId `src/modules/academics/faculty-assignment-service.ts:45-52`
- Fix: Implement faculty-wide course list

## G2-20-019-010  [P2] MISSING  facet F05  effort M
- Legacy: Four distinct class/course counters `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseMappingRepository.java:38-49`
- vNext now: New only assignment rows `src/modules/academics/faculty-assignment-service.ts:73-102`
- Fix: Provide all four aggregate counters

## G2-20-019-017  [P2] GAP  facet F10  effort M
- Legacy: Legacy active flag can deactivate `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseMapping.java:21-22`
- vNext now: New endedAt is persisted `src/modules/academics/faculty-assignment-service.ts:156-208`
- Fix: Handle reactivation and historical replacement

## G2-20-019-027  [P2] GAP  facet F18  effort S
- Legacy: Legacy labels courseSlug, section_name, mapping_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/FacultyCourseMappingDTO.java:11-17`
- vNext now: New role/startedAt/endedAt/displayName `src/modules/academics/faculty-assignment-service.ts:73-85`
- Fix: Map exact visible wording and empty placeholders

## G2-20-019-030  [P2] GAP  facet F21  effort M
- Legacy: Legacy FacultyServiceImpl relies on course/class repository `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseMappingRepository.java:11-20`
- vNext now: New membership/academics scope `src/modules/academics/faculty-assignment-service.ts:8-30`
- Fix: Verify timetable and teacher course access propagation

## G2-3-020-011  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:25-29`
- vNext now: `src/modules/academics/faculty-assignment-service.ts:45-101`
- Fix: Legacy active filter is numeric active=1, vNext section role filters endedAt IS NULL; preserve equivalent active semantics and explicit ended history.

## G2-3-020-031  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:95-99`
- vNext now: `src/modules/academics/faculty-assignment-service.ts:174-203`
- Fix: Legacy deactivate missing mapping returns 404 with no result; vNext ended role treated FACULTY_ASSIGNMENT_NOT_FOUND. Map user-friendly not-found and retry.

## G2-15-027-018  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:316-332 all course mappings filtered by principal college after service read
- vNext now: src/modules/academics/faculty-assignment-service.ts:45-101 section-bound read, role/order sorted
- Fix: Expose scoped complete course/class mapping list and show ended rows only if requested.

## G2-15-027-039  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:518-538 PATCH deactivateMapping sets active flag
- vNext now: src/modules/academics/faculty-assignment-service.ts:156-206 assignment end sets endedAt
- Fix: Document mapping active-to-ended migration and expose exact deactivation action.

## G2-15-027-046  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyServiceImpl.java:439-477 create faculty mapping reactivates previously inactive mapping or errors active dup
- vNext now: src/modules/academics/faculty-assignment-service.ts:105-153 new assignment row, active conflict index
- Fix: Specify reactivation semantics for ended same faculty/course/class combination.

## G2-20-019-011  [P3] GAP  facet F05  effort S
- Legacy: Legacy active query has no explicit order `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseMappingRepository.java:16-20`
- vNext now: New orders role then name ascending `src/modules/academics/faculty-assignment-service.ts:98-102`
- Fix: Document default sort and tie breaking

## G2-20-019-028  [P3] GAP  facet F19  effort M
- Legacy: Legacy counts via distinct SQL `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseMappingRepository.java:38-49`
- vNext now: New per-section joins `src/modules/academics/faculty-assignment-service.ts:73-102`
- Fix: Batch dashboard aggregates for large faculty lists
