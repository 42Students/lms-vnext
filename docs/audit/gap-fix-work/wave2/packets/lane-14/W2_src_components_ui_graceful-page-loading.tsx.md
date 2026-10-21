# Work packet (wave 2): edit src/components/ui/graceful-page-loading.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u006-learner-course-redirect.md, docs/audit/gap2/lane-17/teacher-courses-courseid-index.md

## G2-16-006-005  [P2] GAP  facet F02  effort M
- Legacy: `CourseTabSkeleton.jsx:100-119`: first paint overview about block + four course cards.
- vNext now: `graceful-page-loading.tsx:22-27`: generic 2 skeleton lines + 4 rows.
- Fix: Shape placeholder as about 30/92/76%-width bars plus four chips/cards.

## G2-16-006-006  [P2] GAP  facet F02  effort S
- Legacy: `CourseTabSkeleton.jsx:175-182`: wrapper learn-course-canvas, scroll-container, ln-module-card.
- vNext now: `graceful-page-loading.tsx:14-32`: section with transparent bg and generic canvas spacing.
- Fix: Match legacy canvas/card wrapper and tab-area vertical insets.

## G2-16-006-026  [P2] GAP  facet F13  effort M
- Legacy: `CourseTabSkeleton.jsx:174-182`: aria-live polite skeleton visible until route navigation.
- vNext now: `graceful-page-loading.tsx:14-32`: generic skeleton status and 12s retry action.
- Fix: Use legacy-specific visual skeleton, retain robust timed-retry fallback as approved improvement.

## G2-16-006-030  [P2] GAP  facet F16  effort M
- Legacy: `CourseTabSkeleton.jsx:100-119,175-182`: skeleton responsive content uses 4 cards in course canvas.
- vNext now: `graceful-page-loading.tsx:22-27`: generic rows may shift layout at small viewports.
- Fix: Compare 375/768/1280 loading handoff and implement responsive 4-card overview skeleton.

## G2-16-006-042  [P2] GAP  facet F23  effort M
- Legacy: `CourseTabSkeleton.jsx:100-120,175-182`: matching home skeleton before redirect.
- vNext now: `graceful-page-loading.tsx:22-27`: generic load geometry.
- Fix: Reuse overview skeleton in next route loading fallback.

## G2-17-001-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:16-21 displays FacultyOverviewSkeleton while transitioning; docs/legacy-source/frontend/src/components/Course/Common/CourseTabSkeleton.jsx:127-152 stages about, command bar, four priority cards.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx:1-4 returns GracefulPageLoading directory; src/components/ui/graceful-page-loading.tsx:14-25 renders line/form/rows rather than faculty overview geometry.
- Fix: Use the faculty overview placeholder on the default redirect/loading boundary; match section order and dimensions.

## G2-17-001-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/Course/Common/CourseTabSkeleton.jsx:129-152 renders 3 intro bars, command CTA block and 4 priority cards; docs/legacy-source/frontend/src/components/Course/Common/CourseTabSkeleton.jsx:155-175 exposes per-tab shape map.
- vNext now: src/components/ui/graceful-page-loading.tsx:17-25 renders generic directory rows with no four priority-card skeletons.
- Fix: Implement faculty-specific skeleton elements and bar sizes in shared loading component.

## G2-17-001-027  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:20-21 shows faculty-shaped loading immediately; docs/legacy-source/frontend/src/components/Course/Common/CourseTabSkeleton.jsx:168-175 uses aria-label 'Loading course'.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx:4 generic 'Loading Faculty course…'; src/components/ui/graceful-page-loading.tsx:14-30 shows directory skeleton and slow-load Retry.
- Fix: Match loading geometry, labels, and transition; keep retry as deliberate vNext enhancement after slow threshold.

## G2-16-006-031  [P3] GAP  facet F17  effort S
- Legacy: `CourseTabSkeleton.jsx:175-182`: role=status aria-live polite and aria-label Loading course.
- vNext now: `graceful-page-loading.tsx:14-15`: aria-busy and screen-reader-only `Loading your page...`.
- Fix: Use specific loading label `Loading course` and announce polite status without duplicate announcements.

## G2-16-006-033  [P3] GAP  facet F18  effort S
- Legacy: `index.js:23-28`; `CourseTabSkeleton.jsx:175`: accessible copy `Loading course`.
- vNext now: `graceful-page-loading.tsx:7,15`: `Loading your page...`.
- Fix: Set copy to `Loading course` on this route.

## G2-17-001-033  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/components/Course/Common/CourseTabSkeleton.jsx:168-175 exposes role=status, aria-live=polite, aria-label='Loading course'; skeleton detail bars aria-hidden.
- vNext now: src/components/ui/graceful-page-loading.tsx:14-15 aria-busy on section and sr-only status label 'Loading Faculty course…'; :17-25 visuals aria-hidden.
- Fix: Align spoken loading announcement and avoid double status announcements across redirect.
