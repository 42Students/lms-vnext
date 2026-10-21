# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l11-u014-tpo-home.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l11-u014-tpo-home.md

## G2-11-014-027  [P1] GAP  facet F07  effort M
- Legacy: Legacy no missing-read false zero on primary GET: data absent → error not 0 (home.js:32-47).
- vNext now: vNext operations fallback summary publishedJobs:0/jna:0, pendingRequestsCount??0 and `!crmReady` shapes; Partial InlineNotice (tpo/home/page.tsx:64-73,139-140).
- Fix: Use null/— in all status cards when critical read fails; never show 0 confirmed jobs/requests.

## G2-11-014-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy GET failure before data shows PanelError Could not load Home with Retry, no old snapshot (home.js:32-47,69-73).
- vNext now: vNext many partial `.catch(()=>null)` and renders incomplete Home with InlineNotice, no full PanelError for core operation/batch failure (tpo/home/page.tsx:48-73,175-180).
- Fix: Distinguish essential vs optional read failures, show Retry for essential without calling it empty data.
