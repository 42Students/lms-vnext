# Work packet: edit src/app/api/courses/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-3/college-admin-courses.md

## G2-19-027-001  [P1] GAP  facet F01  effort M
- Legacy: API base `/api/v1/courses` with POST /create, GET /fetch and /fetchAll, scoped + paged variants, slug reads, PUT /update, DELETE /delete, GET /deleted and POST /restore; CourseController.java:27-30,66-67,95-105,129-131,159-175,195-198,233-235,267-269,287-291,322-324,406-408,450-452,463-465
- vNext now: REST GET/POST `/api/courses`, PATCH/DELETE `/api/courses/{courseId}`; src/app/api/courses/route.ts:11-50; [courseId]/route.ts:13-65, with server page `/admin/courses`; admin/courses/page.tsx:11-29
- Fix: Produce explicit route crosswalk for every old operation, URL redirect, method and response; identify deprecated legacy client callers before changing API contract.

## G2-3-008-046  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:305-335`
- vNext now: `src/app/api/courses/route.ts:12-54`; `src/app/api/courses/[courseId]/route.ts:16-65`
- Fix: Legacy GET fetchByCollege, POST /api/v1/courses/create, PUT update/{id}, DELETE delete/{id}; vNext reads directly with Drizzle and POST/PATCH/DELETE archive; reconcile payload/status.
