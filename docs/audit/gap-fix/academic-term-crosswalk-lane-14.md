# Historical program structure and semester-course field crosswalk (chat-14)

Schema-only, import-only additions in migrations 0218 and 0219. No DB executed, no journal edited, no legacy row imported. The vNext normalized program_terms and program_term_courses remain authoritative for current academic offerings. A legacy NewProgramStructure and a legacy Semester are *not* assumed to be identical entities.

| Legacy source field | vNext destination | Reconciliation rule |
| --- | --- | --- |
| NewProgramStructure.id / Semester.id | Scoped legacy_id_map -> program_terms.id, plus legacyStructureId / legacySemesterId on an approved imported target | Two source entities can share a numeric ID; never coalesce just because the numeric key matches |
| NewProgramStructure.programId / Semester.programId | programs.id via legacy_id_map | Program must exist within the same permitted college; no cross-college import |
| NewProgramStructure.name / Semester.name | program_terms.name | Empty/null semester name needs explicit review; no invented default name |
| Semester.semesterNumber | program_terms.termNumber | Must be integer >=1 and unique within program; no fabricated number for a structure-only source row |
| Semester.isActive | program_terms.isActive | Null legacy state is not silently treated as false; review defaults before import |
| Semester.totalCredits | program_terms.totalCredits | Null remains nullable; validate >=0 |
| NewProgramStructure.status | program_terms.legacyStructureStatus | Preserve nullable ACTIVE/INACTIVE/COMPLETED; COMPLETED must remain sticky during sibling activation, requiring service-side guard |
| NewProgramStructure.startDate / endDate | program_terms.legacyStartDate / legacyEndDate | Raw string <=255 retained; parse only when source timezone/format are verified; not conflated with college academicPeriods |
| Old JSON courseIds list | program_terms.legacyCourseIds | Preserve raw source array/shape; normalize into program_term_courses only after every ID resolves in tenant and duplicate/order rules reviewed |
| Source BaseModel.isDeleted | program_terms.legacyWasDeleted / program_term_courses.legacyWasDeleted | Nullable original flag is provenance; access and current deletion lifecycle remain native |
| SemesterCourse.id / semesterId / courseId | program_term_courses.legacySemesterCourseId; approved term/course UUID lookup | Require unique scoped source mapping and source term/course existence; do not cast int to UUID |
| SemesterCourse.isMandatory | program_term_courses.legacyIsMandatory and normalized type CORE/ELECTIVE | TRUE -> CORE, FALSE -> ELECTIVE after approved mapping; NULL preserved as null source while canonical type policy is reviewed |
| SemesterCourse.credits | program_term_courses.credits, now DEFAULT 3 when omitted | Source explicit 0..30 stays valid in DB; UI/service 1..10 is a compatibility mismatch, not license to clamp |
| SemesterCourse.courseOrder | program_term_courses.legacyCourseOrder and displayOrder | Nullable legacy position preserved; canonical displayOrder >=1 needs stable reviewed ordering with collision handling |
| MySQL local creation/update times | Program-term timestamptz createdAt/updatedAt | Confirm Asia/Kolkata legacy clock for source, do not infer UTC |

## Mandatory invariants and outstanding actions

1. One source program may have multiple NewProgramStructure records and separately numbered Semester records. A structure with no validated semesterNumber cannot be inserted into program_terms merely to satisfy the NOT NULL termNumber and unique(programId,termNumber) constraint. Quarantine or separate staging remains necessary.
2. `legacyStructureStatus = COMPLETED` is a historical terminal state, not equivalent to isActive=false. The mutation service must exclude such records from inactivation when activating another structure and prevent reactivation without an explicit reviewed transition.
3. Raw legacy courseIds JSON is not a trusted authorization scope. Target course memberships require per-college course resolution and explicit display ordering. Deleted historic relationships remain auditable, not automatically published.
4. Existing DB credits permit 0..30, and UI/service limits 1..10. Historical 0/>10 should remain read-only or be edited through a reviewed compatibility flow; do not silently coerce or truncate.
5. Default 3 credits in 0219 affects future omitted inserts; explicit NULL remains possible. The status fields and imported course-order/mandatory flags are *not* used in active vNext authorization until importer and service are reconciled.
6. Old Semester isActive/name nullable versus vNext non-null must be resolved on import case by case. No active semester is synthesized from blank names or invalid duplicate numbers.
7. Existing program term records have no CAS version field; updatedAt alone does not provide race-safe term mapping operations. Authenticated mutation owners must retain optimistic checks and source-scope constraints.

No CI, app code execution, import execution, or SQL migration was performed.
