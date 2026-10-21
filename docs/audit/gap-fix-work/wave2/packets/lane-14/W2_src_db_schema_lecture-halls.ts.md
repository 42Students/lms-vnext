# Work packet (wave 2): edit src/db/schema/lecture-halls.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md, docs/audit/gap2/lane-4/lecture-hall-controller.md

## G2-14-013-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy room name displayName defaults empty string when null `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchDTO.java:22-27`
- vNext now: New hall name NOT NULL, trimmed nonempty `src/db/schema/lecture-halls.ts:6-21` `src/modules/academics/lecture-hall-service.ts:51-59`
- Fix: Map historical null names to safe placeholder on import

## G2-14-013-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy capacity primitive int, roomType enum name string `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:20-27` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:47-56`
- vNext now: New capacity int validated 1..5000, enum string roomType `src/modules/academics/lecture-hall-service.ts:61-67` `src/db/schema/lecture-halls.ts:10-23`
- Fix: Check legacy capacity=0 or unsupported enum before migration

## G2-14-013-043  [P2] GAP  facet F12  effort S
- Legacy: Legacy stats count all loaded including soft deleted `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:36-41` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:96-113`
- vNext now: New active and archived status are explicit `src/db/schema/lecture-halls.ts:14-23` `src/modules/academics/lecture-hall-service.ts:175-190`
- Fix: Agree count default active/archived and label it

## G2-14-013-067  [P2] GAP  facet F22  effort M
- Legacy: Legacy repository findAll has no soft-delete filter for cache `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LectureHallRepository.java:14-17` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:36-41`
- vNext now: New status ACTIVE/ARCHIVED indexed, unique active name by college `src/db/schema/lecture-halls.ts:14-24`
- Fix: Map legacy isDeleted to ARCHIVED and default listing rules

## G2-14-013-069  [P2] GAP  facet F22  effort M
- Legacy: Legacy capacity int no DB check visible in entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:20-27`
- vNext now: New check capacity between1 and5000 `src/db/schema/lecture-halls.ts:20-23`
- Fix: Reconcile historic invalid or high capacities

## G2-4-027-014  [P2] GAP  facet F04  effort M
- Legacy: Integer college/dept IDs, int capacity, RoomType enum, no status (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:16-27`)
- vNext now: UUID ids, nullable dept, status ACTIVE/ARCHIVED (`src/db/schema/lecture-halls.ts:5-19`)
- Fix: Map legacy integer IDs; translate department0 to null during import.

## G2-4-027-044  [P2] GAP  facet F12  effort S
- Legacy: Same-college case-insensitive unique app check, serializes by locking college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:80-100`)
- vNext now: Partial unique index on ACTIVE names (`src/db/schema/lecture-halls.ts:22-26`)
- Fix: Retain case-insensitive uniqueness; document archived duplicate reuse behavior.

## G2-4-027-071  [P2] GAP  facet F22  effort M
- Legacy: Hard delete can be blocked by scheduled references (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:147-153`)
- vNext now: College/dept FKs restrict, archive status; no deleting API (`src/db/schema/lecture-halls.ts:6-19`)
- Fix: Define retention/archive policy preserving timetable joins.

## G2-14-013-054  [P3] GAP  facet F17  effort S
- Legacy: Legacy API returns room name as displayName fallback `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchDTO.java:22-27`
- vNext now: New name non-null; input room name has label `src/db/schema/lecture-halls.ts:10-21` `src/app/(authenticated)/college/lecture-halls/page.tsx:105-109`
- Fix: Provide accessible fallback for null migrated names
