# Work packet (wave 2): edit src/app/api/academics/semesters/route.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l13-u026-program-structure-controller.md, docs/audit/gap2/lane-5/u025-semester-controller.md, docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-13-026-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:26-31 — /api/v1/program-structure controller includes six routes.
- vNext now: src/app/api/academics/semesters/route.ts:9-27 and src/app/api/academics/semesters/[semesterId]/route.ts:23-52 — /api/academics/semesters and /:semesterId REST routes.
- Fix: Map compatibility routes or migrate every client link.

## G2-13-026-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:26-30 — @CrossOrigin allowlist and BaseController Spring response wrapper.
- vNext now: src/app/api/academics/semesters/route.ts:9-25 — NextResponse JSON and origin check.
- Fix: Document response envelope and CORS migration.

## G2-13-026-034  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:45-50 — unauthenticated AccessDeniedException Authentication required.
- vNext now: src/app/api/academics/semesters/route.ts:13-25 — request-context errors converted through apiErrorResponse.
- Fix: Map 401/403 and session-expired UI exactly.

## G2-5-025-001  [P2] GAP  facet F01  effort S
- Legacy: Legacy semester CRUD at `/api/v1/semester/create`, `/update/{id}`, `/delete/{id}`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:30-34,104-106,160-162,214-216`
- vNext now: vNext POST collection and PATCH/DELETE `/api/academics/semesters/{uuid}`. `src/app/api/academics/semesters/route.ts:9-17`, `src/app/api/academics/semesters/[semesterId]/route.ts:23-47`
- Fix: Publish one-to-one verb and payload compatibility map.

## G2-5-025-055  [P2] GAP  facet F18  effort M
- Legacy: Legacy HTTP error text `Failed to ... Please try again or contact support.`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:130-155,193-210`
- vNext now: vNext shows short `Semester was not created/updated/deleted` client fallback. `src/modules/academics/semester-copy.ts:11-23`, `src/app/api/academics/semesters/route.ts:18-24`
- Fix: Use original fallback guidance and backend-specific safe errors.

## G2-13-026-015  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:66-74 — POST /create returns 200 OK.
- vNext now: src/app/api/academics/semesters/route.ts:9-17 — POST /semesters returns 201 Created.
- Fix: Align client success-status expectation.

## G2-13-026-040  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:68,78,92,115 — descriptions Create a new program structure (semester), Update a program structure, Delete, Fetch all semesters.
- vNext now: src/app/api/academics/semesters/route.ts:9-17; src/app/api/academics/semesters/[semesterId]/route.ts:23-47 — API paths and models call these semesters not program structures.
- Fix: Map wording in admin UI and error catalogue.

## G2-9-019-043  [P3] GAP  facet F10  effort S
- Legacy: Legacy POST /api/v1/semester/create, snake_case including is_active:true `docs/legacy-source/frontend/src/api/Services/SemesterService.js:5-6` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:180-187`
- vNext now: POST /api/academics/semesters JSON programId,termNumber,name,totalCredits:null, creates isActive default true `src/components/academics/college-semester-management.tsx:48-59` `src/app/api/academics/semesters/route.ts:8-19`
- Fix: Record API translation and ensure active defaults.
