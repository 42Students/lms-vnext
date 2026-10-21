# Work packet (wave 2): edit src/app/(authenticated)/tpo/reports/page.tsx

32 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u022-tpo-reports-index.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-11-022-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:45-45`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:35-46`
- Fix: Legacy sets activeMenuItem('reports') on mount; confirm vNext shell's link highlighting on Reports and preserve legacy menu group.

## G2-11-022-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:69-72`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:285-305`
- Fix: Legacy journey links route Placed to placement-summary, Looking to by-branch, Accepted to offers-acceptance. VNext routes Placed to placed-branch, Looking to unplaced; preserve exact destination or document intentional change.

## G2-11-022-005  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:33-34`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:172-181`
- Fix: Legacy Recruiter engagement route `/tpo/reports/recruiter-leads`, After college route `/tpo/reports/outcomes`; vNext links `/tpo/reports/leads`, `/tpo/reports/after-college`—ensure legacy redirect.

## G2-11-022-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:53-76`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:189-245`
- Fix: Legacy top order Header→snapshot error or JourneyStrip→three report groups; vNext Header→ReportFilters→gallery search→ReportMetrics→groups→collapsed methodology journey. Restore old sequence.

## G2-11-022-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:76-107`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:245-282`
- Fix: Legacy each group has stacked title+description with full-width `tpo-reports__grid`; vNext generic sections, 2-column cards and no equivalent eyebrow placement.

## G2-11-022-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:89-103`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:256-274`
- Fix: Legacy report tile is `button.tpo-reports__card` with title/arrow/description; vNext `<Link>` card with bottom Open report →; match card border, padding and arrow.

## G2-11-022-009  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:91-98`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:264-269`
- Fix: Legacy featured placement-summary card special modifier and Start here eyebrow above title; vNext Start here label beneath title and no featured modifier.

## G2-11-022-014  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:17-33`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:79-184`
- Fix: Legacy group eyebrows Placement health/Student outcomes/Relationships and compliance; vNext group heading presentation lacks visible eyebrow.

## G2-11-022-015  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-73`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:288-305`
- Fix: Legacy JourneyStrip shows Looking for a job, Placed, Accepted linked counters and gap buttons Unplaced, Not accepted yet with arrows/pct. VNext cards have text and no between-step gap chips.

## G2-11-022-022  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/reportsMeta.js:3-13`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:79-186`
- Fix: Legacy 11 report keys + static report help; vNext more report routes and patched descriptions, alphabetizes rather than source key order.

## G2-11-022-023  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/ui/JourneyStrip.jsx:16-18`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:290-303`
- Fix: Legacy each placed/accepted step displays rounded percentage of Looking baseline and clickable gap metric; vNext has no percentage in journey cards.

## G2-11-022-025  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:20-35`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:79-186`
- Fix: Legacy By company placed in overview between By branch and Packages; vNext moved to relationships group after outcomes.

## G2-11-022-028  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:85-106`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:242-244`
- Fix: Legacy report gallery has no result count or no-match state; vNext outputs N matching reports after filters; align placement and avoid duplicate metrics.

## G2-11-022-031  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-73`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:285-305`
- Fix: Legacy journey gaps clamp count with max(0,...); vNext uses different formulas and offers count for waiting, preserve unique-student business rule.

## G2-11-022-040  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/ui/JourneyStrip.jsx:27-48`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:288-305`
- Fix: Legacy interactive `aria-pressed` JourneyStrip button selection; vNext link cards and collapsed disclosure—restore selected visual/button behavior.

## G2-11-022-049  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:17-35`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:79-186`
- Fix: Legacy group classification/order is fixed independent of season; vNext category filter can hide group with 0 matches, affecting navigation.

## G2-11-022-050  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:42-51`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:59-78`
- Fix: Legacy null snapshot while fetching leaves gallery visible without headline strip; vNext SSR delays entire route until getPlacementReportWorkspace resolves, lacking same partial loading.

## G2-11-022-051  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:61-61`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:68-77`
- Fix: Legacy Retry only reruns snapshot (no card data reset); vNext Retry navigates to whole page, losing selected search/season filters.

## G2-11-022-053  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-74`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:234-240`
- Fix: Legacy no report-season state still renders static report cards; vNext No placement season available prompts before reports and metrics show zeros rather than inferred data.

## G2-11-022-059  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-74`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:285-305`
- Fix: Legacy horizontal JourneyStrip with arrow/gap buttons on desktop and narrower wrap phone; vNext 1/2/3 responsive card grid. Clone geometry after browser screenshot.

## G2-11-022-061  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/ui/JourneyStrip.jsx:27-46`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:288-303`
- Fix: Legacy JourneyStrip role=group, pressed states, title percent descriptions for each button; vNext nav links lack button-pressed semantics and percent.

## G2-11-022-063  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:61-61`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:68-77`
- Fix: Legacy Ant Alert showIcon action Retry, vNext Alert/Link error; check focus return and announcement after failure.

## G2-11-022-066  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:69-72`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:291-305`
- Fix: Legacy journey gap labels Unplaced and Not accepted yet, now vNext shows not placed/not yet accepted embedded text without buttons.

## G2-11-022-069  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:85-107`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:79-186`
- Fix: Legacy 11 static cards, vNext 18+ serialized card metadata and season filters, modest increased SSR payload with multiple reads.

## G2-11-022-070  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:46-51`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:59-78`
- Fix: Legacy retryTick increments only snapshot GET without unmounting tiles; vNext SSR navigation reruns all scoped reporting queries.

## G2-11-022-071  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/ui/JourneyStrip.jsx:16-18`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:291-305`
- Fix: Legacy safe pct base0→0 and clamps negative gaps; vNext clamps count but no percentage—avoid division errors if implementing clickable pct.

## G2-11-022-078  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:20-35`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:79-186`
- Fix: Restore original 11-card order by group and move added routes to explicitly labeled extras; alphabetization hides legacy hierarchy.

## G2-11-022-079  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:17-33`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:245-256`
- Fix: Restore eyebrow Placement health / Student outcomes / Relationships and compliance above group headings.

## G2-11-022-080  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:61-61`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:68-77`
- Fix: Restore nonblocking snapshot error Retry that leaves gallery present; new full-page failure loses navigation.

## G2-13-031-077  [P2] GAP  facet F02  effort M
- Legacy: Old detail header: actions, compact four-number sentence, filters before chart/table. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:160-184`
- vNext now: vNext places journey below gallery inside disclosure. `src/app/(authenticated)/tpo/reports/page.tsx:230-308`
- Fix: Use legacy detail header/filter layout and display journey above report groups.

## G2-11-022-018  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:89-103`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:256-273`
- Fix: Legacy icon ArrowRightOutlined top right; vNext text Open report → below explanation. Match icon alignment and hover state.

## G2-11-022-067  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:91-103`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:258-274`
- Fix: Legacy top right arrow icon and Start here eyebrow appear in different positions and vNext shows Open report → below.
