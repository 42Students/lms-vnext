# Work packet: NEW / MISSING items from docs/audit/gap2/lane-6/l14-u029-tpo-batch-detail.md

5 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l14-u029-tpo-batch-detail.md

## G2-14-029-011  [P1] GAP  facet F05  effort M
- Legacy: useUrlFilters applies class and journey to all loaded roster (batches/[batchId].js:69-71,262-286,430-435).
- vNext now: Search server paged 25; other evidence filters only current page (batches/[batchId]/students/page.tsx:35-54,135-138).
- Fix: Make all filters operate over full cohort before paging.

## G2-14-029-012  [P1] GAP  facet F05  effort M
- Legacy: Act on all shown or selected rows across full browser-filtered roster (batches/[batchId].js:316-340).
- vNext now: TpoBulkActionPanel receives visible current page rows only (batches/[batchId]/students/page.tsx:139-146).
- Fix: Expose full selection semantics and explicit per-page limits.

## G2-14-029-022  [P1] GAP  facet F10  effort M
- Legacy: Parallel getBatch/getBatchStudents/getStudentsTable independently tracked (batches/[batchId].js:74-113).
- vNext now: Root Promise.all five sources, separate student page reads (batches/[batchId]/page.tsx:31-35; students/page.tsx:42-46).
- Fix: Partial readiness for optional sources rather than full failure.

## G2-14-029-027  [P1] GAP  facet F13  effort M
- Legacy: Separate 'Batch details may be stale', roster error, profiles incomplete warnings with retries (batches/[batchId].js:386-414).
- vNext now: SSR Promise.all fail unless own summary catch, no independent retry of most sources (batches/[batchId]/page.tsx:31-35).
- Fix: Render partial/stale banners with retry controls.

## G2-14-029-019  [P2] GAP  facet F08  effort M
- Legacy: Remind success Reminded N students or Everyone has chosen already (batches/[batchId].js:239-254).
- vNext now: Reminder moved to /reminder-prep (batches/[batchId]/page.tsx:65-67).
- Fix: Match literal success notices.
