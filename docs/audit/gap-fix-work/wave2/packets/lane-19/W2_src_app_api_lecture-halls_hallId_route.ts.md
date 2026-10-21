# Work packet (wave 2): edit src/app/api/lecture-halls/[hallId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lecture-hall-entity.md

## G2-19-018-003  [P2] MISSING  facet F01  effort M
- Legacy: By-hall and by-department read paths available behind scope checks. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:104-129`
- vNext now: Only collection GET/POST and hall PATCH in mapped vNext routes. `src/app/api/lecture-halls/route.ts:14-45` `src/app/api/lecture-halls/[hallId]/route.ts:15-37`
- Fix: Provide authorized by-ID/dept contract when consumers require it.

## G2-19-018-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy PUT /api/v1/lectureHall/update/{int} and LECTURE_HALL_UPDATE admin audit. `docs/legacy-source/frontend/src/api/Services/AdminService.js:639-640` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LectureHallController.java:131-156`
- vNext now: vNext PATCH /api/lecture-halls/{uuid} and activity event. `src/app/api/lecture-halls/[hallId]/route.ts:15-32` `src/modules/academics/lecture-hall-service.ts:318-334`
- Fix: Map verb, IDs, audit taxonomy and error response.
