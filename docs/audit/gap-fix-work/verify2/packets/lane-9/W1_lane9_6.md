# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-001-058 [P1] GAP facet F11
- Files: src/modules/courses/faculty-course-service.ts, src/modules/courses/faculty-route-access-model.ts
- Legacy: Legacy faculty staff ADMIN subtype may bypass some lesson-content restrictions. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:76-90`
- Expected fix: Confirm legacy faculty ADMIN subtype entitlement; map any required admin-capable account to explicit tenant role/permission, never bypass scope.

## G2-18-001-064 [P1] GAP facet F12
- Files: src/components/courses/faculty-course-home-signals.tsx, src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: Legacy Next action picks first known pending ungraded content, passes lesson and content id. `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:173-217`, `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:146-168`
- Expected fix: Support lesson+content focus and scroll/highlight item; preserve deep links for Review work.

## G2-18-001-065 [P1] GAP facet F12
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx, src/components/courses/faculty-course-workspace.tsx
- Legacy: Legacy content filter accepts `live-sessions` and renders scheduled state labels Live now/Ended. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:90-98`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1100-1107`
- Expected fix: Map legacy filter key and verify live session status semantics.

## G2-18-002-029 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/lessons/page.tsx, src/components/courses/college-lesson-reorder-actions.tsx
- Legacy: Legacy hides pagination while in drag-sort mode, shows all rows of selected course. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:224-239`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:519-523`
- Expected fix: Implement all-course sequence reorder in one view/POST reorder-all to avoid unmovable rows beyond a page.

## G2-18-002-108 [P1] GAP facet F19
- Files: src/components/courses/college-lesson-reorder-actions.tsx, src/app/(authenticated)/admin/lessons/page.tsx
- Legacy: Legacy full course reordering loads all lessons, disabled under active search. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:224-239`
- Expected fix: Expose full-order page or reorder-all with expected list to avoid stale/hidden neighbors.

## G2-19-007-022 [P1] GAP facet F05
- Files: src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx, src/components/courses/admin-offering-section-preview.tsx
- Legacy: Legacy section default generic value0, changing class clears open lesson detail `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:29-35` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:393-397`
- Expected fix: Reset selected lesson when section scope changes, avoid stale lesson detail.

## G2-19-007-035 [P1] GAP facet F09
- Files: src/components/courses/admin-offering-learning-overview.tsx
- Legacy: Legacy Create New opens AddLessonDrawer with course/slug and close-refresh `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:101-108` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:420-431`
- Expected fix: Restore drawer including selected course binding, cancel and refresh lifecycle.

## G2-19-007-036 [P1] GAP facet F09
- Files: src/components/courses/admin-offering-learning-overview.tsx
- Legacy: Legacy clicking lesson swaps whole syllabus into SyllabusDetail roadmap, with prev/next/back `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:503-527` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:539-552`
- Expected fix: Implement legacy lesson detail drill-in with back/prev/next.

## G2-19-007-044 [P1] GAP facet F12
- Files: src/components/courses/admin-offering-learning-overview.tsx, src/components/courses/admin-offering-section-preview.tsx
- Legacy: Legacy course-level generic syllabus default shows shared and every section's content `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:91-97` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:404-410`
- Expected fix: Reconcile all-section combined view, don't silently hide section items.

## G2-19-007-045 [P1] GAP facet F12
- Files: src/components/courses/admin-offering-section-preview.tsx
- Legacy: Legacy section option says exactly what its students see `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:91-97`
- Expected fix: Provide learner-perspective preview with scoped access/verified links; retain privacy controls.

## G2-19-007-047 [P1] GAP facet F12
- Files: src/components/courses/admin-offering-learning-overview.tsx
- Legacy: Legacy no new LearningPath prerequisite; course syllabus API directly returns lessons `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-568`
- Expected fix: Create/migrate learningPath automatically for legacy course with preexisting lessons.

## G2-19-007-076 [P1] GAP facet F22
- Files: src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx, src/components/courses/admin-offering-learning-overview.tsx
- Legacy: Legacy course uses numeric id and `crs-` slug, lessonId, classId `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:60-95` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-596`
- Expected fix: Map legacy ids, slugs and class-specific content to UUID schema and redirects.

## G2-19-007-079 [P1] GAP facet F22
- Files: src/components/courses/admin-offering-learning-overview.tsx
- Legacy: Legacy no Learning Path prerequisite at course-detail stage `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-568`
- Expected fix: Backfill path for existing legacy course content; don't strand legacy lessons.

## G2-19-007-081 [P1] GAP facet F23
- Files: src/components/courses/admin-offering-learning-overview.tsx
- Legacy: Legacy whole Lesson card opens SyllabusDetail with prev/next `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:439-452` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:503-522`
- Expected fix: Restore focused lesson roadmap drilldown or explicit equivalent.

## G2-19-007-082 [P1] GAP facet F23
- Files: src/components/courses/admin-offering-section-preview.tsx
- Legacy: Legacy class-specific view allowed exact student-visible content `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:91-97` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:404-410`
- Expected fix: Provide secure as-learner preview without private link exposure.

## G2-19-003-017 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/course-progress/page.tsx
- Legacy: Choose Class first, Course dropdown limited to its teaching assignments `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:249-282`
- Expected fix: Restore class-first dependent options from teaching assignments.

## G2-19-002-016 [P1] GAP facet F04
- Files: src/modules/courses/super-admin-content-directory-model.ts, src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy Students badge tests content `active!==false && enabled!==false` only `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:978-979`
- Expected fix: Explicitly present `Visible` vs effective visibility, preserve publish-ancestry security, explain divergent badges.

## G2-19-002-051 [P1] GAP facet F10
- Files: src/modules/courses/lesson-content-service.ts, src/db/schema/courses.ts
- Legacy: Legacy POST `/api/v1/lesson/contents/create` accepts LessonContentsDTO with faculty_id/course_id/class_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:214-279` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:12-32`
- Expected fix: Map faculty association and class scoping before treating write paths as equivalent.

## G2-19-002-058 [P1] GAP facet F11
- Files: src/modules/courses/lesson-content-service.ts, src/components/courses/super-admin-content-authoring.tsx
- Legacy: Legacy can create on behalf of a selected faculty `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:256-268` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1220-1231`
- Expected fix: Define delegated faculty author semantics, require scoped faculty membership on write.

## G2-19-002-059 [P1] GAP facet F12
- Files: src/modules/courses/super-admin-content-directory-model.ts, src/components/courses/super-admin-content-authoring.tsx
- Legacy: Legacy video VIDEO and YOUTUBE creation alongside LIVE_CLASS, shared course/lesson selection `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:96-114` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1275-1301`
- Expected fix: Implement full allowed content-kind transitions with equivalent authored types.

## G2-19-002-070 [P1] GAP facet F14
- Files: src/modules/courses/lesson-video-service.ts, src/components/courses/super-admin-content-authoring.tsx
- Legacy: Legacy upload via R2 presign plus best-effort orphan cleanup on failed create `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:400-435` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:669-687`
- Expected fix: Wire secure storage grant/completion for acting Super Admin; preserve cleanup and orphan review.

## G2-19-008-017 [P1] GAP facet F07
- Files: src/components/courses/assignment-file-open-control.tsx
- Legacy: Legacy `<iframe>` no onError handler; fallback text always hidden by CSS `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:16-27` `docs/legacy-source/frontend/src/styles/pages/_courses.scss:4929-4939`
- Expected fix: Add PDF load failure detection and reveal functional fallback; use tested cross-origin load limitations.

## G2-19-008-028 [P1] GAP facet F12
- Files: src/components/courses/assignment-file-open-control.tsx
- Legacy: Legacy PDF modal accepts any pdfUrl, no extension/MIME/file-size limit in component `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:4-25`
- Expected fix: Server-check MIME application/pdf, scan/READY status, size and expiration before exposing preview.

## G2-19-008-032 [P1] GAP facet F13
- Files: src/components/courses/assignment-file-open-control.tsx
- Legacy: Legacy fallback CSS `display:none` even after browser fails iframe `docs/legacy-source/frontend/src/styles/pages/_courses.scss:4929-4939`
- Expected fix: Unhide PDF fallback on explicit preview error or provide always-visible Open/Download alternative.

## G2-19-008-040 [P1] GAP facet F17
- Files: src/components/courses/assignment-file-open-control.tsx
- Legacy: Legacy Open / Download anchor reachable via keyboard but hidden by `.fallback{display:none}` `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:28-35` `docs/legacy-source/frontend/src/styles/pages/_courses.scss:4929-4931`
- Expected fix: Keep keyboard-visible fallback link available when iframe fails; never hide sole recovery action.
