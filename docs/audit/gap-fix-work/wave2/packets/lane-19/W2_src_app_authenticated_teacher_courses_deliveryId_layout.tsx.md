# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-008  [P2] GAP  facet F02  effort M
- Legacy: Single CourseTabsLayout PageShell with main course title, `Course workspace` subtitle, tabs, then content. `docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:54-70`, `docs/legacy-source/frontend/src/components/Common/PageShell.jsx:50-88`
- vNext now: Shared layout displays back, text `course · section`, 3 action links, tabs, then child pages render their own PageHeader. `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx:26-35`, `src/components/courses/faculty-course-tab-navigation.tsx:44-89`, `src/components/courses/faculty-course-workspace.tsx:385-420`
- Fix: Use one consistent canvas and shared PageHeader with legacy title/subtitle once, suppress nested headers.

## G2-18-001-022  [P2] GAP  facet F04  effort S
- Legacy: Legacy class selector entries are `className` or `Class <id>`, numerically sorted class IDs. `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:27-46`
- vNext now: vNext label combines sectionName plus academicPeriodName; sorted by period desc, course asc, section asc. `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx:20-25`, `src/modules/courses/faculty-course-service.ts:197-201`
- Fix: Offer legacy concise class labels where mapping exists; match deterministic class sort per course.

## G2-18-001-061  [P2] GAP  facet F12  effort M
- Legacy: Legacy class selection priority query cls > numeric mapping class > stored class > lowest classId. `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:23-47`
- vNext now: vNext identifies a precise deliveryId in route, separate selector changes delivery. `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx:13-25`, `src/components/courses/faculty-course-tab-navigation.tsx:53-65`
- Fix: When translating old links respect legacy priority; avoid choosing arbitrary section for ambiguous course.
