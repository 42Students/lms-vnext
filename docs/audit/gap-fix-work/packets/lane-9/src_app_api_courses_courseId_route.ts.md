# Work packet: edit src/app/api/courses/[courseId]/route.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md

## G2-19-027-001  [P1] GAP  facet F01  effort M
- Legacy: API base `/api/v1/courses` with POST /create, GET /fetch and /fetchAll, scoped + paged variants, slug reads, PUT /update, DELETE /delete, GET /deleted and POST /restore; CourseController.java:27-30,66-67,95-105,129-131,159-175,195-198,233-235,267-269,287-291,322-324,406-408,450-452,463-465
- vNext now: REST GET/POST `/api/courses`, PATCH/DELETE `/api/courses/{courseId}`; src/app/api/courses/route.ts:11-50; [courseId]/route.ts:13-65, with server page `/admin/courses`; admin/courses/page.tsx:11-29
- Fix: Produce explicit route crosswalk for every old operation, URL redirect, method and response; identify deprecated legacy client callers before changing API contract.

## G2-19-027-003  [P1] MISSING  facet F01  effort M
- Legacy: GET `/by-slug/{slug}` preferred; `/fetchCourse?courseId` marked deprecated and `/{courseId}/slug` lookup; CourseController.java:195-198,233-261,267-285
- vNext now: vNext generic `/api/courses` list by college and UUID item writes; route.ts:12-25; [courseId]/route.ts:13-65
- Fix: Add authorized slug read/resolve alias or explicit validated permanent redirects; never expose guessed cross-tenant UUID mappings.

## G2-19-027-053  [P1] GAP  facet F20  effort M
- Legacy: Legacy `CourseSlugResolver` rejects mismatch between courseSlug and numeric courseId and ID enumeration; CourseSlugResolver.java:19-53; CourseController.java:195-319
- vNext now: vNext UUID exact IDs and scoped endpoint, no accepted dual legacy resolver; [courseId]/route.ts:13-65
- Fix: Support validated alias resolution with tenant-safe 404; never accept slug & UUID that disagree.

## G2-18-003-061  [P1] GAP  facet F10  effort L
- Legacy: Legacy PUT updateCourse with field merge and optional replaced image R2 best-effort cleanup. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:355-382`
- vNext now: vNext PATCH `/api/courses/:id` allowed metadata only, no image. `src/app/api/courses/[courseId]/route.ts:16-40`, `src/components/courses/admin-course-actions.tsx:166-180`
- Fix: Implement update image upload + safe old image lifecycle, account for signed URLs and races.

## G2-3-008-046  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:305-335`
- vNext now: `src/app/api/courses/route.ts:12-54`; `src/app/api/courses/[courseId]/route.ts:16-65`
- Fix: Legacy GET fetchByCollege, POST /api/v1/courses/create, PUT update/{id}, DELETE delete/{id}; vNext reads directly with Drizzle and POST/PATCH/DELETE archive; reconcile payload/status.

## G2-19-027-022  [P2] GAP  facet F07  effort S
- Legacy: Slug resolver errors `Slug is required`, `Use courseId parameter for numeric identifiers`, max64, `Invalid slug format`; CourseSlugResolver.java:58-77
- vNext now: vNext UUID parsing from courseIdSchema and Zod codes; validation.ts:7; [courseId]/route.ts:22-35
- Fix: For old aliases retain exact malformed slug feedback and distinguish valid-unknown 404; do not accept numeric as UUID.

## G2-19-027-023  [P2] MISSING  facet F07  effort M
- Legacy: `fetchCourseName` dual slug/id mismatch -> 400 `courseSlug and courseId do not refer to the same course`; CourseSlugResolver.java:24-34; CourseController.java:287-318
- vNext now: No dual-ID resolver on inspected `/api/courses`/UUID routes; route.ts:11-54; [courseId]/route.ts:13-65
- Fix: Implement compatibility resolver for old bookmarked lookups, reject mismatched aliases safely.

## G2-19-027-027  [P2] GAP  facet F08  effort S
- Legacy: Create/update success Response OK envelope, delete success `Course deleted successfully`, restore `Course restored`; CourseController.java:91-92,377-381,431-436,472-476
- vNext now: vNext POST201 `{course}`, PATCH `{course}`, DELETE `{course}` and toast `Updated course “name”.`, archive UI; route.ts:35-50; [courseId]/route.ts:36-65; admin-course-actions.tsx:35-66,181-203
- Fix: Map old API status/error envelopes for legacy consumers, clone success toast/copy for delete vs archive accurately.

## G2-18-003-052  [P2] GAP  facet F08  effort S
- Legacy: Legacy delete success `Deleted course “NAME”.`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:387-402`
- vNext now: vNext archive action toasts different label/semantics. `src/components/courses/admin-course-actions.tsx:254-260`, `src/app/api/courses/[courseId]/route.ts:43-65`
- Fix: Use accurate `Archived course “NAME”.` confirmation and retention detail.
