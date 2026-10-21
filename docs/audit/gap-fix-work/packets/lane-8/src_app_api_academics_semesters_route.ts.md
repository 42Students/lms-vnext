# Work packet: edit src/app/api/academics/semesters/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u025-semester-controller.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-5-025-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy GET semester by ID, by program, fetchAll, fetchAllPaged. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:264-332,653-686`
- vNext now: Mapped vNext semester mutation APIs only POST/PATCH/DELETE; reads are server-rendered via academic directory. `src/app/api/academics/semesters/route.ts:9-27`, `src/app/api/academics/semesters/[semesterId]/route.ts:23-52`
- Fix: Ensure deep-linked semester GET, per-program read and paged listing are exposed to clients or documented replacements.

## G2-5-025-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy duplicate program/number returns 409 conflict or 400 safe constraint copy `A semester with this number already exists for this program`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterServiceImpl.java:49-53`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:133-155`
- vNext now: vNext SEMESTER_NUMBER_CONFLICT 409, different error mapping. `src/modules/academics/semester-mutation-service.ts:83-103`, `src/app/api/academics/semesters/route.ts:18-24`
- Fix: Render exact descriptive conflict message, not code.

## G2-5-025-027  [P2] GAP  facet F08  effort M
- Legacy: Legacy semester create/update/delete response `{status:'OK',message,data}`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:128-132,189-195,235-240`
- vNext now: vNext `{semester}` or `{result}`, no status/message envelope. `src/app/api/academics/semesters/route.ts:14-17`, `src/app/api/academics/semesters/[semesterId]/route.ts:31-47`
- Fix: Ensure frontend adapts and status copy stays exact.

## G2-9-019-035  [P2] GAP  facet F07  effort S
- Legacy: Duplicate semester server returns A semester with this number already exists for this program `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:96-125`
- vNext now: SEMESTER_NUMBER_CONFLICT as API code `src/modules/academics/semester-mutation-service.ts:22-28,83-91` `src/app/api/academics/semesters/route.ts:16-23`
- Fix: Translate code to old conflict copy.
