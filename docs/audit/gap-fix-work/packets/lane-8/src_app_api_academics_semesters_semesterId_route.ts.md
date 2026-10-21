# Work packet: edit src/app/api/academics/semesters/[semesterId]/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l13-u026-program-structure-controller.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-13-026-013  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:124-130 — updateStatus query programId/id/statusType, no request body.
- vNext now: src/app/api/academics/semesters/[semesterId]/route.ts:23-35 — PATCH item with body name/credits/isActive/CAS/confirm.
- Fix: Implement explicit activate status operation/translation.

## G2-5-025-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy GET semester by ID, by program, fetchAll, fetchAllPaged. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:264-332,653-686`
- vNext now: Mapped vNext semester mutation APIs only POST/PATCH/DELETE; reads are server-rendered via academic directory. `src/app/api/academics/semesters/route.ts:9-27`, `src/app/api/academics/semesters/[semesterId]/route.ts:23-52`
- Fix: Ensure deep-linked semester GET, per-program read and paged listing are exposed to clients or documented replacements.

## G2-13-026-017  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:53-59 — unknown structure returns 404 Program structure not found.
- vNext now: src/app/api/academics/semesters/[semesterId]/route.ts:14-20 — SEMESTER_NOT_FOUND -> 404 JSON code.
- Fix: Return exact 404 message or map in client.

## G2-13-026-018  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:78-88 — IllegalArgumentException -> 400 BAD_REQUEST with message.
- vNext now: src/app/api/academics/semesters/[semesterId]/route.ts:14-20 — SemesterMutationError mostly 409, unless not found 404.
- Fix: Align 400 vs 409 semantic error contracts.

## G2-5-025-027  [P2] GAP  facet F08  effort M
- Legacy: Legacy semester create/update/delete response `{status:'OK',message,data}`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:128-132,189-195,235-240`
- vNext now: vNext `{semester}` or `{result}`, no status/message envelope. `src/app/api/academics/semesters/route.ts:14-17`, `src/app/api/academics/semesters/[semesterId]/route.ts:31-47`
- Fix: Ensure frontend adapts and status copy stays exact.

## G2-13-026-020  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:96-97 — Deleted successfully.
- vNext now: src/app/api/academics/semesters/[semesterId]/route.ts:38-47 — returns {result}, no source message.
- Fix: Emit legacy success toast in UI.

## G2-13-026-021  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:138 — Status updated successfully.
- vNext now: src/app/api/academics/semesters/[semesterId]/route.ts:23-35 — PATCH returns {semester} with no status-specific feedback.
- Fix: Match exact status change confirmation.
