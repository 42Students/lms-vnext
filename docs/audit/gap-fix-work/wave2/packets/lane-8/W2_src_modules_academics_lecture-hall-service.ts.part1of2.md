# Work packet (wave 2): edit src/modules/academics/lecture-hall-service.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-lecture-halls.md, docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md, docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-4/lecture-hall-controller.md

## G2-10-018-044  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:68-82 — GET getLectureHallsByCollege selected numeric college, all records.
- vNext now: src/modules/academics/lecture-hall-service.ts:167-225 — get /api/lecture-halls with selected UUID and SQL filters/pagination.
- Fix: Record old→new field/status mapping.

## G2-10-018-045  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:123-149 — POST createLectureHall sends `room_type`, deptId, capacity etc.
- vNext now: src/modules/academics/lecture-hall-service.ts:237-267 — POST vNext `roomType`, departmentId, name, capacity, description; Zod.
- Fix: Map casing and nullable department identifiers.

## G2-10-018-046  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:188-214 — PUT updateLectureHall old numeric room, collegeId in payload.
- vNext now: src/modules/academics/lecture-hall-service.ts:269-334 — PATCH scoped UUID hall and selected-college membership.
- Fix: Preserve effects and error interpretation.

## G2-10-018-081  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:8-16 — Legacy CRUD endpoints in LectureHall controller, selected college.
- vNext now: src/modules/academics/lecture-hall-service.ts:167-334 — New lecture-hall-service Zod/Drizzle, activity/audit events.
- Fix: Document field/status contract mapping.

## G2-10-018-084  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:132-140 — Old API fields deptId, room_type, capacity default50, description; numeric ID.
- vNext now: src/modules/academics/lecture-hall-service.ts:51-69 — New DB UUID, `departmentId`, `roomType`, status ACTIVE/ARCHIVED, updatedAt.
- Fix: Provide exact old field mapping and create payload.

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

## G2-14-013-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy DTO displays id/name/capacity/description/collegeId/deptId/roomType `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchDTO.java:13-27` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:47-56`
- vNext now: New projection includes id,name,capacity,roomType,description,status,departmentId,departmentName,upcomingClasses `src/modules/academics/lecture-hall-service.ts:193-207`
- Fix: Expose original fields incl legacy collegeId and deptId aliases in compatibility endpoint

## G2-14-013-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy room name displayName defaults empty string when null `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchDTO.java:22-27`
- vNext now: New hall name NOT NULL, trimmed nonempty `src/db/schema/lecture-halls.ts:6-21` `src/modules/academics/lecture-hall-service.ts:51-59`
- Fix: Map historical null names to safe placeholder on import

## G2-14-013-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy capacity primitive int, roomType enum name string `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:20-27` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:47-56`
- vNext now: New capacity int validated 1..5000, enum string roomType `src/modules/academics/lecture-hall-service.ts:61-67` `src/db/schema/lecture-halls.ts:10-23`
- Fix: Check legacy capacity=0 or unsupported enum before migration

## G2-14-013-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy department ID and college ID integer in DTO `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchDTO.java:13-20`
- vNext now: New department UUID and scoped college identity outside row projection `src/modules/academics/lecture-hall-service.ts:193-234`
- Fix: Map legacy IDs to UUIDs with explicit alias if compatibility needed

## G2-14-013-012  [P2] GAP  facet F05  effort S
- Legacy: Legacy search defaults 15 results, max initial cache 200 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:48-53` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:76-93`
- vNext now: New list defaults limit 100, offset zero, max 200 `src/modules/academics/lecture-hall-service.ts:93-104`
- Fix: Use legacy default 15 for search adapter, preserve new admin pagination defaults

## G2-14-013-015  [P2] GAP  facet F05  effort S
- Legacy: Legacy search fields configured name and description `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:28-34`
- vNext now: New q filters only name `src/modules/academics/lecture-hall-service.ts:175-181`
- Fix: Search description also with safe ILIKE OR and test large-text matches

## G2-14-013-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy empty query returns popular/usage-ranked items `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-125` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:194-219`
- vNext now: New empty query lists ACTIVE then alphabetical by name `src/modules/academics/lecture-hall-service.ts:212-218`
- Fix: Choose popular ranking for autosuggest, leave alphabetical directory distinct

## G2-14-013-018  [P2] GAP  facet F06  effort S
- Legacy: Legacy query optional string default empty `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:48-53`
- vNext now: New q optional trimmed max100 `src/modules/academics/lecture-hall-service.ts:93-104`
- Fix: Enforce 100 chars in UI while documenting older long-query behavior

## G2-14-013-019  [P2] GAP  facet F06  effort S
- Legacy: Legacy limit default15 and Math.min(limit,200) but no positive lower bound `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:48-53` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:76-83`
- vNext now: New Zod limit integer 1..200 default100 `src/modules/academics/lecture-hall-service.ts:93-104`
- Fix: Return clean invalid-limit error and compatibility default15 for old client

## G2-14-013-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy collegeId and deptId optional numeric; college takes precedence on principal `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:50-73`
- vNext now: New collegeId required UUID, departmentId optional UUID `src/modules/academics/lecture-hall-service.ts:93-104` `src/modules/academics/lecture-hall-service.ts:167-175`
- Fix: Support old aliases collegeId/deptId in compatibility endpoint only

## G2-14-013-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy search ignores inactive/soft deleted in cache load by findAll `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:36-45` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LectureHallRepository.java:14-17`
- vNext now: New optional status ACTIVE/ARCHIVED and list default includes both `src/modules/academics/lecture-hall-service.ts:93-104` `src/modules/academics/lecture-hall-service.ts:175-190`
- Fix: Define legacy soft delete visibility and default active-only search

## G2-14-013-033  [P2] GAP  facet F10  effort S
- Legacy: Legacy GET stats uses in-memory size or per-college count `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:96-114`
- vNext now: New total SQL count follows active filters `src/modules/academics/lecture-hall-service.ts:219-234`
- Fix: Define total across all statuses vs filtered result for stats widget

## G2-14-013-034  [P2] GAP  facet F10  effort S
- Legacy: Legacy refresh reloads cache with LectureHallRepository.findAll `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:36-62`
- vNext now: New CRUD directly writes lecture_halls and updates no cache `src/modules/academics/lecture-hall-service.ts:237-267` `src/modules/academics/lecture-hall-service.ts:269-339`
- Fix: Guarantee immediate query read after create/archive without refresh

## G2-14-013-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy indexed exact/prefix name and tracks usage counts `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:33-49` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:355-401`
- vNext now: New SQL alphabetical ordering and direct filters `src/modules/academics/lecture-hall-service.ts:212-218`
- Fix: Add ranking metrics only for autosuggest if user expectations depend

## G2-14-013-040  [P2] GAP  facet F12  effort M
- Legacy: Legacy fuzzy matching Levenshtein max2 only if scored matches fewer than5 and query length>=3 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:163-179`
- vNext now: New substring match only `src/modules/academics/lecture-hall-service.ts:175-181`
- Fix: Replicate fuzzy fallback thresholds with scoped search tests

## G2-14-013-041  [P2] GAP  facet F12  effort M
- Legacy: Legacy score exact100 prefix80 word-start60 contains40 usage boosts <=10 `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:311-351`
- vNext now: New lower(name) ascending, no similarity weights `src/modules/academics/lecture-hall-service.ts:212-218`
- Fix: Implement ranked search ordering for lookup only

## G2-14-013-043  [P2] GAP  facet F12  effort S
- Legacy: Legacy stats count all loaded including soft deleted `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:36-41` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:96-113`
- vNext now: New active and archived status are explicit `src/db/schema/lecture-halls.ts:14-23` `src/modules/academics/lecture-hall-service.ts:175-190`
- Fix: Agree count default active/archived and label it

## G2-14-013-044  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty query returns popular cache items instead of empty response `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:118-125` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:194-219`
- vNext now: New no-q query returns sorted paginated halls `src/modules/academics/lecture-hall-service.ts:175-218`
- Fix: Use appropriate empty-query autosuggest fallback

## G2-14-013-052  [P2] GAP  facet F16  effort M
- Legacy: Legacy limit15 supports compact lookup rather than full-page list `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:48-53`
- vNext now: New management list paginates more rows `src/modules/academics/lecture-hall-service.ts:93-104`
- Fix: Expose compact lookup endpoint for mobile autocomplete

## G2-14-013-057  [P2] GAP  facet F18  effort S
- Legacy: Legacy parameter name query, deptId `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:48-53`
- vNext now: New q and departmentId `src/modules/academics/lecture-hall-service.ts:93-104`
- Fix: Define alias/canonical parameter mapping

## G2-14-013-059  [P2] GAP  facet F19  effort M
- Legacy: Legacy fuzzy scans all cached halls when fewer than5 matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:163-179`
- vNext now: New SQL ILIKE scoped to college and limit200 `src/modules/academics/lecture-hall-service.ts:175-218`
- Fix: Use scoped weighted search without global all-halls scan

## G2-14-013-060  [P2] GAP  facet F19  effort M
- Legacy: Legacy empty query uses usageCounts memory popularity `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:194-219` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/core/GenericSearchCache.java:258-261`
- vNext now: New deterministic ACTIVE/name/id order `src/modules/academics/lecture-hall-service.ts:212-218`
- Fix: Introduce usage ranking only where search suggestion parity required

## G2-14-013-064  [P2] GAP  facet F21  effort S
- Legacy: Legacy PostConstruct initializes in-memory search cache once `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchCache.java:20-25`
- vNext now: New DB read performs live query `src/modules/academics/lecture-hall-service.ts:192-234`
- Fix: Document removal of startup cache and performance envelope

## G2-19-018-013  [P2] GAP  facet F05  effort S
- Legacy: Legacy client search includes room name or roomType case insensitive. `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:45-54`
- vNext now: vNext SQL query searches hall name only. `src/modules/academics/lecture-hall-service.ts:175-183`
- Fix: Search room-type code and localized label as well.

## G2-19-018-016  [P2] GAP  facet F05  effort S
- Legacy: Legacy primary list query has no ORDER BY and paginates in browser. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LectureHallRepository.java:16-27` `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-420`
- vNext now: vNext order ACTIVE first then lower(name), id with SQL limit/offset. `src/modules/academics/lecture-hall-service.ts:192-233`
- Fix: Mark new sort explicit or match observed legacy order after live verification.

## G2-19-018-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy PUT /api/v1/lectureHall/update/{int} and LECTURE_HALL_UPDATE admin audit. `docs/legacy-source/frontend/src/api/Services/AdminService.js:639-640` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:131-156`
- vNext now: vNext PATCH /api/lecture-halls/{uuid} and activity event. `src/app/api/lecture-halls/[hallId]/route.ts:15-32` `src/modules/academics/lecture-hall-service.ts:318-334`
- Fix: Map verb, IDs, audit taxonomy and error response.

## G2-19-018-055  [P2] GAP  facet F19  effort M
- Legacy: Legacy primary list unpaged, optional college-paged route default 20 cap100. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:115-120` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:197-218`
- vNext now: vNext list default100 max200 with SQL limit/offset. `src/modules/academics/lecture-hall-service.ts:93-104` `src/modules/academics/lecture-hall-service.ts:192-234`
- Fix: Preserve chosen page-size contract and full-list expectations.

## G2-4-027-005  [P2] GAP  facet F01  effort S
- Legacy: GET `/fetchByCollegePaged?page=0&size=20` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:209-230`)
- vNext now: Offset/limit API, default limit100 (`src/modules/academics/lecture-hall-service.ts:93-104,225-234`)
- Fix: Retain 0-based page/size response adapter with old defaults.

## G2-4-027-013  [P2] GAP  facet F04  effort S
- Legacy: `college_id`, `dept_id`, `room_type` JSON snake_case (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LectureHallDTO.java:11-20`)
- vNext now: `collegeId`,`departmentId`,`roomType` camelCase (`src/modules/academics/lecture-hall-service.ts:61-91`)
- Fix: Alias legacy snake-case fields in migration API.

## G2-4-027-016  [P2] GAP  facet F04  effort S
- Legacy: Paged data content, totalElements,totalPages,size,number,first,last (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:219-230`)
- vNext now: Items + pagination(limit,offset,total) (`src/modules/academics/lecture-hall-service.ts:225-234`)
- Fix: Map number and first/last page semantics.

## G2-4-027-018  [P2] GAP  facet F05  effort S
- Legacy: Page negative clamps0 and size clamps1..100, default20 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:215-220`)
- vNext now: Offset positive, default limit100 max200 (`src/modules/academics/lecture-hall-service.ts:101-104`)
- Fix: Support legacy page/size defaults for v1 requests.

## G2-4-027-020  [P2] GAP  facet F06  effort S
- Legacy: CollegeId @Min1, DeptId @Min0, name @NotBlank max255, capacity min1, roomType required (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LectureHallDTO.java:13-19`)
- vNext now: UUID college, nullable dept, name trim/min1/max255, cap1..5000, enum (`src/modules/academics/lecture-hall-service.ts:51-71`)
- Fix: Keep optional department0 mapping, align role and default validation.
