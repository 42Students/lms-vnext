# Work packet (wave 2): edit src/app/api/lecture-halls/route.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md, docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-4/lecture-hall-controller.md

## G2-14-013-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy search route GET /api/v2/lecture-halls/search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:18-23` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:48-53`
- vNext now: New GET /api/lecture-halls returns paginated listing `src/app/api/lecture-halls/route.ts:14-22` `src/modules/academics/lecture-hall-service.ts:167-234`
- Fix: Map old search route to new query and response adapter

## G2-14-013-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy stats route GET /api/v2/lecture-halls/stats `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:96-113`
- vNext now: New list includes pagination total but no stats route in mapped API `src/app/api/lecture-halls/route.ts:14-23` `src/modules/academics/lecture-hall-service.ts:225-234`
- Fix: Provide stats alias or map callers to list total

## G2-14-013-006  [P2] GAP  facet F02  effort S
- Legacy: Legacy response wrapper success message, data list `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:93-94`
- vNext now: New raw JSON includes items and pagination `src/app/api/lecture-halls/route.ts:14-22` `src/modules/academics/lecture-hall-service.ts:225-234`
- Fix: Provide compatibility response wrapper for older consumers

## G2-14-013-045  [P2] GAP  facet F13  effort S
- Legacy: Legacy cache startup load error logs but retains old or empty cache `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:20-45`
- vNext now: New DB query failures reach API error handler `src/app/api/lecture-halls/route.ts:14-22`
- Fix: Show retry state for live DB failures, not fake empty results

## G2-19-018-003  [P2] MISSING  facet F01  effort M
- Legacy: By-hall and by-department read paths available behind scope checks. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:104-129`
- vNext now: Only collection GET/POST and hall PATCH in mapped vNext routes. `src/app/api/lecture-halls/route.ts:14-45` `src/app/api/lecture-halls/[hallId]/route.ts:15-37`
- Fix: Provide authorized by-ID/dept contract when consumers require it.

## G2-19-018-033  [P2] GAP  facet F10  effort M
- Legacy: Legacy POST /api/v1/lectureHall/create snake_case returns 200 Response(data=room). `docs/legacy-source/frontend/src/api/Services/AdminService.js:623-625` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:56-77`
- vNext now: vNext POST /api/lecture-halls camelCase returns 201 {hall}. `src/app/api/lecture-halls/route.ts:25-45` `src/components/admin/lecture-hall-manager.tsx:118-133`
- Fix: Specify API migration and response remapping.

## G2-4-027-001  [P2] GAP  facet F01  effort S
- Legacy: `POST /api/v1/lectureHall/create` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:22-24,55-57`)
- vNext now: `POST /api/lecture-halls` (`src/app/api/lecture-halls/route.ts:25-41`)
- Fix: Keep v1 route adapter or migrate old form clients, including camelCase path.

## G2-4-027-003  [P2] MISSING  facet F01  effort M
- Legacy: GET `/fetch/{id}`, `/fetchByCollege?collegeId`, `/fetchByDept?deptId` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:110-145`)
- vNext now: Only list by college ID, no dedicated fetch/id/dept routes (`src/app/api/lecture-halls/route.ts:14-23`)
- Fix: Expose hall-id and dept alias or update all dependent consumers.

## G2-4-027-015  [P2] GAP  facet F04  effort S
- Legacy: Create/update returns Response(status='OK',message='OK',data=LectureHall) HTTP200 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:56-76,151-174`)
- vNext now: Create HTTP201 `{hall}` and PATCH `{hall}` (`src/app/api/lecture-halls/route.ts:38-41`)
- Fix: Preserve status/message/data legacy shape in aliases.

## G2-4-027-039  [P2] MISSING  facet F10  effort M
- Legacy: GET by ID/college/dept endpoints (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:110-145`)
- vNext now: Only GET list college query (`src/app/api/lecture-halls/route.ts:14-23`)
- Fix: Implement route adapters for legacy discovery methods.

## G2-14-013-055  [P3] GAP  facet F18  effort S
- Legacy: Legacy text Lecture halls retrieved `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:93-94`
- vNext now: New route no success wrapper `src/app/api/lecture-halls/route.ts:14-22`
- Fix: Preserve response message only for v2 clients
