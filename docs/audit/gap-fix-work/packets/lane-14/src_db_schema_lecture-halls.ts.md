# Work packet: edit src/db/schema/lecture-halls.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md, docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-4/lecture-hall-controller.md

## G2-14-013-066  [P1] GAP  facet F22  effort M
- Legacy: Legacy lecture_hall has integer college/dept, name,capacity,description,roomType `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:10-27`
- vNext now: New UUID relations and constrained fields, status and timestamps `src/db/schema/lecture-halls.ts:6-24`
- Fix: Map integer IDs and roomType enum to UUID and varchar enum

## G2-14-013-068  [P1] GAP  facet F22  effort M
- Legacy: Legacy description can be null and JPA unbounded string declaration `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:24-27`
- vNext now: New description varchar255 `src/db/schema/lecture-halls.ts:10-13` `src/modules/academics/lecture-hall-service.ts:52-59`
- Fix: Plan truncation or explicit reject with preserved long descriptions

## G2-19-018-009  [P1] GAP  facet F04  effort L
- Legacy: Legacy int id/collegeId/deptId, string name and description, int capacity, RoomType. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:15-28`
- vNext now: vNext UUID ID/FKs, nullable departmentId, same core display fields. `src/db/schema/lecture-halls.ts:6-16`
- Fix: Create precise numeric-ID and room-type migration mapping.

## G2-19-018-027  [P1] GAP  facet F07  effort M
- Legacy: Legacy same-name conflict includes quoted name; all halls considered. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:76-87`
- vNext now: vNext HALL_NAME_TAKEN generic and unique active-only index. `src/components/admin/lecture-hall-manager.tsx:63-65` `src/db/schema/lecture-halls.ts:18-19`
- Fix: Resolve archived-name reuse semantics and display name conflict.

## G2-19-018-040  [P1] GAP  facet F12  effort M
- Legacy: Legacy duplicate name check applies to all rows, even logically deleted ones. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:76-86` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:36-37`
- vNext now: vNext only ACTIVE rooms must have unique college/name. `src/db/schema/lecture-halls.ts:18-19`
- Fix: Document archived name reuse rule and historical room references.

## G2-19-018-058  [P1] GAP  facet F20  effort L
- Legacy: Legacy BaseModel has LocalDateTime and is_deleted flag. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-37`
- vNext now: vNext timestamptz and ACTIVE/ARCHIVED status with no is_deleted. `src/db/schema/lecture-halls.ts:14-16`
- Fix: Define timezone, deletion, and migration behavior for historic rows.

## G2-19-018-062  [P1] GAP  facet F22  effort L
- Legacy: Legacy int PK and enum RoomType lacking @Enumerated (JPA default ordinal); int deptId uses zero sentinel. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:11-28` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37`
- vNext now: vNext UUID IDs, varchar room type and nullable FK. `src/db/schema/lecture-halls.ts:6-24` `drizzle/0052_db02_lecture_hall_timetable_integrity.sql:5-20`
- Fix: Map int IDs/ordinal enums/zero dept to UUID/varchar/null before data import.

## G2-19-018-063  [P1] GAP  facet F22  effort L
- Legacy: Legacy has is_deleted in BaseModel; hard-delete service, no DB name unique index per service comment. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-37` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:76-80` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:143-153`
- vNext now: vNext active-name unique partial index and FK restrict. `src/db/schema/lecture-halls.ts:18-24` `drizzle/0052_db02_lecture_hall_timetable_integrity.sql:22-34`
- Fix: Preserve historical deleted status and document uniqueness policy.

## G2-4-027-069  [P1] GAP  facet F22  effort L
- Legacy: `lecture_hall` singular table, integer PK + deptId=0 sentinel, no status (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:12-27`)
- vNext now: `lecture_halls` plural UUID, nullable department, active/archive status/checks (`src/db/schema/lecture-halls.ts:6-34`)
- Fix: Implement ID map and room-to-schedule foreign-key migration, map dept0 to null.
