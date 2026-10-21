# Work packet (wave 2): edit src/modules/placements/learner-career-calendar-url-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-calendar-redirect.md

## G2-19-005-015  [P2] GAP  facet F05  effort S
- Legacy: Old Schedule tab selected `view=month` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65-68` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:129-135`
- vNext now: vNext calendar has separate view state agenda/month/week/day `src/modules/placements/learner-career-calendar-url-model.ts:5-15` `src/components/placements/learner-career-calendar.tsx:153-163`
- Fix: Map old month view alias and selected Calendar tab.

## G2-19-005-019  [P2] GAP  facet F06  effort S
- Legacy: Old month defaults current month via moment().startOf('month') `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65`
- vNext now: vNext initialAnchor from current date, URL default view agenda `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:19-24` `src/modules/placements/learner-career-calendar-url-model.ts:9-15`
- Fix: Use current month grid as initial selection for redirect.

## G2-19-005-053  [P2] GAP  facet F18  effort S
- Legacy: Old page Calendar redirects to view `month` labelled Calendar `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:4-7` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:16-17`
- vNext now: vNext page title `Career Calendar`, default view `agenda` `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:21` `src/modules/placements/learner-career-calendar-url-model.ts:9-15`
- Fix: Preserve destination label Schedule/Calendar and month-selected state.

## G2-19-005-061  [P2] GAP  facet F20  effort S
- Legacy: Old selected month state tied to current month on destination `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65` `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:6`
- vNext now: vNext parser may respect incoming date/view/kind or default agenda `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:13-20` `src/modules/placements/learner-career-calendar-url-model.ts:9-15`
- Fix: Normalize legacy deep-link params while preserving optional selected date when safe.
