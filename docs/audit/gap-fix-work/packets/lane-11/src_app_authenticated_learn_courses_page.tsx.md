# Work packet: edit src/app/(authenticated)/learn/courses/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u006-learner-courses.md, docs/audit/gap2/lane-3/student-course-controller.md

## G2-15-006-067  [P1] GAP  facet F22  effort L
- Legacy: Legacy learner IDs numeric course/class/semester and course visibility active/enabled/published/locked (courseListingUtils.js:75-123)
- vNext now: VNext UUID delivery/offering/course/path, statuses and enrolments (learner-course-service.ts:74-196; learn/courses/page.tsx:41-113)
- Fix: Create documented mapping for class/semester, elective slot, lock state, old route references and course alias

## G2-3-025-028  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Course/CoursesContent.jsx:442-449`
- vNext now: `src/app/(authenticated)/learn/courses/page.tsx:19-24`
- Fix: Legacy page shows error-state Try again; current server-side initial list read has no local component retry when listLearnerCourseDeliveries throws.
