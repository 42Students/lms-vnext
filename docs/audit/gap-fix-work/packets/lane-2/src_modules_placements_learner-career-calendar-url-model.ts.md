# Work packet: edit src/modules/placements/learner-career-calendar-url-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-calendar-redirect.md

## G2-19-005-013  [P1] GAP  facet F05  effort S
- Legacy: Old landing always opens Schedule `view=month` `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:4-6`
- vNext now: vNext URL parser defaults to `view=agenda` on absent view `src/modules/placements/learner-career-calendar-url-model.ts:9-15`
- Fix: Default legacy calendar address to Month/Calendar, not agenda.

## G2-19-005-044  [P1] GAP  facet F15  effort M
- Legacy: Old URL retained as email/notification link target intentionally `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:5-8`
- vNext now: vNext keeps route but no redirect, so old notification lands on new agenda view `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:10-24` `src/modules/placements/learner-career-calendar-url-model.ts:9-15`
- Fix: Preserve incoming notification/bookmark destination and expected month display.

## G2-19-005-021  [P2] GAP  facet F07  effort S
- Legacy: Old month accepts only `?view=month` internally `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:16-17` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65-68`
- vNext now: vNext parser treats `month` valid in career-calendar route, but default request has no view `src/modules/placements/learner-career-calendar-url-model.ts:5-15`
- Fix: Translate redirect to explicit month instead of default agenda.
