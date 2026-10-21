# Work packet (wave 2): edit src/components/courses/admin-offering-learning-overview.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/college-admin-course-detail.md

## G2-19-007-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy Syllabus grid cards three per md row `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:435-494`
- vNext now: vNext vertical list of Lessons/items, no 3-up card grid `src/components/courses/admin-offering-learning-overview.tsx:425-535`
- Fix: Match lesson card grid; retain a separate list/accessible fallback.

## G2-19-007-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy Syllabus primary button `Create New` with plus SVG `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:420-431`
- vNext now: vNext CreateLessonForm inline before list, no `Create New` trigger `src/components/courses/admin-offering-learning-overview.tsx:407-412`
- Fix: Use Create New CTA opening legacy Add Lesson drawer.

## G2-19-007-012  [P2] GAP  facet F03  effort L
- Legacy: Legacy lesson cards clickable whole card and open detailed roadmap `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:439-452`
- vNext now: vNext lesson headings and inline content/actions, no whole-card navigation `src/components/courses/admin-offering-learning-overview.tsx:425-495`
- Fix: Restore interactive card selection + detail transition.

## G2-19-007-017  [P2] GAP  facet F04  effort M
- Legacy: Legacy lesson card title 26px capitalize, created-on date `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:469-489`
- vNext now: vNext lesson H2 18px, description, item count and no created date `src/components/courses/admin-offering-learning-overview.tsx:441-459`
- Fix: Display legacy lesson title scale and created date in grid card.

## G2-19-007-018  [P2] GAP  facet F04  effort M
- Legacy: Legacy lesson created date parses array `createdAt` in en-IN short month `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:581-596`
- vNext now: vNext lesson UI does not show created timestamp `src/components/courses/admin-offering-learning-overview.tsx:425-459`
- Fix: Project createdAt and format legacy `d MMM yyyy` or `—`.

## G2-19-007-025  [P2] GAP  facet F06  effort M
- Legacy: Legacy Add Lesson via ContentDrawer with selected course and close refresh `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:101-108` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:530-533`
- vNext now: vNext CreateLessonForm embedded in Syllabus, not drawer `src/components/courses/admin-offering-learning-overview.tsx:407-412`
- Fix: Use drawer with onClose refresh and focus return.

## G2-19-007-051  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty lessons AntD Empty.PRESENTED_IMAGE_SIMPLE `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:434-438`
- vNext now: vNext `No Lessons yet` dashed bordered call-to-action panel `src/components/courses/admin-offering-learning-overview.tsx:414-424`
- Fix: Show legacy small Empty illustration/wording.

## G2-19-007-057  [P2] GAP  facet F16  effort M
- Legacy: Legacy lesson grid col-12 col-md-4, h5 26px and cards `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:439-493`
- vNext now: vNext one column vertical Lesson sections and item lists `src/components/courses/admin-offering-learning-overview.tsx:425-535`
- Fix: Recreate 3-column cards at >=md, one card per row mobile.

## G2-19-007-064  [P2] GAP  facet F18  effort S
- Legacy: Legacy syllabus action `Create New`, Lessons heading with amber marker `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:365-377` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:420-430`
- vNext now: vNext `CreateLessonForm`, `Shared Learning Path`, `In this course` counters `src/components/courses/admin-offering-learning-overview.tsx:363-412`
- Fix: Restore heading copy, colored marker and CTA.

## G2-19-007-065  [P2] GAP  facet F18  effort S
- Legacy: Legacy lesson cards `Created on` followed short date `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:481-489`
- vNext now: vNext row says `Lesson N`, `<name>`, `N items` `src/components/courses/admin-offering-learning-overview.tsx:441-459`
- Fix: Add exact Created on label and date.

## G2-19-007-072  [P2] GAP  facet F20  effort M
- Legacy: Legacy section change closes lesson detail `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:391-397`
- vNext now: vNext section form changes URL and preview but leaves inline lessons all visible `src/components/courses/admin-offering-section-preview.tsx:30-46` `src/components/courses/admin-offering-learning-overview.tsx:425-535`
- Fix: Reset selected lesson and ensure scope-specific content list.

## G2-19-007-075  [P2] GAP  facet F21  effort L
- Legacy: Legacy `SyllabusDetail` dynamic ssr:false and AddLessonDrawer `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:1-5` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:503-522`
- vNext now: vNext server overview renders authoring/disclosures and item cards `src/components/courses/admin-offering-learning-overview.tsx:425-535`
- Fix: Preserve interaction and no-SSR assumptions for rich editors/upload widgets.

## G2-19-007-078  [P2] GAP  facet F22  effort M
- Legacy: Legacy lesson createdAt can be day array and class sections numeric `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:581-596`
- vNext now: vNext lessons UUID, sequence and no displayed createdOn `src/components/courses/admin-offering-learning-overview.tsx:425-459`
- Fix: Normalize dates/legacy numeric section IDs before display.
