# L15-U030 — HiringDashboard legacy vs vNext UI gap audit v2

## Exact source legend (file:line references below)
- `L`: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js` (610 lines). Old related APIs: `frontend/src/api/Services/AdminService.js` and `placementJobService.js`; component `PlacementsPageOverview`, DashboardSkeleton/RefreshStatus.
- `SA`: `src/app/(authenticated)/admin/placements/analytics/page.tsx` (149 lines). `CO`: `src/app/(authenticated)/college/hiring-dashboard/page.tsx` (58 lines).
- `SR`: `src/modules/admin-ui/super-admin-hiring-report-service.ts` (94 lines). `SF`: `src/modules/admin-ui/super-admin-hiring-report-filters-service.ts` (32 lines). `RM`: `src/modules/admin-ui/super-admin-hiring-report-model.ts` (27 lines). `HF`: `src/modules/admin-ui/super-admin-hiring-funnel-model.ts` (21 lines).
- `CV`: `src/components/placements/college-hiring-funnel.tsx` (127 lines). `CF`: `src/modules/placements/college-hiring-funnel-service.ts` (103 lines). `DT`: `src/components/ui/data-table.tsx` (146 lines).
- `EX`: `src/app/api/admin/placements/hiring-report/export/route.ts` (37 lines). College counterpart `src/app/api/college/placements/hiring-analytics/export/route.ts` and `src/modules/placements/college-hiring-funnel-export.ts`.
- Audit only, source comparison; no runtime/screenshots or code changes. The old page handles both org-scoped and college-scoped views. New Super Admin analytics requires a selected college; College Admin has a distinct analytics workspace.

## Complete mandatory 23 facets
| ID | Facet | Legacy file:line/behaviour | vNext file:line/behaviour | Verdict | Severity | Concrete fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-15-030-001 | F01 | L:39,108-154 org-wide and college-scoped report modes | SA:35-44 selected college required; CO:18-21 college member only | GAP | P1 | Resolve lost org-scoped placement analytics. | L |
| G2-15-030-002 | F01 | L:322-327 'Placement Analytics' title/description | SA:77-79 exact same heading/description | MATCH | P3 | Keep source text. | S |
| G2-15-030-003 | F01 | L:9-25 three old report APIs for two roles | SA:41-44 reports+filters; CO:34-40 report+funnel | GAP | P2 | Publish old-to-new endpoint mapping. | M |
| G2-15-030-004 | F02 | L:328-402 single inline date/job/department/program/batch filter row | SA:83-103 search row plus collapsed Filters | GAP | P2 | Restore one visible wrapped filter row. | M |
| G2-15-030-005 | F02 | L:437-499 separate Ant Statistic cards with gutters | SA:109-111 border-only dl strip | GAP | P2 | Match card geometry and gutters. | M |
| G2-15-030-006 | F02 | L:501-550 vertical 24px funnel bars in one Card | SA:112-126 up to 3-column grid bars | GAP | P2 | Match single-column funnel/card. | M |
| G2-15-030-007 | F02 | L:552-606 Company-wise Hiring Report card with pinned totals | SA:128-145 table+detached company cards | GAP | P2 | Pin totals in report table. | M |
| G2-15-030-008 | F03 | L:329-335 RangePicker 'Applied from'/'Applied to' | SA:90-99 separate date inputs, 'Applied through' | GAP | P3 | Preserve placeholders and labels. | S |
| G2-15-030-009 | F03 | L:339-350 Job dropdown shows title + company | SA:72-75,87 job options title only | GAP | P3 | Include company in option labels. | S |
| G2-15-030-010 | F03 | L:359-363 Department changes reset Program | SA:72-75,93-95 GET selects retain Program | GAP | P2 | Clear dependent selections. | M |
| G2-15-030-011 | F03 | L:396-401 adjacent Refresh and Export report buttons | SA:80-88 export moved to page header | GAP | P3 | Restore action order/location. | S |
| G2-15-030-012 | F03 | L:217-231 closable applied-date chip, conditional Clear all | SA:102-104 always Clear all and raw params text | GAP | P3 | Use same dismissible date-only filter chip. | S |
| G2-15-030-013 | F04 | L:30-37 six funnel stage names | HF:2-6 identical six names | MATCH | P3 | Keep exact stage capitalization. | S |
| G2-15-030-014 | F04 | L:438-498 counts + optional Avg. time to shortlist | SA:109-127 ten counts, always Not recorded for avg | GAP | P2 | Compute or clearly qualify average time. | M |
| G2-15-030-015 | F04 | L:473-486 Withdrawn and Waitlisted tiles | SA:55-59,109-111 both shown | MATCH | P3 | Retain reconciliation counts. | S |
| G2-15-030-016 | F04 | L:240-256 report Company/Job + seven stage columns | RM:15 Company/Drive/Total + ten counts | GAP | P2 | Align column wording and order. | M |
| G2-15-030-017 | F05 | L:557-564 Ant table pageSize10 when >10, x=800 | DT:39-146 unpaged responsive table | GAP | P1 | Add bounded pagination, avoid 5000-row DOM. | L |
| G2-15-030-018 | F05 | L:233-238 segregates company totals from job rows | RM:18-25 computes totals but SA:133-145 shows cards | GAP | P2 | Pin company totals as table footer. | M |
| G2-15-030-019 | F05 | L:240-255 widths 160/80/90 and ellipsis on columns | SA:61-70 generic columns no fixed widths | GAP | P2 | Clone widths, alignment and truncation. | M |
| G2-15-030-020 | F05 | L:589-600 empty table says 'No hiring data yet'/Clear filters | SA:130-131 same generic filtered text, no CTA | GAP | P3 | Distinct first-run and filtered empty states. | S |
| G2-15-030-021 | F06 | L:70-85 numeric IDs and appliedAfter/appliedBefore instants | RM:2-12 UUID keys, ISO date appliedFrom/To | GAP | P2 | Map old filter values and inclusive end-day. | M |
| G2-15-030-022 | F06 | L:359-362 department change clears Program | SA:83-103 form no client-side dependent reset | GAP | P2 | Invalidate stale Program/Batch choices. | M |
| G2-15-030-023 | F06 | L:87-154 independent metrics,funnel,company reads | SR:36-92 grouped report; SA:50-59 derives metrics/funnel | EXTRA | P3 | Keep consistent counts while supporting partial failure. | M |
| G2-15-030-024 | F07 | L:115-128 panel-specific errors for metric/funnel/company | SA:41-44 Promise.all report+filters | GAP | P2 | Show healthy panels despite partial failure. | M |
| G2-15-030-025 | F07 | L:194-204 named filter-load error warning | SF:17-30 filters Promise.all with whole-page error | GAP | P2 | Differentiate failed dropdown from no data. | M |
| G2-15-030-026 | F07 | L:418-425 refresh error retains last same-scope data+Retry | SA:41-44 SSR fetch, route error boundary | GAP | P2 | Restore same-scope stale-data warning and retry. | M |
| G2-15-030-027 | F07 | L:155-163 'Failed to load hiring data' fallback | SA:28-33 invalid filter view + route error boundary | GAP | P3 | Match actionable error copy. | S |
| G2-15-030-028 | F08 | L:396-401 export disabled while metrics absent/loading | SA:80-82 export anchor always enabled | GAP | P2 | Disable or explain export unavailable/partial. | M |
| G2-15-030-029 | F08 | L:416 RefreshStatus with exact running text | SA:83-88 GET Refresh; no inline progress | GAP | P3 | Present refresh/pending status. | S |
| G2-15-030-030 | F08 | L:428-429 DashboardSkeleton metrics6 | SA route loading component; parity not measured | UNKNOWN | P2 | Live-check six tiles and skeleton positions. | S |
| G2-15-030-031 | F09 | L:328-401 visible five-filter row, keyboard Ant selections | SA:90-101 details for academic/date filters | GAP | P2 | Keep old direct filtering UX. | M |
| G2-15-030-032 | F09 | L:404-409 closable date chip | SA:104 plain text active filters | GAP | P3 | Provide keyboard closable chip. | S |
| G2-15-030-033 | F09 | L:225-231 Clear all resets all filters | SA:102 blank query route | MATCH | P3 | Keep clear action and selected state. | S |
| G2-15-030-034 | F10 | L:264-320 CSV sections Summary/Funnel/Job/Company Totals | EX:18-31 flat company rows+totals CSV | GAP | P1 | Restore four report sections in export. | L |
| G2-15-030-035 | F10 | L:311-319 dated hiring-report-YYYY-MM-DD.csv | EX:26-31 dated filename + UTF-8 BOM | MATCH | P3 | Keep filename/BOM. | S |
| G2-15-030-036 | F10 | L:290-310 explicit Company Totals section and heading | EX:19-25 total rows appended within same heading | GAP | P2 | Separate totals so sums aren't doubled. | M |
| G2-15-030-037 | F10 | L:9-25 three report endpoints per role | SR:14-92 scoped query; EX:7-35 export API | GAP | P2 | Document endpoint/response migration. | L |
| G2-15-030-038 | F11 | L:39 collegeId nullable switches org/college read | SR:15-16 selected college only | GAP | P1 | Owner decision on org-wide reports. | L |
| G2-15-030-039 | F11 | L:175-209 college filters per selected tenant | SF:8-30 strictly selected college filters | MATCH | P3 | Keep cross-tenant isolation. | M |
| G2-15-030-040 | F11 | L:68 hides academic filters in org-wide mode | SA:35-39 no-college empty state | GAP | P2 | Represent authorized org/global context explicitly. | M |
| G2-15-030-041 | F12 | L:30-37 legacy six-stage funnel derived by backend | SR:29-60 stage snapshot and HIRED from JOINED outcome | GAP | P1 | Document stage semantic change and reconcile historical results. | L |
| G2-15-030-042 | F12 | L:488-497 avgTimeToShortlistMs rounded hrs | SA:127 hard-coded Not recorded; CF:42-49/98-101 calculates avg | GAP | P2 | Use real recorded transitions for SA. | M |
| G2-15-030-043 | F12 | L:520-523 'N% of [previous stage]' | SA:121 'N% of previous' | GAP | P3 | Name preceding stage in percentage tag. | S |
| G2-15-030-044 | F12 | L:215-216 maxFunnelCount at least1 | HF:11-18 Math.max1 and scaled stage widths | MATCH | P3 | Keep zero-safe bar scale. | S |
| G2-15-030-045 | F13 | L:95-101 resets data when filter/scope changes | SA:23-44 server validation and refetch | EXTRA | P3 | Retain no-stale-scope guarantee. | S |
| G2-15-030-046 | F13 | L:130-153 renders sections that succeed despite others failing | SA:41-44 Promise.all aborts entire report on one exception | GAP | P2 | Offer partial success recovery. | M |
| G2-15-030-047 | F13 | L:430-435 no data defensive fallback | CV:85-89 funnel empty Clear filters; SA:130-131 table empty | GAP | P3 | Align all-panel zero-state copy. | S |
| G2-15-030-048 | F14 | L:264-320 builds export in client via Blob | EX:7-35 authenticated server CSV | EXTRA | P3 | Retain secure server-side export. | M |
| G2-15-030-049 | F14 | L:315 dated CSV file | EX:26-31 same naming | MATCH | P3 | Keep download header. | S |
| G2-15-030-050 | F15 | L:87-168 read-only reporting, no email | SR:14-92 read-only SELECT | MATCH | P3 | Do not send analytics emails. | S |
| G2-15-030-051 | F15 | L:264-320 CSV local download only | EX:7-35 GET export only | MATCH | P3 | No notification mutation on export. | S |
| G2-15-030-052 | F16 | L:438-499 responsive card gutters 16px | SA:109-111 2/3/5 border-only metrics grid | GAP | P2 | Compare 375/768/992/1280 tile dimensions. | M |
| G2-15-030-053 | F16 | L:557-564 Ant horizontal scroll width800 | DT:95-141 mobile disclosure cards | GAP | P2 | Clone horizontal scroll/columns for visual parity. | M |
| G2-15-030-054 | F16 | L:502-545 funnel maxWidth500 vertical, bar height24 | SA:117-125 multi-column mini bars | GAP | P2 | Restore 24px bars and 500px chart width. | M |
| G2-15-030-055 | F17 | L:329-390 labelled date and selection filters | SA:72-75,93-99 labeled Select/DateInput | MATCH | P3 | Keep labels and keyboard support. | S |
| G2-15-030-056 | F17 | L:502-545 count label and status for each bar | SA:122-124 MetricBar role img with count aria label | EXTRA | P3 | Retain accessible funnel description. | S |
| G2-15-030-057 | F17 | L:557-603 semantic report table | DT:99-120 heading, aria sort, mobile details | EXTRA | P3 | Keep semantic headers and details. | S |
| G2-15-030-058 | F18 | L:324-327 Placement Analytics intro | SA:78-79 same intro | MATCH | P3 | Preserve exact text. | S |
| G2-15-030-059 | F18 | L:399-400 Export report CTA | SA:82 'Export report (CSV) →' | GAP | P3 | Restore old label/icon if literal clone. | S |
| G2-15-030-060 | F18 | L:553 'Company-wise Hiring Report' | SA:129 'Company hiring results' | GAP | P3 | Restore exact heading. | S |
| G2-15-030-061 | F18 | L:590-599 contextual empty/retry text | SA:130-131 generic no hiring results | GAP | P3 | Use legacy conditional copy. | S |
| G2-15-030-062 | F19 | L:49-52 request sequence prevents duplicate stale fetch | SA:41-44 server read once | EXTRA | P3 | Avoid unnecessary refetch loops. | S |
| G2-15-030-063 | F19 | L:558-561 table pagination pageSize10 | DT:39-146 no pagination; SR:90 max5001 | GAP | P1 | Add server-side or bounded client pagination. | L |
| G2-15-030-064 | F19 | L:87-154 parallel API requests | SR:14-92 one aggregate SQL | EXTRA | P3 | Keep lower round-trip overhead. | M |
| G2-15-030-065 | F20 | L:70-85 endOf(day) serialized to ISO | SR:31-34 IST 23:59:59.999 bound | GAP | P2 | Verify end inclusive across midnight/UTC. | M |
| G2-15-030-066 | F20 | L:233-238 separates totals to prevent double count | EX:19-25 totals next to row data same CSV section | GAP | P2 | Separate rollups in export. | M |
| G2-15-030-067 | F20 | L:215-216 max(1,counts) | HF:11 max(1) | MATCH | P3 | Keep zero denominator protected. | S |
| G2-15-030-068 | F21 | L:9-25 AdminService+placementJobService data routes | SR:14-92 unified query; EX:7-35 new export | GAP | P2 | Provide backend route map for acceptance. | L |
| G2-15-030-069 | F21 | L:68-85 batchId/programId old params | RM:4-9 cohortId/programId UUID params | GAP | P2 | Map parameter aliases/bookmarks. | M |
| G2-15-030-070 | F22 | L:68-85 legacy integer IDs + instant boundaries | RM:4-9 UUID and date-only filters | GAP | P2 | Document historic IDs/filters; no actual data migration if empty. | L |
| G2-15-030-071 | F22 | L:240-255 per-job and flagged company-total rows | RM:18-25 derives rollups from job groups | GAP | P2 | Preserve rollup column semantics. | M |
| G2-15-030-072 | F22 | L:488-497 avgTimeToShortlistMs | CF:42-49,98-101 averageHoursToShortlist | GAP | P2 | Map milliseconds to hours with matching rounding. | M |
| G2-15-030-073 | F23 | L:39 allows org view without collegeId | SA:35-39 requires chosen college | GAP | P1 | Owner decide org-scoped reporting scope. | L |
| G2-15-030-074 | F23 | L:264-320 combined four-part CSV | EX:18-31 flat rows | GAP | P1 | Restore combined report or explicitly approve replacement. | L |
| G2-15-030-075 | F23 | L:557-585 pinned totals footer | SA:133-145 separate company cards | GAP | P2 | Choose exact pinned footer for clone. | M |

## Top priorities and unresolved verification
- 75 rows, all 23 facets. Verdict GAP 54, MATCH 13, EXTRA 7, UNKNOWN 1. Severity P1 8, P3 33, P2 34.
- P1: restore/retire authorized org-scoped reporting intentionally; ensure Super Admin scoped college matches legacy permissions.
- P1: pageSize=10 vs unpaged table up to 5,000 results, pinned footer totals vs detached cards; add server pagination and trustworthy complete totals before using for decisions.
- P1: combined legacy CSV Summary + Funnel + Job + Company Totals was replaced by flat CSV with rollup rows appended; avoid doubled counts and reconcile export/visible values.
- P1: stage semantics differ (JOINED accepted offer for Hired in Super Admin vNext; current-stage counts rather than historical conversion); average shortlist time is hard-coded unavailable in Super Admin but computed in College. Explain or align metrics.
- UNKNOWN: exact Ant vs new screenshot measurements at 320,375,768,1280 widths; state under slow/failed fetch and during filter change; export exact bytes, count truncation, midnight IST filter edges. No code execution or CI.
