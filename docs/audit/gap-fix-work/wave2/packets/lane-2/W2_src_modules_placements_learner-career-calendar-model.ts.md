# Work packet (wave 2): edit src/modules/placements/learner-career-calendar-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-calendar-redirect.md, docs/audit/gap2/lane-19/learner-placement-schedule.md, docs/audit/gap2/lane-9/l18-u023-learner-eligibility-controller.md

## G2-19-005-037  [P2] GAP  facet F12  effort M
- Legacy: Old calendar includes TALK/test/interview separated by type in legend `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:206-226`
- vNext now: vNext rounds typed ASSESSMENT/INTERVIEW/OTHER `src/modules/placements/learner-career-calendar-model.ts:72-85`
- Fix: Map TALK explicitly to separate legacy category display.

## G2-19-005-057  [P2] GAP  facet F19  effort L
- Legacy: Old Schedule month fetches BLOCKED extras limited to displayed month span `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:91-100`
- vNext now: vNext rounds aggregated before client month selection, then locally filtered `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:11-35` `src/modules/placements/learner-career-calendar-model.ts:90-115`
- Fix: Use bounded server event retrieval and page-level cache for larger cohorts.

## G2-19-004-073  [P2] GAP  facet F19  effort L
- Legacy: Legacy loads journey + older interviews + deadlines via separate requests and per-month blocked dates `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:70-101`
- vNext now: vNext server fetches workspace + results in parallel, calendar derives filtered rounds `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:22-35` `src/modules/placements/learner-career-calendar-model.ts:64-88`
- Fix: Aggregate multiple sources server-side with independent failures and strict bounds.

## G2-18-023-053  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/StudentCalendarService.java:35-94 talks/blocked dates fetched from existing TPO source
- vNext now: src/modules/placements/learner-career-calendar-model.ts:64-87 learner round list; no talk notification here
- Fix: Show talks/block dates in calendar without fabricating notices.

## G2-18-023-065  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/StudentCalendarService.java:83-92 exam date parsed LocalDate at day start then inclusive range
- vNext now: src/modules/placements/learner-career-calendar-model.ts:29-35,90-116 Asia/Kolkata day keys derived from instants
- Fix: Normalize blocked dates by IST civil-day boundaries for start/end windows.
