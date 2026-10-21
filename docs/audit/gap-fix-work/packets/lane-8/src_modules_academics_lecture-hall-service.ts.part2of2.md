# Work packet: edit src/modules/academics/lecture-hall-service.ts (part 2 of 2)

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-lecture-halls.md, docs/audit/gap2/lane-14/u013-lecture-hall-search-controller.md, docs/audit/gap2/lane-19/lecture-hall-entity.md, docs/audit/gap2/lane-4/lecture-hall-controller.md

## G2-10-018-030  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:338-347 — Room Name required whitespace trim error 'Please enter room name'; max255.
- vNext now: src/components/admin/lecture-hall-manager.tsx:274-276; src/modules/academics/lecture-hall-service.ts:51-64 — Client 'Enter a name'; Zod Name is required, max255.
- Fix: Align inline validation copy.

## G2-10-018-032  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:372-374 — Description optional TextArea 2 rows with example placeholder.
- vNext now: src/components/admin/lecture-hall-manager.tsx:304-307; src/modules/academics/lecture-hall-service.ts:52-54 — New single-line Input max255, not 2-row textarea.
- Fix: Restore textarea and placeholder.

## G2-14-013-024  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing scope error exact collegeId or deptId is required (or use GLOBAL superadmin mode) `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:60-67`
- vNext now: New collegeId required Zod, SA shows Select a college to continue `src/modules/academics/lecture-hall-service.ts:93-104` `src/app/(authenticated)/admin/lecture-halls/page.tsx:26-34`
- Fix: Show actionable compatibility error without leaking cross-tenant info

## G2-19-018-026  [P2] GAP  facet F07  effort S
- Legacy: Legacy errors 'Capacity too large (max 5000)' and cross-college department message. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:46-49` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:62-73`
- vNext now: vNext Zod range plus DEPARTMENT_NOT_FOUND generic error mapping. `src/modules/academics/lecture-hall-service.ts:61-67` `src/components/admin/lecture-hall-manager.tsx:58-75`
- Fix: Map distinct capacity/department user messages.

## G2-4-027-025  [P2] GAP  facet F07  effort S
- Legacy: Empty name `Room name is required`; capacity min1/max5000 custom errors (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:40-48`)
- vNext now: Zod `Name is required` and generic numerical constraint issues (`src/modules/academics/lecture-hall-service.ts:51-64`)
- Fix: Map exact legacy backend and FE user errors.

## G2-14-013-028  [P3] GAP  facet F08  effort S
- Legacy: Legacy stats success Stats retrieved `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:113-114`
- vNext now: New list result has total no text wrapper `src/modules/academics/lecture-hall-service.ts:225-234`
- Fix: Map stats response status message
