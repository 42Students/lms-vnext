# Work packet (wave 2): edit src/components/courses/admin-offering-learning-page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/college-admin-course-detail.md

## G2-19-007-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy has two tabs Home and Syllabus, Home default `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:29-46` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:167-179`
- vNext now: vNext four tabs Home, Syllabus, Who teaches it, Section content `src/components/courses/admin-offering-section-tabs.tsx:7-12` `src/components/courses/admin-offering-learning-page.tsx:81-107`
- Fix: Retain Home/Syllabus first two as legacy primary and place extra navigation secondarily.

## G2-19-007-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy header plain course.course_name in white ln-subcourse-head, then AntD Tabs panes `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:167-179`
- vNext now: vNext PageHeader with courseName+code/cohort/period and Back to Courses action `src/components/courses/admin-offering-learning-page.tsx:63-81`
- Fix: Restore plain title strip and tab underline geometry; keep supplementary metadata below.

## G2-19-007-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy Home has one ln-module-card enclosing Back, In this Course, Teachers `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:23-44` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:287-320`
- vNext now: vNext Home is edit Disclosure; Teachers appears separate lower section `src/components/courses/admin-offering-learning-page.tsx:82-107`
- Fix: Group Home content and teachers in same tab-panel card.

## G2-19-007-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy course title from course.course_name `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:169-171`
- vNext now: vNext courseName + courseCode/cohort/period and offering-specific descriptor `src/components/courses/admin-offering-learning-page.tsx:65-76`
- Fix: Separate canonical course title from offering-scope data; use equivalent title formatting.

## G2-19-007-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy Home includes CourseTeachersPanel in same card `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:311-317`
- vNext now: vNext AdminOfferingTeachersPanel after Home and Syllabus `src/components/courses/admin-offering-learning-page.tsx:102-107`
- Fix: Move teaching roster to Home tab with parity columns.

## G2-19-007-040  [P2] GAP  facet F10  effort M
- Legacy: Legacy Home meta_data course-level HTML/takeaways `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:309-315`
- vNext now: vNext service reads course display runtime when enabled `src/components/courses/admin-offering-learning-page.tsx:54-61` `src/components/courses/admin-offering-learning-page.tsx:84-100`
- Fix: Map historical meta_data to display content with same visible rendering.

## G2-19-007-043  [P2] GAP  facet F11  effort M
- Legacy: Legacy Home only teacher may use commented edit trigger, Admin read-only `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:20-21` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:297-307`
- vNext now: vNext editor enabled by runtime flag but may still require specific action permission `src/components/courses/admin-offering-learning-page.tsx:84-100`
- Fix: Guard edit exactly by intended admin privilege and feature toggle.

## G2-19-007-049  [P2] GAP  facet F13  effort S
- Legacy: Legacy malformed/non-owned course renders Course not found Result+Back `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:146-158`
- vNext now: vNext generic notFound, page contains Back only for successful results `src/components/courses/admin-offering-learning-page.tsx:35-48` `src/components/courses/admin-offering-learning-page.tsx:77-79`
- Fix: Match not-found message/button while withholding cross-tenant metadata.

## G2-19-007-054  [P2] GAP  facet F14  effort M
- Legacy: Legacy Home imports rich HTML takeaways via InThisCourseSection `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:309-315`
- vNext now: vNext Home display editor loads bodyHtml/takeaways when feature active, no visible read preview `src/components/courses/admin-offering-learning-page.tsx:84-100`
- Fix: Preserve image/media and trusted sanitization of legacy HTML display.

## G2-19-007-058  [P2] GAP  facet F16  effort M
- Legacy: Legacy Course Home within scroll-container with card padding `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:23-27`
- vNext now: vNext border sections and independent panels `src/components/courses/admin-offering-learning-page.tsx:63-107`
- Fix: Compare at 375/768/1280 widths and align canvas gutter/shadow.

## G2-19-007-062  [P2] GAP  facet F17  effort S
- Legacy: Legacy Retry buttons inline for course/section load `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:379-389`
- vNext now: vNext error boundaries don't include specific Retry near section picker `src/components/courses/admin-offering-learning-page.tsx:49-53` `src/components/courses/admin-offering-section-preview.tsx:42-43`
- Fix: Expose accessible scoped retry controls.

## G2-19-007-009  [P3] GAP  facet F03  effort S
- Legacy: Legacy Home `Back` with left arrow at card top `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:26-42`
- vNext now: vNext `Back to Courses` on PageHeader `src/components/courses/admin-offering-learning-page.tsx:77-79`
- Fix: Match Back text, arrow icon and within-card placement.

## G2-19-007-010  [P3] GAP  facet F03  effort S
- Legacy: Legacy Syllabus `Back` with left arrow inside syllabus card `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:348-364`
- vNext now: vNext shared PageBackLink only, not duplicate per-tab `src/components/courses/admin-offering-learning-page.tsx:77-81`
- Fix: Reproduce per-Syllabus Back control as appropriate.
