# Work packet: edit src/components/courses/admin-offering-learning-page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/college-admin-course-detail.md

## G2-19-007-006  [P1] GAP  facet F02  effort M
- Legacy: Legacy tab content switches single Home or Syllabus pane `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:29-46` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:172-179`
- vNext now: vNext renders both sections one after another and tabs anchor scroll only `src/components/courses/admin-offering-section-tabs.tsx:14-32` `src/components/courses/admin-offering-learning-page.tsx:82-105`
- Fix: Render mutually exclusive panels or approved legacy-equivalent tab display.

## G2-19-007-015  [P1] GAP  facet F04  effort M
- Legacy: Legacy Home `In this Course` content from meta_data introduction/html/takeaways `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:287-315`
- vNext now: vNext home editing through admin course display service and optional fields, no visible InThisCourseSection here `src/components/courses/admin-offering-learning-page.tsx:82-100`
- Fix: Render existing rich HTML+takeaways read-only course preview below Home heading.

## G2-19-007-030  [P1] GAP  facet F07  effort M
- Legacy: Legacy class list failure `Sections couldn't be loaded, so you're seeing shared content only.` with Retry `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:385-389`
- vNext now: vNext error/limit banners only on Section Preview, and promise list read may throw `src/components/courses/admin-offering-learning-page.tsx:49-53` `src/components/courses/admin-offering-section-preview.tsx:42-43`
- Fix: Keep shared syllabus usable when section list fails; show targeted Retry.

## G2-19-007-038  [P1] GAP  facet F10  effort L
- Legacy: Legacy course GET by slug, class names and numeric fetch endpoints `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:2-7` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:69-95`
- vNext now: vNext getAdminOfferingLearningWorkspace by offering UUID and section preview reads `src/components/courses/admin-offering-learning-page.tsx:35-53`
- Fix: Map course, offering and class data joins; support URL redirect from old IDs.

## G2-19-007-039  [P1] GAP  facet F10  effort L
- Legacy: Legacy class-specific syllabus reads `getSpecificCourseContent`, generic by slug/id `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-568`
- vNext now: vNext Syllabus `getAdminOfferingLearningWorkspace` and selected delivery preview, not same content viewer `src/components/courses/admin-offering-learning-page.tsx:35-53` `src/components/courses/admin-offering-learning-overview.tsx:425-535`
- Fix: Expose targeted mixed shared+section content view for authorized class.

## G2-19-007-050  [P1] GAP  facet F13  effort M
- Legacy: Legacy section fetch failure shows shared-only warning but keeps lessons `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:385-410`
- vNext now: vNext Section Preview read is awaited with overall page Promise.all `src/components/courses/admin-offering-learning-page.tsx:49-53`
- Fix: Gracefully degrade section preview rather than block entire course page.

## G2-19-007-068  [P1] GAP  facet F19  effort M
- Legacy: Legacy two concurrent requests course/class names via Promise.allSettled, tolerates failed class lookup `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:69-90`
- vNext now: vNext workspace and section preview Promise.all, whole page depends on both `src/components/courses/admin-offering-learning-page.tsx:35-53`
- Fix: Use independent failure boundaries so shared course remains available.

## G2-19-007-074  [P1] GAP  facet F21  effort L
- Legacy: Legacy courseServices getCourse/getCourseBySlug/getClassName and Redux currAdminCourse `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:2-14` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:51-90`
- vNext now: vNext admin offering workspace/course display/teacher preview services `src/components/courses/admin-offering-learning-page.tsx:12-21` `src/components/courses/admin-offering-learning-page.tsx:35-63`
- Fix: Create explicit compatibility mapping from courseId/slug to offering/section/delivery.

## G2-19-007-077  [P1] GAP  facet F22  effort L
- Legacy: Legacy course meta_data intro/html/takeaways stored on course `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:309-315`
- vNext now: vNext course-display separate enabled runtime content with version `src/components/courses/admin-offering-learning-page.tsx:54-61` `src/components/courses/admin-offering-learning-page.tsx:84-100`
- Fix: Migrate old metadata and preserve sanitized HTML/takeaway order/version history.

## G2-19-007-028  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid URL `Course not found` result explicit 404 and reason `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:146-158`
- vNext now: vNext Zod/offering not found raises Next notFound generic route `src/components/courses/admin-offering-learning-page.tsx:35-48`
- Fix: Render same Course not found copy with Back to Courses within safe 404.

## G2-19-007-031  [P2] GAP  facet F07  effort M
- Legacy: Legacy lesson read failure `Lessons couldn't be loaded.` with Retry `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:379-383`
- vNext now: vNext server workspace awaited as one response, no per-lessons Retry `src/components/courses/admin-offering-learning-page.tsx:35-48` `src/components/courses/admin-offering-learning-overview.tsx:414-424`
- Fix: Separate lesson fetch retry/error from legitimate no lessons.

## G2-19-007-032  [P2] GAP  facet F08  effort M
- Legacy: Legacy failed syllabus fetch toast `Server Notification` / `Internal Server Error` bottomRight duration0 `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:605-615`
- vNext now: vNext offering load errors use notFound or server throw, no matching toast `src/components/courses/admin-offering-learning-page.tsx:35-48`
- Fix: Show durable error notice with Retry; match legacy wording and persistence.
