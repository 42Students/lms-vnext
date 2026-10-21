# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/l15-u030-hiring-dashboard.md

14 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/l15-u030-hiring-dashboard.md

## G2-15-030-001  [P1] GAP  facet F01  effort L
- Legacy: L:39,108-154 org-wide and college-scoped report modes
- vNext now: SA:35-44 selected college required; CO:18-21 college member only
- Fix: Resolve lost org-scoped placement analytics.

## G2-15-030-017  [P1] GAP  facet F05  effort L
- Legacy: L:557-564 Ant table pageSize10 when >10, x=800
- vNext now: DT:39-146 unpaged responsive table
- Fix: Add bounded pagination, avoid 5000-row DOM.

## G2-15-030-034  [P1] GAP  facet F10  effort L
- Legacy: L:264-320 CSV sections Summary/Funnel/Job/Company Totals
- vNext now: EX:18-31 flat company rows+totals CSV
- Fix: Restore four report sections in export.

## G2-15-030-038  [P1] GAP  facet F11  effort L
- Legacy: L:39 collegeId nullable switches org/college read
- vNext now: SR:15-16 selected college only
- Fix: Owner decision on org-wide reports.

## G2-15-030-041  [P1] GAP  facet F12  effort L
- Legacy: L:30-37 legacy six-stage funnel derived by backend
- vNext now: SR:29-60 stage snapshot and HIRED from JOINED outcome
- Fix: Document stage semantic change and reconcile historical results.

## G2-15-030-063  [P1] GAP  facet F19  effort L
- Legacy: L:558-561 table pagination pageSize10
- vNext now: DT:39-146 no pagination; SR:90 max5001
- Fix: Add server-side or bounded client pagination.

## G2-15-030-073  [P1] GAP  facet F23  effort L
- Legacy: L:39 allows org view without collegeId
- vNext now: SA:35-39 requires chosen college
- Fix: Owner decide org-scoped reporting scope.

## G2-15-030-074  [P1] GAP  facet F23  effort L
- Legacy: L:264-320 combined four-part CSV
- vNext now: EX:18-31 flat rows
- Fix: Restore combined report or explicitly approve replacement.

## G2-15-030-024  [P2] GAP  facet F07  effort M
- Legacy: L:115-128 panel-specific errors for metric/funnel/company
- vNext now: SA:41-44 Promise.all report+filters
- Fix: Show healthy panels despite partial failure.

## G2-15-030-025  [P2] GAP  facet F07  effort M
- Legacy: L:194-204 named filter-load error warning
- vNext now: SF:17-30 filters Promise.all with whole-page error
- Fix: Differentiate failed dropdown from no data.

## G2-15-030-026  [P2] GAP  facet F07  effort M
- Legacy: L:418-425 refresh error retains last same-scope data+Retry
- vNext now: SA:41-44 SSR fetch, route error boundary
- Fix: Restore same-scope stale-data warning and retry.

## G2-15-030-028  [P2] GAP  facet F08  effort M
- Legacy: L:396-401 export disabled while metrics absent/loading
- vNext now: SA:80-82 export anchor always enabled
- Fix: Disable or explain export unavailable/partial.

## G2-15-030-027  [P3] GAP  facet F07  effort S
- Legacy: L:155-163 'Failed to load hiring data' fallback
- vNext now: SA:28-33 invalid filter view + route error boundary
- Fix: Match actionable error copy.

## G2-15-030-029  [P3] GAP  facet F08  effort S
- Legacy: L:416 RefreshStatus with exact running text
- vNext now: SA:83-88 GET Refresh; no inline progress
- Fix: Present refresh/pending status.
