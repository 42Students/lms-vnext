# Work packet (wave 2): edit src/app/(authenticated)/learn/courses/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u006-learner-courses.md, docs/audit/gap2/lane-3/student-course-controller.md

## G2-15-006-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy elective badge purple with label `elective_slot_name` or `Elective` (CoursesContent.jsx:526-528)
- vNext now: VNext StatusBadge info `Elective` ignores slotName (learner-course-list.tsx:391-395; learn/courses/page.tsx:41-57)
- Fix: Project elective slot label, purple Tag and exact placement

## G2-3-025-012  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/StudentCoursesResponseDTO.java:16-36`
- vNext now: `src/app/(authenticated)/learn/courses/page.tsx:41-58`
- Fix: Map legacy student/class/batch/program/current semester/academic year fields explicitly to vNext membership, section/cohort/program/academic-period records.

## G2-3-025-046  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:425-440`
- vNext now: `src/app/(authenticated)/learn/courses/page.tsx:19-24`
- Fix: Legacy initial load renders six skeleton cards; vNext async server page lacks source-equivalent in-page skeleton proof (check Suspense/loading route live).

## G2-3-025-047  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:480-488`
- vNext now: `src/app/(authenticated)/learn/courses/page.tsx:34-76`
- Fix: Legacy malformed record warning is page-level alert and invalid credits alert; vNext renders individual Unavailable cards and catches metadata load errors silently.

## G2-3-025-060  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:83-89`
- vNext now: `src/app/(authenticated)/learn/courses/page.tsx:19-24`
- Fix: Legacy aborts stale requests/ignores identity-switched responses; vNext server page needs authenticated cache/no-store and request consistency verified.

## G2-3-025-065  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:7-8`
- vNext now: `src/app/(authenticated)/learn/courses/page.tsx:10-17`
- Fix: Legacy calls SemesterService and faculty assignment API from client; vNext uses internal server query and display metadata service. Document observability and failure boundaries.
