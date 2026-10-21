# Work packet (wave 2): edit src/components/courses/learner-course-overview.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/shared-course-home.md

## G2-8-009-004  [P2] GAP  facet F02  effort M
- Legacy: legacy About card and Next action inside ln-module-card framed sections (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:336-395`)
- vNext now: new learner layout uses border-bottom About and rounded primary-subtle Next action (`src/components/courses/learner-course-overview.tsx:249-332,369-408`)
- Fix: Match legacy card borders/shadows/padding and section spacing without duplicating shell

## G2-8-009-007  [P2] GAP  facet F03  effort S
- Legacy: next-action button large AntD primary with contextual icon (Clock, Calendar, Play) (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:179-278,369-395`)
- vNext now: vNext learner link styled primary with no icon (`src/components/courses/learner-course-overview.tsx:369-407`)
- Fix: Restore contextual icon and exact large size/label for learner next action

## G2-8-009-008  [P2] GAP  facet F03  effort S
- Legacy: legacy button disabled while courseIdentifier missing; title Loading course… (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:384-392`)
- vNext now: vNext component renders after valid delivery resolution; no disabled button state (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:58-74; src/components/courses/learner-course-overview.tsx:395-407`)
- Fix: Show comparable pending/unavailable action when course scope loading rather than rendering broken link

## G2-8-009-009  [P2] GAP  facet F03  effort S
- Legacy: legacy about credit chips with TrophyOutlined and instructor UserOutlined (`docs/legacy-source/frontend/src/components/Course/Home/InThisCourseSection.jsx:74-91`)
- vNext now: vNext neutral badges for credits/instructors plus course code/section/period (`src/components/courses/learner-course-overview.tsx:299-329`)
- Fix: Match icon chips and wording for authored course details; place new metadata separately

## G2-8-009-012  [P2] GAP  facet F04  effort M
- Legacy: legacy about hides entire card when metadata absent, except while loading/error (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:338-366`)
- vNext now: vNext about section shown if description, credits or instructors exists (`src/components/courses/learner-course-overview.tsx:249-332`)
- Fix: Verify absent-meta criteria including course descriptions versus authored metadata, no blank card

## G2-8-009-015  [P2] GAP  facet F05  effort M
- Legacy: legacy recent feed takes 3 deadlines, 2 announcements, 2 sessions then groups urgency, limits 6 (`docs/legacy-source/frontend/src/components/Course/Home/UnifiedActivityList.jsx:13,48-78`)
- vNext now: vNext merges up to 2 course updates + 2 recent completed activities + 2 upcoming, sorts by priority/time (`src/components/courses/learner-course-overview.tsx:184-220`)
- Fix: Match exact recent activity source mix, category precedence and six-item cutoff

## G2-8-009-025  [P2] GAP  facet F09  effort M
- Legacy: legacy course updates expand inline via clicked announcement ID (`docs/legacy-source/frontend/src/components/Course/Home/UnifiedActivityList.jsx:38-47,103-105`)
- vNext now: vNext recent update rows are links to notifications/roadmap, not inline expansion (`src/components/courses/learner-course-overview.tsx:184-220,443-492`)
- Fix: Allow expanding full announcement inline or document route transition

## G2-8-009-031  [P2] GAP  facet F12  effort M
- Legacy: legacy learner next-action precedence deadline, live session, next content, then first lecture (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:224-278`)
- vNext now: vNext priority learner activity from full upcoming set then nextContent/next, respects readOnly (`src/components/courses/learner-course-overview.tsx:155-182`)
- Fix: Compare precedence on same-date quiz/live and ensure no overdue stale next step

## G2-8-009-036  [P2] GAP  facet F13  effort S
- Legacy: legacy update feed Skeleton includes 3 lines and Loading recent updates (`docs/legacy-source/frontend/src/components/Course/Home/UnifiedActivityList.jsx:107-118`)
- vNext now: new page SSR data and no component-local activity skeleton (`src/components/courses/learner-course-overview.tsx:184-220,443-492`)
- Fix: Match feed loading skeleton or document server streaming transition

## G2-8-009-040  [P2] GAP  facet F16  effort M
- Legacy: legacy About and Next action wrapped ln-module-card; faculty insight side-by-side below (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:336-472`)
- vNext now: new sections border-bottom plus separate responsive faculty signals and learner sticky mobile jump nav (`src/components/courses/learner-course-overview.tsx:231-240; src/components/courses/faculty-course-home-signals.tsx:35-101`)
- Fix: Compare legacy desktop card widths and responsive mobile stacking; avoid new sticky overlay covering tab strip

## G2-8-009-013  [P3] GAP  facet F04  effort S
- Legacy: legacy intro and takeaways two-column grid with check-circle icons (`docs/legacy-source/frontend/src/components/Course/Home/InThisCourseSection.jsx:94-107`)
- vNext now: vNext check mark in text and md:grid-cols-2 (`src/components/courses/learner-course-overview.tsx:278-296`)
- Fix: Restore exact icon glyph and list spacing
