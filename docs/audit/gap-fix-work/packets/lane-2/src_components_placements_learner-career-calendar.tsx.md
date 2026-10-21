# Work packet: edit src/components/placements/learner-career-calendar.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-calendar-redirect.md, docs/audit/gap2/lane-19/learner-placement-schedule.md

## G2-19-005-010  [P1] GAP  facet F04  effort M
- Legacy: Old redirected Calendar displays booking `ScheduleCard` full metadata (room, platform, bring) in day Drawer `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-170` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:74-85`
- vNext now: vNext event-only Drawer has Scheduled, Round type, Employer, Role and rescheduled notice `src/components/placements/learner-career-calendar.tsx:356-384`
- Fix: Use rich ScheduleCard for selected day's entries, not only event metadata.

## G2-19-005-026  [P1] GAP  facet F09  effort M
- Legacy: Legacy Schedule calendar day Drawer opens width440 and title `dddd D MMMM` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-175`
- vNext now: vNext event Drawer title individual round event and description company/role `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Restore date-titled day Drawer, 440px wide.

## G2-19-005-027  [P1] GAP  facet F09  effort L
- Legacy: Old day Drawer holds all schedule events, deadlines and blocked events `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-171`
- vNext now: vNext event Drawer focuses one selected event `src/components/placements/learner-career-calendar.tsx:356-384`
- Fix: Show complete day's multi-source agenda within one drawer.

## G2-19-005-067  [P1] GAP  facet F23  effort L
- Legacy: Old Schedule offers direct confirm/reschedule inside day Drawer `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-170` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-119`
- vNext now: vNext event Drawer only offers Open exact round and Close `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Restore direct booked-round actions in calendar detail with appropriate gates.

## G2-19-005-068  [P1] GAP  facet F23  effort L
- Legacy: Old Calendar shows blocked days and application deadlines in same month `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:197-227`
- vNext now: vNext calendar round-only with alternative agenda/week/day and ICS export `src/components/placements/learner-career-calendar.tsx:35-42` `src/components/placements/learner-career-calendar.tsx:121-151`
- Fix: Prioritize missing factual event types before enhanced mode parity.

## G2-19-004-036  [P1] GAP  facet F09  effort L
- Legacy: Legacy calendar click opens 440px Drawer titled `dddd D MMMM`, displaying ALL day events and blocked/deadlines `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-175`
- vNext now: vNext event detail Drawer titled individual event, no whole-day extras `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Implement day detail drawer showing all date events/deadlines/blocked notes at width440.

## G2-19-005-024  [P2] GAP  facet F08  effort M
- Legacy: Old Schedule confirmation success toast visible after day Drawer action `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-95` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:169-170`
- vNext now: vNext event Drawer has no attendance-confirm action `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Restore ScheduleCard action and matching feedback in day Drawer.

## G2-19-005-025  [P2] GAP  facet F08  effort M
- Legacy: Old Schedule reschedule success toast appears in day Drawer `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:43-47` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:169`
- vNext now: vNext event Drawer is read-only with Open exact round link `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Expose authorized reschedule action or link to equivalent flow with success notice.
