# Lecture hall historical crosswalk — lane 14

Legacy lecture_hall.id, collegeId, deptId are integers. Use source-scoped legacy_id_map for every hall, college, department and schedule reference; legacy deptId 0 maps to NULL departmentId (not a synthetic UUID), while original 0 stays in legacyDepartmentId. Native lecture_halls UUID/college FK and active/archive lifecycle remain authoritative.

Legacy RoomType uses default JPA ordinal: 0 CLASSROOM, 1 LECTURE_HALL, 2 LAB, 3 SEMINAR_HALL, 4 AUDITORIUM, 5 CONFERENCE_ROOM. Store source ordinal before converting to native varchar. Unknown or corrupt ordinal must be quarantined, not mapped to classroom. Original boolean is_deleted and LocalDateTime need verified retention and timezone decisions.

Legacy description String is unbounded while native varchar255 discarded long text; Drizzle now stores text and 0228 widens the SQL column. Existing UI/service 255-character validation must be reconciled before old long descriptions can round-trip. Native active-only uniqueness allows archived name reuse; legacy service treated deleted names as conflicts. That is an explicit vNext archive/restore semantics difference, not fixed by blindly broadening the constraint. A new import must preflight duplicate and restored names; UI must display the original conflicting quoted name where required.

Schedule room references and college-department composite eligibility are separately service-scoped. Migration 0228 unregistered; no SQL, tests or CI executed.