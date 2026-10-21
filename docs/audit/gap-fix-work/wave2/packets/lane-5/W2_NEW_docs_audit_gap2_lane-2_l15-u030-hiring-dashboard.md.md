# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/l15-u030-hiring-dashboard.md

40 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/l15-u030-hiring-dashboard.md

## G2-15-030-003  [P2] GAP  facet F01  effort M
- Legacy: L:9-25 three old report APIs for two roles
- vNext now: SA:41-44 reports+filters; CO:34-40 report+funnel
- Fix: Publish old-to-new endpoint mapping.

## G2-15-030-004  [P2] GAP  facet F02  effort M
- Legacy: L:328-402 single inline date/job/department/program/batch filter row
- vNext now: SA:83-103 search row plus collapsed Filters
- Fix: Restore one visible wrapped filter row.

## G2-15-030-005  [P2] GAP  facet F02  effort M
- Legacy: L:437-499 separate Ant Statistic cards with gutters
- vNext now: SA:109-111 border-only dl strip
- Fix: Match card geometry and gutters.

## G2-15-030-006  [P2] GAP  facet F02  effort M
- Legacy: L:501-550 vertical 24px funnel bars in one Card
- vNext now: SA:112-126 up to 3-column grid bars
- Fix: Match single-column funnel/card.

## G2-15-030-007  [P2] GAP  facet F02  effort M
- Legacy: L:552-606 Company-wise Hiring Report card with pinned totals
- vNext now: SA:128-145 table+detached company cards
- Fix: Pin totals in report table.

## G2-15-030-010  [P2] GAP  facet F03  effort M
- Legacy: L:359-363 Department changes reset Program
- vNext now: SA:72-75,93-95 GET selects retain Program
- Fix: Clear dependent selections.

## G2-15-030-014  [P2] GAP  facet F04  effort M
- Legacy: L:438-498 counts + optional Avg. time to shortlist
- vNext now: SA:109-127 ten counts, always Not recorded for avg
- Fix: Compute or clearly qualify average time.

## G2-15-030-016  [P2] GAP  facet F04  effort M
- Legacy: L:240-256 report Company/Job + seven stage columns
- vNext now: RM:15 Company/Drive/Total + ten counts
- Fix: Align column wording and order.

## G2-15-030-018  [P2] GAP  facet F05  effort M
- Legacy: L:233-238 segregates company totals from job rows
- vNext now: RM:18-25 computes totals but SA:133-145 shows cards
- Fix: Pin company totals as table footer.

## G2-15-030-019  [P2] GAP  facet F05  effort M
- Legacy: L:240-255 widths 160/80/90 and ellipsis on columns
- vNext now: SA:61-70 generic columns no fixed widths
- Fix: Clone widths, alignment and truncation.

## G2-15-030-021  [P2] GAP  facet F06  effort M
- Legacy: L:70-85 numeric IDs and appliedAfter/appliedBefore instants
- vNext now: RM:2-12 UUID keys, ISO date appliedFrom/To
- Fix: Map old filter values and inclusive end-day.

## G2-15-030-022  [P2] GAP  facet F06  effort M
- Legacy: L:359-362 department change clears Program
- vNext now: SA:83-103 form no client-side dependent reset
- Fix: Invalidate stale Program/Batch choices.

## G2-15-030-031  [P2] GAP  facet F09  effort M
- Legacy: L:328-401 visible five-filter row, keyboard Ant selections
- vNext now: SA:90-101 details for academic/date filters
- Fix: Keep old direct filtering UX.

## G2-15-030-036  [P2] GAP  facet F10  effort M
- Legacy: L:290-310 explicit Company Totals section and heading
- vNext now: EX:19-25 total rows appended within same heading
- Fix: Separate totals so sums aren't doubled.

## G2-15-030-037  [P2] GAP  facet F10  effort L
- Legacy: L:9-25 three report endpoints per role
- vNext now: SR:14-92 scoped query; EX:7-35 export API
- Fix: Document endpoint/response migration.

## G2-15-030-040  [P2] GAP  facet F11  effort M
- Legacy: L:68 hides academic filters in org-wide mode
- vNext now: SA:35-39 no-college empty state
- Fix: Represent authorized org/global context explicitly.

## G2-15-030-042  [P2] GAP  facet F12  effort M
- Legacy: L:488-497 avgTimeToShortlistMs rounded hrs
- vNext now: SA:127 hard-coded Not recorded; CF:42-49/98-101 calculates avg
- Fix: Use real recorded transitions for SA.

## G2-15-030-046  [P2] GAP  facet F13  effort M
- Legacy: L:130-153 renders sections that succeed despite others failing
- vNext now: SA:41-44 Promise.all aborts entire report on one exception
- Fix: Offer partial success recovery.

## G2-15-030-052  [P2] GAP  facet F16  effort M
- Legacy: L:438-499 responsive card gutters 16px
- vNext now: SA:109-111 2/3/5 border-only metrics grid
- Fix: Compare 375/768/992/1280 tile dimensions.

## G2-15-030-053  [P2] GAP  facet F16  effort M
- Legacy: L:557-564 Ant horizontal scroll width800
- vNext now: DT:95-141 mobile disclosure cards
- Fix: Clone horizontal scroll/columns for visual parity.

## G2-15-030-054  [P2] GAP  facet F16  effort M
- Legacy: L:502-545 funnel maxWidth500 vertical, bar height24
- vNext now: SA:117-125 multi-column mini bars
- Fix: Restore 24px bars and 500px chart width.

## G2-15-030-065  [P2] GAP  facet F20  effort M
- Legacy: L:70-85 endOf(day) serialized to ISO
- vNext now: SR:31-34 IST 23:59:59.999 bound
- Fix: Verify end inclusive across midnight/UTC.

## G2-15-030-066  [P2] GAP  facet F20  effort M
- Legacy: L:233-238 separates totals to prevent double count
- vNext now: EX:19-25 totals next to row data same CSV section
- Fix: Separate rollups in export.

## G2-15-030-068  [P2] GAP  facet F21  effort L
- Legacy: L:9-25 AdminService+placementJobService data routes
- vNext now: SR:14-92 unified query; EX:7-35 new export
- Fix: Provide backend route map for acceptance.

## G2-15-030-069  [P2] GAP  facet F21  effort M
- Legacy: L:68-85 batchId/programId old params
- vNext now: RM:4-9 cohortId/programId UUID params
- Fix: Map parameter aliases/bookmarks.

## G2-15-030-070  [P2] GAP  facet F22  effort L
- Legacy: L:68-85 legacy integer IDs + instant boundaries
- vNext now: RM:4-9 UUID and date-only filters
- Fix: Document historic IDs/filters; no actual data migration if empty.

## G2-15-030-071  [P2] GAP  facet F22  effort M
- Legacy: L:240-255 per-job and flagged company-total rows
- vNext now: RM:18-25 derives rollups from job groups
- Fix: Preserve rollup column semantics.

## G2-15-030-072  [P2] GAP  facet F22  effort M
- Legacy: L:488-497 avgTimeToShortlistMs
- vNext now: CF:42-49,98-101 averageHoursToShortlist
- Fix: Map milliseconds to hours with matching rounding.

## G2-15-030-075  [P2] GAP  facet F23  effort M
- Legacy: L:557-585 pinned totals footer
- vNext now: SA:133-145 separate company cards
- Fix: Choose exact pinned footer for clone.

## G2-15-030-008  [P3] GAP  facet F03  effort S
- Legacy: L:329-335 RangePicker 'Applied from'/'Applied to'
- vNext now: SA:90-99 separate date inputs, 'Applied through'
- Fix: Preserve placeholders and labels.

## G2-15-030-009  [P3] GAP  facet F03  effort S
- Legacy: L:339-350 Job dropdown shows title + company
- vNext now: SA:72-75,87 job options title only
- Fix: Include company in option labels.

## G2-15-030-011  [P3] GAP  facet F03  effort S
- Legacy: L:396-401 adjacent Refresh and Export report buttons
- vNext now: SA:80-88 export moved to page header
- Fix: Restore action order/location.

## G2-15-030-012  [P3] GAP  facet F03  effort S
- Legacy: L:217-231 closable applied-date chip, conditional Clear all
- vNext now: SA:102-104 always Clear all and raw params text
- Fix: Use same dismissible date-only filter chip.

## G2-15-030-020  [P3] GAP  facet F05  effort S
- Legacy: L:589-600 empty table says 'No hiring data yet'/Clear filters
- vNext now: SA:130-131 same generic filtered text, no CTA
- Fix: Distinct first-run and filtered empty states.

## G2-15-030-032  [P3] GAP  facet F09  effort S
- Legacy: L:404-409 closable date chip
- vNext now: SA:104 plain text active filters
- Fix: Provide keyboard closable chip.

## G2-15-030-043  [P3] GAP  facet F12  effort S
- Legacy: L:520-523 'N% of [previous stage]'
- vNext now: SA:121 'N% of previous'
- Fix: Name preceding stage in percentage tag.

## G2-15-030-047  [P3] GAP  facet F13  effort S
- Legacy: L:430-435 no data defensive fallback
- vNext now: CV:85-89 funnel empty Clear filters; SA:130-131 table empty
- Fix: Align all-panel zero-state copy.

## G2-15-030-059  [P3] GAP  facet F18  effort S
- Legacy: L:399-400 Export report CTA
- vNext now: SA:82 'Export report (CSV) →'
- Fix: Restore old label/icon if literal clone.

## G2-15-030-060  [P3] GAP  facet F18  effort S
- Legacy: L:553 'Company-wise Hiring Report'
- vNext now: SA:129 'Company hiring results'
- Fix: Restore exact heading.

## G2-15-030-061  [P3] GAP  facet F18  effort S
- Legacy: L:590-599 contextual empty/retry text
- vNext now: SA:130-131 generic no hiring results
- Fix: Use legacy conditional copy.
