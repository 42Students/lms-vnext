# Work packet: edit src/components/courses/admin-offering-learning-overview.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/college-admin-course-detail.md

## G2-19-007-023  [P1] GAP  facet F05  effort L
- Legacy: Legacy class-specific syllabus query fetches specific content `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-568`
- vNext now: vNext shared Learning Overview shown independently, Section Preview only metadata `src/components/courses/admin-offering-learning-overview.tsx:397-405` `src/components/courses/admin-offering-section-preview.tsx:44-59`
- Fix: Render actual scoped course syllabus including section items when class selected.

## G2-19-007-035  [P1] GAP  facet F09  effort L
- Legacy: Legacy Create New opens AddLessonDrawer with course/slug and close-refresh `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:101-108` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:420-431`
- vNext now: vNext CreateLessonForm directly inline `src/components/courses/admin-offering-learning-overview.tsx:407-412`
- Fix: Restore drawer including selected course binding, cancel and refresh lifecycle.

## G2-19-007-036  [P1] GAP  facet F09  effort L
- Legacy: Legacy clicking lesson swaps whole syllabus into SyllabusDetail roadmap, with prev/next/back `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:503-527` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:539-552`
- vNext now: vNext full inline lesson cards and management disclosure, no equivalent isolated detail panel `src/components/courses/admin-offering-learning-overview.tsx:425-535`
- Fix: Implement legacy lesson detail drill-in with back/prev/next.

## G2-19-007-039  [P1] GAP  facet F10  effort L
- Legacy: Legacy class-specific syllabus reads `getSpecificCourseContent`, generic by slug/id `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-568`
- vNext now: vNext Syllabus `getAdminOfferingLearningWorkspace` and selected delivery preview, not same content viewer `src/components/courses/admin-offering-learning-page.tsx:35-53` `src/components/courses/admin-offering-learning-overview.tsx:425-535`
- Fix: Expose targeted mixed shared+section content view for authorized class.

## G2-19-007-044  [P1] GAP  facet F12  effort L
- Legacy: Legacy course-level generic syllabus default shows shared and every section's content `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:91-97` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:404-410`
- vNext now: vNext shared learningPath rendered and separate section metadata preview `src/components/courses/admin-offering-learning-overview.tsx:388-405` `src/components/courses/admin-offering-section-preview.tsx:44-59`
- Fix: Reconcile all-section combined view, don't silently hide section items.

## G2-19-007-047  [P1] GAP  facet F12  effort L
- Legacy: Legacy no new LearningPath prerequisite; course syllabus API directly returns lessons `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-568`
- vNext now: vNext needs active learningPath before adding lessons `src/components/courses/admin-offering-learning-overview.tsx:301-334`
- Fix: Create/migrate learningPath automatically for legacy course with preexisting lessons.

## G2-19-007-076  [P1] GAP  facet F22  effort L
- Legacy: Legacy course uses numeric id and `crs-` slug, lessonId, classId `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:60-95` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-596`
- vNext now: vNext UUID course/offerings/learningPaths/lessons/deliveries `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx:9-29` `src/components/courses/admin-offering-learning-overview.tsx:298-345`
- Fix: Map legacy ids, slugs and class-specific content to UUID schema and redirects.

## G2-19-007-079  [P1] GAP  facet F22  effort L
- Legacy: Legacy no Learning Path prerequisite at course-detail stage `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-568`
- vNext now: vNext requires offering learningPath for authoring `src/components/courses/admin-offering-learning-overview.tsx:301-334`
- Fix: Backfill path for existing legacy course content; don't strand legacy lessons.

## G2-19-007-081  [P1] GAP  facet F23  effort L
- Legacy: Legacy whole Lesson card opens SyllabusDetail with prev/next `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:439-452` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:503-522`
- vNext now: vNext all content inline, drag order and disclosures `src/components/courses/admin-offering-learning-overview.tsx:425-535`
- Fix: Restore focused lesson roadmap drilldown or explicit equivalent.

## G2-19-007-031  [P2] GAP  facet F07  effort M
- Legacy: Legacy lesson read failure `Lessons couldn't be loaded.` with Retry `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:379-383`
- vNext now: vNext server workspace awaited as one response, no per-lessons Retry `src/components/courses/admin-offering-learning-page.tsx:35-48` `src/components/courses/admin-offering-learning-overview.tsx:414-424`
- Fix: Separate lesson fetch retry/error from legitimate no lessons.
