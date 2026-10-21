# Work packet (wave 2): edit src/app/(authenticated)/tpo/drive-day/page.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-index.md

## G2-11-009-003  [P2] GAP  facet F01  effort S
- Legacy: Legacy subtitle says Your assigned rounds for today, optimized for quick on-site access. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:44`
- vNext now: TPO-only subtitle talks about currently happening rounds and duration. `src/app/(authenticated)/tpo/drive-day/page.tsx:62`
- Fix: Restore exact subtitle for operational list.

## G2-11-009-005  [P2] MISSING  facet F01  effort S
- Legacy: Empty page links to /tpo/calendar via See upcoming rounds. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:59`
- vNext now: TPO-only empty offers Reset focus, not calendar. `src/app/(authenticated)/tpo/drive-day/page.tsx:79`
- Fix: Add explicit calendar CTA.

## G2-11-009-007  [P2] GAP  facet F02  effort M
- Legacy: White PageShell encloses header, states, two-column round cards. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:40`
- vNext now: TPO inserts search/filter form, export row, global KPIs and list of articles. `src/app/(authenticated)/tpo/drive-day/page.tsx:60`
- Fix: Restore legacy page anatomy; place advanced controls separately.

## G2-11-009-008  [P2] GAP  facet F02  effort S
- Legacy: Round grid two equal columns gap12 on desktop. `docs/legacy-source/frontend/src/styles/components/_tpo-drive-day.scss:105`
- vNext now: TPO live articles always a single column. `src/app/(authenticated)/tpo/drive-day/page.tsx:81`
- Fix: Use two-column cards at >=768px.

## G2-11-009-009  [P2] GAP  facet F02  effort M
- Legacy: Round cards border/radius13/hover lift/min-height132. `docs/legacy-source/frontend/src/styles/components/_tpo-drive-day.scss:111`
- vNext now: Border-bottom rows with no matching card surface. `src/app/(authenticated)/tpo/drive-day/page.tsx:83`
- Fix: Apply old Card border/radius/min-height/hover CSS.

## G2-11-009-010  [P2] GAP  facet F02  effort M
- Legacy: Card order is eyebrow, company-job heading, round/time/venue, action. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:66`
- vNext now: Card shows company-round, job-start date, venue, remaining time, actions and 5 stats. `src/app/(authenticated)/tpo/drive-day/page.tsx:86`
- Fix: Reorder card fields to legacy hierarchy.

## G2-11-009-012  [P2] MISSING  facet F03  effort S
- Legacy: Each card has Assigned round eyebrow. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:67`
- vNext now: TPO-only card omits eyebrow. `src/app/(authenticated)/tpo/drive-day/page.tsx:85`
- Fix: Restore label and spacing.

## G2-11-009-014  [P2] GAP  facet F03  effort M
- Legacy: AntD Empty illustration plus call to upcoming rounds. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:58`
- vNext now: EmptyState has Reset focus action, not calendar. `src/app/(authenticated)/tpo/drive-day/page.tsx:79`
- Fix: Clone visual illustration and action.

## G2-11-009-016  [P2] GAP  facet F03  effort S
- Legacy: Loading has ListSkeleton 4 rows. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:50`
- vNext now: Server awaits data rather than matching list skeleton. `src/app/(authenticated)/tpo/drive-day/page.tsx:56`
- Fix: Add matching labelled skeleton loading state.

## G2-11-009-017  [P2] GAP  facet F04  effort S
- Legacy: Primary card heading company plus job title. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:68`
- vNext now: Primary card heading company plus round name. `src/app/(authenticated)/tpo/drive-day/page.tsx:86`
- Fix: Use company and job title as primary heading.

## G2-11-009-018  [P2] GAP  facet F04  effort S
- Legacy: Subtitle order round name, 12-hour clock, venue. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:70`
- vNext now: Job title with full date and Started prefix, venue separate. `src/app/(authenticated)/tpo/drive-day/page.tsx:87`
- Fix: Render exact three pieces in legacy order.

## G2-11-009-019  [P2] GAP  facet F04  effort S
- Legacy: Time formatted h:mm A via dj; no date. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:70`
- vNext now: TPO formats en-IN medium date and short time plus IST. `src/app/(authenticated)/tpo/drive-day/page.tsx:87`
- Fix: Match time-only formatting for list.

## G2-11-009-056  [P2] GAP  facet F13  effort S
- Legacy: Empty-before-load renders four skeleton list rows. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:50`
- vNext now: No equivalent in-page skeleton for TPO summary. `src/app/(authenticated)/tpo/drive-day/page.tsx:56`
- Fix: Clone four-row loading state.

## G2-11-009-058  [P2] GAP  facet F13  effort S
- Legacy: No rounds: There is no drive day for you today. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:58`
- vNext now: No verified round happening now is different meaning. `src/app/(authenticated)/tpo/drive-day/page.tsx:79`
- Fix: Restore exact all-day empty state.

## G2-11-009-059  [P2] MISSING  facet F13  effort S
- Legacy: No-round state has See upcoming rounds button. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:59`
- vNext now: Coordinator empty no calendar CTA either. `src/app/(authenticated)/tpo/drive-day/page.tsx:134`
- Fix: Include link to upcoming calendar.

## G2-11-009-065  [P2] GAP  facet F16  effort S
- Legacy: Desktop >=768 2 columns, phone 1. `docs/legacy-source/frontend/src/styles/components/_tpo-drive-day.scss:105`
- vNext now: TPO live list single column all widths. `src/app/(authenticated)/tpo/drive-day/page.tsx:81`
- Fix: Clone breakpoints.

## G2-11-009-067  [P2] GAP  facet F16  effort S
- Legacy: Legacy desktop card body min132 and padding16. `docs/legacy-source/frontend/src/styles/components/_tpo-drive-day.scss:123`
- vNext now: New article vertical padding4 with no minheight. `src/app/(authenticated)/tpo/drive-day/page.tsx:83`
- Fix: Apply exact min-height/padding.

## G2-11-009-070  [P2] MISSING  facet F17  effort S
- Legacy: Legacy empty CTA keyboard available. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:58`
- vNext now: Missing calendar CTA removes focus target. `src/app/(authenticated)/tpo/drive-day/page.tsx:79`
- Fix: Restore accessible calendar link.

## G2-11-009-072  [P2] GAP  facet F18  effort S
- Legacy: Exact subtitle assigned rounds, quick on-site access. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:44`
- vNext now: New copy rounds happening now, recorded schedule. `src/app/(authenticated)/tpo/drive-day/page.tsx:62`
- Fix: Restore exact old copy.

## G2-11-009-073  [P2] MISSING  facet F18  effort S
- Legacy: Exact card eyebrow Assigned round. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:67`
- vNext now: TPO no eyebrow. `src/app/(authenticated)/tpo/drive-day/page.tsx:86`
- Fix: Restore literal text.

## G2-11-009-074  [P2] GAP  facet F18  effort S
- Legacy: Exact CTA See upcoming rounds. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:59`
- vNext now: Reset focus instead. `src/app/(authenticated)/tpo/drive-day/page.tsx:79`
- Fix: Use calendar wording on empty day.

## G2-11-009-075  [P2] MISSING  facet F18  effort S
- Legacy: Exact failure fallback Could not load today's drive-day assignments. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:29`
- vNext now: Only malformed filter errors inside page. `src/app/(authenticated)/tpo/drive-day/page.tsx:49`
- Fix: Add original fallback.

## G2-11-009-076  [P2] MISSING  facet F18  effort S
- Legacy: Skeleton copy Loading drive-day assignments. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:50`
- vNext now: No same labelled state. `src/app/(authenticated)/tpo/drive-day/page.tsx:56`
- Fix: Add exact label.

## G2-11-009-080  [P2] MISSING  facet F19  effort S
- Legacy: Manual Retry sets spinner and retains old cards. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:25`
- vNext now: No corresponding in-page Retry. `src/app/(authenticated)/tpo/drive-day/page.tsx:56`
- Fix: Add manual revalidation with loading status.

## G2-11-009-020  [P3] GAP  facet F04  effort S
- Legacy: Missing or invalid startsAt simply omitted. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:70`
- vNext now: New start line includes unknown when missing. `src/app/(authenticated)/tpo/drive-day/page.tsx:87`
- Fix: Align optional/empty time placeholder behavior.

## G2-11-009-068  [P3] GAP  facet F16  effort S
- Legacy: Hover card border/shadow/transform changes over .15s. `docs/legacy-source/frontend/src/styles/components/_tpo-drive-day.scss:113`
- vNext now: New row has no elevation animation. `src/app/(authenticated)/tpo/drive-day/page.tsx:83`
- Fix: Copy hover transition.
