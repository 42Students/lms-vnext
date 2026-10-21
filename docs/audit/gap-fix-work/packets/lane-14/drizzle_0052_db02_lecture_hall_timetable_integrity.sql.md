# Work packet: edit drizzle/0052_db02_lecture_hall_timetable_integrity.sql

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lecture-hall-entity.md

## G2-19-018-062  [P1] GAP  facet F22  effort L
- Legacy: Legacy int PK and enum RoomType lacking @Enumerated (JPA default ordinal); int deptId uses zero sentinel. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:11-28` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37`
- vNext now: vNext UUID IDs, varchar room type and nullable FK. `src/db/schema/lecture-halls.ts:6-24` `drizzle/0052_db02_lecture_hall_timetable_integrity.sql:5-20`
- Fix: Map int IDs/ordinal enums/zero dept to UUID/varchar/null before data import.

## G2-19-018-063  [P1] GAP  facet F22  effort L
- Legacy: Legacy has is_deleted in BaseModel; hard-delete service, no DB name unique index per service comment. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-37` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:76-80` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:143-153`
- vNext now: vNext active-name unique partial index and FK restrict. `src/db/schema/lecture-halls.ts:18-24` `drizzle/0052_db02_lecture_hall_timetable_integrity.sql:22-34`
- Fix: Preserve historical deleted status and document uniqueness policy.
